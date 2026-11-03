import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const data = JSON.parse(read('../../content/refresh/content-package.json'));

test('Kansas polling hours distinguish time-zone defaults and direct voters to their county', () => {
  const record = data.state_registration_records.find(row => row.state === 'KS').election_day_hours;
  assert.match(record.value, /Central default: 7 a\.m\. to 7 p\.m\./);
  assert.match(record.value, /Mountain default: 6 a\.m\. to 6 p\.m\./);
  assert.match(record.note, /County election officers may set different hours/);
  assert.match(record.note, /confirm your county/);
  assert.equal(record.corrected_on, '2026-11-03');
  assert.equal(record.correction_date_basis, 'UTC');
  assert.equal(record.previous_superseded, '7 a.m. to 7 p.m.');
  assert.ok(record.source_ids.includes('KS-HOURS-LAW-20261103'));
  assert.ok(record.source_ids.includes('KS-HOURS-SOS-20261103'));
  for (const path of ['../../content/refresh/fragments/states/ks.html', '../../content/refresh/fragments/voting-deadlines.html']) {
    const html = read(path);
    assert.ok(html.includes(record.value), path);
    assert.ok(html.includes('KS-HOURS-LAW-20261103'), path);
    assert.ok(html.includes('KS-HOURS-SOS-20261103'), path);
  }
  const row = read('../../public/downloads/midterm-watch-voting-2026-10-20.csv').split('\n').find(line => line.startsWith('KS,'));
  assert.ok(row.includes(record.value));
  assert.ok(row.includes(record.note));
  assert.ok(row.includes('www.kslegislature.gov/b2025_26/laws/025_000_0000_chapter/'));
  assert.ok(row.includes('www.sos.ks.gov/elections/voter-information.html'));
  const calendar = read('../../public/downloads/midterm-watch-voting-2026-10-20.ics').replace(/\r?\n[ \t]/g, '');
  const event = calendar.split('BEGIN:VEVENT').find(item => item.includes('SUMMARY:Kansas — November election'));
  assert.ok(event.includes('Central default: 7 a.m. to 7 p.m.'));
  assert.ok(event.includes('Mountain default: 6 a.m. to 6 p.m.'));
  assert.ok(event.includes('www.kslegislature.gov/b2025_26/laws/'));
  assert.ok(event.includes('www.sos.ks.gov/elections/voter-information.html'));
});
