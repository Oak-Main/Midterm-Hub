import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The apex is the one canonical host. www.midtermwatch.com may appear only as
// the source host of a redirect rule, e.g. a `_redirects` line such as
// "https://www.midtermwatch.com/* https://midtermwatch.com/:splat 308".
const root = fileURLToPath(new URL('../../', import.meta.url));
const WWW = 'www.midtermwatch.com';
const REDIRECT_SOURCE = /^\s*(?:https?:\/\/)?www\.midtermwatch\.com\S*\s+https:\/\/midtermwatch\.com\S*\s+30[178]!?\s*$/;
const BINARY = /\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip)$/i;
// Compare whole host-like tokens, so the www host is found wherever it appears.
const HOST_TOKENS = /[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
const namesWww = line => (line.match(HOST_TOKENS) ?? []).some(token => token.toLowerCase() === WWW);

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function wwwMentions(dir) {
  const hits = [];
  for (const path of walk(join(root, dir))) {
    if (BINARY.test(path)) continue;
    const lines = readFileSync(path, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (namesWww(line) && !REDIRECT_SOURCE.test(line)) hits.push(`${path.slice(root.length)}:${index + 1}`);
    });
  }
  return hits;
}

test('source, content and downloads never name the www host', () => {
  for (const dir of ['app', 'lib', 'components', 'content', 'public/downloads']) {
    assert.deepEqual(wwwMentions(dir), [], `${dir}/ must use the apex canonical origin`);
  }
});

test('the redirect-source exception admits only a www -> apex redirect rule', () => {
  assert.ok(REDIRECT_SOURCE.test('https://www.midtermwatch.com/* https://midtermwatch.com/:splat 308'));
  assert.ok(!REDIRECT_SOURCE.test('<link rel="canonical" href="https://www.midtermwatch.com/"/>'));
  assert.ok(!REDIRECT_SOURCE.test('https://midtermwatch.com/* https://www.midtermwatch.com/:splat 308'));
});

test('the www matcher finds the host in URLs, JSON and prose, and ignores the apex', () => {
  for (const line of ['<link rel="canonical" href="https://www.midtermwatch.com/"/>', '"url":"https://WWW.midtermwatch.com/results/"', 'served from www.midtermwatch.com.']) {
    assert.ok(namesWww(line), line);
  }
  for (const line of ['<link rel="canonical" href="https://midtermwatch.com/"/>', 'https://midterm-hub.vercel.app/']) {
    assert.ok(!namesWww(line), line);
  }
});

// out/ is only meaningful straight after `npm run build` in this checkout: the
// committed copy predates the apex decision. A fresh export carries the
// .next/BUILD_ID it was built from under out/_next/static/.
const buildIdFile = join(root, '.next', 'BUILD_ID');
const buildId = existsSync(buildIdFile) ? readFileSync(buildIdFile, 'utf8').trim() : null;
const freshExport = Boolean(buildId) && existsSync(join(root, 'out', '_next', 'static', buildId));

test('the built export never names the www host', { skip: freshExport ? false : 'no fresh `npm run build` export in out/' }, () => {
  assert.deepEqual(wwwMentions('out'), [], 'out/ must use the apex canonical origin');
});
