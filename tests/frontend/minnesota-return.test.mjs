import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const data = JSON.parse(read('../../content/refresh/content-package.json'));

test('Minnesota return guidance distinguishes 5 p.m. hand delivery from 8 p.m. exceptions', () => {
  const record = data.state_registration_records.find(row => row.state === 'MN').mail_return;
  assert.equal(record.instruction_corrected_on, '2026-11-02');
  assert.match(record.instruction_previous_superseded, /by 8 p\.m\. on Nov 3/);
  assert.match(record.instruction, /dropped off by the voter or another person.*5 p\.m\. on Nov 3/);
  assert.match(record.instruction, /agent-delivery process.*mail-ballot precincts.*8 p\.m\. on Nov 3/);
  assert.ok(record.instruction_source_ids.includes('MN-SOS-2026-RETURN'));
  for (const path of ['../../content/refresh/fragments/states/mn.html', '../../content/refresh/fragments/voting-deadlines.html']) {
    const html = read(path);
    assert.ok(html.includes(record.instruction), path);
    assert.match(html, /MN-SOS-2026-RETURN/, path);
  }
  const row = read('../../public/downloads/midterm-watch-voting-2026-10-20.csv').split('\n').find(line => line.startsWith('MN,'));
  assert.ok(row.includes(record.instruction));
  assert.match(row, /sos\.mn\.gov\/elections-voting\/other-ways-to-vote\/return-your-ballot/);
});
