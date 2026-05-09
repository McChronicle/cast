// Beam — minimaler Service Worker für die App-Shell.
// Cached nur die statischen Assets; Videos und externe CDN-Skripte
// werden NICHT abgefangen (würden ggf. großen Speicher fressen).

const CACHE = 'beam-shell-v2';
const SHELL = [
  './',
  './index.html',
  './tv.html',
  './manifest.webmanifest',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Nur die Shell-Dateien bedienen — Range-Requests an Videos NICHT.
  const path = url.pathname.replace(/\/$/, '/');
  const isShell = SHELL.some((s) => {
    const sPath = new URL(s, self.location.href).pathname.replace(/\/$/, '/');
    return path === sPath;
  });
  if (!isShell) return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
