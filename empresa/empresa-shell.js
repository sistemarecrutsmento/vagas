/* VagasIO · Portal Empresa · navegação única */
(function () {
  'use strict';

  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isCandidateFlow = ['vagas.html', 'candidaturas.html', 'candidatos.html', 'matches.html', 'candidato.html', 'vaga.html'].includes(file);
  const active = file === 'index.html' ? 'dashboard' :
    file === 'vagas-todas.html' ? 'vagas' :
    file === 'base-candidatos.html' ? 'base' :
    isCandidateFlow ? 'candidaturas' :
    file === 'agenda.html' ? 'agenda' :
    file === 'chat.html' ? 'chat' :
    file === 'analytics.html' ? 'analytics' :
    file === 'notificacoes.html' ? 'notificacoes' :
    file === 'usuarios.html' ? 'equipe' :
    ['perfil.html', 'email-preferencias.html', 'seguranca.html'].includes(file) ? 'perfil' : '';

  const links = [
    ['dashboard', 'index.html', '📊 Dashboard'],
    ['vagas', 'vagas-todas.html', '💼 Minhas Vagas'],
    ['base', 'base-candidatos.html', '👥 Base de Talentos'],
    ['candidaturas', 'vagas.html', '📋 Vagas com Candidatos'],
    ['agenda', 'agenda.html', '📅 Agenda'],
    ['chat', 'chat.html', '💬 Chat'],
    ['analytics', 'analytics.html', '📈 Analytics'],
    ['notificacoes', 'notificacoes.html', '🔔 Notificações'],
    ['perfil', 'perfil.html', '⚙️ Perfil'],
    ['equipe', 'usuarios.html', '👥 Equipe']
  ];

  function buildSidebar(fixedPage) {
    const ids = fixedPage
      ? { avatar: 'shell-avatar', nome: 'shell-user-nome', empresa: 'shell-user-empresa', role: 'shell-user-role' }
      : { avatar: 'avatar', nome: 'user-nome', empresa: 'user-empresa', role: 'user-role' };
    const aside = document.createElement('aside');
    aside.className = 'empresa-shell-sidebar';
    aside.setAttribute('aria-label', 'Navegação do Portal Empresa');
    aside.innerHTML = `
      <button class="empresa-shell-close" type="button" aria-label="Fechar menu">✕</button>
      <div class="empresa-shell-logo"><h1>VagasIO</h1><small>Portal da Empresa</small></div>
      <nav class="empresa-shell-nav">
        ${links.map(([key, href, label]) => `<a class="nav-item${active === key ? ' ativo' : ''}${key === 'equipe' ? ' nav-equipe' : ''}"${key === 'equipe' ? ' id="nav-equipe"' : ''} data-shell-key="${key}" href="${href}">${label}</a>`).join('')}
      </nav>
      <div class="nav-divisor">Links</div>
      <a class="nav-item" href="../candidato/">👤 Portal do candidato</a>
      <div class="empresa-shell-user">
        <div class="empresa-shell-avatar" id="${ids.avatar}">--</div>
        <div class="empresa-shell-user-info"><div class="nome" id="${ids.nome}">--</div><div class="empresa" id="${ids.empresa}">--</div><span id="${ids.role}" style="display:none"></span></div>
        <button class="empresa-shell-logout" type="button" title="Sair">↪</button>
      </div>`;

    aside.querySelector('.empresa-shell-close').addEventListener('click', closeMenu);
    aside.querySelector('.empresa-shell-logout').addEventListener('click', () => {
      if (typeof window.empresaSair === 'function') window.empresaSair();
      else {
        localStorage.removeItem('empresa_token');
        localStorage.removeItem('empresa_refresh');
        localStorage.removeItem('empresa_usuario');
        location.href = 'login.html';
      }
    });
    aside.querySelectorAll('a.nav-item').forEach(a => a.addEventListener('click', closeMenu));
    return aside;
  }

  function closeMenu() {
    const aside = document.querySelector('.empresa-shell-sidebar');
    const toggle = document.querySelector('.empresa-shell-toggle');
    if (aside) aside.classList.remove('empresa-shell-open');
    if (toggle) toggle.classList.remove('empresa-shell-open');
  }

  function fillUser() {
    let user = {};
    try {
      user = (window.authRBAC && authRBAC.currentUser && authRBAC.currentUser()) || {};
      if (!user.nome) user = JSON.parse(localStorage.getItem('empresa_usuario') || '{}');
    } catch (_) {}
    const nome = user.nome || user.name || 'Usuário';
    const initials = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'U';
    const fixed = document.body.classList.contains('empresa-shell-fixed');
    const avatar = document.getElementById(fixed ? 'shell-avatar' : 'avatar');
    const nomeEl = document.getElementById(fixed ? 'shell-user-nome' : 'user-nome');
    const empresaEl = document.getElementById(fixed ? 'shell-user-empresa' : 'user-empresa');
    const roleEl = document.getElementById(fixed ? 'shell-user-role' : 'user-role');
    if (avatar) avatar.textContent = initials;
    if (nomeEl) nomeEl.textContent = nome;
    if (empresaEl) empresaEl.textContent = user.empresa_nome || user.email || 'Portal Empresa';
    if (roleEl) roleEl.textContent = user.role || '';
    const canTeam = window.authRBAC && authRBAC.hasRole && authRBAC.hasRole('admin_empresa');
    const team = document.querySelector('[data-shell-key="equipe"]');
    if (team) team.style.display = canTeam ? '' : 'none';
  }

  function init() {
    let aside = document.querySelector('body > aside, .app > aside');
    const hadAside = !!aside;
    // As páginas antigas já traziam um botão de menu próprio. Removê-lo
    // evita dois botões sobrepostos no mobile.
    document.querySelectorAll('.menu-toggle').forEach(el => el.remove());
    const toggle = document.createElement('button');
    toggle.className = 'empresa-shell-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Abrir menu');
    toggle.textContent = '☰';
    toggle.addEventListener('click', () => {
      aside.classList.add('empresa-shell-open');
      toggle.classList.add('empresa-shell-open');
    });

    if (aside) {
      const canonical = buildSidebar(false);
      aside.replaceWith(canonical);
      aside = canonical;
      const app = document.querySelector('.app');
      if (app) app.classList.add('empresa-shell-existing');
      document.body.classList.add('empresa-shell-existing');
    } else {
      aside = buildSidebar(true);
      const content = document.createElement('div');
      content.className = 'empresa-shell-fixed-content';
      [...document.body.children].forEach(el => {
        if (el !== toggle && el.tagName !== 'SCRIPT' && el.tagName !== 'LINK') content.appendChild(el);
      });
      document.body.appendChild(content);
      document.body.classList.add('empresa-shell-fixed');
    }
    document.body.insertBefore(toggle, document.body.firstChild);
    if (!hadAside) document.body.insertBefore(aside, toggle.nextSibling);
    fillUser();
    setTimeout(fillUser, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
