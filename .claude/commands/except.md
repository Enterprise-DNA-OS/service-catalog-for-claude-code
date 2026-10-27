---
description: Run the service catalog except job and report the records.
---

Read CLAUDE.md. Resolve the operator's named records before any mutation. Replace angle-bracket placeholders with supplied facts, never guesses.

```bash
node scripts/catalog.mjs except <service> --standard=<standard> --code=<code> --reason="<reason>" --approver="<recorded approver>" --expires=<YYYY-MM-DD> --actor="<operator>"
```

Every command accepts `--json`. If a reference is ambiguous, show the candidates and ask which one. Do not retry with a guessed identifier. Record an approval already given by the named approver. Do not invent or grant approval. An actor label is attribution, not authentication.

Report the result and any remaining evidence gaps. Keep all drafts local.
