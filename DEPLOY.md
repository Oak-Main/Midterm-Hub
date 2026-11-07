# Deploying MidtermWatch

## Accepted release configuration — November 6, 2026

| Component | Accepted role |
| --- | --- |
| GitHub `Oak-Main/Midterm-Hub`, `main` | Reviewed source for the current Next.js edition |
| Vercel team `kevynsgrin-a11ys-projects`, project `midterm-hub` | Authoritative build and production deployment; project ID `prj_dp0jJnbJQBsJfiFXM7sfBvRXKCkA` |
| Vercel Production environment | Tracks `main`; automatic custom-domain assignment enabled |
| `https://midterm-hub.vercel.app` | Production upstream for the edge proxy |
| Cloudflare `midtermwatch-vercel-proxy` | Serves the canonical apex and redirects `www` to `https://midtermwatch.com`; separate Worker release only when its code changes |
| GitHub `test` workflow | Python tests; frontend typecheck, lint, build and required export regressions on pushes and PRs |
| `.github/workflows/pages.yml` — **Static export validation** | Build and export regressions on `main`, manual runs and the existing weekly schedule; no publishing, Pages configuration, OIDC or Pages write permissions |
| **Vercel production verification** | Read-only check after a push to `main`, or manually on `main`; waits for the exact commit's Vercel status, then checks the canonical site |
| GitHub Pages / `github-pages` environment | Retired duplicate publishing target; historical settings and deployments retained, no active publishing job |

The inspected GitHub environments are `Production`, `Preview`, `copilot` and
`github-pages`. Vercel's Git integration emits deployment statuses and commit
statuses; both switches were enabled. Its connected Git repository is
`Oak-Main/Midterm-Hub`. No new Vercel token or second deploy mechanism is needed.

GitHub Pages was configured with source **GitHub Actions** and custom domain
`midtermwatch.com`, rather than a distinct secondary URL. Its settings showed
the last successful deployment and unavailable HTTPS for that domain. The
`github-pages` environment allowed `main` and the historical
`claude/civic-calendar-engine-backend-wddfqw` branch, with no reviewer or wait
timer, secrets or variables. `Production` had no branch restriction, reviewers,
wait timer, secrets or variables. These GitHub environment settings do not
select what the public Cloudflare/Vercel path serves.

The redundant Pages publisher is removed from the workflow. Existing Pages
settings, deployments, environment history, DNS, Vercel integration and
Cloudflare configuration are preserved. The old Pages dashboard may still
claim the public domain; that is a historical configuration, not a production
acceptance receipt. No separate Pages destination is maintained or relied on
for failover. Reintroducing one requires a distinct hostname/path, correct
asset base path, HTTPS, and its own named release and acceptance process.

## Build and release

Before merging, require the `test` checks to pass on the reviewed revision.
Review the Vercel preview when the change affects public behavior. A merge to
`main` triggers Vercel's existing Git deployment and the read-only production
verification workflow. GitHub Actions does not upload a second production site.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt -e .
npm ci
npm run lint
npm run typecheck
npm run build
REQUIRE_STATIC_EXPORT=1 npm test
.venv/bin/python -m pytest -q
```

Vercel's `vercel.json` install command prepares its checkout-local Python
environment and installs the locked Node dependencies. `npm run build`
validates the historical calendar and dated research, then exports current
routes into `out/`. The standalone Python calendar renderer, historical
Cloudflare Pages instructions and tracked legacy `out/` files are not a
replacement for this current edition.

## Production acceptance and failure attribution

`scripts/verify-production.mjs` runs with Node 24 and read-only GitHub contents
and commit-status access. It needs no npm installation. It:

1. Confirms its SHA is still `main`; superseded runs report `superseded` and
   exit 2, so an older run cannot claim a newer release or green acceptance.
   Concurrency can cancel an obsolete run before it writes a receipt.
2. Waits up to 30 attempts, ten seconds apart, for the Vercel bot's commit
   status. `failure` or `error` terminates immediately. Only the approved
   team's `midterm-hub` deployment URL is accepted.
3. Extracts the deployment ID from that status and requires matching
   `data-dpl-id` on the public homepage, results index and GA/MS/LA results
   pages. A successful older edition cannot pass for a new commit.
4. Requires HTTP 200, expected response types, no Worker stale fallback,
   the committed edition state and exact `/status.json` payload. Results
   pages must retain the no-live-results disclaimer; post-election pages must
   also show `Status: After the election`.
5. Confirms the `www` results route returns HTTP 308 to the canonical apex.

Each route is checked both with a non-tracking query parameter to bypass the
Worker's cache and as an ordinary cacheable visitor request. HTML responses must
match the exact deployment; JSON must match the committed payload. Both reject
stale fallback. The GitHub token is sent only to `api.github.com`, never
to the website. A JSON receipt is written to the job log and step summary.
The workflow has a ten-minute overall bound. Local/manual equivalent:

```bash
GITHUB_SHA="$(git rev-parse HEAD)" node scripts/verify-production.mjs
```

An unauthenticated local run uses the public GitHub API's rate limit; CI uses
its scoped `GITHUB_TOKEN`. If evidence cannot be retrieved, verification fails
and names the missing evidence; that alone does not establish a public outage.

| Failure | Meaning and next step |
| --- | --- |
| `test` or Static export validation | Source/build/regression failure; inspect the failing gate before release |
| Vercel commit status `failure` / `error` | Authoritative build/release failure; inspect that exact Vercel deployment |
| Vercel ready, public acceptance fails | Investigate alias assignment, canonical routing, edge cache/stale fallback or deployed content using the reported SHA and deployment ID |
| Historical `deploy-site` / `github-pages` failure | Separate retired target; not proof of a Vercel or public-domain outage |
| Production verification `superseded` (exit 2), or canceled run | Obsolete revision, not an outage; use the newer run's receipt |

For content rollback and the separately deployed Worker, follow
`docs/RESULTS-NIGHT.md`. After a Vercel rollback, restore automatic domain
assignment through promotion before expecting later merges to go live.

## Reconciled November 6 incident

PR #55 merged as `c5214f0bbca4b369372d925c2b4c4ba375c01d93`.
Vercel deployment `dpl_4VsCFwfeYM3ESVph6VqRf1b7EAXT` reached Ready, and the
PR's 22:26 UTC receipt verified the post-election edition on the public site.

GitHub Actions run `42304423191` built successfully, uploaded its Pages
artifact and created a Pages deployment. Its deploy job polled
`syncing_files` until the action's default 600,000 ms timeout at 22:35:18 UTC,
then canceled that Pages deployment. It did not report a build, authorization,
environment approval or artifact-validation failure. Increasing a timeout
would not resolve the duplicated destination or identify a backend cause.

Of the twelve Pages runs in the latest 100 workflow records inspected, eleven
succeeded and only this run failed. The immediately preceding runs and the
following runs `42309855355` (23:08 UTC) and `42321859127` (01:03 UTC Nov 7)
succeeded with the same workflow blob
`6e9d2180fa6299b89ca8a3644fc5f2c0e6cc4e4c`. That supports an isolated Pages
publishing delay; it does not prove the internal platform cause or a globally
declared incident. No repeatable `syncing_files` configuration defect was found.

At reconciliation, current `main` was
`7c203aef8cc5603b75d127526cdcb9775454bb0a` (PR #57), after PR #56.
Its Vercel production deployment `dpl_BZNzo6YBG9JVt8MGdzuP1XXmrkdB` was Ready
and served the current post-election edition. This repair preserves those
later approved corrections. It changes release automation and documentation,
plus acceptance tooling/tests; it does not change editorial content or app code.

Sources: [PR #55 and production receipt](https://github.com/Oak-Main/Midterm-Hub/pull/55),
[failed Pages run](https://github.com/Oak-Main/Midterm-Hub/actions/runs/42304423191),
[subsequent Pages success](https://github.com/Oak-Main/Midterm-Hub/actions/runs/42321859127),
[deploy-pages timeout contract](https://github.com/actions/deploy-pages/blob/v4/action.yml).

## Repair validation

The repair passed lint (zero warnings), typecheck, a complete Next.js build
(739 generated static routes), all 140 frontend/export regressions (zero
skipped), and all 409 Python tests. Twelve new acceptance tests cover attribution,
old deployments, stale fallback, status timestamps, retries, terminal Vercel
failures, superseded runs, redirect/JSON failures, visitor cache failures and
token scoping. Both workflow files parse as YAML;
the validation workflow has no Pages action, deployment job or write permission.
The new verifier accepted baseline `7c203ae` and its exact live Vercel deployment
at `2026-11-07T04:28:38Z`, checking both bypass and ordinary visitor paths. App,
editorial content, generated data, assets, Worker,
Next.js and Vercel configuration were checked unchanged. Production acceptance
for the merged repair is recorded by its GitHub Actions run, with the exact SHA
and deployment ID in the step summary; local results alone are not a release
receipt.
