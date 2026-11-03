import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

// Per-state results pages: built from content/election-night data. These run
// after `next build` has produced out/ (the CI frontend job builds first).
const read = (path) => readFileSync(new URL(`../../out/${path}`, import.meta.url), 'utf8');

const pollClose = JSON.parse(readFileSync(new URL('../../content/election-night/poll-close-2026.json', import.meta.url)));
const official = JSON.parse(readFileSync(new URL('../../content/election-night/official-results.json', import.meta.url)));
const pollRow = (code) => pollClose.rows.find((row) => row.state === code);
const officialRow = (code) => official.rows.find((row) => row.state === code);

test('Alabama results page carries title, authority link, closing time and guide link', () => {
  const html = read('results/al/index.html');
  assert.match(html, /Alabama 2026 election results: poll closing and official results/);
  assert.ok(html.includes(officialRow('AL').url), 'official AL results URL present');
  const al = pollRow('AL');
  for (const close of al.closes) assert.ok(html.includes(close.et), `close ${close.et} present`);
  assert.ok(html.includes('href="/states/al/"'), 'guide cross-link present');
  assert.match(html, /No live results or election calls are published here/);
});

test('New Hampshire renders the election-office fallback, not a fabricated close', () => {
  const html = read('results/nh/index.html');
  assert.ok(html.includes(pollRow('NH').election_office_url), 'election office link present');
  assert.match(html, /vary by locality/i);
});

test('DC results page exists with its authority link', () => {
  const html = read('results/dc/index.html');
  assert.match(html, /DC 2026 election results|District of Columbia 2026 election results/);
  assert.ok(html.includes(officialRow('DC').url));
});

test('Texas split-zone page shows both waves and the ballot section', () => {
  const html = read('results/tx/index.html');
  const tx = pollRow('TX');
  for (const close of tx.closes) assert.ok(html.includes(close.et), `close ${close.et} present`);
  // React renders comment markers between text nodes, so match flexibly.
  assert.match(html, /On the (?:<!-- -->)?Texas(?:<!-- -->)? ballot/);
  assert.match(html, /U\.S\. Senate/);
});

test('all 51 state results pages exported', () => {
  const jurisdictions = JSON.parse(readFileSync(new URL('../../generated/elections.json', import.meta.url))).elections.map((e) => e.state);
  for (const code of new Set(jurisdictions)) {
    assert.ok(existsSync(new URL(`../../out/results/${code.toLowerCase()}/index.html`, import.meta.url)), `${code} results page exported`);
  }
});

test('sitemap includes every state results URL', () => {
  const xml = read('sitemap.xml');
  for (const row of pollClose.rows) assert.ok(xml.includes(`/results/${row.state.toLowerCase()}/`), `${row.state} in sitemap`);
});
