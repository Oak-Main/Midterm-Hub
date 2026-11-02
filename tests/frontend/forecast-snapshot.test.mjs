import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url));

test('the displayed forecast snapshot has a linked and integrity-checked captured excerpt', () => {
  const evidence = JSON.parse(read('../../content/refresh/evidence/pec-senate-2026-11-02.json'));
  const downloaded = read('../../public/downloads/midterm-watch-pec-forecast-2026-11-02.json');
  assert.deepEqual(JSON.parse(downloaded), evidence);
  const sources = JSON.parse(read('../../content/refresh/source-register.json'));
  const source = sources.find(row => row.id === evidence.source_id);
  assert.equal(source.url, evidence.source_url);
  assert.equal(source.snapshot_path, '/downloads/midterm-watch-pec-forecast-2026-11-02.json');
  assert.equal(source.snapshot_sha256, createHash('sha256').update(downloaded).digest('hex'));
  assert.match(evidence.excerpt, new RegExp(`${evidence.democratic_seats} Dem \\| ${evidence.republican_seats} Rep`));
  assert.match(evidence.limitation, /not election results or calls/);
});
