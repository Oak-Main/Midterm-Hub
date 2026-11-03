import assert from 'node:assert/strict';
import test from 'node:test';
import { pollSourceKey, resultsDescription } from '../../lib/election-night.ts';
import { readFileSync, existsSync } from 'node:fs';

// Per-state results pages are generated from content/election-night data.
// Data and copy invariants run on clean checkouts. Render checks require a
// local build; CI explicitly builds and requires the complete static export.
const read = (path) => readFileSync(new URL(`../../out/${path}`, import.meta.url), 'utf8');
const buildIdFile = new URL('../../.next/BUILD_ID', import.meta.url);
const buildId = existsSync(buildIdFile) ? readFileSync(buildIdFile, 'utf8').trim() : null;
const hasExport = Boolean(buildId) && existsSync(new URL(`../../out/_next/static/${buildId}`, import.meta.url));
if (process.env.REQUIRE_STATIC_EXPORT === '1') {
  assert.ok(hasExport, 'Run npm run build before export regression tests');
  for (const { state } of JSON.parse(readFileSync(new URL('../../content/election-night/poll-close-2026.json', import.meta.url))).rows) {
    assert.ok(existsSync(new URL(`../../out/results/${state.toLowerCase()}/index.html`, import.meta.url)), `${state} export required`);
  }
}

const pollClose = JSON.parse(readFileSync(new URL('../../content/election-night/poll-close-2026.json', import.meta.url)));
const official = JSON.parse(readFileSync(new URL('../../content/election-night/official-results.json', import.meta.url)));
const elections = JSON.parse(readFileSync(new URL('../../generated/elections.json', import.meta.url))).elections;
const pollRow = (code) => pollClose.rows.find((row) => row.state === code);
const officialRow = (code) => official.rows.find((row) => row.state === code);
const jurisdictions = [...new Set(elections.map((e) => e.state))];

test('every jurisdiction has the data both sections of the page render from', () => {
  assert.equal(pollClose.rows.length, jurisdictions.length, 'poll-close row per jurisdiction');
  assert.equal(official.rows.length, jurisdictions.length, 'official-results row per jurisdiction');
  for (const code of jurisdictions) {
    const row = pollRow(code);
    assert.ok(row, `poll row for ${code}`);
    assert.ok(row.election_office_url, `office URL for ${code}`);
    if (row.tag !== 'UNVERIFIED') {
      assert.ok(row.closes.length >= 1, `at least one close for ${code}`);
      for (const close of row.closes) assert.match(close.et, /\d:\d\d (a|p)\.m\. ET/, `ET label for ${code}`);
    }
    assert.ok(officialRow(code).url.startsWith('https://'), `authority https URL for ${code}`);
    const general = elections.find((e) => e.state === code && e.election_type === 'general' && e.election_date === '2026-11-03');
    assert.ok(general, `2026 general record for ${code}`);
    assert.ok(general.offices.length > 0, `offices list for ${code}`);
  }
});

test('New Hampshire stays UNVERIFIED so no statewide close is fabricated', () => {
  assert.equal(pollRow('NH').tag, 'UNVERIFIED');
});

test('Texas carries a split-zone note; Alabama is a single statewide close', () => {
  assert.match(pollRow('TX').split_zone_note, /all polls closed/i);
  // Election-Day verification: no official Eastern-Time polling places found;
  // AL closes statewide at 7 p.m. Central (8 p.m. ET).
  const al = pollRow('AL');
  assert.equal(al.closes.length, 1);
  assert.equal(al.closes[0].area, 'Statewide');
  assert.equal(al.closes[0].et, '8:00 p.m. ET');
  assert.equal(al.split_zone_note, '');
  assert.match(pollRow('ND').split_zone_note, /vary by county/i);
});

test('Alabama results page carries title, authority link, closing time and guide link', { skip: !hasExport }, () => {
  const html = read('results/al/index.html');
  assert.match(html, /Alabama 2026 election results: poll closing and official results/);
  assert.ok(html.includes(officialRow('AL').url), 'official AL results URL present');
  for (const close of pollRow('AL').closes) assert.ok(html.includes(close.et), `close ${close.et} present`);
  assert.ok(html.includes('href="/states/al/"'), 'guide cross-link present');
  assert.match(html, /No live results or election calls are published here/);
});

test('New Hampshire renders the election-office fallback, not a fabricated close', { skip: !hasExport }, () => {
  const html = read('results/nh/index.html');
  assert.ok(html.includes(pollRow('NH').election_office_url), 'election office link present');
});

test('DC results page exists with its authority link', { skip: !hasExport }, () => {
  const html = read('results/dc/index.html');
  assert.ok(html.includes(officialRow('DC').url));
});

test('Texas split-zone page shows both waves and the ballot section', { skip: !hasExport }, () => {
  const html = read('results/tx/index.html');
  for (const close of pollRow('TX').closes) assert.ok(html.includes(close.et), `close ${close.et} present`);
  // React renders comment markers between text nodes, so match flexibly.
  assert.match(html, /On the (?:<!-- -->)?Texas(?:<!-- -->)? ballot/);
});

test('all 51 state results pages exported', { skip: !hasExport }, () => {
  for (const code of jurisdictions) {
    assert.ok(existsSync(new URL(`../../out/results/${code.toLowerCase()}/index.html`, import.meta.url)), `${code} results page exported`);
  }
});

test('sitemap includes every state results URL', { skip: !hasExport }, () => {
  const xml = read('sitemap.xml');
  for (const row of pollClose.rows) assert.ok(xml.includes(`/results/${row.state.toLowerCase()}/`), `${row.state} in sitemap`);
});

test('search descriptions preserve uncertainty without malformed prefixes', () => {
  for (const code of ['NH', 'AK']) {
    const description = resultsDescription(pollRow(code), officialRow(code).authority);
    assert.match(description, new RegExp(`check the ${pollRow(code).name} election office`));
    assert.doesNotMatch(description, /polls close|\d:\d\d/);
  }
  for (const row of [
    { ...pollRow('HI'), tag: 'CONFLICT' },
    { ...pollRow('HI'), closes: [] },
  ]) assert.match(resultsDescription(row, 'Election office'), /not confirmed here; check/);
});

test('Hawaii and split-zone descriptions separate election date from ET close date', () => {
  const hi = resultsDescription(pollRow('HI'), officialRow('HI').authority);
  assert.match(hi, /For the November 3, 2026 election: Hawaii polls close 12:00 a.m. ET, Nov 4\./);
  assert.doesNotMatch(hi, /Nov 4.*on .*November 3/);
  const tx = resultsDescription(pollRow('TX'), officialRow('TX').authority);
  for (const close of pollRow('TX').closes) assert.ok(tx.includes(close.et));
  assert.match(tx, /No live counts or calls here/);
});

test('Nebraska citations sharing a statutory URL have distinct keys', () => {
  const sources = pollRow('NE').sources;
  assert.ok(new Set(sources.map(source => source.url)).size < sources.length);
  assert.equal(new Set(sources.map(pollSourceKey)).size, sources.length);
});

test('every exported state has matching search and social descriptions and normal pending copy', { skip: !hasExport }, () => {
  for (const row of pollClose.rows) {
    const html = read(`results/${row.state.toLowerCase()}/index.html`);
    const expected = resultsDescription(row, officialRow(row.state).authority);
    const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    for (const attr of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
      assert.ok(html.includes(`${attr} content="${escape(expected)}"`), `${row.state} ${attr}`);
    }
    assert.doesNotMatch(html, /&amp;rsquo;/, `${row.state} must not show an entity literally`);
    if (officialRow(row.state).pending) assert.ok(html.includes('authority’s results landing page.'));
    assert.ok(html.includes('No live results or election calls are published here.'));
  }
  const hub = read('results/index.html');
  assert.match(hub, /times where verified, election-office fallbacks elsewhere/);
  const xml = read('sitemap.xml');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(urls.length, 630);
  assert.equal(new Set(urls).size, 630);
});
