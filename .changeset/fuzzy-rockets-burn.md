---
'@mastra/memory': patch
---

Improved recall search to fill context-covered hits with lower-ranked excerpts while keeping compact references. Backfill uses a bounded candidate pool and preserves the shared text allowance. Source groups are compacted when both range endpoints are in the current thread's message list, without extra message-history reads. Search labels these groups as overlapping context, and observation paging can still expand them in full.
