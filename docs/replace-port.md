# Replace the Port catalog desk

Source checked 27 October 2026: [Port catalog export](https://docs.port.io/interface-builder/port-interface/page/catalog-page/). Port exports catalog pages as CSV or JSON. Active filters and visible columns determine what is included. [The profile export](https://docs.port.io/troubleshooting/general/) can also export selected blueprints, but this importer consumes catalog CSV.

## Export and import

1. In Port, open the service catalog page. Remove filters that exclude wanted records. Show the stable identifier, title, team and other fields you need. Export page data as CSV. Record the expected entity count.
2. Keep an untouched copy. Add the existing teams to the new database using add-team. For a new database, run migrate only. Do not seed real records.
3. Run `node scripts/catalog.mjs import port service-catalog.csv --source=our-port-service-catalog --dry-run --actor="Your name"`. Add `--map=our-mapping.json` if labels differ.
4. Reconcile counts and ownership. Repeat without --dry-run. Read services, owner-review and scorecards. Make the ownership reviews and local evidence checks before relying on the register.

## Mapping

These headings are configurable examples, not a claim about Port's universal defaults. The example CSV is synthetic.

| Internal field | Default CSV heading | Rule |
|---|---|---|
| code | Identifier | Required stable identifier, letters/digits/underscore/hyphen |
| name | Title | Required nonempty title |
| team | Team | Existing team code, name or UUID prefix; ambiguous values fail |
| lifecycle | Lifecycle | proposed, production, deprecated, retired; blank becomes proposed |
| tier | Tier | critical, standard, low, unknown; blank becomes unknown |
| runbook | Runbook | Reference retained as text, not fetched |
| repository | Repository | Reference retained as text, not cloned |

Example mapping file:

```json
{"code":"Service ID","name":"Service name","team":"Owning team"}
```

Mapping keys override column labels, not values. A mapping entry whose column is absent fails. Different lifecycle or tier vocabularies require an explicit reviewed mapping change through customise. Identifiers outside the allowed set also need a reviewed mapping. Do not silently normalise collisions. Teams are never created from guesses.

The complete original row, source label and stable identifier remain on every imported service. The importer does not mark an ownership review complete or create an assessment from a vendor badge. Unrecognised extra columns stay in raw_source for subsequent mapping. Existing local codes cannot be overwritten. Re-importing unchanged source records is a no-op; changed records stop the entire batch. Changes are reconciled explicitly with their history intact.

## What needs separate mapping

Dependencies and team definitions, scorecard rules, assessment history, exception approvals, action runs, integration credentials, attachments, entity access policies and automations are not imported by this service CSV command. Retain the original exports. Use the local link, attest, except and task commands with verified evidence, or have Enterprise DNA build a migration for your blueprints. No blanket promise to migrate the whole Port platform is made.

Export JSON to keep all local records and audit events. Export CSV for a service register. Neither replaces protected native database backups.
