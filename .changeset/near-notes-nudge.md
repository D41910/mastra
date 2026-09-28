---
'@mastra/memory': patch
---

When the recall tool is enabled, observational memory now adds a short reminder right after the observations: if they don't contain what's needed, or they conflict, use recall before answering. The full recall guidance sits before the observations, which can be far from the question in a long memory, and agents were concluding a topic was never discussed without searching. The guidance also no longer counts visible-but-contradicted evidence as a reason to skip recall.
