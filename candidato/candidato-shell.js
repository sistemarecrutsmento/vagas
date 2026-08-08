/* VagasIO — shell único do Portal do Candidato. Fonte única de header, título e navegação. */
(function () {
  'use strict';

  const ROOT = '/candidato/';
  const url = new URL(location.href);
  // Dentro do shell persistente, páginas internas podem perder o parâmetro
  // ao redirecionar. A detecção pelo contexto evita shells aninhados.
  const frameMode = url.searchParams.get('candidate_shell') === 'frame' || window.top !== window.self;
  const authenticated = !!localStorage.getItem('candidato_token');
  // O login acontece dentro da página pública. Como o shell é avaliado antes
  // do envio do formulário, ele precisa reavaliar a autenticação sem exigir
  // que o usuário recarregue manualmente.
  window.addEventListener('candidate-auth-changed', () => {
    if (localStorage.getItem('candidato_token')) location.reload();
  });
  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const titles = {
    index: 'Vagas', painel: 'Meu perfil', perfil: 'Meu perfil', entrevistas: 'Entrevistas',
    favoritos: 'Favoritos', conversas: 'Chat', chat: 'Chat', notificacoes: 'Notificações',
    seguranca: 'Segurança', documentos: 'Documentos', candidatura: 'Candidatura',
    candidaturas: 'Minhas candidaturas', inscricao: 'Minha inscrição', vaga: 'Vaga',
    onboarding: 'Completar cadastro'
  };
  const titleFor = file => titles[file.replace('.html', '')] || 'VagasIO';

  // A página carregada dentro do shell continua sendo a página original: isso
  // preserva seus scripts, IDs, URLs e fluxos. Apenas o shell é desativado no frame.
  if (authenticated && frameMode) {
    document.querySelectorAll('body > header, body > .header, body > .topbar, body > .navbar, body > .subheader, body > .candidato-subheader, body > .drawer, body > .drawer-overlay, body > #drawer, body > #drawer-overlay, body > .btn-menu-logo, body > .painel-lateral').forEach(el => el.remove());
    document.body.classList.add('candidate-shell-frame');
    return;
  }

  const icons = {
    vagas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5v8.5H4zM9 19v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
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

  document.querySelectorAll('body > .drawer, body > .drawer-overlay, body > #drawer, body > #drawer-overlay, body > .btn-menu-logo').forEach(el => el.remove());
  document.querySelectorAll('#sino-fase7, .perfil-card-sino').forEach(el => el.remove());
  if (!authenticated) return;
  document.querySelectorAll('body > header, body > .subheader, body > .candidato-subheader').forEach(el => el.remove());

  const header = document.createElement('header');
  header.className = 'candidate-header';
  header.innerHTML = '<div class="header-inner"><a href="' + ROOT + 'index.html" class="logo">VagasIO</a><nav class="desktop-nav" id="desktop-nav" aria-label="Navegação principal"></nav><div class="header-actions" id="header-actions"></div><button type="button" class="btn-menu-logo" id="btn-menu-logo" aria-label="Abrir menu" aria-controls="candidato-sidebar" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>'
  document.body.insertBefore(header, document.body.firstChild);
  const desktopNav = header.querySelector('#desktop-nav');
  desktopNav.innerHTML = menu.map(([href, icon, label]) => '<a href="' + ROOT + href + '" class="desktop-nav-link' + (currentFile === href ? ' ativo' : '') + '">' + label + '</a>').join('');
  const subheader = document.createElement('section');
  subheader.className = 'subheader';
  subheader.innerHTML = '<div class="subheader-inner"><h1 id="sub-titulo">' + esc(titleFor(currentFile)) + '</h1></div>';
  header.insertAdjacentElement('afterend', subheader);

  const overlay = document.createElement('div'); overlay.className = 'drawer-overlay'; overlay.id = 'drawer-overlay'; overlay.setAttribute('aria-hidden', 'true');
  const sidebar = document.createElement('aside'); sidebar.className = 'drawer'; sidebar.id = 'candidato-sidebar'; sidebar.setAttribute('aria-label', 'Menu do candidato'); sidebar.setAttribute('aria-hidden', 'true');
  sidebar.innerHTML = '<div class="drawer-header"><div class="drawer-foto" id="drawer-foto" aria-hidden="true">' + esc(initials || 'C') + '</div><div class="drawer-info"><h3 id="drawer-nome">' + esc(localStorage.getItem('candidato_nome') || 'Candidato') + '</h3><p id="drawer-email">' + esc(localStorage.getItem('candidato_email') || '—') + '</p></div><button class="drawer-close" id="drawer-close" type="button" aria-label="Fechar menu">×</button></div><nav class="drawer-body" aria-label="Navegação"><div class="drawer-section">NAVEGAÇÃO</div>' + menu.map(([href, icon, label]) => '<a href="' + ROOT + href + '" class="drawer-link' + (currentFile === href ? ' ativo' : '') + '"' + (currentFile === href ? ' aria-current="page"' : '') + '><span class="icon" aria-hidden="true">' + icon + '</span><span>' + label + '</span></a>').join('') + '</nav><div class="drawer-footer"><button class="drawer-logout" id="drawer-logout" type="button">Sair</button></div>';
  document.body.append(overlay, sidebar);

  const button = document.getElementById('btn-menu-logo'), close = document.getElementById('drawer-close');
  const setOpen = open => { sidebar.classList.toggle('aberto', open); overlay.classList.toggle('aberto', open); sidebar.setAttribute('aria-hidden', String(!open)); overlay.setAttribute('aria-hidden', String(!open)); button.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('drawer-aberto', open); if (open) close.focus(); else button.focus(); };
  const logout = () => { ['candidato_token','candidato_refresh','candidato_email','candidato_nome','candidato_foto','candidato_id'].forEach(k => localStorage.removeItem(k)); location.href = ROOT; };
  button.addEventListener('click', () => setOpen(true)); close.addEventListener('click', () => setOpen(false)); overlay.addEventListener('click', () => setOpen(false));
  const navigateShell = (a, e) => {
    e.preventDefault(); setOpen(false);
    const u = new URL(a.href, location.origin);
    const target = u.pathname + u.search;
    history.pushState({}, '', target); loadFrame(target);
  };
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', e => navigateShell(a, e)));
  desktopNav.querySelectorAll('a').forEach(a => a.addEventListener('click', e => navigateShell(a, e)));
  header.querySelector('.logo').addEventListener('click', e => {
    e.preventDefault(); const target = ROOT + 'index.html'; history.pushState({}, '', target); loadFrame(target);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sidebar.classList.contains('aberto')) setOpen(false); });
  document.getElementById('drawer-logout').addEventListener('click', logout);
  window.abrirDrawer = () => setOpen(true); window.fecharDrawer = () => setOpen(false); window.logout = logout;

  // Persistent shell: the original page remains the content document, so no
  // backend/API or page-specific functionality is rewritten.
  const frame = document.createElement('iframe');
  frame.className = 'candidate-shell-frame'; frame.title = titleFor(currentFile); frame.setAttribute('aria-label', 'Conteúdo do portal do candidato');
  const resizeFrame = () => {
    try {
      const doc = frame.contentDocument;
      frame.style.height = Math.max(window.innerHeight - 130, doc.documentElement.scrollHeight, doc.body.scrollHeight) + 'px';
    } catch (_) {}
  };
  window.addEventListener('message', e => {
    if (e.source !== frame.contentWindow || !e.data || e.data.type !== 'candidate-modal') return;
    if (window.matchMedia('(max-width: 640px)').matches && e.data.open) frame.style.height = Math.max(window.innerHeight - 130, 520) + 'px';
    else resizeFrame();
  });
  const cleanCurrent = () => { const u = new URL(location.href); u.searchParams.delete('candidate_shell'); return u.pathname + u.search + u.hash; };
  const frameURL = path => { const u = new URL(path, location.origin); u.searchParams.set('candidate_shell', 'frame'); return u.pathname + u.search + u.hash; };
  const original = [...document.body.children].filter(el => el !== header && el !== subheader && el !== overlay && el !== sidebar);
  original.forEach(el => { if (el.tagName !== 'SCRIPT' && el.tagName !== 'LINK' && el.tagName !== 'STYLE') el.hidden = true; });
  document.body.appendChild(frame);
  let loadingFromShell = false;
  const syncShell = path => { const f = (new URL(path, location.origin).pathname.split('/').pop() || 'index.html').toLowerCase(); document.getElementById('sub-titulo').textContent = titleFor(f); sidebar.querySelectorAll('.drawer-link').forEach(a => { const active = a.getAttribute('href').endsWith('/' + f); a.classList.toggle('ativo', active); active ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'); }); desktopNav.querySelectorAll('.desktop-nav-link').forEach(a => { const active = a.getAttribute('href').endsWith('/' + f); a.classList.toggle('ativo', active); }); };
  const loadFrame = path => { loadingFromShell = true; frame.src = frameURL(path || cleanCurrent()); syncShell(path || cleanCurrent()); };
  frame.addEventListener('load', () => {
    loadingFromShell = false;
    try {
      const doc = frame.contentDocument;
      doc.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a'); if (!a || a.target === '_blank' || !a.href) return; const u = new URL(a.href, location.origin); if (u.origin !== location.origin || !u.pathname.startsWith(ROOT) || a.hasAttribute('download')) return; e.preventDefault(); const path = u.pathname + u.search + u.hash; history.pushState({}, '', path); loadFrame(path); }, true);
      resizeFrame();
    } catch (_) {}
  });
  window.addEventListener('popstate', () => loadFrame(cleanCurrent()));
  loadFrame(cleanCurrent());
})();
