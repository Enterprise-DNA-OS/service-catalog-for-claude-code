---
description: Run the service catalog add job and report the records.
---

Read CLAUDE.md. Resolve the operator's named records before any mutation. Replace angle-bracket placeholders with supplied facts, never guesses.

```bash
node scripts/catalog.mjs add --code=<code> --name="<name>" --team=<team> --tier=standard --runbook="<reference>" --actor="<operator>"
```

Every command accepts `--json`. If a reference is ambiguous, show the candidates and ask which one. Do not retry with a guessed identifier. 

Report the result and any remaining evidence gaps. Keep all drafts local.
