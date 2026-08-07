// =========================================================================
// AUTH HELPER v2.0 (Etapa 2 - 27/07/2026)
// =========================================================================
// Wrapper de fetch com auto-refresh + sessão durável.
//
// API global:
//   setStorageKeys(accessKey, refreshKey) → configura chaves do localStorage
//   authInit()                             → tenta refresh silencioso
//   authFetch(url, opts)                   → fetch com auto-refresh
//   authLogout()                           → chama /api/auth/logout + limpa
//   authTokens.getAccess() / getRefresh()  → acessa tokens
//   authTokens.setTokens(a, r)             → salva
//   authTokens.clearTokens()               → limpa
//
// Como usar:
//   <script src="../_shared/auth-helper.js"></script>
//   <script>
//     setStorageKeys('admin_token', 'admin_refresh');
//     window.addEventListener('DOMContentLoaded', async () => {
//       await authInit(); // sessão durável
//       // ... resto do app
//     });
//   </script>
// =========================================================================

(function() {
  const API = 'https://recrutamento-api-novo.onrender.com';

  // Defaults (admin). Candidato/empresa sobrescrevem com setStorageKeys()
  let ACCESS_KEY = 'admin_token';
  let REFRESH_KEY = 'admin_refresh';

  // -------------------------------------------------------------------------
  // Configuração (chamar ANTES de qualquer coisa)
  // -------------------------------------------------------------------------
  function setStorageKeys(accessKey, refreshKey) {
    if (accessKey) ACCESS_KEY = accessKey;
    if (refreshKey) REFRESH_KEY = refreshKey;
  }

  // -------------------------------------------------------------------------
  // Token storage
  // -------------------------------------------------------------------------
  function getAccess() { return localStorage.getItem(ACCESS_KEY); }
  function getRefresh() { return localStorage.getItem(REFRESH_KEY); }
  function setTokens(access, refresh) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  }
  function clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // NÃO limpa dados do user (candidato_email, admin_usuario etc)
    // — quem chama isso decide o que limpar
  }

  // -------------------------------------------------------------------------
  // REFRESH: troca refresh_token por novo access_token (com fila anti-dupla)
  // -------------------------------------------------------------------------
  let refreshingPromise = null;

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
          console.warn('[auth] refresh falhou status=' + r.status);
          return false;
        }

        const data = await r.json();
        // Backend pode retornar { token, refreshToken } ou { accessToken, refreshToken }
        const newAccess = data.token || data.accessToken;
        const newRefresh = data.refreshToken;

        if (!newAccess) {
          console.warn('[auth] refresh sem token novo:', data);
          return false;
        }

        setTokens(newAccess, newRefresh);
        console.log('[auth] refresh OK');
        return true;
      } catch (e) {
        console.error('[auth] refresh erro:', e);
        return false;
      } finally {
        // Libera a fila depois de 1s pra próxima request
        setTimeout(() => { refreshingPromise = null; }, 1000);
      }
    })();

    return refreshingPromise;
  }

  // -------------------------------------------------------------------------
  // AUTH FETCH: fetch com Authorization + auto-refresh em 401
  // -------------------------------------------------------------------------
  async function authFetch(url, opts = {}) {
    const fullUrl = url.startsWith('http') ? url : (API + url);
    const headers = opts.headers ? { ...opts.headers } : {};

    const access = getAccess();
    if (access && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = 'Bearer ' + access;
    }

    let r;
    try {
      r = await fetch(fullUrl, { ...opts, headers });
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
        headers['Authorization'] = 'Bearer ' + newAccess;
        r = await fetch(fullUrl, { ...opts, headers });
      } else {
        // Refresh falhou — chama callback de logout se existir, senão reload
        clearTokens();
        if (window.location.pathname.indexOf('/login') === -1) {
          window.location.reload();
        }
      }
    }

    return r;
  }

  // -------------------------------------------------------------------------
  // AUTH INIT: tenta refresh silencioso na inicialização
  // -------------------------------------------------------------------------
  async function authInit() {
    const refresh = getRefresh();
    if (!refresh) return false;
    const ok = await tryRefresh();
    return ok;
  }

  // -------------------------------------------------------------------------
  // AUTH LOGOUT: chama /api/auth/logout e limpa tudo
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Exposição global
  // -------------------------------------------------------------------------
  window.authFetch = authFetch;
  window.authInit = authInit;
  window.authLogout = authLogout;
  window.setStorageKeys = setStorageKeys;
  window.authTokens = {
    getAccess, getRefresh, setTokens, clearTokens,
    getAccessKey: () => ACCESS_KEY,
    getRefreshKey: () => REFRESH_KEY
  };
})();