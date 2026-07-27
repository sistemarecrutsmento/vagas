// =========================================================================
// AUTH HELPER v1.0 (Etapa 2 - 27/07/2026)
// =========================================================================
// Wrapper de fetch que:
// 1. Adiciona automaticamente o Authorization: Bearer <accessToken>
// 2. Se receber 401, tenta /api/auth/refresh UMA vez e refaz a request
// 3. Se refresh falhar, desloga o usuário
// =========================================================================
//
// Como usar:
//   <script src="auth-helper.js"></script>
//   <script>
//     const r = await authFetch('/api/admin/candidatos');
//   </script>
//
// Cada app (admin/candidato/empresa) deve:
// 1. Carregar este script antes de qualquer outro que faça fetch
// 2. Configurar TOKEN_STORAGE_KEY e REFRESH_STORAGE_KEY (ver abaixo)
// 3. Chamar authInit() no DOMContentLoaded
// =========================================================================

(function() {
  const API = 'https://recrutamento-api-novo.onrender.com';

  // Chaves do localStorage (configuráveis por app)
  let ACCESS_KEY = 'candidato_token';
  let REFRESH_KEY = 'candidato_refresh';
  let USER_KEY = 'user_data';

  // Configura por app
  function setStorageKeys(accessKey, refreshKey, userKey) {
    ACCESS_KEY = accessKey || ACCESS_KEY;
    REFRESH_KEY = refreshKey || REFRESH_KEY;
    USER_KEY = userKey || USER_KEY;
  }

  function getAccess() { return localStorage.getItem(ACCESS_KEY); }
  function getRefresh() { return localStorage.getItem(REFRESH_KEY); }

  function setTokens(access, refresh) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  }

  function clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // =========================================================================
  // REFRESH: tenta trocar refresh_token por novo access_token
  // =========================================================================
  // Retorna true se sucesso, false se falhou (e desloga)
  let refreshingPromise = null; // evita múltiplos refresh simultâneos
  async function tryRefresh() {
    if (refreshingPromise) return refreshingPromise;

    const refresh = getRefresh();
    if (!refresh) return false;

    refreshingPromise = (async () => {
      try {
        const r = await fetch(API + '/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh })
        });
        if (!r.ok) {
          console.warn('[auth] refresh falhou, status:', r.status);
          clearTokens();
          return false;
        }
        const data = await r.json();
        if (data.accessToken || data.refreshToken) {
          setTokens(data.accessToken, data.refreshToken);
          console.log('[auth] tokens atualizados');
          return true;
        }
        clearTokens();
        return false;
      } catch (e) {
        console.error('[auth] refresh erro:', e);
        clearTokens();
        return false;
      } finally {
        refreshingPromise = null;
      }
    })();

    return refreshingPromise;
  }

  // =========================================================================
  // authFetch: wrapper com auto-refresh e auto-logout
  // =========================================================================
  async function authFetch(url, opts = {}) {
    // Adiciona Authorization automaticamente
    const access = getAccess();
    if (access) {
      opts.headers = opts.headers || {};
      opts.headers['Authorization'] = 'Bearer ' + access;
    }

    // URL completa se for relativa
    const fullUrl = url.startsWith('http') ? url : (API + url);

    let r;
    try {
      r = await fetch(fullUrl, opts);
    } catch (e) {
      console.error('[auth] fetch falhou:', e);
      throw e;
    }

    // 401: tenta refresh UMA vez
    if (r.status === 401 && getRefresh()) {
      console.log('[auth] 401, tentando refresh...');
      const refreshed = await tryRefresh();
      if (refreshed) {
        // Refaz a request com o novo access token
        const newAccess = getAccess();
        opts.headers['Authorization'] = 'Bearer ' + newAccess;
        r = await fetch(fullUrl, opts);
      } else {
        // Refresh falhou, desloga
        clearTokens();
        if (window.location.pathname.indexOf('/login') === -1 &&
            window.location.pathname.indexOf('login.html') === -1) {
          window.location.reload(); // vai cair na tela de login
        }
      }
    }

    return r;
  }

  // =========================================================================
  // authInit: tenta refresh silencioso na inicialização (pra sessão durável)
  // =========================================================================
  async function authInit() {
    const refresh = getRefresh();
    if (!refresh) return false;
    return await tryRefresh();
  }

  // =========================================================================
  // authLogout: chama /api/auth/logout e limpa tudo
  // =========================================================================
  async function authLogout() {
    const refresh = getRefresh();
    if (refresh) {
      try {
        await fetch(API + '/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh })
        });
      } catch (e) { /* ignora erro no logout */ }
    }
    clearTokens();
    window.location.reload();
  }

  // Expõe globalmente
  window.authFetch = authFetch;
  window.authInit = authInit;
  window.authLogout = authLogout;
  window.setStorageKeys = setStorageKeys;
  window.authTokens = { getAccess, getRefresh, setTokens, clearTokens };
})();