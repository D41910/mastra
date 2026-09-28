import type { ObservationalMemoryHistoryOptions, ObservationalMemoryRecord } from '@mastra/core/storage';
import xxhash from 'xxhash-wasm';
import { addRelativeTimeToObservations } from '../processors/observational-memory/date-utils';
import { getBufferedChunks } from '../processors/observational-memory/message-utils';
import { parseObservationGroups } from '../processors/observational-memory/observation-groups';
import type { ObservationGroup } from '../processors/observational-memory/observation-groups';

export type OMGenerationRecord = Pick<
  ObservationalMemoryRecord,
  'id' | 'generationCount' | 'activeObservations' | 'bufferedObservationChunks' | 'observedTimezone' | 'threadId'
>;
export interface OMTimelineEngine {
  getHistory(
    threadId: string,
    resourceId: string,
    limit?: number,
    options?: ObservationalMemoryHistoryOptions,
  ): Promise<OMGenerationRecord[]>;
}
export interface GroupTimeline {
  record: OMGenerationRecord;
  groups: ObservationGroup[];
  indexById: Map<string, number>;
}
const hasher = xxhash();

async function buildTimeline(record: OMGenerationRecord, threadId: string): Promise<GroupTimeline> {
  // Buffering indexes originals before activation. Preserve the same append order as activation.
  let text = [record.activeObservations, ...getBufferedChunks(record).map(chunk => chunk.observations)].join('\n');
  if (record.threadId === null) {
    // Resource-scoped records mix threads; attribution can use raw or obscured thread IDs.
    const obscuredId = (await hasher).h32ToString(threadId);
    text = [...text.matchAll(/<thread id="([^"]+)">([\s\S]*?)<\/thread>/g)]
      .filter(match => match[1] === threadId || match[1] === obscuredId)
      .map(match => match[2])
      .join('\n');
  }
  const groups = parseObservationGroups(text).filter(group => group.kind !== 'reflection');
  const indexById = new Map<string, number>();
  const unique = groups.filter(group => {
    if (indexById.has(group.id)) return false;
    indexById.set(group.id, indexById.size);
    return true;
  });
  return { record, groups: unique, indexById };
}

export async function findGroupTimeline(
  om: OMTimelineEngine,
  threadId: string,
  resourceId: string,
  groupId: string,
): Promise<GroupTimeline | null> {
  const [record] = await om.getHistory(threadId, resourceId, 1, { groupId, sortDirection: 'ASC' });
  if (!record || (record.threadId !== null && record.threadId !== threadId)) return null;
  const timeline = await buildTimeline(record, threadId);
  return timeline.indexById.has(groupId) ? timeline : null;
}

export function pagingCall(groupId: string, direction: 'before' | 'after', threadId?: string): string {
  return `recall(${JSON.stringify({ mode: 'observations', threadId, groupId, direction })})`;
}

/** Messages after the last observed range are raw history only; say so instead of implying the thread ends. */
async function newerMessagesNote(
  group: ObservationGroup | undefined,
  countNewerMessages: ((cursor: string) => Promise<number>) | undefined,
  threadId: string | undefined,
): Promise<string | null> {
  const endpoints = group?.range.split(',').at(-1)?.split(':');
  const cursor = endpoints?.length === 2 ? endpoints[1] : undefined;
  if (!cursor || !countNewerMessages) return null;
  const count = await countNewerMessages(cursor);
  if (count <= 0) return null;
  const call = `recall(${JSON.stringify({ mode: 'messages', threadId, cursor })})`;
  return count === 1
    ? `1 newer message has not been observed yet; read it with ${call}`
    : `${count} newer messages have not been observed yet; read them with ${call}`;
}

export async function pageObservationGroups({
  om,
  threadId,
  resourceId,
  groupId,
  direction: requestedDirection,
  limit,
  threadTitle,
  includeThreadId = true,
  countNewerMessages,
}: {
  om: OMTimelineEngine;
  threadId: string;
  resourceId: string;
  groupId: string;
  direction?: 'before' | 'after';
  limit: number;
  threadTitle?: string;
  includeThreadId?: boolean;
  /** Counts the thread's messages created after the given message ID. */
  countNewerMessages?: (cursor: string) => Promise<number>;
}): Promise<{ results: string; count: number; hasMore?: boolean }> {
  const home = await findGroupTimeline(om, threadId, resourceId, groupId);
  if (!home)
    return {
      results: `No original observation group ${JSON.stringify(groupId)} was found in the active or buffered observations of thread ${JSON.stringify(threadId)} across its retained history. Check the threadId and groupId from the search hit, or use mode="messages" with a message ID from its source range.`,
      count: 0,
    };
  const direction = requestedDirection ?? 'after';
  let current = home;
  let position = home.indexById.get(groupId)! - (requestedDirection === undefined ? 1 : 0);
  const seen = new Set(
    (direction === 'after' ? home.groups.slice(0, position + 1) : home.groups.slice(position)).map(group => group.id),
  );
  const entries: Array<{ group: ObservationGroup; record: OMGenerationRecord }> = [];
  // One lookahead group lets us distinguish a full page from the end of retained history.
  while (entries.length <= limit) {
    position += direction === 'after' ? 1 : -1;
    const group = current.groups[position];
    if (group) {
      if (!seen.has(group.id)) {
        seen.add(group.id);
        entries.push({ group, record: current.record });
      }
      continue;
    }
    const generation = current.record.generationCount;
    const [record] = await om.getHistory(
      threadId,
      resourceId,
      1,
      direction === 'after'
        ? { afterGeneration: generation, sortDirection: 'ASC' }
        : { beforeGeneration: generation, sortDirection: 'DESC' },
    );
    if (!record) break;
    // Do not loop or expose other threads if a custom adapter ignores query options.
    if (
      (direction === 'after' ? record.generationCount <= generation : record.generationCount >= generation) ||
      (record.threadId !== null && record.threadId !== threadId)
    ) {
      throw new Error('Storage adapter did not honor observation history filters');
    }
    current = await buildTimeline(record, threadId);
    position = direction === 'after' ? -1 : current.groups.length;
  }
  const hasMore = entries.length > limit;
  const page = entries.slice(0, limit);
  if (direction === 'before') page.reverse();
  const pagingThreadId = includeThreadId ? threadId : undefined;
  if (!page.length) {
    const note =
      direction === 'after'
        ? await newerMessagesNote(home.groups[home.indexById.get(groupId)!], countNewerMessages, pagingThreadId)
        : null;
    return {
      results: `No ${direction === 'before' ? 'earlier' : 'later'} original observation groups in this thread's retained history.${note ? ` ${note}.` : ''}`,
      count: 0,
      hasMore: false,
    };
  }
  const now = new Date();
  const text = page.map(({ group, record }) =>
    [
      `## Group \`${group.id}\``,
      `_range: \`${group.range}\`_`,
      addRelativeTimeToObservations(group.content, now, record.observedTimezone ?? undefined),
    ].join('\n'),
  );
  // Exclusive pages can always return toward their original anchor. Inclusive pages must check.
  const hasEarlier =
    direction === 'before'
      ? hasMore
      : requestedDirection !== undefined ||
        home.indexById.get(groupId)! > 0 ||
        (home.record.generationCount > 0 &&
          (await pageObservationGroups({ om, threadId, resourceId, groupId, direction: 'before', limit: 1 })).count >
            0);
  const hasLater = direction === 'before' || hasMore;
  const newer = hasLater ? null : await newerMessagesNote(page.at(-1)!.group, countNewerMessages, pagingThreadId);
  text.unshift(
    hasEarlier
      ? `— Browse earlier: ${pagingCall(page[0]!.group.id, 'before', pagingThreadId)} —`
      : '— Start of retained observation history for this thread. —',
  );
  text.push(
    hasLater
      ? `— Browse later: ${pagingCall(page.at(-1)!.group.id, 'after', pagingThreadId)} —`
      : newer
        ? `— End of observation history for this thread. ${newer} —`
        : '— End of retained observation history for this thread. —',
  );
  text.unshift(
    `### Observation page\nThread: ${threadTitle || '(untitled)'}\nShowing ${page.length} groups ${requestedDirection === undefined ? 'starting at' : `strictly ${direction}`} \`${groupId}\` (oldest first).`,
  );
  return { results: text.join('\n\n'), count: page.length, hasMore };
}
