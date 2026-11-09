# Midterm-Hub — workspace guide (civic-calendar-engine)

## What this is
`midterm-watch` — a curation-first pipeline for U.S. off-cycle and local election
dates and deadlines, powering two products from one audited SQLite store.
Next.js app (app/, components/), Cloudflare deployment assets under cloudflare/.

## Production
- Domain: midtermwatch.com — confirm current origin/hosting in the PortfolioOps
  inventory before any change.
- Deployment procedure: follow DEPLOY.md; do not invent a new path.

## Working rules
- `npm run typecheck && npm run lint && npm run test` before any build hand-off.
- Data changes go through the audited store — never hand-edit generated outputs.
- Content parity gates apply before any domain/origin move (see fleet rules).

## Cold-verify (after any deploy)
- https://midtermwatch.com — expect 200 with a real, on-brand title
- /robots.txt and /sitemap.xml both 200; record results in the session ledger.

## Fleet rules that always apply (summary of user-level AGENTS.md)

- Never deploy, repoint DNS, or attach/detach a domain on a production site without
  explicit owner approval for that exact change AND a passed content-parity check on
  the new origin BEFORE traffic moves (sitemap page count same-or-better, root body
  size same-or-better, robots.txt and sitemap.xml both 200, real on-brand title).
- Placeholder/scaffold/template builds are NEVER production deploys.
- Migrations cut over one site at a time, verify-then-next. No fleet-wide waves.
- After any deploy/cutover: cold-verify the live domain and record the check in the
  session ledger.
- Secrets: read from the local vault (`C:\Users\Dell\.ops-vault\`) at the moment of
  use. Never commit, print, or transmit values — report "set"/"missing" only.
