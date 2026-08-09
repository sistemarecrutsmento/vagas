// Vagas.io — Service Worker v1 (Fase 14 PWA)
// Estratégias:
//   • assets estáticos (CSS/JS/ícones/imagens): cache-first
//   • páginas HTML públicas: network-first
//   • APIs autenticadas e dados privados: network-only (NUNCA cacheados)
//   • offline fallback: página amigável
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME   = 'vagasio-v37';
const CACHE_STATIC = 'vagasio-static-v20';

// Assets estáticos que podem ser cacheados (sem dados privados)
const STATIC_ASSETS = [
  '/candidato/home-redesign.css',
  '/candidato/mobile-detail-fix.css',
  '/candidato/candidato-shell.css',
  '/candidato/candidato-shell.js',
  '/candidato/app-v2.js',
  '/candidato/modals.js',
  '/candidato/manifest.json',
  '/candidato/icons/icon-192.png',
  '/candidato/icons/icon-512.png',
  '/candidato/icons/icon-180.png',
];

// Padrões de URL que NUNCA devem ser cacheados
const NEVER_CACHE = [
  /\/api\//,               // toda a API
  /token/i,                // qualquer URL com "token"
  /refresh/i,              // refresh tokens
  /auth/i,                 // endpoints de autenticação
  /curriculo/i,            // currículos
  /documentos/i,           // documentos pessoais
  /mensagens/i,            // chat / mensagens
  /notificacoes/i,         // notificações (dados em tempo real)
  /candidatura/i,          // dados de candidatura (privados)
  /candidato\/perfil/i,    // perfil do candidato
  /\/upload\//i,           // uploads
  /cloudinary/i,           // CDN de uploads
  /resend/i,               // serviço de email
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      // Pre-cache seletivo: falha silenciosa por arquivo (não quebra tudo)
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] pre-cache falhou:', url, e.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_STATIC && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-HTTP (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // 1. NEVER CACHE: APIs, tokens, dados privados → network-only
  if (NEVER_CACHE.some(p => p.test(url.pathname) || p.test(url.href))) {
    event.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify({ erro: 'Offline — dados autenticados indisponíveis' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // 2. Assets estáticos (CSS, JS, imagens, fontes) → cache-first
  if (
    request.method === 'GET' && (
      url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico)$/) ||
      STATIC_ASSETS.includes(url.pathname)
    )
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(c => c.put(request, clone));
          }
          return response;
        }).catch(() => offlineFallback(request));
      })
    );
    return;
  }

  // 3. Páginas HTML públicas → network-first (conteúdo fresco preferido)
  if (request.method === 'GET' && request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(c => c.put(request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(request).then(cached => cached || offlineFallback(request))
      )
    );
    return;
  }

  // 4. Demais requisições GET → network-first simples
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then(cached => cached || offlineFallback(request))
      )
    );
  }
  // POST/PUT/PATCH/DELETE → sem interferência do SW
});

// ─── Offline Fallback Page ────────────────────────────────────────────────────
function offlineFallback(request) {
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Offline · Vagas.io</title>
  <style>
    body{font-family:-apple-system,sans-serif;background:#722F37;color:#fff;
         display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    .box{text-align:center;padding:40px 24px;max-width:380px;}
    .icon{font-size:56px;margin-bottom:16px;}
    h1{font-size:22px;font-weight:700;margin:0 0 10px;}
    p{font-size:15px;opacity:.85;margin:0 0 24px;line-height:1.5;}
    button{background:#fff;color:#722F37;border:none;padding:12px 28px;
           border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">📡</div>
    <h1>Você está offline</h1>
    <p>Assim que a conexão voltar, tente novamente.<br>
       Seus dados estão seguros.</p>
    <button onclick="location.reload()">Tentar novamente</button>
  </div>
</body>
</html>`, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  return new Response('Offline', { status: 503 });
}
