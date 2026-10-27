---
description: Correct a service name, importance or evidence reference.
---

Read CLAUDE.md, then show and history for the named service. Apply only the supplied facts:

```bash
node scripts/catalog.mjs update <service> --name="<name>" --tier=standard --runbook="<reference>" --repository="<reference>" --actor="<operator>"
```

Supply only the flags being changed. Never guess an evidence reference. Production services require a runbook. Present the updated record and its audit event. No messages are sent.
