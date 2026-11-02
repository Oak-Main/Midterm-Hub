const UPSTREAM_ORIGIN = "https://midterm-hub.vercel.app";
const CANONICAL_ORIGIN = "https://midtermwatch.com";

// Edge cache (caches.default). Vercel sends HTML with max-age=0, so the stored
// copy carries the Worker's own TTL and the upstream Cache-Control is restored
// for browsers on a hit. A second copy of each HTML page is kept for a day and
// served only when the upstream throws, times out or returns a 5xx.
const HTML_TTL_SECONDS = 60;
const RESULTS_TTL_SECONDS = 30;
const STALE_TTL_SECONDS = 86_400;
const UPSTREAM_TIMEOUT_MS = 8_000;
// Requests carrying any non-utm_* query parameter never read the cache, so no
// visitor URL can collide with this key namespace.
const STALE_KEY_PARAM = "__mw_stale";
const ORIGIN_CACHE_CONTROL = "x-mw-origin-cache-control";

class UpstreamTimeout extends Error {}

function canonicalUrl(url) {
  return `${CANONICAL_ORIGIN}${url.pathname}${url.search}`;
}

function rewriteLocation(location, upstreamUrl) {
  if (!location) return null;

  const target = new URL(location, upstreamUrl);
  if (target.origin !== UPSTREAM_ORIGIN) return location;

  return canonicalUrl(target);
}

// The cache key ignores utm_* tracking parameters; any other parameter (for
// example Next's _rsc) makes the request uncacheable.
function cacheKey(request, url) {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (request.headers.has("authorization") || request.headers.has("rsc")) return null;
  for (const name of url.searchParams.keys()) {
    if (!name.startsWith("utm_")) return null;
  }
  return new URL(url.pathname, CANONICAL_ORIGIN).href;
}

function staleKey(key) {
  const url = new URL(key);
  url.searchParams.set(STALE_KEY_PARAM, "1");
  return url.href;
}

const isHtml = (response) => (response.headers.get("content-type") ?? "").includes("text/html");

function edgeTtl(pathname, response) {
  if (!isHtml(response)) return HTML_TTL_SECONDS;
  return pathname === "/results/" ? RESULTS_TTL_SECONDS : HTML_TTL_SECONDS;
}

// /_next/static/* assets are content-hashed; keep the upstream immutable policy.
function forCache(response, pathname, ttl) {
  const upstreamPolicy = response.headers.get("cache-control") ?? "";
  if (pathname.startsWith("/_next/static/") && upstreamPolicy.includes("immutable")) return response;

  const headers = new Headers(response.headers);
  headers.set(ORIGIN_CACHE_CONTROL, upstreamPolicy);
  headers.set("cache-control", `public, max-age=${ttl}`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function fromCache(cached, request, { stale }) {
  const headers = new Headers(cached.headers);
  if (headers.has(ORIGIN_CACHE_CONTROL)) {
    const upstreamPolicy = headers.get(ORIGIN_CACHE_CONTROL);
    headers.delete(ORIGIN_CACHE_CONTROL);
    if (upstreamPolicy) headers.set("cache-control", upstreamPolicy);
    else headers.delete("cache-control");
  }
  headers.set("x-mw-cache", stale ? "STALE" : "HIT");
  if (stale) headers.set("x-mw-stale", "1");
  return new Response(request.method === "HEAD" ? null : cached.body, { status: 200, headers });
}

function forClient(upstreamResponse, upstreamUrl, cacheStatus) {
  const headers = new Headers(upstreamResponse.headers);
  const location = rewriteLocation(headers.get("location"), upstreamUrl);

  if (location) headers.set("location", location);
  if (cacheStatus) headers.set("x-mw-cache", cacheStatus);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

async function fetchWithTimeout(upstreamRequest) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new UpstreamTimeout());
    }, UPSTREAM_TIMEOUT_MS);
  });
  try {
    return await Promise.race([fetch(upstreamRequest, { redirect: "manual", signal: controller.signal }), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const worker = {
  async fetch(request, env, ctx) {
    const incomingUrl = new URL(request.url);

    // Old published links used uppercase state codes, but Next exports lowercase
    // directories. Normalize only this route family; election URLs stay intact.
    if (/^\/states\/[A-Za-z]{2}\/?$/.test(incomingUrl.pathname)) {
      const normalized = incomingUrl.pathname.toLowerCase().replace(/\/?$/, "/");
      if (incomingUrl.pathname !== normalized) {
        incomingUrl.pathname = normalized;
        return Response.redirect(canonicalUrl(incomingUrl), 308);
      }
    }

    if (incomingUrl.hostname === "www.midtermwatch.com") {
      return Response.redirect(canonicalUrl(incomingUrl), 308);
    }

    const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, UPSTREAM_ORIGIN);
    const upstreamRequest = new Request(upstreamUrl, request);
    const cache = globalThis.caches?.default;
    const key = cache ? cacheKey(request, incomingUrl) : null;

    if (!key) {
      const upstreamResponse = await fetch(upstreamRequest, { redirect: "manual" });
      return forClient(upstreamResponse, upstreamUrl, cache ? "BYPASS" : null);
    }

    const cached = await cache.match(key);
    if (cached) return fromCache(cached, request, { stale: false });

    let upstreamResponse;
    try {
      upstreamResponse = await fetchWithTimeout(upstreamRequest);
    } catch (error) {
      const copy = await cache.match(staleKey(key));
      if (copy) return fromCache(copy, request, { stale: true });
      const timedOut = error instanceof UpstreamTimeout;
      return new Response(timedOut ? "Upstream timed out\n" : "Upstream unavailable\n", {
        status: timedOut ? 504 : 502,
        headers: { "content-type": "text/plain; charset=utf-8", "x-mw-cache": "MISS" },
      });
    }
    if (upstreamResponse.status >= 500) {
      const copy = await cache.match(staleKey(key));
      if (!copy) return forClient(upstreamResponse, upstreamUrl, "MISS");
      await upstreamResponse.body?.cancel();
      return fromCache(copy, request, { stale: true });
    }

    const response = forClient(upstreamResponse, upstreamUrl, null);
    if (request.method === "GET" && response.status === 200 && !response.headers.has("set-cookie")) {
      const pending = [cache.put(key, forCache(response.clone(), incomingUrl.pathname, edgeTtl(incomingUrl.pathname, response)))];
      if (isHtml(response)) pending.push(cache.put(staleKey(key), forCache(response.clone(), incomingUrl.pathname, STALE_TTL_SECONDS)));
      const stored = Promise.all(pending).catch(() => {});
      if (ctx?.waitUntil) ctx.waitUntil(stored);
      else await stored;
    }
    response.headers.set("x-mw-cache", "MISS");
    return response;
  },
};

export default worker;
