import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { registrationAction } from '../../lib/registration-action.mjs';
const index = JSON.parse(readFileSync(new URL('../../generated/registration-index.json', import.meta.url)));
const state = code => index.find(row => row.state === code);

test('closed ordinary routes never imply same-day registration in PA, TX or SD', () => {
  for (const code of ['PA', 'TX', 'SD']) {
    const row = registrationAction(state(code), '2026-10-21');
    assert.equal(row.days, null, code);
    assert.doesNotMatch(row.label, /same.day rules may|open through election day/i, code);
    assert.match(row.label, /passed/, code);
  }
});
test('a passed mail date does not close later in-person routes', () => {
  const nebraska = registrationAction(state('NE'), '2026-10-20');
  assert.equal(nebraska.days, 3);
  assert.match(nebraska.label, /in person: 2026-10-23/);
  const california = registrationAction(state('CA'), '2026-10-20');
  assert.equal(california.days, 14);
  assert.match(california.label, /2026-11-03/);
  assert.match(registrationAction(state('NC'), '2026-10-20').label, /early|in.person/i);
});
test('no registration and the historical election state are explicit', () => {
  assert.equal(registrationAction(state('ND'), '2026-10-20').noRegistration, true);
  assert.match(registrationAction(state('NV'), '2026-10-20').label, /in person/i);
  assert.match(registrationAction(state('CA'), '2026-11-04').label, /later election/);
});
