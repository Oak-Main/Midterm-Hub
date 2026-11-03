import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Production metadata and downloadable content use the apex host. The Worker
// redirect is intentionally outside the scanned source directories.
const root = fileURLToPath(new URL('../../', import.meta.url));
const WWW = 'www.midtermwatch.com';
const BINARY = /\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip)$/i;
// This counts text occurrences in source and the export; it does not validate URLs.
const wwwOccurrences = line => line.toLowerCase().split(WWW).length - 1;

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
      if (wwwOccurrences(line) > 0) hits.push(`${path.slice(root.length)}:${index + 1}`);
    });
  }
  return hits;
}

test('source, content and downloads never name the www host', () => {
  for (const dir of ['app', 'lib', 'components', 'content', 'public/downloads']) {
    assert.deepEqual(wwwMentions(dir), [], `${dir}/ must use the apex canonical origin`);
  }
});

test('the www scan finds the host in URLs, JSON and prose, and ignores the apex', () => {
  for (const line of ['<link rel="canonical" href="https://www.midtermwatch.com/"/>', '"url":"https://WWW.midtermwatch.com/results/"', 'served from www.midtermwatch.com.']) {
    assert.ok(wwwOccurrences(line) > 0, line);
  }
  for (const line of ['<link rel="canonical" href="https://midtermwatch.com/"/>', 'https://midterm-hub.vercel.app/']) {
    assert.equal(wwwOccurrences(line), 0, line);
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
