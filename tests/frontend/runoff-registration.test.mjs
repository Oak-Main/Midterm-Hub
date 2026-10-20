import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runoffRegistrationText } from '../../lib/runoff-registration.mjs';
const data = JSON.parse(readFileSync(new URL('../../content/refresh/content-package.json', import.meta.url)));
test('Louisiana runoff registration keeps the later online route visible', () => {
  const row = data.conditional_runoffs.find(item => item.state === 'LA');
  const text = runoffRegistrationText(row);
  assert.match(text, /mail or in person by November 12, 2026/);
  assert.match(text, /online by November 21, 2026/);
});
test('Georgia distinguishes federal eligibility and Mississippi names its cutoff', () => {
  const georgia = runoffRegistrationText(data.conditional_runoffs.find(item => item.state === 'GA'));
  assert.match(georgia, /October 5|October 05/);
  assert.match(georgia, /November 2|November 02/);
  const mississippi = runoffRegistrationText(data.conditional_runoffs.find(item => item.state === 'MS'));
  assert.match(mississippi, /November 2, 2026/);
});
