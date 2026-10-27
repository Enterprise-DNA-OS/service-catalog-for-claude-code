# Service Catalog for Claude Code

Read the database before answering. This is an internal service ownership desk for one organisation and trusted operators. It records ownership, direct dependencies, assessments, exceptions and remediation. It does not execute deployments, run security scanners or contact production systems.

## Operating rules

- Start with `node scripts/catalog.mjs attention` and the named service's `show` and `history` commands.
- The CLI is the one write path. Supply `--actor` for every mutation. That label records who is reported to have acted, not an authenticated identity.
- Ask when a name is ambiguous. Never infer an approver, evidence, owner or assessment result.
- Keep exceptions distinct from passes. Stale evidence stays stale. No inferred security assurance.
- Record an exception only after the operator gives the approver, reason and expiry. Do not approve on someone else's behalf.
- Never send messages, execute remote actions or delete records. Drafts stay in `drafts/`.
- Only seed disposable demo databases. Business databases start with migrate alone.
- Every recurring task uses `.claude/commands/`. All coding agents use this library.

## Routing

| Job | Command |
|---|---|
| help | `/help` |
| teams | `/teams` |
| services | `/services` |
| show | `/show` |
| owner review | `/owner-review` |
| scorecards | `/scorecards` |
| dependency risk | `/dependency-risk` |
| exceptions due | `/exceptions-due` |
| remediation | `/remediation` |
| attention | `/attention` |
| compliance | `/compliance` |
| insights | `/insights` |
| history | `/history` |
| add team | `/add-team` |
| add | `/add` |
| Correct service details | `/update` |
| assign | `/assign` |
| review | `/review` |
| lifecycle | `/lifecycle` |
| link | `/link` |
| add standard | `/add-standard` |
| attest | `/attest` |
| except | `/except` |
| close exception | `/close-exception` |
| add task | `/add-task` |
| complete task | `/complete-task` |
| log | `/log` |
| import | `/import` |
| export | `/export` |
| weekly review | `/weekly-review` |
| draft handover | `/draft-handover` |

| Change a field or rule | `/customise` |
| Add a read-only report | `/new-view` |

## Files

`supabase/migrations/` contains the Postgres/PGlite schema. `scripts/catalog.mjs` owns the CLI. `views.json` and `documents.json` define branded read-only output. `brand.json` holds the business name, colours and logo. `docs/replace-port.md` specifies import mappings and limits. `docs/compliance.md` separates local policy choices from source practices.

Use main. Every authored commit ends with `Agent: omni-rebuild-strategist`.
