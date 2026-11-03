import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, sep } from 'node:path';
import ts from 'typescript';
import { resultShareLine, guideShareLine } from '../../lib/og-copy.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const exportRoot = resolve(root, 'out');
// The repo retains an older partial out/ snapshot; only a completed local
// build is an export of this checkout. CI does not run next build.
const buildIdFile = new URL('../../.next/BUILD_ID', import.meta.url);
const buildId = existsSync(buildIdFile) ? readFileSync(buildIdFile, 'utf8').trim() : null;
const hasExport = Boolean(buildId) && existsSync(resolve(exportRoot, '_next/static', buildId));
const readJson = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const polls = readJson('content/election-night/poll-close-2026.json').rows;
const guides = readJson('content/refresh/content-package.json').state_registration_records;
const texas = polls.find(row => row.state === 'TX');
const registration = state => guides.find(guide => guide.state === state).registration;

test('results cards use the latest verified ET close, including split zones and the next ET date', () => {
  assert.equal(resultShareLine(texas), 'Final poll close: 9:00 p.m. ET');
  assert.equal(resultShareLine({ ...texas, closes: [...texas.closes].reverse() }), resultShareLine(texas));
  const hawaii = polls.find(row => row.state === 'HI');
  assert.equal(resultShareLine(hawaii), `Final poll close: ${hawaii.closes.at(-1).et}`);
  assert.match(resultShareLine(hawaii), /ET, Nov 4/);
});

test('uncertain or incomplete statewide closes never become definitive card times', () => {
  for (const change of [
    { tag: 'UNVERIFIED' }, { tag: 'CONFLICT' }, { closes: [] },
    { all_polls_closed_utc: null }, { unverified_areas: ['Locality with unverified hours'] },
  ]) assert.equal(resultShareLine({ ...texas, ...change }), 'Closing times vary by locality');
  for (const state of ['NH', 'AK']) {
    assert.equal(resultShareLine(polls.find(row => row.state === state)), 'Closing times vary by locality', state);
  }
});

test('guide cards show only an unambiguous verified ordinary registration date', () => {
  assert.equal(guideShareLine(registration('TX')), 'Ordinary registration deadline: Oct 5, 2026');
  for (const state of ['CA', 'SC', 'NH', 'ND']) assert.equal(guideShareLine(registration(state)), undefined, state);
  const uncertain = structuredClone(registration('TX'));
  uncertain.mail.verification_status = 'CONFLICT';
  assert.equal(guideShareLine(uncertain), undefined);
});

function meta(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/g) ?? []) {
    const attrs = Object.fromEntries([...tag.matchAll(/([a-z:]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
    if (attrs.property === name || attrs.name === name) return attrs.content?.replaceAll('&amp;', '&');
  }
}

function assertPng(bytes, label) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${label} is a PNG`);
  assert.equal(bytes.readUInt32BE(16), 1200, `${label} width`);
  assert.equal(bytes.readUInt32BE(20), 630, `${label} height`);
}

function assertExportedCard(path, prefix) {
  const html = readFileSync(resolve(exportRoot, path), 'utf8');
  const content = meta(html, 'og:image');
  assert.ok(content, `${path} has og:image`);
  const url = new URL(content);
  assert.equal(url.origin, 'https://midtermwatch.com', 'image is hosted on this site');
  assert.ok(url.pathname.startsWith(`${prefix}opengraph-image`), `${path} uses its own card`);
  const imagePath = resolve(exportRoot, '.' + decodeURIComponent(url.pathname));
  assert.ok(imagePath.startsWith(exportRoot + sep), 'image stays inside out/');
  assert.ok(existsSync(imagePath), `${url.pathname} exists in out/`);
  assertPng(readFileSync(imagePath), url.pathname);
  assert.equal(meta(html, 'twitter:card'), 'summary_large_image', path);
  assert.equal(meta(html, 'twitter:image'), content, 'Twitter uses the same route-specific card');
}

const exportOptions = { skip: hasExport ? false : 'no fresh npm run build export in out/' };
test('Texas results reference an exported 1200 by 630 OG image', exportOptions, () => assertExportedCard('results/tx/index.html', '/results/tx/'));
test('the results hub references its own exported OG image', exportOptions, () => assertExportedCard('results/index.html', '/results/'));
test('home and every state results and guide route have local large social cards', exportOptions, () => {
  assertExportedCard('index.html', '/');
  for (const { state } of polls) {
    const code = state.toLowerCase();
    assertExportedCard(`results/${code}/index.html`, `/results/${code}/`);
    assertExportedCard(`states/${code}/index.html`, `/states/${code}/`);
  }
});

test('card rendering succeeds with external fetching disabled', async () => {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL('../../lib/og-image.tsx', import.meta.url), 'utf8');
  let compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const name of ['react/jsx-runtime', 'next/og']) {
    const url = JSON.stringify(pathToFileURL(require.resolve(name)).href);
    compiled = compiled.replaceAll(JSON.stringify(name), url).replaceAll(`'${name}'`, url);
  }
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      requests.push(url.href);
      throw new Error('External requests are forbidden in share cards');
    }
    return originalFetch(input, init);
  };
  try {
    const { shareImage } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
    for (const card of [
      { title: 'Texas', subtitle: '2026 election results', detail: resultShareLine(texas) },
      { title: 'District of Columbia', subtitle: 'voting guide 2026' },
      { title: 'New Hampshire', subtitle: '2026 election results', detail: 'Closing times vary by locality' },
      { title: '2026 election results status', subtitle: 'Poll closing times · Official results links' },
    ]) {
      const response = await shareImage(card);
      assertPng(Buffer.from(await response.arrayBuffer()), card.title);
    }
    assert.deepEqual(requests, [], 'no network fetch requests while rendering any card');
  } finally { globalThis.fetch = originalFetch; }
});
