import assert from 'node:assert/strict';
import test from 'node:test';
import proxy from '../../cloudflare/src/worker.js';

const HTML_HEADERS = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' };

// A caches.default stand-in: stores what the Worker puts, keyed by URL string.
function mockCache() {
  const entries = new Map();
  return {
    entries,
    async match(key) {
      const entry = entries.get(String(key));
      return entry ? new Response(entry.body, { status: entry.status, headers: entry.headers }) : undefined;
    },
    async put(key, response) {
      assert.ok(!response.headers.has('set-cookie'), 'caches.default never stores Set-Cookie responses');
      entries.set(String(key), { status: response.status, headers: new Headers(response.headers), body: await response.text() });
    },
  };
}

// Installs a mocked upstream and cache for one test; `respond` receives each upstream Request.
function harness(t, respond) {
  const cache = mockCache();
  const upstream = [];
  const original = { fetch: globalThis.fetch, caches: globalThis.caches };
  globalThis.caches = { default: cache };
  globalThis.fetch = async (request, init) => { upstream.push({ url: request.url, method: request.method, init }); return respond(request, init); };
  t.after(() => { globalThis.fetch = original.fetch; globalThis.caches = original.caches; });
  const pending = [];
  const ctx = { waitUntil: promise => pending.push(promise) };
  const get = async (url, init) => { const response = await proxy.fetch(new Request(url, init), {}, ctx); await Promise.all(pending.splice(0)); return response; };
  return { cache, upstream, ctx, get };
}

const html = body => () => new Response(body, { status: 200, headers: HTML_HEADERS });

test('miss stores the page for 60 s plus a 24 h stale copy; the next request is a hit', async t => {
  const { cache, upstream, get } = harness(t, html('<p>home</p>'));
  const first = await get('https://midtermwatch.com/');
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('x-mw-cache'), 'MISS');
  assert.equal(await first.text(), '<p>home</p>');
  assert.equal(cache.entries.get('https://midtermwatch.com/').headers.get('cache-control'), 'public, max-age=60');
  assert.equal(cache.entries.get('https://midtermwatch.com/?__mw_stale=1').headers.get('cache-control'), 'public, max-age=86400');

  const second = await get('https://midtermwatch.com/');
  assert.equal(second.headers.get('x-mw-cache'), 'HIT');
  assert.equal(second.headers.get('cache-control'), HTML_HEADERS['cache-control'], 'browsers keep the upstream policy');
  assert.equal(second.headers.get('x-mw-origin-cache-control'), null);
  assert.equal(await second.text(), '<p>home</p>');
  assert.equal(upstream.length, 1, 'a hit never reaches Vercel');
});

test('/results/ is cached for 30 s', async t => {
  const { cache, get } = harness(t, html('<p>results</p>'));
  await get('https://midtermwatch.com/results/');
  assert.equal(cache.entries.get('https://midtermwatch.com/results/').headers.get('cache-control'), 'public, max-age=30');
});

test('immutable /_next/static/* assets keep the upstream policy and get no stale copy', async t => {
  const policy = 'public,max-age=31536000,immutable';
  const { cache, get } = harness(t, () => new Response('js', { status: 200, headers: { 'content-type': 'application/javascript', 'cache-control': policy } }));
  await get('https://midtermwatch.com/_next/static/chunks/app.js');
  const stored = cache.entries.get('https://midtermwatch.com/_next/static/chunks/app.js');
  assert.equal(stored.headers.get('cache-control'), policy);
  assert.equal(cache.entries.size, 1);
  const hit = await get('https://midtermwatch.com/_next/static/chunks/app.js');
  assert.equal(hit.headers.get('cache-control'), policy);
});

test('utm_* parameters share the page entry; any other query string bypasses the cache', async t => {
  const { cache, upstream, get } = harness(t, html('<p>page</p>'));
  await get('https://midtermwatch.com/house/?utm_source=news&utm_medium=social');
  assert.equal((await get('https://midtermwatch.com/house/')).headers.get('x-mw-cache'), 'HIT');
  assert.equal(upstream[0].url, 'https://midterm-hub.vercel.app/house/?utm_source=news&utm_medium=social');

  const before = cache.entries.size;
  const rsc = await get('https://midtermwatch.com/house/?_rsc=abc');
  assert.equal(rsc.headers.get('x-mw-cache'), 'BYPASS');
  await get('https://midtermwatch.com/house/?_rsc=abc');
  assert.equal(cache.entries.size, before);
  assert.equal(upstream.length, 3);
});

test('stale copy is served with 200 and x-mw-stale when Vercel returns 500', async t => {
  let status = 200;
  const { cache, get } = harness(t, () => status === 200 ? html('<p>good</p>')() : new Response('down', { status }));
  await get('https://midtermwatch.com/results/');
  cache.entries.delete('https://midtermwatch.com/results/'); // the 30 s copy has expired
  status = 503;
  const response = await get('https://midtermwatch.com/results/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-mw-stale'), '1');
  assert.equal(response.headers.get('x-mw-cache'), 'STALE');
  assert.equal(response.headers.get('cache-control'), HTML_HEADERS['cache-control']);
  assert.equal(await response.text(), '<p>good</p>');
});

test('a 500 with no stale copy passes through unchanged', async t => {
  const { cache, get } = harness(t, () => new Response('down', { status: 500 }));
  const response = await get('https://midtermwatch.com/states/');
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('x-mw-stale'), null);
  assert.equal(cache.entries.size, 0, 'errors are never stored');
});

test('stale copy is served when the upstream fetch throws', async t => {
  let fail = false;
  const { cache, get } = harness(t, () => { if (fail) throw new TypeError('network'); return html('<p>ok</p>')(); });
  await get('https://midtermwatch.com/senate/');
  cache.entries.delete('https://midtermwatch.com/senate/');
  fail = true;
  const response = await get('https://midtermwatch.com/senate/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-mw-stale'), '1');
  assert.equal(await response.text(), '<p>ok</p>');
});

test('stale copy is served when the upstream takes longer than 8 s; 504 without one', async t => {
  let hang = false;
  const { cache, ctx, get } = harness(t, (request, init) => hang
    ? new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
    : html('<p>cached</p>')());
  const run = async url => {
    let settled = false;
    const pending = proxy.fetch(new Request(url), {}, ctx).finally(() => { settled = true; });
    await new Promise(resolve => setImmediate(resolve));
    t.mock.timers.tick(7_999);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(settled, false, 'still waiting on the upstream at 7.999 s');
    t.mock.timers.tick(1);
    return pending;
  };
  await get('https://midtermwatch.com/governors/');
  cache.entries.delete('https://midtermwatch.com/governors/');
  hang = true;
  t.mock.timers.enable({ apis: ['setTimeout'] });

  const stale = await run('https://midtermwatch.com/governors/');
  assert.equal(stale.status, 200);
  assert.equal(stale.headers.get('x-mw-stale'), '1');
  assert.equal(await stale.text(), '<p>cached</p>');

  const missing = await run('https://midtermwatch.com/polls/');
  assert.equal(missing.status, 504);
});

test('responses carrying Set-Cookie are never cached', async t => {
  const { cache, upstream, get } = harness(t, () => new Response('<p>x</p>', { status: 200, headers: { ...HTML_HEADERS, 'set-cookie': 'a=1' } }));
  await get('https://midtermwatch.com/about/');
  const again = await get('https://midtermwatch.com/about/');
  assert.equal(again.headers.get('x-mw-cache'), 'MISS');
  assert.equal(cache.entries.size, 0);
  assert.equal(upstream.length, 2);
});

test('requests carrying Authorization are never cached or served from cache', async t => {
  const { cache, upstream, get } = harness(t, html('<p>x</p>'));
  await get('https://midtermwatch.com/data/');
  const authed = await get('https://midtermwatch.com/data/', { headers: { authorization: 'Bearer t' } });
  assert.equal(authed.headers.get('x-mw-cache'), 'BYPASS');
  assert.equal(upstream.length, 2);
  assert.equal(cache.entries.size, 2, 'only the unauthenticated page and its stale copy');
});

test('HEAD is answered from a cached GET without a body', async t => {
  const { upstream, get } = harness(t, html('<p>head</p>'));
  await get('https://midtermwatch.com/methodology/');
  const head = await get('https://midtermwatch.com/methodology/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('x-mw-cache'), 'HIT');
  assert.equal(await head.text(), '');
  assert.equal(upstream.length, 1);
});

test('redirects are unchanged and never cached', async t => {
  const { cache, upstream, get } = harness(t, () => new Response(null, { status: 308, headers: { location: 'https://midterm-hub.vercel.app/results/' } }));
  const www = await get('https://www.midtermwatch.com/house/?ref=x');
  assert.equal(www.status, 308);
  assert.equal(www.headers.get('location'), 'https://midtermwatch.com/house/?ref=x');
  const state = await get('https://midtermwatch.com/states/TX');
  assert.equal(state.status, 308);
  assert.equal(state.headers.get('location'), 'https://midtermwatch.com/states/tx/');
  assert.equal(upstream.length, 0, 'both redirects are answered at the edge');

  const upstreamRedirect = await get('https://midtermwatch.com/results');
  assert.equal(upstreamRedirect.status, 308);
  assert.equal(upstreamRedirect.headers.get('location'), 'https://midtermwatch.com/results/');
  assert.equal(cache.entries.size, 0);
});
