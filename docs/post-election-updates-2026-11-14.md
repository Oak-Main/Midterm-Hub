# Official election updates — November 14, 2026

Owner authorized source-backed publication, PR creation, merging, deployment and live verification. This release adds 17 missing records to the three already published: 20 records containing 60 contest entries. Some contests occur in more than one event; this is not a count of unique races.

## Evidence and scope

The complete direct election-office URLs, observed document versions, check timestamps, contest scopes, totals and missing-date caveats are in `content/election-night/official-updates.json`. The existing three entries retain their earlier check dates. New records were checked against official documents and office-linked results portals on November 14.

| Jurisdiction | Added records | Publication treatment |
| --- | --- | --- |
| South Dakota | State certification, five covered contests | Signed certificate sworn and filed November 10; first observed November 14; publication date unstated |
| Wyoming | State certification, four covered contests | November 10 signed canvassing-board minutes; missing publication date remains null |
| New Hampshire | Nashua amended ward returns and four completed House recounts | Preserve ward scope and workbook recount columns; missing publication/completion dates explicitly identified |
| Idaho | Bannock correction and Latah completed recount | County figures only; Latah recount completion does not establish certification |
| South Carolina | State certification and separate District 2 completed recount | Certification effective November 11, release published November 12; District 2 kept separate and unofficial |
| Florida | Miami-Dade District 27 county certification and Brevard House 33 completed recount | County certification does not become state certification; later overseas-ballot totals are distinguished from the recount snapshot |
| Minnesota | Senate 33 and House 32A certifications | County boards competent for these wholly contained districts; later scheduled recounts are not reported as completed |
| Oklahoma | State certification, eight covered contests | November 13 reporting review documents the November 10 certification; official portal supplies totals |
| Vermont | Official canvass, four covered contests | Official report retained without inferring a publication or certification date |

The state results directory covers all 50 states and DC. Fourteen authority routes or labels were refreshed: AK, CA, FL, IA, LA, ME, MN, MS, MO, OH, OK, SD, DE and WY. Other rows retain their prior observation dates. Colorado and Texas portal rendering was incomplete during this review; Illinois, Kansas, Massachusetts and Wisconsin archive checks did not establish new general-election records. Those limitations are not evidence of no change and require subsequent rechecking. This release does not claim a fresh, exhaustive official-record review of all 51 jurisdictions.

## Presentation and safeguards

- Covered House, Senate, governor and selected down-ballot pages link to the relevant detailed state record. Historical forecast content remains labeled historical.
- A completed recount can have an unknown publication/completion date only when its first observation and explicit missing-date caveat are retained.
- An official canvass is distinct from an actual dated certification.
- An available updated tally can be published when the prior tally was not stated or retained; no missing figure is inferred.
- County and ward figures remain partial-scope figures. Certifications require the competent authority's documented act.

## Acceptance

Local Python suite: 409 passing. Frontend suite: 159 passing with a required fresh static export. Lint, typecheck and production build pass. Generated `out/` files are not part of this source change; Vercel builds the merged revision.

After deployment, run `GITHUB_SHA=<exact-main-sha> node scripts/verify-official-updates.mjs` following a fresh local build. It first verifies Vercel bot attribution and the exact production deployment, then concurrently checks all 51 state/DC results routes, the national hub, and affected race/coverage routes with both cache bypass and ordinary visitor requests. On state results pages, every event article must exactly match the reviewed rendered export, including totals, dates, scope, caveats and official source links. Race and coverage pages must link to the corresponding state records. Authority links, labels and check dates are compared on all state/DC pages. This acceptance checks publication fidelity; it does not replace the election-office evidence review above.
