---
name: GPT-5 mini empty JSON responses
description: Avoiding empty content from short structured-output calls to GPT-5 mini.
---

For short JSON ranking calls with `gpt-5-mini`, explicitly request minimal
reasoning and leave enough completion-token headroom. A small output limit can
be consumed entirely by internal reasoning, producing an otherwise successful
completion with empty message content.

**Why:** A real structured-output call returned no message content until the
reasoning effort was reduced and the output ceiling was increased.

**How to apply:** For concise JSON tasks, keep the prompt strict, validate the
response locally, set minimal reasoning, and do not size the completion budget
as if only the visible JSON consumes tokens.