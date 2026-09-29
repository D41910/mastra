---
'@mastra/memory': patch
---

Observational memory guidance now covers sources, preferences, and totals:

- What the assistant did, such as editing a file, running a command, or calling a tool, counts as what happened. What it only proposed still counts as a suggestion.
- When asked what a specific person, video, document, or policy said, the assistant's own explanations don't count as that source. If memory only has the assistant's explanation, the agent says the source's content wasn't recorded.
- The agent follows the user's established choices and exclusions in recommendations unless asked for alternatives.
- The recall guidance asks the agent to look up earlier choices before recommending, and to look up each part separately before adding up totals across sessions. It no longer says recall is unnecessary for questions about preferences.
