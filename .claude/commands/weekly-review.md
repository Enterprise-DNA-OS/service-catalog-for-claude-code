---
description: Run the service catalog weekly-review job and report the records.
---

Read CLAUDE.md. Resolve the operator's named records before any mutation. Replace angle-bracket placeholders with supplied facts, never guesses.

```bash
node scripts/catalog.mjs weekly-review
```

Every command accepts `--json`. If a reference is ambiguous, show the candidates and ask which one. Do not retry with a guessed identifier. The script reads owner-review, dependency-risk and attention and writes the Monday review to drafts/. Present owners, gaps and the next action. Do not send it.

Report the result and any remaining evidence gaps. Keep all drafts local.
