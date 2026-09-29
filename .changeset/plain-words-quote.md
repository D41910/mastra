---
'@mastra/memory': patch
---

Recall search results now quote the user's own words. Each excerpt not already in context includes up to two of the user's messages from that observation group, the ones sharing the most words with the query, placed in time order among the observation lines as `User said (<date> <time>): "…"`. Long messages are shortened around the matching words. Previously search showed only the observation summary, so the agent could not tell what the user actually said without a separate message lookup.
