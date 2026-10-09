// Network-first para HTML: las nuevas versiones se muestran al abrir la app.
const CACHE = 'calculadora-3d-v2';
const CORE = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('calculadora-3d-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).protocol === 'chrome-extension:') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || (url.origin === self.location.origin && /\/index\.html$/.test(url.pathname));
  if (isPage) {
    event.respondWith((async () => {
      try {
        const response = await fetch(req, {cache: 'no-store'});
        if (response.ok) { const cache = await caches.open(CACHE); await cache.put('./index.html', response.clone()); }
        return response;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok) { const cache = await caches.open(CACHE); await cache.put(req, response.clone()); }
      return response;
    } catch (_) { return Response.error(); }
  })());
});
