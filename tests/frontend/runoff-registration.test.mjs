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

test('Georgia runoff early-voting conflict is corrected in the data and both guides', () => {
  const georgia = data.conditional_runoffs.find(item => item.state === 'GA');
  assert.match(georgia.early_voting_note, /official sources differ.*county election authority/i);
  assert.match(georgia.early_voting_note_previous_superseded, /through November 25/);
  assert.match(georgia.early_voting_note_correction, /Corrected November 2, 2026/);
  assert.deepEqual(georgia.early_voting_note_source_ids, ['GA-SOS-2026-RUNOFF', 'GA-GOV-2026-RUNOFF', 'GA-FULTON-20261102']);
  for (const path of ['../../content/refresh/fragments/runoffs.html', '../../content/refresh/fragments/runoffs/ga.html']) {
    const html = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(html, /Georgia.gov lists November 25.*Secretary of State calendar lists November 27/);
    assert.match(html, /Check your county election authority/);
    assert.match(html, /Fulton County lists November 21 as the first early-voting day/);
    assert.doesNotMatch(html, /Statewide: starts as soon as possible, no later than November 23, through November 25/);
  }
});
