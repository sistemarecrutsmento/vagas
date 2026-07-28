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

  // Configura chaves do localStorage (empresa_*)
  if (typeof window.setStorageKeys === 'function') {
    setStorageKeys('empresa_token', 'empresa_refresh');
  }

  const originalFetch = window.fetch;

  window.fetch = async function(url, opts = {}) {
    const apiUrl = typeof url === 'string' && url.startsWith('http') ? url : url;

    // Se a request tem Authorization manual, deixa o authFetch cuidar
    // (ele já adiciona + faz auto-refresh)
    if (apiUrl.includes('/api/')) {
      return window.authFetch(apiUrl, opts);
    }

    // Outros domínios (ex: imagens): fetch puro
    return originalFetch(url, opts);
  };

  console.log('[empresa-auth-patch] ativo — fetch() interceptado');
})();