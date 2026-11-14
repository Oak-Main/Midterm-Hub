import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyProduction } from './verify-production.mjs';

// Run after a fresh build. Attribute the release to its exact main SHA before
// comparing every published update with the reviewed static export.
const release = await verifyProduction();
assert.equal(release.outcome, 'verified', 'This revision must be the current verified production release');
const events = JSON.parse(readFileSync('content/election-night/official-updates.json')).events;
const rows = JSON.parse(readFileSync('content/election-night/official-results.json')).rows;
const paths = [...new Set([
  '/results/', ...rows.map(row => `/results/${row.state.toLowerCase()}/`),
  ...events.flatMap(event => event.contests.flatMap(contest => [contest.race_path, contest.coverage_path].filter(Boolean))),
])];
const expected = new Map(paths.map(path => [path, readFileSync(resolve('out', `.${path}index.html`), 'utf8')]));
const article = (html, id) => html.match(new RegExp(`<article[^>]*id="${id}"[^>]*>[\\s\\S]*?</article>`))?.[0];
const jobs = paths.flatMap(path => [true, false].map(bypass => ({ path, bypass })));
let completed = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (jobs.length) {
    const { path, bypass } = jobs.shift();
    const response = await fetch(`https://midtermwatch.com${path}${bypass ? `?mw_acceptance=${process.env.GITHUB_SHA}` : ''}`, {
      redirect: 'error', signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, 200, `${path}: HTTP 200`);
    assert.equal(response.headers.get('x-mw-stale'), null, `${path}: no stale fallback`);
    const html = await response.text();
    assert.ok(html.includes(`data-dpl-id="${release.deployment}"`), `${path}: exact deployment identity`);
    assert.ok(html.includes(`<link rel="canonical" href="https://midtermwatch.com${path}"`), `${path}: canonical`);
    for (const event of events) {
      const statePath = `/results/${event.state.toLowerCase()}/`;
      const id = `update-${event.id.toLowerCase()}`;
      if (path === statePath) {
        const reviewed = article(expected.get(path), id);
        assert.ok(reviewed, `${path}: reviewed export contains ${id}`);
        assert.equal(article(html, id), reviewed, `${path}: ${id} totals, dates, scope, sources and caveats match reviewed export`);
      } else if (path === '/results/' || event.contests.some(contest => contest.race_path === path || contest.coverage_path === path)) {
        assert.ok(html.includes(`href="${statePath}#${id}"`), `${path}: link to ${id}`);
      }
    }
    completed++;
  }
}));
console.log(JSON.stringify({ ...release, state_pages: rows.length, event_records: events.length,
  contest_entries: events.reduce((sum, event) => sum + event.contests.length, 0),
  routes_checked: paths.length, requests_passed: completed, modes: ['cache bypass', 'ordinary visitor'],
  checked_at: new Date().toISOString(),
}, null, 2));
