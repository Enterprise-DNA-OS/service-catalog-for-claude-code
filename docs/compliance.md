# Standards evidence checks

Sources opened 27 October 2026. These checks help a software team keep evidence for selected practices. They are not legal advice, certification, a vulnerability scan, or proof of secure software. NIST practices are guidance unless adopted by the organisation's own obligations. Applicable contracts and controls must be reviewed for the deployment.

Primary source: [NIST SP 800-218, SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final), [full publication](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf).

| Check | Source practice | What the CLI checks | Limit |
|---|---|---|---|
| NIST-PO.2 | Defined security roles and responsibilities | Active service has a responsible team | A team assignment alone does not define every security responsibility |
| NIST-PW.1.2 | Document security requirements, risks and design decisions | Production service has a runbook/design evidence reference | It does not open or judge that document |
| NIST-PO.4 | Criteria for software security checks | Every active local standard has current assessment evidence | User-entered pass/fail is an attestation, not a scan |
| NIST-PW.4.4 | Check third-party components against organisational requirements through their life cycle | Recorded direct dependency is deprecated, retired, unowned or has an unexcepted evidence gap | The service dependency list is not a software bill of materials |

Restore-test evidence is an example local standard informed by [NIST SP 800-34 Rev. 1](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final). It records the operator's exercise reference. It does not test a backup. Replace or extend these standards for your own obligations.

Local defaults: ownership reviews and evidence freshness use 90 days; upcoming exceptions use 30 days. Neither is a NIST mandated interval. A current exception can suppress a standard gap from the action list, but compliance and scorecards still show the underlying failed, stale or missing result. Expired exceptions suppress nothing. The code does not automatically approve exceptions or change records based on these reports.
