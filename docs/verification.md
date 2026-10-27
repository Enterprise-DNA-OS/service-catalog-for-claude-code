# Verification

27 October 2026, Linux, Node 22.23.4:

- `npm install`: PASS, dependency audit reported no vulnerabilities.
- `npm test`: PASS, all 31 CLI commands, migrations, repeated seed, rollback, unchanged import, changed-source rejection, dry run, ambiguous matching, case-insensitive identifier uniqueness, evidence freshness, expiry, retirement guard, audit and HTML rendering.
- `npm run demo`: PASS, both migrations applied and demo gaps shown.
- `npm run view`: PASS, three branded views.
- `npm run docs`: PASS, eight documents across service handovers, exception records and team reviews.

Windows and Postgres results will be recorded after the manual CI workflow finishes. No credentials or production systems are used in these checks.
