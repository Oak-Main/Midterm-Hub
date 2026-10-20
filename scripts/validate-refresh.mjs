import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = name => JSON.parse(readFileSync(name, 'utf8'));
const data = read('content/refresh/content-package.json');
const sources = read('content/refresh/source-register.json');
const sourceIds = new Set(sources.map(row => row.id));
const expected = {house_races:435,senate_ratings:35,governor_ratings:36,state_registration_records:51,statewide_executive_races:60,legislative_chambers:32,judicial_contests:17,ballot_measures:15,polls:7};
for (const [key, count] of Object.entries(expected)) assert.equal(data[key].length, count, key);
assert.equal(new Set(data.house_races.map(row => row.district)).size, 435);
assert.equal(new Set(data.state_registration_records.map(row => row.state)).size, 51);
function checkReferences(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (key.endsWith('source_ids')) for (const id of item) assert.ok(sourceIds.has(id), `Unknown source ${id}`);
    else checkReferences(item);
  }
}
checkReferences(data);
for (const row of data.house_races) {
  assert.ok(row.source_ids.length >= 2, row.district);
  assert.ok(row.featured_candidates.length > 0, row.district);
  for (const candidate of row.featured_candidates) assert.ok(candidate.source_ids.length >= 2, candidate.name);
  assert.ok(row.win_probability == null, 'Do not invent calibrated race odds');
}
for (const row of data.forecasts) {
  assert.equal(row.democratic_seat_center + row.republican_seat_center, row.office === 'House' ? 435 : 100);
  assert.equal(row.democratic_control_probability_pct + row.republican_control_probability_pct + (row.independent_decided_control_probability_pct ?? 0), 100);
  assert.ok(row.last_checked_utc && row.published_on, 'Forecast dates must remain explicit');
}
for (const file of read('generated/refresh-downloads-manifest.json').files) {
  const content = readFileSync(join('public/downloads', file.name));
  assert.equal(content.length, file.bytes, file.name);
  assert.equal(createHash('sha256').update(content).digest('hex'), file.sha256, file.name);
}
assert.deepEqual(read('public/downloads/midterm-watch-refresh-2026-10-20.json'), data);
assert.deepEqual(read('public/downloads/midterm-watch-sources-2026-10-20.json'), sources);
function walk(path) {
  return readdirSync(path).flatMap(name => { const file = join(path, name); return statSync(file).isDirectory() ? walk(file) : [file]; });
}
for (const path of walk('content/refresh/fragments')) {
  const text = readFileSync(path, 'utf8');
  assert.ok(!/<(?:script|iframe|object|embed)\b|\son[a-z]+\s*=|javascript:/i.test(text), `Unsafe content ${path}`);
}
console.log('Refresh validation passed: 435 district identities, collection coverage, source references, forecast arithmetic, script-free content and current export hashes.');
