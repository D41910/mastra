import { ErrorCategory, ErrorDomain, MastraError } from '@mastra/core/error';
import type { Plugin } from 'rollup';

export function moduleAlias(alias: Record<string, string>, resolveFrom: string): Plugin | null {
  const entries = Object.entries(alias);
  if (entries.length === 0) {
    return null;
  }

  return {
    name: 'module-alias',
    resolveId: {
      order: 'pre',
      async handler(id, _importer, options) {
        const target = alias[id];
        if (!target) {
          return null;
        }

        const resolved = await this.resolve(target, resolveFrom, {
          ...options,
          skipSelf: true,
        });

        if (!resolved) {
          throw new MastraError({
            id: 'DEPLOYER_ALIAS_TARGET_NOT_FOUND',
            domain: ErrorDomain.DEPLOYER,
            category: ErrorCategory.USER,
            details: {
              alias: id,
              target,
            },
            text: `Could not resolve deployer alias \`${id}\` to \`${target}\`.`,
          });
        }

        return resolved;
      },
    },
  };
}
