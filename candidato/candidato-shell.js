/* VagasIO — shell lateral único do Portal do Candidato */
(function () {
  const root = '/candidato/';
  const icons = {
    vagas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5v8.5H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 19v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    perfil: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 20c.7-3.4 2.9-5.2 6.5-5.2s5.8 1.8 6.5 5.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    entrevistas: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    favoritos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    notificacoes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19.5h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    seguranca: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.6-2.7 7.7-7 10-4.3-2.3-7-5.4-7-10V6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.5 12 11 13.5l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const links = [
    ['index.html', icons.vagas, 'Vagas'],
    ['painel.html', icons.perfil, 'Meu perfil'],
    ['entrevistas.html', icons.entrevistas, 'Entrevistas'],
    ['favoritos.html', icons.favoritos, 'Favoritos'],
    ['conversas.html', icons.chat, 'Chat'],
    ['notificacoes.html', icons.notificacoes, 'Notificações'],
    ['seguranca.html', icons.seguranca, 'Segurança']
  ];
  const current = location.pathname.split('/').pop() || 'index.html';
  const body = document.body;
  const autenticado = !!localStorage.getItem('candidato_token');

  // Visitante não deve ver nem abrir o menu lateral do candidato.
  if (!autenticado) {
    document.querySelectorAll('.btn-menu-logo').forEach(el => el.remove());
    document.getElementById('drawer-overlay')?.remove();
    document.getElementById('drawer')?.remove();
    return;
  }

  // Cabeçalho e faixa de título únicos em todas as páginas autenticadas.
  const titulos = { painel: 'Página do candidato', favoritos: 'Favoritos', conversas: 'Chat', notificacoes: 'Notificações', seguranca: 'Segurança', entrevistas: 'Entrevistas', documentos: 'Documentos', candidaturas: 'Minhas candidaturas', perfil: 'Meu perfil', candidatura: 'Candidatura' };
  const baseNome = current.replace('.html', '');
  const tituloPagina = titulos[baseNome] || 'Página do candidato';
  let header = document.querySelector('body > header');
  if (!header) {
    document.body.insertAdjacentHTML('afterbegin', '<header class="candidate-header"></header>');
    header = document.querySelector('body > header');
  }
  header.className = 'candidate-header';
  header.innerHTML = '<div class="header-inner"><a href="' + root + 'index.html" class="logo">VagasIO</a><div class="header-actions" id="header-actions"></div></div>';
  let subheader = document.querySelector('body > .subheader');
  if (!subheader) {
    header.insertAdjacentHTML('afterend', '<section class="subheader"><div class="subheader-inner"><h1>' + escapeHtml(tituloPagina) + '</h1></div></section>');
  } else {
    subheader.innerHTML = '<div class="subheader-inner"><h1>' + escapeHtml(tituloPagina) + '</h1></div>';
  }
  document.querySelectorAll('#sino-fase7, .perfil-card-sino').forEach(el => el.remove());

  function drawerMarkup() {
    return `<div class="drawer-overlay" id="drawer-overlay"></div>
      <aside class="drawer" id="drawer" aria-label="Menu do candidato">
        <div class="drawer-header">
          <div class="drawer-foto" id="drawer-foto">👤</div>
          <div class="drawer-info"><h3 id="drawer-nome">${escapeHtml(localStorage.getItem('candidato_nome') || 'Candidato')}</h3><p id="drawer-email">${escapeHtml(localStorage.getItem('candidato_email') || '—')}</p></div>
          <button class="drawer-close" id="drawer-close" type="button" aria-label="Fechar menu">×</button>
        </div>
        <div class="drawer-body"><div class="drawer-section">NAVEGAÇÃO</div>${links.map(([href, icon, label]) => `<a href="${root + href}" class="drawer-link${current === href ? ' ativo' : ''}"><span class="icon" aria-hidden="true">${icon}</span>${label}</a>`).join('')}</div>
        <div class="drawer-footer"><button class="drawer-logout" id="drawer-logout" type="button">⇥ &nbsp; Sair</button></div>
      </aside>`;
  }
  function escapeHtml(v) { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

  let drawer = document.getElementById('drawer');
  if (!drawer) {
    body.insertAdjacentHTML('afterbegin', drawerMarkup());
    drawer = document.getElementById('drawer');
  } else {
    const bodyMenu = drawer.querySelector('.drawer-body');
    if (bodyMenu) bodyMenu.innerHTML = `<div class="drawer-section">NAVEGAÇÃO</div>${links.map(([href, icon, label]) => `<a href="${root + href}" class="drawer-link${current === href ? ' ativo' : ''}"><span class="icon" aria-hidden="true">${icon}</span>${label}</a>`).join('')}`;
    const footer = drawer.querySelector('.drawer-footer');
    if (footer) footer.innerHTML = '<button class="drawer-logout" id="drawer-logout" type="button">⇥ &nbsp; Sair</button>';
  }
  const overlay = document.getElementById('drawer-overlay');
  const close = document.getElementById('drawer-close');
  const open = () => { drawer.classList.add('aberto'); overlay?.classList.add('aberto'); document.body.classList.add('drawer-aberto'); };
  const closeDrawer = () => { drawer.classList.remove('aberto'); overlay?.classList.remove('aberto'); document.body.classList.remove('drawer-aberto'); };
  window.abrirDrawer = window.abrirDrawer || open;
  window.fecharDrawer = window.fecharDrawer || closeDrawer;
  close?.addEventListener('click', closeDrawer); overlay?.addEventListener('click', closeDrawer);
  document.getElementById('drawer-logout')?.addEventListener('click', () => { ['candidato_token','candidato_refresh','candidato_email','candidato_nome','candidato_foto'].forEach(k => localStorage.removeItem(k)); location.href = root; });

  const actions = document.querySelector('.header-actions, #header-actions, .hdr-right');
  if (actions && !actions.querySelector('.btn-menu-logo')) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-menu-logo'; b.setAttribute('aria-label', 'Abrir menu'); b.textContent = '☰'; b.addEventListener('click', open); actions.prepend(b);
  }
})();
