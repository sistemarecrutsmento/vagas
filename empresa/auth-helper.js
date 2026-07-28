// =========================================================================
// AUTH HELPER v3.0 (FASE 3 - 28/07/2026)
// =========================================================================
// Wrapper de fetch com auto-refresh + sessão durável + RBAC.
//
// API global:
//   setStorageKeys(accessKey, refreshKey) → configura chaves do localStorage
//   authInit()                             → tenta refresh silencioso
//   authFetch(url, opts)                   → fetch com auto-refresh
//   authLogout()                           → chama /api/auth/logout + limpa
//   authTokens.getAccess() / getRefresh()  → acessa tokens
//   authTokens.setTokens(a, r)             → salva
//   authTokens.clearTokens()               → limpa
//   authRBAC.currentUser()                 → lê usuário do JWT (não confia p/ segurança)
//   authRBAC.currentRole()                 → role: admin_empresa|recrutador|viewer
//   authRBAC.currentEmpresaId()            → id da empresa no JWT
//   authRBAC.currentEmpresaNome()          → nome da empresa
//   authRBAC.currentUsuarioId()            → id do usuário
//   authRBAC.hasRole(...roles)             → true se usuário tem algum desses roles
//   authRBAC.requireRole(...roles)         → redirect p/ erro se não tem
//   authRBAC.hideIfNoRole(...roles, el)    → esconde el se não tem role
//
// Como usar:
//   <script src="../_shared/auth-helper.js"></script>
//   <script>
//     setStorageKeys('admin_token', 'admin_refresh');
//     window.addEventListener('DOMContentLoaded', async () => {
//       await authInit();
//       // segurança frontend (UX), backend é autoridade:
//       authRBAC.requireRole('admin_empresa');
//     });
//   </script>
// =========================================================================

(function() {
  const VERSION = '3.0';
  const API = 'https://recrutamento-api-v2.onrender.com';

  // Defaults (admin). Candidato/empresa sobrescrevem com setStorageKeys()
  let ACCESS_KEY = 'admin_token';
  let REFRESH_KEY = 'admin_refresh';
  // Chave de "dados do usuário logado" (opcional)
  let USER_KEY = null;

  // -------------------------------------------------------------------------
  // Configuração (chamar ANTES de qualquer coisa)
  // -------------------------------------------------------------------------
  function setStorageKeys(accessKey, refreshKey, userKey) {
    if (accessKey) ACCESS_KEY = accessKey;
    if (refreshKey) REFRESH_KEY = refreshKey;
    if (userKey) USER_KEY = userKey;
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
    if (USER_KEY) localStorage.removeItem(USER_KEY);
  }

  // Limpa TUDO: tokens + flags usuais (empresa_*, admin_*, candidato_*)
  function clearSessionAll() {
    clearTokens();
    try {
      ['empresa_token','empresa_refresh','empresa_usuario',
       'admin_token','admin_refresh','admin_usuario',
       'candidato_token','candidato_refresh','candidato_email'].forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  // -------------------------------------------------------------------------
  // Decode JWT (frontend é UX, não segurança)
  // -------------------------------------------------------------------------
  function decodeJwt(token) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let s = parts[1];
      s = s.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      return JSON.parse(atob(s));
    } catch (e) {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // RBAC helpers (apenas UX — backend é autoridade)
  // -------------------------------------------------------------------------
  function _userFromToken() {
    return decodeJwt(getAccess());
  }
  function _userFromStorage() {
    if (!USER_KEY) return null;
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  }
  function currentUser() {
    // prioriza dados da storage (mais ricos), mas completa com JWT se faltar
    const stored = _userFromStorage() || {};
    const claims = _userFromToken() || {};
    return {
      id: stored.id ?? claims.id ?? null,
      email: stored.email ?? claims.email ?? null,
      nome: stored.nome ?? claims.nome ?? null,
      tipo: stored.tipo ?? claims.tipo ?? null,
      cargo: stored.cargo ?? claims.cargo ?? null,
      role: claims.role ?? stored.role ?? null,
      empresa_id: claims.empresa_id ?? stored.empresa_id ?? null,
      empresa_nome: claims.empresa_nome ?? stored.empresa_nome ?? null
    };
  }
  function currentRole() {
    return currentUser().role || null;
  }
  function currentEmpresaId() {
    return currentUser().empresa_id || null;
  }
  function currentEmpresaNome() {
    return currentUser().empresa_nome || null;
  }
  function currentUsuarioId() {
    return currentUser().id || null;
  }
  function hasRole(...roles) {
    const r = currentRole();
    if (!r) return false;
    return roles.includes(r);
  }

  // requireRole: se não tiver nenhum dos roles exigidos, redireciona para
  // a página de erro de acesso negado ou para o index
  function requireRole(...roles) {
    if (hasRole(...roles)) return true;
    // guarda UX: redireciona
    console.warn('[auth-rbac] Sem permissão. Esperado:', roles, 'Tem:', currentRole());
    if (typeof window.acessoNegadoHandler === 'function') {
      window.acessoNegadoHandler(roles, currentRole());
    } else {
      // tenta voltar pro index
      try {
        const path = window.location.pathname.split('/').pop();
        if (path !== 'index.html') {
          window.location.href = 'index.html?acesso=negado';
        }
      } catch (e) {}
    }
    return false;
  }

  function hideIfNoRole(...roles) {
    const els = Array.from(arguments).slice(roles.length);
    const visible = hasRole(...roles);
    els.forEach(el => {
      if (!el) return;
      if (typeof el === 'string') {
        document.querySelectorAll(el).forEach(e => e.style.display = visible ? '' : 'none');
      } else {
        el.style.display = visible ? '' : 'none';
      }
    });
    return visible;
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
        const newAccess = data.token || data.accessToken;
        const newRefresh = data.refreshToken;

        if (!newAccess) {
          console.warn('[auth] refresh sem token novo:', data);
          return false;
        }

        setTokens(newAccess, newRefresh);
        console.log('[auth] refresh OK — role preservada:', _userFromToken()?.role);
        return true;
      } catch (e) {
        console.error('[auth] refresh erro:', e);
        return false;
      } finally {
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
      throw e;
    }

    if (r.status === 401 && getRefresh()) {
      // tenta refresh UMA vez
      const ok = await tryRefresh();
      if (ok) {
        headers['Authorization'] = 'Bearer ' + getAccess();
        r = await fetch(fullUrl, { ...opts, headers });
      } else {
        // refresh falhou -> sessão inválida, limpa e redireciona
        console.warn('[auth] refresh falhou — limpando sessão');
        clearSessionAll();
        // redireciona para a página de login apropriada
        try {
          const key = ACCESS_KEY;
          if (key.startsWith('empresa_')) window.location.href = 'login.html';
          else if (key.startsWith('admin_')) window.location.href = '../admin/index.html';
          else if (key.startsWith('candidato_')) window.location.href = '../candidato/login.html';
        } catch (e) {}
        throw new Error('Sessão expirada. Faça login novamente.');
      }
    }

    return r;
  }

  // -------------------------------------------------------------------------
  // AUTH INIT: tenta refresh silencioso
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
    clearSessionAll();
    // redireciona para o login apropriado
    try {
      const key = ACCESS_KEY;
      if (key.startsWith('empresa_')) window.location.href = 'login.html';
      else if (key.startsWith('admin_')) window.location.href = '../admin/index.html';
      else if (key.startsWith('candidato_')) window.location.href = '../candidato/login.html';
      else window.location.reload();
    } catch (e) { window.location.reload(); }
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
    clearSessionAll,
    getAccessKey: () => ACCESS_KEY,
    getRefreshKey: () => REFRESH_KEY,
    getUserKey: () => USER_KEY
  };
  window.authRBAC = {
    currentUser, currentRole, currentEmpresaId, currentEmpresaNome,
    currentUsuarioId, hasRole, requireRole, hideIfNoRole,
    decodeJwt
  };
  window.authHelperVersion = VERSION;
})();
