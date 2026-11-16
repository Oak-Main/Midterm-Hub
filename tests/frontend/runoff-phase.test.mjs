import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { decodeIcs, icsHasCurrentRunoffEvent } from '../../lib/runoff-calendar.mjs';
import { activeRunoffs, runoffPhase, runoffRegistrationText, runoffStatusLine, sortRunoffs } from '../../lib/runoff-registration.mjs';

const readJson = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const runoffs = readJson('content/refresh/content-package.json').conditional_runoffs;
const register = readJson('content/refresh/source-register.json');
const runoff = state => runoffs.find(row => row.state === state);
const states = list => list.map(row => row.state);

test('Louisiana phases: online registration to Nov 21, early voting from Nov 28, closed Sunday Nov 29', () => {
  const la = runoff('LA');
  const expected = {
    '2026-11-20': 'registration_open', '2026-11-21': 'registration_open', '2026-11-22': 'registration_closed',
    '2026-11-28': 'voting_open', '2026-11-29': 'no_voting_today', '2026-11-30': 'voting_open',
    '2026-12-06': 'no_voting_today', '2026-12-12': 'runoff_day', '2026-12-13': 'past',
  };
  for (const [today, phase] of Object.entries(expected)) assert.equal(runoffPhase(la, today), phase, today);
});

test('Mississippi and Georgia: registration closed Nov 15, runoff day Dec 1, past Dec 2', () => {
  for (const state of ['MS', 'GA']) {
    assert.equal(runoffPhase(runoff(state), '2026-11-15'), 'registration_closed', state);
    assert.equal(runoffPhase(runoff(state), '2026-12-01'), 'runoff_day', state);
    assert.equal(runoffPhase(runoff(state), '2026-12-02'), 'past', state);
  }
  // Mississippi's calendar gives no first day for in-person absentee voting, so the
  // desk never claims a voting window is open there; Georgia's opens by Nov 23.
  assert.equal(runoffPhase(runoff('MS'), '2026-11-28'), 'registration_closed');
  assert.equal(runoffPhase(runoff('MS'), '2026-11-29'), 'no_voting_today');
  assert.equal(runoffPhase(runoff('GA'), '2026-11-23'), 'voting_open');
  assert.equal(runoffPhase(runoff('GA'), '2026-11-28'), 'no_voting_today');
});

test('status lines state routes and windows without asserting a contested date', () => {
  assert.equal(runoffStatusLine(runoff('LA'), '2026-11-15'), 'Online registration open through Nov 21 (GeauxVote). Mail and in-person registration closed Nov 12.');
  assert.match(runoffStatusLine(runoff('LA'), '2026-11-21'), /^Online registration closes today, Nov 21 \(GeauxVote\)\./);
  assert.equal(runoffStatusLine(runoff('GA'), '2026-11-15'), 'Registration for this runoff has closed.');
  assert.equal(runoffStatusLine(runoff('MS'), '2026-11-15'), 'Registration for this runoff has closed. In-person absentee voting ends at noon Saturday, Nov 28.');
  assert.equal(runoffStatusLine(runoff('LA'), '2026-11-22'), 'Registration for this runoff has closed. Early voting starts Saturday, Nov 28.');
  assert.equal(runoffStatusLine(runoff('LA'), '2026-11-28'), 'Registration has closed. Early voting runs through Saturday, Dec 5, 8:30 a.m.–6 p.m.; no early voting Sunday, Nov 29.');
  assert.equal(runoffStatusLine(runoff('LA'), '2026-11-29'), 'No early voting today (Sunday, Nov 29). It resumes Monday, Nov 30 and runs through Saturday, Dec 5.');
  assert.equal(runoffStatusLine(runoff('LA'), '2026-11-30'), 'Registration has closed. Early voting runs through Saturday, Dec 5, 8:30 a.m.–6 p.m.');
  // Georgia keeps the November 2 correction: neither official last day is asserted.
  for (const today of ['2026-11-23', '2026-11-26', '2026-11-27']) {
    assert.match(runoffStatusLine(runoff('GA'), today), /official sources list Nov 25 or Nov 27 as the last day/, today);
  }
  assert.match(runoffStatusLine(runoff('MS'), '2026-12-01'), /where a contest requires one/);
  assert.match(runoffStatusLine(runoff('LA'), '2026-12-12'), /^Election day is today\. Polling hours: 7 a\.m\.–8 p\.m\./);
  assert.equal(runoffStatusLine(runoff('LA'), '2026-12-13'), null);
});

test('no date on the static first paint: registration text, no phase', () => {
  for (const row of runoffs) assert.equal(runoffStatusLine(row, null), runoffRegistrationText(row), row.state);
});

test('Louisiana leads while its registration is open; the static order matches, so cards do not reorder', () => {
  for (const today of ['2026-11-15', '2026-11-20', '2026-11-21']) assert.equal(sortRunoffs(runoffs, today)[0].state, 'LA', today);
  assert.deepEqual(states(sortRunoffs(runoffs, null)), states(sortRunoffs(runoffs, '2026-11-15')));
  assert.deepEqual(states(sortRunoffs(runoffs, '2026-11-22')), ['GA', 'MS', 'LA'], 'nearest deadline first once LA registration closes');
});

test('after December 12 the desk is empty, so the hero falls back to the post-election masthead', () => {
  assert.deepEqual(states(activeRunoffs(runoffs, '2026-12-02')), ['LA']);
  assert.deepEqual(activeRunoffs(runoffs, '2026-12-12').length, 1);
  assert.deepEqual(activeRunoffs(runoffs, '2026-12-13'), []);
  assert.equal(activeRunoffs(runoffs, null).length, 3);
  // UntilRunoffsEnd switches the hero text on the same boundary: the day after the last runoff.
  const last = runoffs.map(row => row.date).sort().at(-1);
  for (const today of ['2026-11-15', '2026-12-12', '2026-12-13', '2027-01-04']) assert.equal(activeRunoffs(runoffs, today).length === 0, today > last, today);
});

test('desk facts cite dated register entries; earlier check dates are not overwritten', () => {
  const byId = new Map(register.map(row => [row.id, row]));
  assert.equal(byId.size, register.length, 'source IDs are unique');
  for (const row of runoffs) {
    for (const id of [...row.desk_source_ids, ...row.authority_source_ids, ...row.voting_window.source_ids, ...(row.contests ?? []).flatMap(contest => contest.source_ids)]) {
      assert.ok(byId.get(id)?.url && /^\d{4}-\d{2}-\d{2}$/.test(byId.get(id).retrieved_on), `${row.state} ${id}`);
    }
  }
  for (const id of ['LA-DATES-20261115', 'LA-LINCOLN-20261115', 'LA-STTAMMANY-20261115', 'LA-CANDIDATES-20261115', 'MS-CALENDAR-20261115', 'MS-CALENDAR-SUMMARY-20261115']) {
    assert.equal(byId.get(id).retrieved_on, '2026-11-15', id);
  }
  assert.equal(byId.get('LA-DATES').retrieved_on, '2026-10-20');
  assert.equal(byId.get('MS-CALENDAR').retrieved_on, '2026-10-20');
  assert.equal(byId.get('GA-SOS-2026-RUNOFF').retrieved_on, '2026-11-02');
});

test('contests come only from an official ballot source, with no candidate names', () => {
  assert.deepEqual(runoffs.filter(row => row.contests).map(row => row.state), ['LA'], 'GA and MS keep the generic offices text');
  const official = new Set(register.filter(row => row.publisher === 'Louisiana Secretary of State').map(row => row.id));
  for (const contest of runoff('LA').contests) {
    assert.ok(contest.source_ids.every(id => official.has(id)), contest.label);
    assert.match(contest.label, /^(U\.S\. House|State Senate), District \d+/);
  }
});

test('the calendar link is offered only where the .ics event carries the current early-voting text', () => {
  const ics = decodeIcs(readFileSync(new URL('../../public/downloads/midterm-watch-voting-2026-10-20.ics', import.meta.url)));
  assert.equal(icsHasCurrentRunoffEvent(ics, runoff('LA')), true);
  assert.equal(icsHasCurrentRunoffEvent(ics, runoff('MS')), true);
  // The October 20 file's Georgia event still says "through November 25".
  assert.equal(icsHasCurrentRunoffEvent(ics, runoff('GA')), false);
});

test('home page source keeps the subhead slot and drops the stale runoff copy', () => {
  const source = readFileSync(new URL('../../app/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /\{\/\* KEVYN-WRITE: one sentence saying the remaining 2026 contests are the December 1 Georgia and Mississippi runoffs/);
  assert.ok(source.includes('Runoffs: Georgia and Mississippi on December 1, Louisiana on December 12.'));
  assert.doesNotMatch(source, /Louisiana House contests may require a December runoff/);
  assert.doesNotMatch(source, /RunoffNotice/);
});

// The built home page, when out/ is a fresh `npm run build` from this checkout.
const buildIdFile = new URL('../../.next/BUILD_ID', import.meta.url);
const buildId = existsSync(buildIdFile) ? readFileSync(buildIdFile, 'utf8').trim() : null;
const freshExport = Boolean(buildId) && existsSync(new URL(`../../out/_next/static/${buildId}`, import.meta.url));
if (process.env.REQUIRE_STATIC_EXPORT === '1') assert.ok(freshExport, 'Run npm run build before export regression tests');
const decode = html => html.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');

test('built home page: runoff title, description budget, Event data and section order', { skip: freshExport ? false : 'no fresh `npm run build` export in out/' }, () => {
  const home = readFileSync(new URL('../../out/index.html', import.meta.url), 'utf8');
  const title = decode(home.match(/<title>(.*?)<\/title>/)[1]);
  assert.equal(title, '2026 Runoff Dates & Deadlines: GA, MS Dec 1, LA Dec 12 · Midterm Watch');
  assert.ok(title.length <= 70, `title is ${title.length} characters`);
  const description = decode(home.match(/<meta name="description" content="(.*?)"/)[1]);
  assert.equal(description, 'Georgia and Mississippi runoffs Dec 1; Louisiana votes Dec 12 (online registration to Nov 21). Official deadlines, early voting and absentee rules.');
  assert.ok(description.length <= 160, `description is ${description.length} characters`);

  const blocks = [...home.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  const events = blocks.flatMap(block => block['@graph'] ?? [block]).filter(node => node['@type'] === 'Event');
  assert.deepEqual(events.map(event => event.startDate).sort(), ['2026-12-01', '2026-12-01', '2026-12-12']);
  for (const event of events) {
    assert.equal(event.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
    assert.match(event.url, /^https:\/\/midtermwatch\.com\/states\/(ga|ms|la)\/$/);
    assert.ok(event.location?.address?.addressRegion, event.name);
    assert.equal(event.performer, undefined);
    assert.equal(event.organizer, undefined);
  }

  assert.ok(home.includes('The 2026 midterms · Runoff desk · checked November 15, 2026'));
  assert.ok(home.includes('Runoffs: Georgia and Mississippi on December 1, Louisiana on December 12.'));
  const desk = home.indexOf('data-runoff-desk');
  const electionDay = home.indexOf('Election Day results · November 3, 2026');
  assert.ok(desk > 0 && electionDay > desk, 'the Election Day block follows the runoff desk');
  for (const state of ['LA', 'GA', 'MS']) assert.match(home, new RegExp(`data-state="${state}" data-runoff-phase="unknown"`), state);
  assert.doesNotMatch(home, /days? until/, 'no countdown on the static first paint');
  assert.doesNotMatch(home, /runoff-notice-heading|Separate registration dates for possible runoffs/);
  assert.doesNotMatch(home, /Louisiana House contests may require a December runoff/);
  assert.doesNotMatch(home, /KEVYN-WRITE/);
  assert.equal((home.match(/download="">Calendar \(\.ics\)/g) ?? []).length, 2, 'LA and MS only');
});
