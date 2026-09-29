---
'@mastra/deployer': minor
'@mastra/deployer-cloudflare': patch
---

Added module aliases for custom deployer build pipelines. Override `getAliases()` to replace exact module specifiers during dependency analysis, optimization, and final bundling.

```typescript
abstract class WorkersDeployer extends Deployer {
  protected getAliases(): Record<string, string> {
    return {
      ajv: './src/ajv-worker-shim.ts',
    };
  }
}
```
