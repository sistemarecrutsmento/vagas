(function (window) {
  'use strict';

  // Camada de compatibilidade do fluxo SaaS.
  // Mantém as mesmas chaves e o mesmo localStorage nesta primeira etapa.
  const KEYS = Object.freeze({
    access: 'admin_token',
    refresh: 'admin_refresh',
    legacy: 'saas_token',
    user: 'admin_usuario',
    twoFaId: 'admin_login_2fa_id',
    twoFaEmail: 'admin_login_email'
  });

  const store = {
    keys: KEYS,
    getAccess() { return localStorage.getItem(KEYS.access); },
    getRefresh() { return localStorage.getItem(KEYS.refresh); },
    getLegacy() { return localStorage.getItem(KEYS.legacy); },
    hasAccess() { return !!this.getAccess(); },
    setSession({ token, refreshToken, usuario } = {}) {
      if (token) localStorage.setItem(KEYS.access, token);
      if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken);
      if (usuario) localStorage.setItem(KEYS.user, JSON.stringify(usuario));
    },
    setPending2FA(email, codigoId) {
      localStorage.setItem(KEYS.twoFaEmail, email || '');
      localStorage.setItem(KEYS.twoFaId, codigoId || '');
    },
    getPending2FA() {
      return {
        email: localStorage.getItem(KEYS.twoFaEmail),
        codigoId: localStorage.getItem(KEYS.twoFaId)
      };
    },
    clearPending2FA() {
      localStorage.removeItem(KEYS.twoFaId);
      localStorage.removeItem(KEYS.twoFaEmail);
    },
    clearSession() {
      [KEYS.access, KEYS.legacy, KEYS.refresh, KEYS.user].forEach(key => localStorage.removeItem(key));
    }
  };

  window.SaaSAuthStore = Object.freeze(store);
})(window);
