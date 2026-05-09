// Beam — minimaler Service Worker für die App-Shell.
// HTML-Seiten: network-first (immer frische Version, fallback auf Cache).
// Andere Shell-Assets: cache-first.
// Videos und CDN-Skripte werden NICHT abgefangen.

const CACHE = 'beam-shell-v15';
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

function isShellRequest(url) {
  const path = url.pathname.replace(/\/$/, '/');
  return SHELL.some((s) => {
    const sPath = new URL(s, self.location.href).pathname.replace(/\/$/, '/');
    return path === sPath;
  });
}

function isHtmlRequest(req, url) {
  if (req.destination === 'document') return true;
  if (url.pathname === '/' || url.pathname.endsWith('/')) return true;
  if (/\.html$/.test(url.pathname)) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!isShellRequest(url)) return;

  if (isHtmlRequest(req, url)) {
    // network-first: damit neue Versionen sofort sichtbar sind
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // andere Shell-Files (manifest, icon): cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
