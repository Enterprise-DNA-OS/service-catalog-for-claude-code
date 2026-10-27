# Service Catalog for Claude Code

Own the record of who runs each software service, what it depends on, which standards have evidence and what still needs attention.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free MIT code. Install and operate it yourself. | Your ownership rules, standards, reports and Port data mapping. | Installed, connected and operated through Omni by Enterprise DNA. |
| [Quick start](#quick-start) | One setup fee, then a retainer. [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=port) | One setup fee, then a retainer. [Talk to Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=port) |

## The annual bill

[Port's pricing page](https://www.port.io/pricing), checked 27 October 2026, lists Basic from $30 per seat per month billed annually, in a 50-seat package. That is $18,000 a year at the displayed starting rate. This is a calculation from published pricing, not a customer invoice. The page shows dollar signs without a currency label. Confirm the billing currency and your contract. Port also has a free tier.

This independent project supplies the internal catalog and review work. Port is a broader hosted platform. The base does not include its integrations, developer self-service execution, sign-in, public portal, provisioning or live resource discovery. It never connects to a production service. Enterprise DNA scopes those connections and any screens around the customer's own process. Port and its marks belong to their owners. No affiliation is implied.

## Quick start

Node 20 or later. Run locally with embedded PGlite, or use a trusted shared Postgres database.

```bash
git clone https://github.com/Enterprise-DNA-OS/service-catalog-for-claude-code.git
cd service-catalog-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
node scripts/catalog.mjs help
```

Use Claude Code, Codex, OpenCode or Cursor. All read the same command library through CLAUDE.md and AGENTS.md. Demo records are fictional. Dates are relative to the first seed, including overdue reviews, an expired exception and stale evidence. The seed is idempotent. Never seed business data. Use a fresh DATA_DIR with migrate alone to begin your own register.

## Five weekly rituals

1. `/owner-review`: confirm the team responsible for every active service.
2. `/scorecards`: read missing, stale, failed and passed evidence separately.
3. `/dependency-risk`: review direct dependencies with gaps or a retired lifecycle.
4. `/exceptions-due`: review expired exceptions and those due within 30 days.
5. `/remediation`: assign and complete the work behind the gaps.

`/attention` combines outstanding work. `/weekly-review` writes a Monday draft from ownership, dependencies and attention. `/draft-handover` writes a service's ownership, standards and open work. Nothing sends.

## Commands

Flags use `--key=value`. Every command accepts `--json`. Codes, names and UUID prefixes resolve without case sensitivity. Ambiguous names list candidates and exit 1. Mutation labels are attribution, not authenticated identity.

```text
help
teams
services
show <service>
owner-review
scorecards
dependency-risk
exceptions-due
remediation
attention
compliance
insights
history <service>
add-team --code=<code> --name="<name>" --contact="<contact>" --actor="<operator>"
add --code=<code> --name="<name>" --team=<team> --tier=standard --runbook="<reference>" --actor="<operator>"
update <service> --runbook="<reference>" --repository="<reference>" --actor="<operator>"
assign <service> --team=<team> --actor="<operator>"
review <service> --note="<review evidence>" --actor="<operator>"
lifecycle <service> --state=<proposed|production|deprecated|retired> --note="<reason>" --actor="<operator>"
link <service> --to=<dependency> --note="<dependency reason>" --actor="<operator>"
add-standard --code=<code> --name="<name>" --source=<https-policy-reference> --days=90 --actor="<operator>"
attest <service> --standard=<standard> --result=<pass|fail> --evidence="<reference>" --date=<YYYY-MM-DD> --actor="<operator>"
except <service> --standard=<standard> --code=<code> --reason="<reason>" --approver="<recorded approver>" --expires=<YYYY-MM-DD> --actor="<operator>"
close-exception <exception> --note="<closure reason>" --actor="<operator>"
add-task <service> --code=<code> --title="<work>" --owner="<owner>" --due=<YYYY-MM-DD> --actor="<operator>"
complete-task <task> --note="<resolution evidence>" --actor="<operator>"
log <service> --note="<note>" --actor="<operator>"
import port <catalog.csv> --source=<stable-source-label> --dry-run --actor="<operator>"
export --out=catalog-export.json
weekly-review
draft-handover <service>
```

Service tiers are critical, standard, low or unknown. New services default to proposed and unknown. Promotion to production requires an owner and a runbook reference. Retirement refuses while an active service records a dependency. Dependencies are direct links, not inferred transitive impact or live topology.

Assessments store pass or fail with an evidence reference, date and actor. The current result becomes stale after the standard's configured freshness period. A missing assessment never counts as pass. A future assessment date is rejected. An unexpired exception records accepted risk separately and leaves the underlying result intact. Closing it requires a reason. A completed task requires resolution evidence. All successful mutations and import rows append an audit event in the same transaction.

Ownership review intervals of 90 days, standard freshness of 90 days and the 30-day exception lookahead are local defaults, not deadlines set by NIST. Change them through `/customise` and a tested migration.

## Bring Port records across

```bash
node scripts/catalog.mjs import port examples/port-services.csv --source=demo-port --dry-run --actor="Demo operator"
node scripts/catalog.mjs import port examples/port-services.csv --source=demo-port --actor="Demo operator"
node scripts/catalog.mjs export --out=catalog-export.json
node scripts/catalog.mjs export --format=csv --out=catalog-register.csv
```

Port's catalog CSV export includes visible columns and the entities permitted by current filters. The included example is synthetic, showing one configured catalog layout. [The switching guide](docs/replace-port.md) explains column mapping and existing team matching. Custom fields stay in the original source row. Scorecard rules, dependencies, attachments, integrations and permissions need separate mapping. Imported owner reviews are never assumed complete.

The full batch validates and writes transactionally. A bad row rolls back all rows and audit events. Same-source duplicates are skipped when unchanged. Changed records are rejected for explicit reconciliation. Preview performs the same writes inside a rolled-back transaction. Use one stable source label for the same Port catalog.

## Ten questions to ask

`node scripts/catalog.mjs insights` answers all ten from the current records. These combine ownership, evidence and work in ways that suit this desk. Port supports custom reporting too; this is not a claim that Port cannot answer them with configuration.

1. Which critical services lack a responsible team?
2. Which production services depend directly on deprecated or retired services?
3. Which services have stale evidence despite a recorded pass?
4. Which standards have never been assessed for each service?
5. Which exceptions expired while their checks still failed or lacked evidence?
6. Which teams own services with overdue remediation?
7. Which services have an exception but still lack a runbook?
8. Which production services have no dependency records?
9. Which imported services still await an ownership review?
10. Which services combine overdue ownership reviews with open remediation?

## Documents and views

`npm run docs` renders a service handover, exception record and team review as HTML. `npm run view` renders the week, standards and dependency review. Change your name, logo and colours in brand.json. These are read-only documents, with no forms or server. `/new-view` adds a report. [Why no front end](docs/why-no-front-end.md) explains the operating scope.

`/compliance` checks evidence against selected NIST SSDF practices. It does not scan software, verify references, certify compliance or grant exceptions. [Compliance sources](docs/compliance.md) name each practice and the limits of the check.

## Your first hour: ten things to ask for

1. Put our business name and colours on the handover.
2. Add our platform and product teams.
3. Add our critical customer-facing services.
4. Import a small Port catalog export and reconcile the count.
5. Map our owner field to existing teams.
6. Review the services with no responsible team.
7. Record our real security assessment evidence.
8. Add the dependencies we know about and their source.
9. Record one approved exception with its expiry and follow-up task.
10. Add a service domain field through `/customise` and a tested migration.

## Operating boundaries

One organisation per database, trusted internal operators only. No application authentication or tenant isolation layer. Row-level security is enabled without public policies. A shared deployment needs scoped database roles, secret storage, protected backups and tested restore procedures. Keep credentials outside this repository. Store evidence references, not confidential document bodies. Names and internal links in exports remain sensitive business data.

JSON export includes every domain record and audit event. It is a portable record copy, not a tested restore mechanism. CSV exports protect against spreadsheet formulas. HTML escapes record content. Files use restrictive permissions where the operating system supports them. Audit events reject normal updates and deletes; a database owner can alter those protections.

`npm test` uses disposable storage and exercises all 31 CLI commands, rollback, import preview, matching, evidence expiry, exception handling, retirement guards and rendering. A manual GitHub workflow checks Linux and Windows on Node 20/22 plus Postgres 17. See [verification](docs/verification.md) for actual run results.

MIT. Built by Enterprise DNA.
