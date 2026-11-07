import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePage, vercelDeployment, verifyProduction } from '../../scripts/verify-production.mjs';

const sha = 'a'.repeat(40);
const deployment = 'dpl_Release123';
const expectedStatus = { edition_state: 'post_election', updated_at: '2026-11-06T22:05:14Z' };
const commitStatus = (state = 'success') => ({ statuses: [{
  context: 'Vercel', state, creator: { login: 'vercel[bot]' },
  target_url: 'https://vercel.com/kevynsgrin-a11ys-projects/midterm-hub/Release123',
}] });
const html = `<html data-dpl-id="${deployment}"><main data-edition-state="post_election">Status: After the election. No live results or election calls are published here.</main></html>`;
const response = (body, type = 'application/json', headers = {}) => new Response(body, { headers: { 'content-type': type, ...headers } });

test('release identity uses the Vercel bot status and approved project, not another target', () => {
  assert.equal(vercelDeployment(commitStatus()), deployment);
  assert.equal(vercelDeployment(commitStatus('pending')), null);
  assert.throws(() => vercelDeployment(commitStatus('failure')), /build\/release status is failure/);
  const other = commitStatus();
  other.statuses[0].target_url = 'https://vercel.com/other/project/Release123';
  assert.throws(() => vercelDeployment(other), /midterm-hub/);
  assert.equal(vercelDeployment({ statuses: [{ ...commitStatus().statuses[0], creator: { login: 'someone-else' } }] }), null);
});

test('a healthy-looking older deployment or stale Worker fallback cannot pass production acceptance', () => {
  const ok = response(html, 'text/html');
  validatePage(ok, html, 'post_election', deployment, '/results/');
  assert.throws(() => validatePage(ok, html, 'post_election', 'dpl_Older', '/results/'), /expected Vercel deployment/);
  assert.throws(() => validatePage(response(html, 'text/html', { 'x-mw-stale': '1' }), html, 'post_election', deployment, '/'), /stale fallback/);
  assert.throws(() => validatePage(ok, html, 'counting', deployment, '/'), /committed edition/);
});

function mockRequest({ status = commitStatus(), publicStatus = { status: 'post_election', ...expectedStatus }, advance = false } = {}) {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/branches/main')) return response(JSON.stringify({ commit: { sha: advance ? 'b'.repeat(40) : sha } }));
    if (url.endsWith(`/commits/${sha}/statuses?per_page=100`)) return response(JSON.stringify(status.statuses));
    if (url.includes('/status.json?')) return response(JSON.stringify(publicStatus));
    if (url.startsWith('https://www.midtermwatch.com/')) return new Response(null, { status: 308, headers: { location: 'https://midtermwatch.com/results/' } });
    return response(html, 'text/html');
  };
  return { request, calls };
}

test('complete acceptance checks canonical pages and redirect without sending the GitHub token to the website', async () => {
  const { request, calls } = mockRequest();
  const receipt = await verifyProduction({ sha, token: 'test-only-token', expectedStatus, request, attempts: 1 });
  assert.equal(receipt.outcome, 'verified');
  assert.equal(receipt.deployment, deployment);
  assert.equal(calls.filter(call => call.url.includes('mw_acceptance=')).length, 6);
  for (const { url, options } of calls) {
    if (url.startsWith('https://api.github.com/')) assert.equal(options.headers.authorization, 'Bearer test-only-token');
    else assert.equal(options.headers?.authorization, undefined);
  }
});

test('wrong public status timestamp fails even when the edition label is correct', async () => {
  const { request } = mockRequest({ publicStatus: { status: 'post_election', ...expectedStatus, updated_at: 'old' } });
  await assert.rejects(verifyProduction({ sha, expectedStatus, request, attempts: 1, log: () => {} }), /committed edition exactly/);
});

test('pending release is retried; failed release terminates immediately', async () => {
  let pending = true;
  let pauses = 0;
  const ready = mockRequest();
  const request = async (url, options) => {
    if (url.endsWith('/statuses?per_page=100') && pending) {
      pending = false;
      return response(JSON.stringify(commitStatus('pending').statuses));
    }
    return ready.request(url, options);
  };
  const result = await verifyProduction({ sha, expectedStatus, request, attempts: 2, pause: async () => { pauses++; }, log: () => {} });
  assert.equal(result.outcome, 'verified');
  assert.equal(pauses, 1);
  await assert.rejects(verifyProduction({ sha, expectedStatus, request: mockRequest({ status: commitStatus('error') }).request, attempts: 3, pause: async () => assert.fail('must not retry a failed release'), log: () => {} }), /status is error/);
});

test('a superseded main revision is recorded separately from a verified release', async () => {
  const { request, calls } = mockRequest({ advance: true });
  const receipt = await verifyProduction({ sha, expectedStatus, request, attempts: 1 });
  assert.equal(receipt.outcome, 'superseded');
  assert.equal(calls.length, 1);
});
