/* VagasIO — shell único do Portal do Candidato. Fonte única de header, título e sidebar. */
(function () {
  'use strict';

  const ROOT = '/candidato/';
  const authenticated = !!localStorage.getItem('candidato_token');
  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const titles = {
    index: 'Vagas', painel: 'Meu perfil', perfil: 'Meu perfil', entrevistas: 'Entrevistas',
    favoritos: 'Favoritos', conversas: 'Chat', chat: 'Chat', notificacoes: 'Notificações',
    seguranca: 'Segurança', documentos: 'Documentos', candidatura: 'Candidatura',
    candidaturas: 'Minhas candidaturas', inscricao: 'Minha inscrição', vaga: 'Vaga',
    onboarding: 'Completar cadastro'
  };
  const title = titles[currentFile.replace('.html', '')] || 'VagasIO';

  const icons = {
    vagas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5v8.5H4zM9 19v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    perfil: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 20c.7-3.4 2.9-5.2 6.5-5.2s5.8 1.8 6.5 5.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    entrevistas: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    favoritos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    notificacoes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4zM10 19.5h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    seguranca: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.6-2.7 7.7-7 10-4.3-2.3-7-5.4-7-10V6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9.5 12 1.5 1.5 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const menu = [
    ['index.html', icons.vagas, 'Vagas'], ['painel.html', icons.perfil, 'Meu perfil'],
    ['entrevistas.html', icons.entrevistas, 'Entrevistas'], ['favoritos.html', icons.favoritos, 'Favoritos'],
    ['conversas.html', icons.chat, 'Chat'], ['notificacoes.html', icons.notificacoes, 'Notificações'],
    ['seguranca.html', icons.seguranca, 'Segurança']
  ];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const initials = (localStorage.getItem('candidato_nome') || 'Candidato').trim().split(/\s+/).slice(0,2).map(x => x[0]).join('').toUpperCase();

  // Visitantes mantêm o cabeçalho público, mas nunca recebem componentes autenticados.
  document.querySelectorAll('body > .drawer, body > .drawer-overlay, body > #drawer, body > #drawer-overlay, body > .btn-menu-logo').forEach(el => el.remove());
  document.querySelectorAll('#sino-fase7, .perfil-card-sino').forEach(el => el.remove());
  if (!authenticated) return;

  // Em páginas autenticadas, remove qualquer implementação antiga antes de inserir a única estrutura oficial.
  document.querySelectorAll('body > header, body > .subheader, body > .candidato-subheader').forEach(el => el.remove());

  const header = document.createElement('header');
  header.className = 'candidate-header';
  header.innerHTML = '<div class="header-inner"><a href="' + ROOT + 'index.html" class="logo">VagasIO</a><div class="header-actions" id="header-actions"><button type="button" class="btn-menu-logo" id="btn-menu-logo" aria-label="Abrir menu" aria-controls="candidato-sidebar" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div></div>';
  document.body.insertBefore(header, document.body.firstChild);

  const subheader = document.createElement('section');
  subheader.className = 'subheader';
  subheader.innerHTML = '<div class="subheader-inner"><h1 id="sub-titulo">' + esc(title) + '</h1></div>';
  header.insertAdjacentElement('afterend', subheader);

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.id = 'drawer-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  const sidebar = document.createElement('aside');
  sidebar.className = 'drawer';
  sidebar.id = 'candidato-sidebar';
  sidebar.setAttribute('aria-label', 'Menu do candidato');
  sidebar.setAttribute('aria-hidden', 'true');
  sidebar.setAttribute('aria-modal', 'true');
  sidebar.inert = true;
  sidebar.innerHTML = '<div class="drawer-header"><div class="drawer-foto" id="drawer-foto" aria-hidden="true">' + esc(initials || 'C') + '</div><div class="drawer-info"><h3 id="drawer-nome">' + esc(localStorage.getItem('candidato_nome') || 'Candidato') + '</h3><p id="drawer-email">' + esc(localStorage.getItem('candidato_email') || '—') + '</p></div><button class="drawer-close" id="drawer-close" type="button" aria-label="Fechar menu">×</button></div><nav class="drawer-body" aria-label="Navegação"><div class="drawer-section">NAVEGAÇÃO</div>' + menu.map(([href, icon, label]) => '<a href="' + ROOT + href + '" class="drawer-link' + (currentFile === href ? ' ativo' : '') + '"' + (currentFile === href ? ' aria-current="page"' : '') + '><span class="icon" aria-hidden="true">' + icon + '</span><span>' + label + '</span></a>').join('') + '</nav><div class="drawer-footer"><button class="drawer-logout" id="drawer-logout" type="button">Sair</button></div>';
  document.body.append(overlay, sidebar);

  const button = document.getElementById('btn-menu-logo');
  const close = document.getElementById('drawer-close');
  let restoreFocus = button;
  const getFocusable = () => [...sidebar.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  const setOpen = open => {
    if (open) restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : button;
    sidebar.classList.toggle('aberto', open); overlay.classList.toggle('aberto', open);
    sidebar.setAttribute('aria-hidden', String(!open)); overlay.setAttribute('aria-hidden', String(!open));
    sidebar.inert = !open;
    button.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('drawer-aberto', open);
    if (open) close.focus();
    else if (restoreFocus && typeof restoreFocus.focus === 'function') restoreFocus.focus();
  };
  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);
  const logout = () => {
    ['candidato_token','candidato_refresh','candidato_email','candidato_nome','candidato_foto','candidato_id'].forEach(k => localStorage.removeItem(k));
    location.href = ROOT;
  };
  button.addEventListener('click', openDrawer); close.addEventListener('click', closeDrawer); overlay.addEventListener('click', closeDrawer);
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => {
    if (!sidebar.classList.contains('aberto')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) { e.preventDefault(); close.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.getElementById('drawer-logout').addEventListener('click', logout);
  window.abrirDrawer = openDrawer; window.fecharDrawer = closeDrawer; window.logout = logout;
})();
