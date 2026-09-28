---
'@mastra/memory': patch
---

Improved recall search excerpts for long observation groups. When a hit doesn't fit its share of the text allowance, the excerpt now starts at the line that best matches the query and keeps that line's date. Previously every search showed the start of the group. A matching fact past that point could stay hidden while repeated searches returned the same opening lines as already in context.
