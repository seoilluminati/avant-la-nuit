// Offline support: cache the app shell so it works on the trail without signal.
// Map tiles are not cached (tile servers' usage policies forbid bulk caching).
const CACHE = 'avant-la-nuit-v1';
const SHELL = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'icon.svg',
  'manifest.webmanifest',
  'src/index.js',
  'src/gpx.js',
  'src/geo.js',
  'src/sun.js',
  'src/pace.js',
  'src/plan.js',
  'examples/chamonix-synthetic.gpx',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isShell = url.origin === location.origin || url.hostname === 'unpkg.com';
  if (event.request.method !== 'GET' || !isShell) return;
  // Network first so updates show up, cache as fallback when offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});
