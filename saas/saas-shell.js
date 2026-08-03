(function () {
  'use strict';

  const API = 'https://recrutamento-api-novo.onrender.com';
  const legacyToken = localStorage.getItem('saas_token');
  if (!localStorage.getItem('admin_token') && legacyToken) {
    localStorage.setItem('admin_token', legacyToken);
  }
  const token = localStorage.getItem('admin_token');

  function clearSession() {
    ['admin_token', 'saas_token', 'admin_refresh', 'admin_usuario'].forEach(k => localStorage.removeItem(k));
  }

  function goLogin() {
    clearSession();
    window.location.replace('index.html');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[ch]));
  }

  function initials(value) {
    return String(value || 'Admin').trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(part => part[0]).join('').toUpperCase() || 'A';
  }

  async function authFetch(path, options = {}) {
    if (!token) { goLogin(); throw new Error('Sessão expirada'); }
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', 'Bearer ' + token);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(path.startsWith('http') ? path : API + path, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      goLogin();
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }
    return response;
  }

  function toast(message, type = 'info') {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      document.body.appendChild(region);
    }
    const item = document.createElement('div');
    item.className = 'toast ' + type;
    item.textContent = message;
    region.appendChild(item);
    setTimeout(() => item.remove(), 4200);
  }

  function decodeToken() {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch (_) { return {}; }
  }

  async function loadAdmin() {
    const payload = decodeToken();
    const fallback = { nome: payload.nome || 'Administrador', email: payload.email || '', role: payload.role || 'Administrador' };
    const apply = user => {
      const name = user.nome || fallback.nome;
      document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = name; });
      document.querySelectorAll('[data-user-email]').forEach(el => { el.textContent = user.email || fallback.email; });
      document.querySelectorAll('[data-user-role]').forEach(el => { el.textContent = user.role || fallback.role || 'Administrador global'; });
      document.querySelectorAll('[data-user-avatar]').forEach(el => { el.textContent = initials(name); });
    };
    apply(fallback);
    try {
      const r = await authFetch('/api/admin/me');
      if (r.ok) apply(await r.json());
    } catch (_) { /* authFetch already handles expired session */ }
  }

  function setupShell() {
    const page = document.body.dataset.page || '';
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === page);
    });
    const menu = document.getElementById('mobile-menu');
    const sidebar = document.getElementById('saas-sidebar');
    if (menu && sidebar) {
      menu.addEventListener('click', () => sidebar.classList.toggle('open'));
      sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => sidebar.classList.remove('open')));
    }
    document.querySelectorAll('[data-action="logout"]').forEach(button => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await fetch(API + '/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ refreshToken: localStorage.getItem('admin_refresh') || null })
          });
        } catch (_) { /* logout local continua mesmo sem resposta da API */ }
        goLogin();
      });
    });
    loadAdmin();
  }

  window.SaaS = { API, token, authFetch, escapeHtml, initials, toast, goLogin, clearSession };
  if (!token) { goLogin(); return; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupShell);
  else setupShell();
})();
