import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import {
  EDITION_STATES, closeInstant, editionLabels, etLabel, mastheadPhase, officialResultsProblems, pollCloseProblems, readStatus, sortByClose, zoneOffsetMinutes,
} from '../../lib/election-night.ts';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const status = read('content/election-night/status.json');
const pollClose = read('content/election-night/poll-close-2026.json');
const officialResults = read('content/election-night/official-results.json');
const guides = read('content/refresh/content-package.json').state_registration_records;

// Home masthead by visitor date (rows) and status.json (columns).
const HOME = {
  '2026-11-02': { awaiting_polls: ['countdown', 1], election_day: ['election_day', null], counting: ['after', null], post_election: ['after', null] },
  '2026-11-03': { awaiting_polls: ['election_day', null], election_day: ['election_day', null], counting: ['after', null], post_election: ['after', null] },
  '2026-11-04': { awaiting_polls: ['after', null], election_day: ['after', null], counting: ['after', null], post_election: ['after', null] },
  '2026-11-10': { awaiting_polls: ['after', null], election_day: ['after', null], counting: ['after', null], post_election: ['after', null] },
};

test('home masthead renders the right state for Nov 2, 3, 4 and 10 under every status value', () => {
  for (const [today, expected] of Object.entries(HOME)) {
    for (const state of EDITION_STATES) {
      const [phase, days] = expected[state];
      assert.deepEqual(mastheadPhase(state, today), { phase, days }, `${state} on ${today}`);
    }
  }
});

test('the static first paint never shows a count, and status drives it', () => {
  assert.deepEqual(mastheadPhase('awaiting_polls', null), { phase: 'date', days: null });
  assert.equal(mastheadPhase('election_day', null).phase, 'election_day');
  assert.equal(mastheadPhase('counting', null).phase, 'after');
  assert.equal(mastheadPhase('post_election', null).phase, 'after');
});

test('no status and no date from Oct 20 to Dec 31 renders a zero or negative countdown', () => {
  for (let day = Date.parse('2026-10-20T12:00:00Z'); day <= Date.parse('2026-12-31T12:00:00Z'); day += 86_400_000) {
    const today = new Date(day).toISOString().slice(0, 10);
    for (const state of EDITION_STATES) {
      const { phase, days } = mastheadPhase(state, today);
      if (phase === 'countdown') assert.ok(days > 0, `${state} on ${today} counts ${days}`);
      if (today >= '2026-11-04') assert.equal(phase, 'after', `${state} on ${today}`);
    }
  }
});

test('/results/ shows the status.json state on every date: nothing advances automatically', () => {
  for (const state of EDITION_STATES) {
    const value = readStatus({ edition_state: state, updated_at: '2026-11-03T12:00:00Z' });
    for (const today of Object.keys(HOME)) assert.equal(editionLabels[value.edition_state], editionLabels[state], `${state} on ${today}`);
  }
  assert.equal(new Set(Object.values(editionLabels)).size, EDITION_STATES.length, 'each state has its own banner label');
  assert.throws(() => readStatus({ edition_state: 'projected', updated_at: '2026-11-03T12:00:00Z' }), /Unknown edition_state/);
  assert.throws(() => readStatus({ edition_state: 'counting', updated_at: 'tonight' }), /Invalid updated_at/);
  assert.doesNotThrow(() => readStatus(status), 'the committed status.json is valid');
  assert.deepEqual(Object.keys(status).sort(), ['edition_state', 'updated_at']);
});

test('Nov 3 is on standard time: ET is UTC-5 and every zone is at its standard offset', () => {
  assert.equal(zoneOffsetMinutes('America/New_York'), -300);
  assert.equal(zoneOffsetMinutes('America/Chicago'), -360);
  assert.equal(zoneOffsetMinutes('America/Denver'), -420);
  assert.equal(zoneOffsetMinutes('America/Los_Angeles'), -480);
  assert.equal(zoneOffsetMinutes('America/Anchorage'), -540);
  assert.equal(zoneOffsetMinutes('Pacific/Honolulu'), -600);
  assert.equal(closeInstant('19:00', 'America/New_York').toISOString(), '2026-11-04T00:00:00.000Z');
  assert.equal(etLabel(closeInstant('19:00', 'America/Chicago')), '8:00 p.m. ET');
  assert.equal(etLabel(closeInstant('19:00', 'Pacific/Honolulu')), '12:00 a.m. ET, Nov 4');
});

test('poll-close table: 51 rows, ET derivable, every row sourced or explicitly unverified', () => {
  assert.deepEqual(pollCloseProblems(pollClose.rows), []);
  assert.deepEqual(pollClose.rows.map(row => row.state).sort(), guides.map(row => row.state).sort(), 'one row per state and DC');
  for (const row of pollClose.rows) {
    if (row.tag === 'UNVERIFIED') assert.equal(row.closes.length, 0, `${row.state} must not guess a time`);
    else assert.ok(row.sources.length > 0 && row.source_url && row.retrieved_at, `${row.state} must cite a source`);
  }
  assert.ok(pollClose.time_basis.sources.length > 0, 'the standard-time basis is sourced');
  const sorted = sortByClose(pollClose.rows).filter(row => row.all_polls_closed_utc);
  assert.ok(sorted.every((row, index) => index === 0 || sorted[index - 1].all_polls_closed_utc <= row.all_polls_closed_utc));
});

test('the poll-close validator rejects guessed, mislabeled and unsourced rows', () => {
  const good = pollClose.rows.find(row => row.tag !== 'UNVERIFIED' && row.closes.length === 1);
  const wrongEt = { ...good, closes: [{ ...good.closes[0], et: '9:00 p.m. ET' }] };
  const guessed = { ...good, tag: 'UNVERIFIED' };
  const unsourced = { ...good, sources: [], source_url: null };
  const http = { ...good, election_office_url: 'http://example.gov/' };
  for (const bad of [wrongEt, guessed, unsourced, http]) {
    const rows = pollClose.rows.map(row => (row.state === good.state ? bad : row));
    assert.ok(pollCloseProblems(rows).some(problem => problem.startsWith(good.state)), JSON.stringify(bad).slice(0, 80));
  }
});

test('official results: 51 election-authority links, all https', () => {
  assert.deepEqual(officialResultsProblems(officialResults.rows), []);
  assert.deepEqual(officialResults.rows.map(row => row.state).sort(), guides.map(row => row.state).sort());
  for (const row of officialResults.rows) {
    assert.match(row.url, /^https:\/\//, `${row.state} url`);
    assert.match(row.requested_url, /^https:\/\//, `${row.state} requested_url`);
  }
  assert.ok(officialResultsProblems([{ ...officialResults.rows[0], url: 'http://example.gov/' }]).length > 0);
});

// The built pages, when out/ is a fresh `npm run build` from this checkout.
const buildIdFile = new URL('../../.next/BUILD_ID', import.meta.url);
const buildId = existsSync(buildIdFile) ? readFileSync(buildIdFile, 'utf8').trim() : null;
const freshExport = Boolean(buildId) && existsSync(new URL(`../../out/_next/static/${buildId}`, import.meta.url));

const page = path => readFileSync(new URL(`../../out/${path}`, import.meta.url), 'utf8');

// Owner-approved banner sentences from app/results/page.tsx statusSentence, pinned
// verbatim. The build renders only the committed state's sentence, right after
// "Consult election authorities for official results." (React escapes ' as &#x27;
// and marks the text-node boundary with <!-- -->). awaiting_polls and
// election_day still render no sentence; both have passed.
const bannerSentence = {
  counting: 'Polls have closed in every state; the last verified closing time was midnight ET on November 4. Election authorities are counting, and the official results links below are the source for every count.',
  post_election: "Counting and certification continue on each state's own schedule, and the official results links below stay current. Where a state requires a runoff, its page lists the date and registration rules.",
};

test('the built /results/ and home pages carry the committed status', { skip: freshExport ? false : 'no fresh `npm run build` export in out/' }, () => {
  const results = page('results/index.html');
  assert.match(results, new RegExp(`data-edition-state="${status.edition_state}"`));
  assert.ok(results.includes(`Status: ${editionLabels[status.edition_state]}</p>`), 'banner names the status.json state');
  assert.match(results, /<strong>No live results or election calls are published here\.<\/strong>/, '#44 banner wording is kept');
  const sentence = bannerSentence[status.edition_state];
  if (sentence) {
    const banner = results.replaceAll('&#x27;', "'").replaceAll('<!-- -->', '');
    assert.ok(banner.includes(`Consult election authorities for official results. ${sentence}`), `banner carries the ${status.edition_state} sentence verbatim`);
    for (const [state, other] of Object.entries(bannerSentence)) {
      if (state !== status.edition_state) assert.ok(!banner.includes(other), `the ${state} sentence does not leak into a ${status.edition_state} build`);
    }
  }
  assert.equal((results.match(/<tr id="close-[a-z]{2}"/g) ?? []).length, 51);
  assert.equal((results.match(/<tr id="results-[a-z]{2}"/g) ?? []).length, 51);
  assert.match(results, /<caption>Result publication states<\/caption>/);
  assert.match(results, /"@type":"BreadcrumbList"/);
  assert.doesNotMatch(results, /"@type":"(?:Event|LiveBlogPosting)"/);
  assert.doesNotMatch(results, /KEVYN-WRITE/, 'slots render nothing');
  for (const row of pollClose.rows.filter(item => item.tag === 'UNVERIFIED' || item.tag === 'CONFLICT' || item.unverified_areas?.length)) {
    assert.ok(results.includes(`Check the ${row.name} election office`), `${row.state} falls back to its election office`);
  }

  const home = page('index.html');
  assert.match(home, new RegExp(`data-phase="${mastheadPhase(status.edition_state, null).phase}"`), 'static paint follows status.json');
  assert.doesNotMatch(home, /KEVYN-WRITE/);
  assert.ok((home.match(/href="\/results\/"/g) ?? []).length >= 3, 'header, hero and footer link to /results/');
});

// app/status.json/route.ts: the public switch, exported as a static JSON file.
test('the exported /status.json matches the committed status.json and stays out of the sitemap', { skip: freshExport ? false : 'no fresh `npm run build` export in out/' }, () => {
  assert.ok(existsSync(new URL('../../out/status.json', import.meta.url)), 'the static export writes out/status.json');
  const payload = JSON.parse(page('status.json'));
  assert.deepEqual(payload, { status: status.edition_state, edition_state: status.edition_state, updated_at: status.updated_at });
  assert.deepEqual(Object.keys(payload).sort(), ['edition_state', 'status', 'updated_at'], 'no counts, projections or calls ride along');
  assert.doesNotMatch(page('sitemap.xml'), /status\.json/, '/status.json is not a sitemap entry');
});
