import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

// Per-state results pages are generated from content/election-night data.
// The data invariants below run everywhere (CI never builds); the render
// checks run only when a static export is present (local post-build, the
// Pages workflow, or after `next build`).
const read = (path) => readFileSync(new URL(`../../out/${path}`, import.meta.url), 'utf8');
const hasExport = existsSync(new URL('../../out/results/al/index.html', import.meta.url));

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

test('Texas and Alabama carry split-zone notes for two-wave closes', () => {
  assert.match(pollRow('TX').split_zone_note, /all polls closed/i);
  assert.match(pollRow('AL').split_zone_note, /all polls closed/i);
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
