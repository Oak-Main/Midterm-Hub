# Deploying midtermwatch.com

## Current October 20, 2026 edition

The public domain is served by the Vercel `midterm-hub` Next.js project. The
canonical origin is `https://www.midtermwatch.com`; the apex redirects there.
Use `npm ci` and `npm run build`, with Python requirements installed as configured
in `vercel.json`. The build validates the preserved calendar and the dated
`content/refresh/` collections, then exports every current route into `out/`.
The Pages workflow uses that same export.

See `docs/refresh-2026-10-20.md` for data boundaries, verification requirements,
publisher disclosures and the previous production rollback candidate.

The instructions below document the older standalone Python calendar builder.
That builder does not include the current race, forecast and voting-guide refresh
and must not replace the current production edition.

## Legacy calendar-only builder

The site is a hermetic static build. One command produces the whole thing:

```bash
bash scripts/build-site.sh dist    # → ./dist, built for https://midtermwatch.com
```

`dist/` contains the full site (HTML, `/assets`, `/downloads`, `sitemap.xml`,
`robots.txt`, and a `CNAME` file). Pick one host below.

> **Optional reference refresh (TrueAPI):** `node scripts/refresh-trueapi.mjs` writes
`generated/trueapi-reference.json` — the official Google Civic elections list and the
FEC-declared 2026 congressional candidates — read entirely from the portfolio's warm
ingest cache (`ingest.oakandmain.dev`). No API key, no upstream call, and never a
build input: the build stays hermetic; this is a reviewer cross-check for the curated
calendar.

The build ingests the real curated dataset in `intake/*.yaml` — every record
> was verified against an official source (see each record's `source_url`).
> To update data: edit/add intake YAML, and the next build picks it up.

---

## Option A — Cloudflare Pages (recommended, since the domain is on Cloudflare)

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
select this repo and set:

| Setting | Value |
| --- | --- |
| Build command | `bash scripts/build-site.sh dist` |
| Build output directory | `dist` |
| Environment variable | `PYTHON_VERSION = 3.11` |

Then **Custom domains → Set up a domain → `midtermwatch.com`**. Cloudflare adds the
DNS records automatically because the zone is already in your account. Every push to
`main` redeploys. (The `CNAME` file in `dist/` is ignored by Cloudflare Pages and is
harmless.)

## Option B — GitHub Pages + Cloudflare DNS

`.github/workflows/deploy-site.yml` already builds and deploys on push to `main`.
One-time setup:

1. **Repo → Settings → Pages → Source: "GitHub Actions".**
2. **Settings → Pages → Custom domain: `midtermwatch.com`** (this matches the `CNAME`
   the build emits). Leave "Enforce HTTPS" on once the cert provisions.
3. **In Cloudflare DNS**, add a record for the apex:
   - Type `CNAME`, Name `@` (or `midtermwatch.com`), Target `kevynsgrin-a11y.github.io`
     — Cloudflare flattens apex CNAMEs automatically.
   - Set it to **DNS only** (grey cloud) first while GitHub provisions the TLS cert;
     you can switch to **Proxied** (orange cloud) afterward.
4. Trigger a deploy: push to `main`, or **Actions → deploy-site → Run workflow**.

Live at `https://midtermwatch.com/`.

---

## Verifying a build locally

```bash
python -m http.server -d dist 8000   # then open http://localhost:8000/
```

Everything is same-origin and self-contained — no external requests.
