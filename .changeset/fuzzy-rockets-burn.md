---
'@mastra/memory': patch
---

Improved recall search to fill context-covered hits with lower-ranked excerpts while keeping compact references. Backfill uses a bounded candidate pool and preserves the shared text allowance. Groups already in context are compacted, and observation paging can still expand them in full.
