import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { officialResultsProblems, officialUpdateProblems, officialUpdatesForPath } from '../../lib/election-night.ts';

// Official post-election updates: dated, source-linked authority documents for
// covered contests. These tests pin the publication rules (scope, unofficial
// labels, certification evidence, no inferred values) and, when a build exists,
// the rendered pages.

const json = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const { events } = json('content/election-night/official-updates.json');
const official = json('content/election-night/official-results.json');
const codes = official.rows.map((row) => row.state);
const buildIdFile = new URL('../../.next/BUILD_ID', import.meta.url);
const buildId = existsSync(buildIdFile) ? readFileSync(buildIdFile, 'utf8').trim() : null;
const hasExport = Boolean(buildId) && existsSync(new URL(`../../out/_next/static/${buildId}`, import.meta.url));
const page = (path) => readFileSync(new URL(`../../out/${path}`, import.meta.url), 'utf8').replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&');

const base = () => ({
  id: 'CT-2026-11-06-sample', state: 'CT', kind: 'corrected_unofficial_tally', status: 'Unofficial; not certified',
  authority: 'Town Clerk', summary: 'A town return was amended.',
  contests: [{ contest: 'U.S. House, Connecticut District 1', coverage: 'U.S. House race page', race_path: '/house/ct-1/', candidates: 'A (D)', scope: 'Town return only', before: '1', after: '2', change: '+1' }],
  sources: [{ url: 'https://example.gov/a.pdf', title: 'Return', publisher: 'Town', version: null, sha256: null, checked_at: '2026-11-10T17:00:00Z' }],
  dates: { published: null, effective: null, certified: null, printed: null, first_observed: null, last_checked: '2026-11-10T17:00:00Z' },
  caveats: [],
});

test('the committed official-updates record is publishable', () => {
  assert.deepEqual(officialUpdateProblems(events, codes), []);
  assert.deepEqual(officialResultsProblems(official.rows), []);
});

test('validator: uncertified events must say unofficial and carry no certification date', () => {
  assert.deepEqual(officialUpdateProblems([base()], codes), []);
  assert.ok(officialUpdateProblems([{ ...base(), status: 'Corrected' }], codes).some((p) => /unofficial/.test(p)));
  assert.ok(officialUpdateProblems([{ ...base(), dates: { ...base().dates, certified: '2026-11-10' } }], codes).some((p) => /certification date/.test(p)));
});

test('validator: a certification needs its certification date; ids, states and sources are checked', () => {
  assert.ok(officialUpdateProblems([{ ...base(), kind: 'certification', status: 'Certified' }], codes).some((p) => /needs its certification date/.test(p)));
  assert.deepEqual(officialUpdateProblems([{ ...base(), kind: 'certification', status: 'Certified', dates: { ...base().dates, certified: '2026-11-10' } }], codes), []);
  assert.ok(officialUpdateProblems([base(), base()], codes).some((p) => /duplicate id/.test(p)));
  assert.ok(officialUpdateProblems([{ ...base(), state: 'GA' }], codes).some((p) => /state must be/.test(p)));
  assert.ok(officialUpdateProblems([{ ...base(), sources: [{ ...base().sources[0], url: 'http://example.gov' }] }], codes).some((p) => /https/.test(p)));
  assert.ok(officialUpdateProblems([{ ...base(), contests: [{ ...base().contests[0], after: null }] }], codes).some((p) => /both be stated/.test(p)));
});

test('validator: label_seen only describes posted 2026 results', () => {
  const row = { ...official.rows[0], page_kind: 'landing', pending: true, label_seen: 'Unofficial Results' };
  assert.ok(officialResultsProblems([row]).some((p) => /label_seen/.test(p)));
});

test('every event keeps its reporting-unit scope and states missing values instead of inferring them', () => {
  for (const event of events) {
    for (const contest of event.contests) {
      assert.ok(contest.scope.length > 10, `${event.id}: scope stated in words`);
      if (/town|county/i.test(contest.scope)) assert.match(contest.scope, /not (?:a|the) (?:statewide|district|full)/i, `${event.id}: local scope is never presented as a contest total`);
    }
    if (event.kind !== 'certification' && event.kind !== 'amended_certification' && event.kind !== 'withdrawn_certification') assert.equal(event.dates.certified, null);
  }
});

test('race pages only list events whose contests name that route', () => {
  for (const event of events) for (const contest of event.contests) if (contest.race_path) {
    assert.ok(officialUpdatesForPath(events, contest.race_path).includes(event));
  }
  assert.deepEqual(officialUpdatesForPath(events, '/house/zz-99/'), []);
});

test('built pages render each event on its state page, the hub and the covered race page', { skip: hasExport ? false : 'no fresh `npm run build` export in out/' }, () => {
  const hub = page('results/index.html');
  for (const event of events) {
    const anchor = `update-${event.id.toLowerCase()}`;
    const state = page(`results/${event.state.toLowerCase()}/index.html`);
    assert.ok(state.includes(`id="${anchor}"`), `${event.id} on its state page`);
    assert.ok(state.includes('No live results or election calls are published here.'), 'disclaimer kept');
    assert.ok(state.includes(event.status), `${event.id} status shown`);
    for (const contest of event.contests) {
      for (const value of [contest.before, contest.after, contest.change].filter(Boolean)) assert.ok(state.includes(value), `${event.id}: ${value}`);
      assert.ok(state.includes(contest.scope), `${event.id}: scope shown`);
      if (contest.race_path) assert.ok(page(`${contest.race_path.slice(1)}index.html`).includes(`/results/${event.state.toLowerCase()}/#${anchor}`), `${contest.race_path} links the update`);
    }
    for (const source of event.sources) assert.ok(state.includes(`href="${source.url}"`), `${event.id}: source link`);
    assert.ok(hub.includes(`/results/${event.state.toLowerCase()}/#${anchor}`), `${event.id} listed on the hub`);
  }
  const withEvents = new Set(events.map((event) => event.state));
  for (const code of codes.filter((code) => !withEvents.has(code))) {
    assert.ok(!page(`results/${code.toLowerCase()}/index.html`).includes('id="official-updates"'), `${code} has no empty updates section`);
  }
});

test('built results pages state each authority link check date and only claim "not posted" for pending rows', { skip: hasExport ? false : 'no fresh `npm run build` export in out/' }, () => {
  for (const row of official.rows) {
    const html = page(`results/${row.state.toLowerCase()}/index.html`);
    assert.equal(html.includes('had not been posted when last checked'), row.pending, `${row.state} availability sentence follows pending`);
    assert.ok(html.includes(`href="${row.url.replaceAll('&', '&amp;')}"`) || html.includes(`href="${row.url}"`), `${row.state} links its authority`);
    if (row.label_seen) assert.ok(html.includes(`“${row.label_seen}”`), `${row.state} label shown`);
  }
});
