---
description: Run the service catalog draft-handover job and report the records.
---

Read CLAUDE.md. Resolve the operator's named records before any mutation. Replace angle-bracket placeholders with supplied facts, never guesses.

```bash
node scripts/catalog.mjs draft-handover <service>
```

Every command accepts `--json`. If a reference is ambiguous, show the candidates and ask which one. Do not retry with a guessed identifier. Read show and history for the named service first. The generated file is an internal draft. Do not send it.

Report the result and any remaining evidence gaps. Keep all drafts local.
