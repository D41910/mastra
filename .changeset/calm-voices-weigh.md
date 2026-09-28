---
'@mastra/memory': patch
---

Observational memory now tells the agent to treat what the user said as authoritative and what the assistant said as suggestions. Previously an assistant's proposed schedule or example date could be recalled as if the user had done it. When an observation records an assistant proposal without the user's decision, the recall guidance tells the agent to read the raw messages around it.
