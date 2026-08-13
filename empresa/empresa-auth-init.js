// =========================================================================
// EMPRESA AUTH INIT v2.0 (FASE 3 - 28/07/2026)
// =========================================================================
// Inicializa sessão durável ANTES do redirect de "sem token".
//
// Adiciona:
//   1. authInit() silencioso no carregamento (renova se possível)
//   2. Sai limpa via helper (revoga refresh no backend)
//   3. USER_KEY = 'empresa_usuario' para que authRBAC.currentUser() funcione
//
// Uso:
//   <script src="auth-helper.js?v=fase3_2026_07_28"></script>
//   <script src="empresa-auth-init.js?v=fase3_2026_07_28"></script>
//   <script>
//     // SEU CÓDIGO AQUI
//     if (!authRBAC.currentUser()) window.location.href = 'login.html';
//     authRBAC.requireRole('admin_empresa');   // guard UX
//     // ...
//   </script>
// =========================================================================

(async function() {
  if (typeof window.setStorageKeys === 'function') {
    setStorageKeys('empresa_token', 'empresa_refresh', 'empresa_usuario');
  }

  // Tenta refresh silencioso antes de qualquer coisa
  if (typeof window.authInit === 'function') {
    try {
      await window.authInit();
    } catch (e) {
      console.warn('[empresa-auth-init] authInit falhou:', e);
    }
  }

  // Todas as páginas que carregam este init são privadas. Depois de tentar
  // renovar a sessão, impede que uma tela vazia seja exibida sem login.
  const access = window.authTokens?.getAccess?.();
  if (!access) {
    const current = window.location.pathname.split('/').pop() || '';
    if (current !== 'login.html') window.location.replace('login.html');
    return;
  }

  // Expõe helper global de logout
  window.empresaSair = function() {
    if (typeof window.authLogout === 'function') {
      window.authLogout();
      return;
    }
    // Fallback manual
    const refresh = localStorage.getItem('empresa_refresh');
    if (refresh) {
      fetch(window.VAGASIO_API_BASE + '/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh })
      }).catch(() => {});
    }
    if (window.authTokens?.clearSessionAll) window.authTokens.clearSessionAll();
    else {
      localStorage.removeItem('empresa_token');
      localStorage.removeItem('empresa_refresh');
      localStorage.removeItem('empresa_usuario');
    }
    window.location.href = 'login.html';
  };

  // Expõe authFetch se quiserem usar manualmente
  window.empresaFetch = function(url, opts) {
    if (typeof window.authFetch === 'function') {
      return window.authFetch(url, opts);
    }
    return fetch(url, opts);
  };

  console.log('[empresa-auth-init] pronto — sessão durável ativa (FASE 3)');
})();
