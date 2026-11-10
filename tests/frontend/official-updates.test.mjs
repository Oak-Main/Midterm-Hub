import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { officialResultsProblems, officialUpdateProblems, officialUpdateRowConflicts, officialUpdatesForPath, sortOfficialUpdates } from '../../lib/election-night.ts';

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
if (process.env.REQUIRE_STATIC_EXPORT === '1') assert.ok(hasExport, 'Run npm run build before export regression tests');
const housePaths = new Set(json('content/refresh/content-package.json').house_races.map((race) => `/house/${race.district.toLowerCase()}/`));
const page = (path) => readFileSync(new URL(`../../out/${path}`, import.meta.url), 'utf8').replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&');

const base = () => ({
  id: 'CT-2026-11-06-sample', state: 'CT', kind: 'corrected_tally', status: 'Unofficial; not certified',
  authority: 'Town Clerk', summary: 'A town return was amended.',
  contests: [{ contest: 'U.S. House, Connecticut District 1', coverage: 'U.S. House race page', race_path: '/house/ct-1/', candidates: 'A (D)', scope_kind: 'local_unit', scope: 'Town return only; not a district total', before: '1', after: '2', change: '+1' }],
  sources: [{ url: 'https://example.gov/a.pdf', title: 'Return', publisher: 'Town', version: null, sha256: null, checked_at: '2026-11-10T17:00:00Z' }],
  dates: { published: null, effective: null, certified: null, printed: null, first_observed: null, last_checked: '2026-11-10T17:00:00Z' },
  caveats: [],
});

test('the committed official-updates record is publishable', () => {
  assert.deepEqual(officialUpdateProblems(events, codes, housePaths), []);
  assert.deepEqual(officialUpdateRowConflicts(events, official.rows), []);
  assert.deepEqual(officialResultsProblems(official.rows), []);
});

const problemsFor = (patch) => officialUpdateProblems([{ ...base(), ...patch }], codes, housePaths);
const withDates = (dates) => ({ dates: { ...base().dates, ...dates } });
const withContest = (contest) => ({ contests: [{ ...base().contests[0], ...contest }] });

test('validator: the sample event passes', () => assert.deepEqual(problemsFor({}), []));

test('validator: uncertified events must say unofficial; a corrected tally carries no certification date', () => {
  assert.ok(problemsFor({ status: 'Corrected' }).some((p) => /unofficial/.test(p)));
  assert.ok(problemsFor(withDates({ certified: '2026-11-10' })).some((p) => /no certification date/.test(p)));
  assert.ok(problemsFor({ status: 'Unofficial; not certified.' }).some((p) => /punctuation/.test(p)));
});

test('validator: certifications need a dated act and full-contest scope; partial scope is a local certification', () => {
  const certified = { kind: 'certification', status: 'Certified by the State Board', ...withDates({ certified: '2026-11-10' }) };
  assert.ok(problemsFor({ kind: 'certification', status: 'Certified' }).some((p) => /date of the certification act/.test(p)));
  assert.ok(problemsFor(certified).some((p) => /speaks for the whole contest/.test(p)), 'a town scope cannot be a full certification');
  assert.deepEqual(problemsFor({ ...certified, ...withContest({ scope_kind: 'full_contest', scope: 'Full contest, all counties' }) }), []);
  assert.deepEqual(problemsFor({ ...certified, kind: 'local_certification' }), []);
  assert.ok(problemsFor({ ...certified, kind: 'withdrawn_certification', ...withContest({ scope_kind: 'full_contest', scope: 'Full contest' }) }).some((p) => /withdrawn certification must say so/.test(p)));
});

test('validator: a completed recount needs a completion or publication date', () => {
  assert.ok(problemsFor({ kind: 'completed_recount', status: 'Unofficial recount result' }).some((p) => /completed recount needs/.test(p)));
  assert.deepEqual(problemsFor({ kind: 'completed_recount', status: 'Unofficial recount result', ...withDates({ effective: '2026-11-12' }) }), []);
});

test('validator: dates must be a calendar day or a UTC timestamp, never loose text', () => {
  for (const loose of ['2026-11', 'Tuesday, November 10, 2026', '11/10/2026', '2026-11-10T09:00:00-05:00']) {
    assert.ok(problemsFor(withDates({ published: loose })).some((p) => /dates\.published/.test(p)), loose);
  }
  assert.ok(problemsFor(withDates({ last_checked: '2026-11-10' })).some((p) => /last_checked must be a UTC timestamp/.test(p)));
});

test('validator: a local scope must disclaim being a contest total, for any local unit', () => {
  for (const scope of ['Town return only', 'Parish of Orleans', 'Ward 5 only', 'City of Nashua return']) {
    assert.ok(problemsFor(withContest({ scope })).some((p) => /local-unit scope/.test(p)), scope);
  }
  assert.ok(problemsFor(withContest({ scope_kind: 'precinct' })).some((p) => /scope_kind/.test(p)));
});

test('validator: race_path must be an existing House page in the event state', () => {
  assert.ok(problemsFor(withContest({ race_path: '/house/ct-01/' })).some((p) => /not a published House page/.test(p)));
  assert.ok(problemsFor(withContest({ race_path: '/house/ga-2/' })).some((p) => /in CT/.test(p)));
  assert.ok(problemsFor(withContest({ race_path: '/senate/ct/' })).some((p) => /\/house\/ route/.test(p)));
});

test('validator: ids, states, sources and duplicates are checked', () => {
  assert.ok(officialUpdateProblems([base(), base()], codes).some((p) => /duplicate id/.test(p)));
  assert.ok(problemsFor({ state: 'GA' }).some((p) => /state must be/.test(p)));
  assert.ok(problemsFor({ sources: [{ ...base().sources[0], url: 'http://example.gov' }] }).some((p) => /https/.test(p)));
  assert.ok(problemsFor({ sources: [base().sources[0], base().sources[0]] }).some((p) => /duplicate source/.test(p)));
  assert.ok(problemsFor(withContest({ after: null })).some((p) => /both be stated/.test(p)));
});

test('a pending results link older than an update for that state is a build error', () => {
  const rows = official.rows.map((row) => row.state === 'CT' ? { ...row, pending: true, checked_at: '2026-11-02T23:39:03Z' } : row);
  assert.ok(officialUpdateRowConflicts([base()], rows).some((p) => /still pending/.test(p)));
});

test('updates render newest authority date first', () => {
  const older = { ...base(), id: 'CT-2026-11-05-older' };
  assert.deepEqual(sortOfficialUpdates([older, base()]).map((event) => event.id), ['CT-2026-11-06-sample', 'CT-2026-11-05-older']);
});

test('validator: label_seen and visitor_note only describe posted 2026 results', () => {
  const row = { ...official.rows[0], page_kind: 'landing', pending: true, label_seen: 'Unofficial Results' };
  assert.ok(officialResultsProblems([row]).some((p) => /label_seen/.test(p)));
  assert.ok(officialResultsProblems([{ ...row, label_seen: undefined, visitor_note: 'Pick the election.' }]).some((p) => /visitor_note/.test(p)));
});

test('every event keeps its reporting-unit scope and states missing values instead of inferring them', () => {
  for (const event of events) {
    for (const contest of event.contests) {
      assert.ok(contest.scope.length > 10, `${event.id}: scope stated in words`);
      if (contest.scope_kind === 'local_unit') assert.match(contest.scope, /not (?:a|the) (?:statewide|district|full)/i, `${event.id}: local scope is never presented as a contest total`);
    }
    if (event.kind === 'corrected_tally') assert.equal(event.dates.certified, null);
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
    if (row.visitor_note) assert.ok(html.includes(row.visitor_note), `${row.state} visitor note shown`);
  }
});
