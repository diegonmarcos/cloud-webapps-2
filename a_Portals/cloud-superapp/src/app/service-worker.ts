/// <reference lib="webworker" />
// Generic Service Worker template — copied verbatim from the front/ engine
// pattern (front-sw-init.sh). Build-time constants are INJECTED by the
// `esbuild_sw` build step (see build.json + _engine.sh):
//
//   • BUILD_HASH         — 12-char content hash of the `hash_of` files.
//   • BUILD_PRECACHE     — URLs to precache at install time.
//   • BUILD_ASSET_HASHES — per-asset 12-char SHA-256 prefix map.
//
// All three are esbuild --define constants. Zero hardcoded data.

declare const self: ServiceWorkerGlobalScope;
declare const BUILD_HASH: string;
declare const BUILD_PRECACHE: string[];
declare const BUILD_ASSET_HASHES: Record<string, string>;

const STATIC_CACHE = `static-${BUILD_HASH}`;
const RUNTIME_CACHE = `runtime-${BUILD_HASH}`;
const PRECACHE: string[] = BUILD_PRECACHE;
const TAG = '[sw]';

console.info(TAG, 'evaluated', { hash: BUILD_HASH, scope: self.registration?.scope });

self.addEventListener('install', (event) => {
  console.info(TAG, 'install', { hash: BUILD_HASH, precache: PRECACHE.length });
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => c.addAll(PRECACHE).catch((e) => {
        console.warn(TAG, 'precache failed (continuing anyway)', e?.message);
      }))
      .then(() => self.skipWaiting())
      .then(() => console.info(TAG, 'install complete · skipWaiting')),
  );
});

self.addEventListener('activate', (event) => {
  console.info(TAG, 'activate', { hash: BUILD_HASH });
  event.waitUntil(
    caches.keys().then((keys) => {
      const stale = keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE);
      return Promise.all(stale.map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
      .then(() => console.info(TAG, 'activate complete · clients.claim')),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'sw-kill') {
    console.warn(TAG, 'sw-kill received from client — unregistering');
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ includeUncontrolled: true }))
        .then((clients) => clients.forEach((c) => 'navigate' in c && (c as WindowClient).navigate(c.url))),
    );
  }
});

function scopeRelative(reqUrl: string): string {
  const scope = self.registration.scope;
  const noQuery = reqUrl.split('?')[0];
  if (noQuery.startsWith(scope)) return './' + noQuery.slice(scope.length);
  return './' + new URL(noQuery).pathname.replace(/^\//, '');
}

async function sha256_12(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  let hex = '';
  const view = new Uint8Array(hash);
  for (let i = 0; i < 6; i++) hex += view[i].toString(16).padStart(2, '0');
  return hex;
}

async function verifyAsset(req: Request, res: Response): Promise<Response> {
  try {
    const expected = BUILD_ASSET_HASHES[scopeRelative(req.url)];
    if (!expected) return res;
    const got = await sha256_12(await res.clone().arrayBuffer());
    if (got === expected) return res;
    const bustUrl = new URL(req.url);
    bustUrl.searchParams.set('v', expected);
    const fresh = await fetch(bustUrl.toString(), { cache: 'reload' });
    if (!fresh.ok) return res;
    const freshHash = await sha256_12(await fresh.clone().arrayBuffer());
    return freshHash === expected ? fresh : res;
  } catch {
    return res;
  }
}

async function isCacheable(req: Request, res: Response): Promise<boolean> {
  try {
    const buf = await res.clone().arrayBuffer();
    if (buf.byteLength === 0) return false;
  } catch { return false; }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (req.destination === 'script' && ct && !/javascript|ecmascript/.test(ct)) return false;
  if (req.destination === 'style' && ct && !/css/.test(ct)) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const hit = await cache.match(req);

    if (hit) {
      const expected = BUILD_ASSET_HASHES[scopeRelative(req.url)];
      if (!expected) {
        event.waitUntil((async () => {
          try {
            const fresh = await fetch(req);
            if (fresh.ok && await isCacheable(req, fresh)) {
              await cache.put(req, fresh.clone());
            }
          } catch { /* offline — keep stale */ }
        })());
        return hit;
      }
      try {
        const got = await sha256_12(await hit.clone().arrayBuffer());
        if (got === expected) return hit;
      } catch { /* fall through to network on hash failure */ }
      cache.delete(req).catch(() => undefined);
    }

    try {
      const res = await fetch(req);
      if (!res.ok) return res;
      const verified = await verifyAsset(req, res);
      if (verified.ok && await isCacheable(req, verified)) {
        cache.put(req, verified.clone()).catch(() => undefined);
      }
      return verified;
    } catch (e) {
      console.error(TAG, 'fetch failed', { url: req.url, err: (e as Error)?.message });
      if (req.mode === 'navigate' || req.destination === 'document') {
        return (await caches.match('./index.html')) ?? Response.error();
      }
      return Response.error();
    }
  })());
});

export {};
