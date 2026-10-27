---
description: Run the service catalog add-task job and report the records.
---

Read CLAUDE.md. Resolve the operator's named records before any mutation. Replace angle-bracket placeholders with supplied facts, never guesses.

```bash
node scripts/catalog.mjs add-task <service> --code=<code> --title="<work>" --owner="<owner>" --due=<YYYY-MM-DD> --actor="<operator>"
```

Every command accepts `--json`. If a reference is ambiguous, show the candidates and ask which one. Do not retry with a guessed identifier. 

Report the result and any remaining evidence gaps. Keep all drafts local.
