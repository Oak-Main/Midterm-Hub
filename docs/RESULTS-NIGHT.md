# Results night runbook, November 3–4, 2026

Operator: Kevyn. This site never calls a race and carries no vote counts. On
election night it shows each state's official poll-closing time, a link to each
election authority's results page, and a status banner driven by one file.

- Public host: `https://midtermwatch.com` (apex, canonical). `www` 308s to it at
  the Cloudflare Worker `midtermwatch-vercel-proxy`.
- Origin: Vercel project `midterm-hub` (Production Branch `main`). A commit to
  `main` is a production deploy.
- Data: `content/election-night/poll-close-2026.json`,
  `content/election-night/official-results.json`,
  `content/election-night/status.json` (the switch).

## Timeline (from the poll-close table)

Every time below is Tuesday, November 3, 2026 unless marked. Nov 3 is on standard
time (daylight saving time ended Sunday, November 1), so ET = UTC-5 and PT = UTC-8.
Source per row: `content/election-night/poll-close-2026.json`. First close 6:00 p.m. ET
(3:00 p.m. PT); last verified close 12:00 a.m. ET Nov 4 (9:00 p.m. PT).

| Eastern | Pacific | Polls close (bold: all of that state's polls have closed) |
| --- | --- | --- |
| 6:00 p.m. ET | 3:00 p.m. PT | Indiana (Eastern), Kentucky (Eastern) |
| 7:00 p.m. ET | 4:00 p.m. PT | Alabama (Eastern), Florida (Eastern), **Georgia**, **Indiana (Central)**, **Kentucky (Central)**, **South Carolina**, **Vermont**, **Virginia** |
| 7:30 p.m. ET | 4:30 p.m. PT | **North Carolina**, **Ohio**, **West Virginia** |
| 8:00 p.m. ET | 5:00 p.m. PT | **Alabama (Central)**, **Connecticut**, **Delaware**, **District of Columbia**, **Florida (Central)**, **Illinois**, **Maine**, **Maryland**, **Massachusetts**, Michigan (Eastern), **Mississippi**, **Missouri**, **New Jersey**, **Oklahoma**, **Pennsylvania**, **Rhode Island**, South Dakota (Central), **Tennessee (Eastern and Central)**, Texas (Central) |
| 8:30 p.m. ET | 5:30 p.m. PT | **Arkansas** |
| 9:00 p.m. ET | 6:00 p.m. PT | **Arizona**, **Colorado**, **Iowa**, **Kansas (Central and Mountain)**, **Louisiana**, **Michigan (Central)**, **Minnesota**, **Nebraska (Central and Mountain)**, **New Mexico**, **New York**, **South Dakota (Mountain)**, **Texas (Mountain)**, **Wisconsin**, **Wyoming** |
| 10:00 p.m. ET | 7:00 p.m. PT | Idaho (Mountain), **Montana**, **Nevada**, North Dakota (Central), Oregon (Mountain), **Utah** |
| 11:00 p.m. ET | 8:00 p.m. PT | **California**, **Idaho (Pacific)**, **North Dakota (Mountain)**, **Oregon (Pacific)**, **Washington** |
| 12:00 a.m. ET, Nov 4 | 9:00 p.m. PT | Alaska, **Hawaii** |

Alaska: Aleutian Islands west of 169°30′ W (Hawaii-Aleutian time zone) has no verified close; /results/ links the Alaska election office for it.

No verified statewide close (shown as "Check the [state] election office"): New Hampshire.
RSA 659:4 sets only an earliest close (7 p.m.); towns choose later times.

Kansas and North Dakota set hours locally within a statutory window; the table
shows the latest permitted close (K.S.A. 25-106: 8 p.m. Central, 7 p.m. Mountain;
NDCC 16.1-01-03: 9 p.m.). The Kansas voting guide, corrected on `main`
(`docs/kansas-poll-hours-2026-11-03.md`), shows the same statute's defaults
(7 p.m. Central, 6 p.m. Mountain); counties may close later, up to these limits.

## The switch: `content/election-night/status.json`

`edition_state` is the only switch. Nothing advances on its own; a forecast or
a poll close never changes it. Two things change without a flip, on the
visitor's device date: from November 3 the home masthead stops counting and
shows "Polls close today", and from November 4 it shows the after-election
block. A flip moves the `/results/` banner and the static first paint of the
home page.

| Flip | Recommended time | `edition_state` | What changes |
| --- | --- | --- | --- |
| 1 | Tue Nov 3, 06:00 ET / 03:00 PT (every US zone is on Nov 3) | `election_day` | `/results/` banner "Election Day: polls open"; home first paint "Polls close today" |
| 2 | After 12:00 a.m. ET Nov 4 / 9:00 p.m. PT, the last verified close; 1:00 a.m. ET leaves margin for the unverified Aleutian close | `counting` | `/results/` banner "Counting"; home shows the after-election block (links to `/results/` and runoff registration routes) |
| 3 | Your call, no earlier than Wed Nov 4 | `post_election` | `/results/` banner "After the election"; home unchanged from `counting` |

`Projected` is not an edition state. The publication-state table on `/results/`
still requires a named call provider, source link and exact call time for any
projection, and this edition adds none.

### One-line flip (Git Bash, repository root, on `main`)

```bash
printf '{\n  "edition_state": "election_day",\n  "updated_at": "%s"\n}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > content/election-night/status.json && git commit -m "Election night: status election_day" -- content/election-night/status.json && git push origin main
```

Replace `election_day` with `counting` or `post_election` for flips 2 and 3.

From a phone: open
`https://github.com/Oak-Main/Midterm-Hub/edit/main/content/election-night/status.json`,
change `edition_state`, set `updated_at` to the current UTC time
(`2026-11-03T11:00:00Z` style), and commit directly to `main` (the branch is not
protected).

A misspelled state or an unparseable `updated_at` fails the build
(`lib/election-night-data.ts` validates it), so Vercel keeps serving the previous
production deployment. After every flip, confirm the deployment reached Ready.

### How long a flip takes to show

| Step | Time | Basis |
| --- | --- | --- |
| Vercel build and promote | about 1 min 45 s | PR #44 merge commit `8f8bcd2` at 23:22:54Z; deployment `dpl_HNZic5MAHRbMWhkhdX7vzR67nxgs` building 23:22:58Z, Ready 23:24:41Z (103 s) |
| Worker edge cache, `/results/` | up to 30 s more | `RESULTS_TTL_SECONDS` in `cloudflare/src/worker.js` |
| Worker edge cache, other HTML | up to 60 s more | `HTML_TTL_SECONDS` |
| Browser | none | HTML keeps Vercel's `max-age=0, must-revalidate` |

So `/results/` shows a flip within about 2.5 minutes of the push, and the home
page within about 3 minutes. Each Cloudflare data center expires its own copy.

## Rollback

### Vercel (site content)

- Dashboard: `midterm-hub` → Deployments → the production deployment that was
  live before the bad one → Instant Rollback. CLI: `vercel rollback <deployment-id-or-url>`.
- On the Hobby plan Vercel only allows rolling back to the previous production
  deployment.
- After a rollback Vercel stops assigning production domains to new
  deployments. Later merges, including status flips, will not go live until you
  run `vercel promote <deployment-id-or-url>` or undo the rollback in the
  dashboard.
- Production before this branch merges: `dpl_HNZic5MAHRbMWhkhdX7vzR67nxgs`
  (`8f8bcd2`, PR #44). Earlier: `dpl_EFhw7BTtgU6B6E8HzTDBRze2bgim` (`908dfca`),
  `dpl_EDNfHoVEvqnoASGrppqPaLBPpapK` (`103ddd0`).
- The Worker proxies `midterm-hub.vercel.app`, so a Vercel rollback reaches
  `midtermwatch.com` within the edge TTL above.

### Worker (edge)

```bash
cd cloudflare && npx wrangler deployments list
```

```bash
cd cloudflare && npx wrangler rollback --message "Results night: previous Worker version"
```

Without a version ID, `wrangler rollback` returns to the version uploaded before
the latest one. It takes effect immediately on both custom domains. The previous
version has no edge cache and no stale fallback.

## If the site slows

1. Edge state for a page:
   `curl -sI https://midtermwatch.com/results/ | grep -iE "^HTTP|x-mw-|cache-control"`.
   `x-mw-cache` is `HIT`, `MISS`, `STALE` or `BYPASS`.
2. Origin health:
   `curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://midterm-hub.vercel.app/results/`.
3. `x-mw-stale: 1` means Vercel threw, took longer than 8 s or returned 5xx, and
   the Worker served its last good copy of that page (kept 24 h, per data center,
   only for pages already fetched there). Check Vercel's status page and the
   production deployment.
4. A 502 or 504 with `x-mw-cache: MISS` means the origin failed and that data
   center had no stale copy yet.
5. Worker exceptions or CPU errors: Cloudflare dashboard → Workers & Pages →
   `midtermwatch-vercel-proxy` → Observability (enabled in `wrangler.jsonc`). If
   the new Worker is the cause, roll it back (above).
6. Avoid status flips during an origin incident: each flip is a new build.

## Drill (this branch, nothing touches production)

Run on 2026-11-03 from 03:37 UTC, on this branch rebased onto `8f8bcd2` (#44).
Vercel previews for this project sit behind Vercel Authentication (a preview URL
answered 302 to `vercel.com/sso-api`), so every check ran against a local static
server of this branch's `out/` export (`npm run build`; trailing-slash directory
hosting like Vercel's). Nothing touched midtermwatch.com or a Vercel deployment.
The Worker is covered separately by `tests/frontend/worker-cache.test.mjs` and
`wrangler deploy --dry-run`.

### Home and /results/ under each status value

One build per `edition_state` (`updated_at` 2026-11-03T12:00:00Z), reading the
static HTML: the `/results/` status label and the home masthead's first paint.
After hydration the home masthead also applies the visitor's date (tested in
`tests/frontend/election-night.test.mjs` for Nov 2, 3, 4 and 10).

| edition_state | build exit | /results/ label | home first paint | home headline |
| --- | --- | --- | --- | --- |
| `awaiting_polls` | 0 | Status: Awaiting polls | data-phase="date" | Nov 3 |
| `election_day` | 0 | Status: Election Day: polls open | data-phase="election_day" | Polls close today |
| `counting` | 0 | Status: Counting | data-phase="after" | Official results by state |
| `post_election` | 0 | Status: After the election | data-phase="after" | Official results by state |

### 30-URL matrix (status, canonical, og:url)

| Path | Status | canonical | og:url |
| --- | --- | --- | --- |
| / | 200 | https://midtermwatch.com/ | https://midtermwatch.com/ |
| /results/ | 200 | https://midtermwatch.com/results/ | https://midtermwatch.com/results/ |
| /states/ | 200 | https://midtermwatch.com/states/ | https://midtermwatch.com/states/ |
| /house/ | 200 | https://midtermwatch.com/house/ | https://midtermwatch.com/house/ |
| /senate/ | 200 | https://midtermwatch.com/senate/ | https://midtermwatch.com/senate/ |
| /governors/ | 200 | https://midtermwatch.com/governors/ | https://midtermwatch.com/governors/ |
| /polls/ | 200 | https://midtermwatch.com/polls/ | https://midtermwatch.com/polls/ |
| /forecast/ | 200 | https://midtermwatch.com/forecast/ | https://midtermwatch.com/forecast/ |
| /voting/ | 200 | https://midtermwatch.com/voting/ | https://midtermwatch.com/voting/ |
| /data/ | 200 | https://midtermwatch.com/data/ | https://midtermwatch.com/data/ |
| /about/ | 200 | https://midtermwatch.com/about/ | https://midtermwatch.com/about/ |
| /methodology/ | 200 | https://midtermwatch.com/methodology/ | https://midtermwatch.com/methodology/ |
| /sources/ | 200 | https://midtermwatch.com/sources/ | https://midtermwatch.com/sources/ |
| /corrections/ | 200 | https://midtermwatch.com/corrections/ | https://midtermwatch.com/corrections/ |
| /down-ballot/ | 200 | https://midtermwatch.com/down-ballot/ | https://midtermwatch.com/down-ballot/ |
| /down-ballot/executives/ | 200 | https://midtermwatch.com/down-ballot/executives/ | https://midtermwatch.com/down-ballot/executives/ |
| /down-ballot/measures/ | 200 | https://midtermwatch.com/down-ballot/measures/ | https://midtermwatch.com/down-ballot/measures/ |
| /states/ca/ | 200 | https://midtermwatch.com/states/ca/ | https://midtermwatch.com/states/ca/ |
| /states/tx/ | 200 | https://midtermwatch.com/states/tx/ | https://midtermwatch.com/states/tx/ |
| /states/ga/ | 200 | https://midtermwatch.com/states/ga/ | https://midtermwatch.com/states/ga/ |
| /states/la/ | 200 | https://midtermwatch.com/states/la/ | https://midtermwatch.com/states/la/ |
| /states/dc/ | 200 | https://midtermwatch.com/states/dc/ | https://midtermwatch.com/states/dc/ |
| /house/ca-22/ | 200 | https://midtermwatch.com/house/ca-22/ | https://midtermwatch.com/house/ca-22/ |
| /house/ny-17/ | 200 | https://midtermwatch.com/house/ny-17/ | https://midtermwatch.com/house/ny-17/ |
| /house/pa-7/ | 200 | https://midtermwatch.com/house/pa-7/ | https://midtermwatch.com/house/pa-7/ |
| /house/az-6/ | 200 | https://midtermwatch.com/house/az-6/ | https://midtermwatch.com/house/az-6/ |
| /house/me-2/ | 200 | https://midtermwatch.com/house/me-2/ | https://midtermwatch.com/house/me-2/ |
| /elections/GA/georgia/ae9f36da2d07e1e9/ | 200 | https://midtermwatch.com/elections/GA/georgia/ae9f36da2d07e1e9/ | https://midtermwatch.com/elections/GA/georgia/ae9f36da2d07e1e9/ |
| /sitemap.xml | 200 | - | - |
| /robots.txt | 200 | - | - |

### Load check, /results/

20 concurrent clients for 60 s against the local static server (Node fetch,
full body read). The /results/ HTML is 297,942 bytes uncompressed.

| Requests | Rate | p50 | p95 | p99 | Max | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| 52,342 | 872.4/s | 20.8 ms | 38.0 ms | 51.7 ms | 349.8 ms | 0 |

This measures the page and a single local server, not Vercel or the Worker.
Production adds the Worker cache: a 30 s `/results/` copy per Cloudflare data
center means Vercel sees at most about one `/results/` request per data center
every 30 s, however many visitors arrive.

In the browser the drill server answered 404 for Next's segment prefetch files
(`/<page>/__next.<segment>.__PAGE__.txt`), which the export stores as nested
folders that this simple server does not map. Every page shows the same 404s,
including pages this branch does not change; they only cost client-side
prefetch, and every page and asset request returned 200.
