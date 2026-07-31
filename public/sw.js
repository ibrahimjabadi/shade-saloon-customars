const CACHE = 'shadi-customer-app';

// Live data (branches, services, availability, bookings...) must never be
// served from cache: a stale "available slot" or stale booking list is
// actively misleading, not just an inconvenience. This covers both
// deployment shapes — bundled with the backend (same-origin, path starts
// with /api/) and standalone (cross-origin calls to SHADI_API_BASE).
function isLiveDataRequest(url) {
  if (url.origin !== self.location.origin) return true; // calls to the backend's own origin
  return url.pathname.startsWith('/api/');
}

// Vite content-hashes every build output file under /app-build/ (see
// vite.config.ts) — a new deploy always produces new filenames, so these can
// be cached forever with zero staleness risk: there is no such thing as a
// stale hashed asset, only a hashed asset that's no longer referenced by the
// current index.html. This also removes the old hand-maintained CACHE
// version string (was 'shadi-customer-app-v3') that had to be bumped by hand
// on every deploy to bust stale entries — correctness now comes from the
// hash itself, not from remembering to edit this file.
function isHashedBuildAsset(url) {
  // includes(), not startsWith() — this app-build/ can sit at the domain
  // root ("/app-build/...") or under a mount prefix ("/customer-app/app-build/...").
  return url.origin === self.location.origin && url.pathname.includes('/app-build/');
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isLiveDataRequest(url)) {
    event.respondWith(fetch(event.request)); // network-only, never cached, never served stale
    return;
  }

  if (isHashedBuildAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }))
    );
    return;
  }

  // Everything else (the app shell '/', config.js, manifest.json, icons):
  // network-first so a redeploy is visible as soon as there's connectivity,
  // falling back to the last cached copy only when the network is down.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
