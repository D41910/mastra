---
'@mastra/memory': patch
---

The recall guidance now tells the agent to look before saying something was never discussed. Previously an agent could answer "we never talked about that" just because the topic wasn't in its current observations, without searching its history.
