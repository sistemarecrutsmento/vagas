// VagasIO — SW da área empresa. Videochamada nunca é cacheada.
const CACHE_NAME = 'vagasio-empresa-v2';
const NEVER_CACHE = [/\/api\//, /\/token/i, /\/auth/i, /\/video-call/i, /\/_shared\/video-call\.(?:css|js)/i];
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  const {request} = event, url = new URL(request.url);
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;
  if (NEVER_CACHE.some(p => p.test(url.pathname) || p.test(url.href))) {
    event.respondWith(fetch(request, {cache: 'no-store'}).catch(() => new Response('Recurso indisponível offline', {status: 503})));
    return;
  }
  // Empresa pages are network-first; never let an old shell block current auth/UI.
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(request, {cache: 'no-store'}).catch(() => caches.match(request)));
  }
});
