/* VagasIO — shell lateral único do Portal do Candidato */
(function () {
  const root = '/candidato/';
  const links = [
    ['index.html', '🏠', 'Vagas'],
    ['painel.html', '👤', 'Meu perfil'],
    ['entrevistas.html', '📅', 'Entrevistas'],
    ['favoritos.html', '☆', 'Favoritos'],
    ['conversas.html', '▢', 'Chat'],
    ['notificacoes.html', '♧', 'Notificações'],
    ['seguranca.html', '🔒', 'Segurança']
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
