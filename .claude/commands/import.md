---
description: Run the service catalog import job and report the records.
---

Read CLAUDE.md. Resolve the operator's named records before any mutation. Replace angle-bracket placeholders with supplied facts, never guesses.

```bash
node scripts/catalog.mjs import port <catalog.csv> --source=<stable-source-label> --dry-run --actor="<operator>"
```

Every command accepts `--json`. If a reference is ambiguous, show the candidates and ask which one. Do not retry with a guessed identifier. Read `docs/replace-port.md`. Run the preview, reconcile counts and mapping, then repeat without `--dry-run` within the authorised import. Never silently alter changed source records.

Report the result and any remaining evidence gaps. Keep all drafts local.
