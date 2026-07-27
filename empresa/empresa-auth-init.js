// =========================================================================
// EMPRESA AUTH INIT v1.0 (Etapa 2 - 27/07/2026)
// =========================================================================
// Inicializa sessão durável ANTES do redirect de "sem token".
// Adiciona:
//   1. authInit() silencioso no carregamento (renova se possível)
//   2. Sai limpa via helper (revoga refresh no backend)
//
// Uso:
//   <script src="auth-helper.js?v=etapa2_2026_07_27"></script>
//   <script src="empresa-auth-init.js?v=etapa2_2026_07_27"></script>
//   <script>
//     // SEU CÓDIGO AQUI
//     if (!localStorage.getItem('empresa_token')) window.location.href = 'login.html';
//     // ...
//   </script>
//
// O redirect só acontece DEPOIS do authInit tentar renovar.
// =========================================================================

(async function() {
  if (typeof window.setStorageKeys === 'function') {
    setStorageKeys('empresa_token', 'empresa_refresh');
  }

  // Tenta refresh silencioso antes de qualquer coisa
  if (typeof window.authInit === 'function') {
    try {
      await window.authInit();
    } catch (e) {
      console.warn('[empresa-auth-init] authInit falhou:', e);
    }
  }

  // Expõe helper global de logout
  window.empresaSair = function() {
    if (typeof window.authLogout === 'function') {
      window.authLogout();
      return;
    }
    // Fallback manual
    const refresh = localStorage.getItem('empresa_refresh');
    if (refresh && typeof window.API !== 'undefined') {
      fetch(API + '/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh })
      }).catch(() => {});
    }
    localStorage.removeItem('empresa_token');
    localStorage.removeItem('empresa_refresh');
    localStorage.removeItem('empresa_usuario');
    window.location.href = 'login.html';
  };

  // Expõe authFetch se quiserem usar manualmente
  window.empresaFetch = function(url, opts) {
    if (typeof window.authFetch === 'function') {
      return window.authFetch(url, opts);
    }
    return fetch(url, opts);
  };

  console.log('[empresa-auth-init] pronto — sessão durável ativa');
})();