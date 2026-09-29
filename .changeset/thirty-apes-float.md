---
'@mastra/deployer-cloudflare': minor
'@mastra/deployer': patch
---

Added Cloudflare module aliases that apply during bundling and in Wrangler configuration.

```typescript
new CloudflareDeployer({
  name: 'my-worker',
  alias: {
    ajv: './src/ajv-worker-shim.ts',
  },
});
```
