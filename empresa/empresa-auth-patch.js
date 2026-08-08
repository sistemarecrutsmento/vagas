// =========================================================================
// EMPRESA AUTH PATCH v1.0 (Etapa 2 - 27/07/2026)
// =========================================================================
// Intercepta fetch() em todas as páginas da empresa que NÃO usam o
// auth-helper.js centralizado (cada HTML tem sua lógica inline).
//
// Comportamento:
// 1. Se recebe 401 numa request com Authorization, tenta /api/auth/refresh
// 2. Se refresh funciona, refaz a request UMA vez com o novo access token
// 3. Se refresh falha, limpa tokens e redireciona pra login.html
//
// Pré-requisito: auth-helper.js precisa estar carregado (faz auto-refresh)
// =========================================================================

(function() {
  if (typeof window.authFetch !== 'function') {
    console.warn('[empresa-auth-patch] auth-helper.js NÃO carregado. Auto-refresh desabilitado.');
    return;
  }

  // Configura chaves do localStorage (empresa_*) — v3 tem USER_KEY
  if (typeof window.setStorageKeys === 'function') {
    setStorageKeys('empresa_token', 'empresa_refresh', 'empresa_usuario');
  }

  // Salva a fetch original SOMENTE uma vez
  if (window.__enterpriseFetchPatched) return;
  window.__enterpriseFetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(url, opts = {}) {
    const apiUrl = typeof url === 'string' && url.startsWith('http') ? url : url;

    // Se a request tem Authorization manual ou é uma chamada recursiva
    // (authFetch já vai chamar originalFetch via __nativeFetch)
    if (opts && opts.__native) {
      // chamada interna do auth-helper
      return originalFetch(url, opts);
    }

    // Se a request tem Authorization manual, deixa o authFetch cuidar
    // (ele já adiciona + faz auto-refresh)
    // Login e refresh são endpoints públicos: nunca podem ser interceptados
    // pelo authFetch, senão uma tentativa de login pode entrar no fluxo de
    // refresh de uma sessão antiga e ser redirecionada antes de concluir.
    if (apiUrl.includes('/api/auth/login-empresa') || apiUrl.includes('/api/auth/refresh')) {
      return originalFetch(url, opts);
    }
    if (apiUrl.includes('/api/')) {
      return window.authFetch(apiUrl, opts);
    }

    // Outros domínios (ex: imagens): fetch puro
    return originalFetch(url, opts);
  };

  console.log('[empresa-auth-patch] ativo — fetch() interceptado');
})();