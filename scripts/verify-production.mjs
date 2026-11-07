import assert from 'node:assert/strict';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const origin = 'https://midtermwatch.com';
const repository = 'Oak-Main/Midterm-Hub';
const dashboardPath = '/kevynsgrin-a11ys-projects/midterm-hub/';

export function vercelDeployment(status) {
  const entry = status.statuses?.find(row => row.context === 'Vercel' && row.creator?.login === 'vercel[bot]');
  if (!entry || entry.state === 'pending') return null;
  if (entry.state !== 'success') throw new Error(`Vercel build/release status is ${entry.state}`);
  const url = new URL(entry.target_url);
  assert.equal(url.origin, 'https://vercel.com', 'Vercel status must link to the approved project');
  assert.ok(url.pathname.startsWith(dashboardPath), 'Vercel status must identify midterm-hub');
  const id = url.pathname.slice(dashboardPath.length);
  assert.match(id, /^[A-Za-z0-9]+$/, 'Vercel status must identify one deployment');
  return `dpl_${id}`;
}

export function validatePage(response, html, state, deployment, path) {
  assert.equal(response.status, 200, `${path}: HTTP 200 required`);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/i, `${path}: HTML required`);
  assert.equal(response.headers.get('x-mw-stale'), null, `${path}: stale fallback is not release acceptance`);
  // Hosting metadata observed in real Vercel-served HTML (PR #55 and the
  // baseline acceptance receipt); it is not emitted by app/ or the Worker.
  assert.ok(html.includes(`data-dpl-id="${deployment}"`), `${path}: expected Vercel deployment ${deployment}`);
  assert.ok(html.includes(`data-edition-state="${state}"`), `${path}: committed edition state required`);
  if (path.startsWith('/results/')) {
    assert.ok(html.includes('No live results or election calls are published here.'), `${path}: results disclaimer required`);
    if (state === 'post_election') {
      assert.ok(html.includes('Status: After the election'), `${path}: post-election status required`);
    }
  }
}

export async function verifyProduction({
  sha = process.env.GITHUB_SHA,
  token = process.env.GITHUB_TOKEN,
  expectedStatus = JSON.parse(readFileSync(new URL('../content/election-night/status.json', import.meta.url))),
  request = fetch,
  attempts = 30,
  pause = () => delay(10_000),
  log = console.log,
} = {}) {
  assert.match(sha ?? '', /^[a-f0-9]{40}$/, 'GITHUB_SHA must be the exact main revision');
  const api = async path => {
    const response = await request(`https://api.github.com/repos/${repository}${path}`, {
      headers: { accept: 'application/vnd.github+json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
    assert.equal(response.status, 200, `GitHub release evidence ${path}: HTTP 200 required`);
    return response.json();
  };
  const publicResponse = (path, bypass) => request(`${origin}${path}${bypass ? `?mw_acceptance=${sha}` : ''}`, {
    signal: AbortSignal.timeout(10_000), redirect: 'error',
  });
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // An old run must never attribute a newer main release to its own SHA.
      const branch = await api('/branches/main');
      if (branch.commit.sha !== sha) {
        return { outcome: 'superseded', sha, current_main: branch.commit.sha };
      }
      // The combined-status endpoint omits creator metadata. The status list
      // is newest first and includes the bot identity required for attribution.
      const deployment = vercelDeployment({ statuses: await api(`/commits/${sha}/statuses?per_page=100`) });
      assert.ok(deployment, 'Vercel has not reported this commit ready yet');
      let status;
      // Bypass proves origin identity; ordinary requests also exercise the
      // visitor cache/stale-fallback path. Both must serve this exact release.
      for (const bypass of [true, false]) {
        const statusResponse = await publicResponse('/status.json', bypass);
        assert.equal(statusResponse.status, 200, '/status.json: HTTP 200 required');
        assert.match(statusResponse.headers.get('content-type') ?? '', /application\/json/i, '/status.json: JSON content type required');
        assert.equal(statusResponse.headers.get('x-mw-stale'), null, '/status.json: stale fallback is not release acceptance');
        status = await statusResponse.json();
        assert.deepEqual(status, {
          status: expectedStatus.edition_state,
          edition_state: expectedStatus.edition_state,
          updated_at: expectedStatus.updated_at,
        }, '/status.json must match the committed edition exactly');
        for (const path of ['/', '/results/', '/results/ga/', '/results/ms/', '/results/la/']) {
          const response = await publicResponse(path, bypass);
          validatePage(response, await response.text(), status.edition_state, deployment, path);
        }
      }
      const redirect = await request('https://www.midtermwatch.com/results/', {
        redirect: 'manual', signal: AbortSignal.timeout(10_000),
      });
      assert.equal(redirect.status, 308, 'www must permanently redirect to the canonical origin');
      assert.equal(redirect.headers.get('location'), `${origin}/results/`);
      // Guard against main advancing while the public checks were in flight.
      const finalBranch = await api('/branches/main');
      if (finalBranch.commit.sha !== sha) {
        return { outcome: 'superseded', sha, current_main: finalBranch.commit.sha };
      }
      return { outcome: 'verified', sha, deployment, origin, status, checked_at: new Date().toISOString() };
    } catch (error) {
      lastError = error;
      log(`Production verification attempt ${attempt}/${attempts}: ${error.message}`);
      // Build/release failure is a distinct terminal signal, not a Pages error.
      if (error.message.startsWith('Vercel build/release status is ')) throw error;
      if (attempt < attempts) await pause();
    }
  }
  throw new Error(`Vercel production verification could not accept ${sha}: ${lastError?.message}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const receipt = await verifyProduction();
    console.log(JSON.stringify(receipt, null, 2));
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Vercel production ${receipt.outcome}\n\n\`\`\`json\n${JSON.stringify(receipt, null, 2)}\n\`\`\`\n`);
    }
    // A superseded receipt is informative, but never a green acceptance.
    if (receipt.outcome !== 'verified') process.exitCode = 2;
  } catch (error) {
    console.error(error.message);
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Vercel production verification failed\n\n${error.message}\n\nThis concerns the Vercel/public-domain release path. GitHub Pages is retired.\n`);
    }
    process.exitCode = 1;
  }
}
