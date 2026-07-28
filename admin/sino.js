// =========================================================================
// Sino de notificações (FASE 7) — componente global melhorado
// =========================================================================
// Incluir em qualquer página autenticada:
//   <script src="sino.js"></script>
//
// Auto-detecta:
//   - localStorage.admin_token (empresa) → /admin/notificacoes.html
//   - localStorage.candidato_token → /candidato/notificacoes.html
//
// Polling a cada 60s. Não agressivo.
(function() {
  const API = 'https://recrutamento-api-novo.onrender.com';
  const TOKEN_KEY = localStorage.getItem('admin_token') ? 'admin_token' : 'candidato_token';
  const IS_ADMIN = TOKEN_KEY === 'admin_token';
  const BASE = IS_ADMIN ? 'admin' : 'candidato';

  // Mapeamento tipo → ícone + cor
  const TIPO_ICON = {
    candidatura: { icon: '📥', cor: '#5B9BD5' },
    etapa: { icon: '📊', cor: '#A78BFA' },
    status: { icon: '🔄', cor: '#FBBF24' },
    documento: { icon: '📄', cor: '#34D399' },
    proposta: { icon: '📨', cor: '#FF8FA3' },
    desistiu: { icon: '🚪', cor: '#999' }
  };

  // Mapeamento tipo → link inteligente ao clicar
  function linkInteligente(tipo, referenciaId) {
    if (!referenciaId) return null;
    if (tipo === 'candidatura' || tipo === 'etapa' || tipo === 'status' || tipo === 'proposta' || tipo === 'desistiu') {
      return IS_ADMIN
        ? `${BASE}/analisar.html?id=${referenciaId}`
        : `${BASE}/candidatura.html?id=${referenciaId}`;
    }
    if (tipo === 'documento') {
      return IS_ADMIN
        ? `${BASE}/analisar.html?id=${referenciaId}#docs`
        : `${BASE}/inscricao.html#docs`;
    }
    return null;
  }

  function inject() {
    if (document.getElementById('sino-fase7')) return;
    const css = document.createElement('style');
    css.textContent = `
      #sino-fase7 {
        position: fixed; top: 12px; right: 60px; z-index: 9999;
        background: #fff; border: 1px solid #e0e0e0; border-radius: 24px;
        width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        font-size: 20px; transition: transform 0.1s;
      }
      #sino-fase7:hover { transform: scale(1.06); }
      #sino-fase7 .badge {
        position: absolute; top: -4px; right: -4px;
        background: #c62828; color: #fff; font-size: 11px; font-weight: 700;
        min-width: 20px; height: 20px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center; padding: 0 6px;
      }
      #sino-fase7 .badge.hidden { display: none; }
      #sino-fase7 .dropdown {
        position: absolute; top: 52px; right: 0;
        background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
        width: 360px; max-height: 520px; overflow-y: auto;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        display: none;
      }
      #sino-fase7.open .dropdown { display: block; }
      #sino-fase7 .dropdown .item {
        padding: 12px 16px; border-bottom: 1px solid #f0f0f0;
        cursor: pointer; font-size: 14px; display: flex; gap: 10px; align-items: flex-start;
      }
      #sino-fase7 .dropdown .item:hover { background: #fafafa; }
      #sino-fase7 .dropdown .item .icon-tipo {
        flex: 0 0 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; margin-top: 2px;
      }
      #sino-fase7 .dropdown .item .conteudo { flex: 1; min-width: 0; }
      #sino-fase7 .dropdown .item .t { font-weight: 600; margin: 0 0 4px; }
      #sino-fase7 .dropdown .item .m { color: #666; font-size: 13px; margin: 0 0 4px; }
      #sino-fase7 .dropdown .item .d { color: #999; font-size: 11px; }
      #sino-fase7 .dropdown .item.nao-lida { background: #fffafa; }
      #sino-fase7 .dropdown .item.nao-lida .t::before {
        content: '●'; color: #D4AF37; margin-right: 6px; font-size: 10px;
      }
      #sino-fase7 .dropdown .footer {
        padding: 10px 16px; text-align: center;
        border-top: 1px solid #e0e0e0; font-size: 13px;
      }
      #sino-fase7 .dropdown .footer a { color: #7B1F1F; text-decoration: none; font-weight: 600; }
      #sino-fase7 .dropdown .footer button {
        background: none; border: none; color: #666; cursor: pointer; font-size: 12px;
      }
      #sino-fase7 .dropdown .vazio { padding: 40px 16px; text-align: center; color: #999; }
    `;
    document.head.appendChild(css);

    const sino = document.createElement('div');
    sino.id = 'sino-fase7';
    sino.innerHTML = `
      🔔<span class="badge hidden">0</span>
      <div class="dropdown">
        <div class="vazio">Carregando…</div>
      </div>
    `;
    document.body.appendChild(sino);

    sino.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sino.classList.toggle('open');
      if (isOpen) carregarFeed();
    });
    document.addEventListener('click', () => sino.classList.remove('open'));
    sino.querySelector('.dropdown').addEventListener('click', e => e.stopPropagation());

    carregar();
    setInterval(carregar, 60_000);
  }

  async function carregar() {
    const tok = localStorage.getItem(TOKEN_KEY);
    if (!tok) return;
    try {
      const r = await fetch(API + '/api/notificacoes/nao-lidas', {
        headers: { 'Authorization': 'Bearer ' + tok }
      });
      if (!r.ok) return;
      const d = await r.json();
      const badge = document.querySelector('#sino-fase7 .badge');
      const n = d.total || 0;
      badge.textContent = n > 99 ? '99+' : n;
      badge.classList.toggle('hidden', n === 0);
      // Se aberto, atualiza feed
      if (document.querySelector('#sino-fase7').classList.contains('open')) {
        await carregarFeed();
      }
    } catch (e) {}
  }

  async function carregarFeed() {
    const tok = localStorage.getItem(TOKEN_KEY);
    const r = await fetch(API + '/api/notificacoes?lida=false&limit=8', {
      headers: { 'Authorization': 'Bearer ' + tok }
    });
    const d = await r.json();
    const dd = document.querySelector('#sino-fase7 .dropdown');
    if (!d.notificacoes || d.notificacoes.length === 0) {
      dd.innerHTML = '<div class="vazio">Nenhuma notificação não lida. ✓</div>' + footer();
      return;
    }
    dd.innerHTML = d.notificacoes.map(n => {
      const t = TIPO_ICON[n.tipo] || { icon: '🔔', cor: '#999' };
      return `
      <div class="item nao-lida" data-id="${n.id}" data-tipo="${n.tipo || ''}" data-refid="${n.referencia_id || ''}">
        <div class="icon-tipo" style="background:${t.cor}22;color:${t.cor}">${t.icon}</div>
        <div class="conteudo">
          <p class="t">${escapeHtml(n.titulo)}</p>
          ${n.mensagem ? `<p class="m">${escapeHtml(n.mensagem)}</p>` : ''}
          <div class="d">${formatarData(n.criada_em)}</div>
        </div>
      </div>`;
    }).join('') + footer();
    dd.querySelectorAll('.item').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.dataset.id;
        const tipo = el.dataset.tipo;
        const refid = el.dataset.refid;
        const link = linkInteligente(tipo, refid);
        await fetch(API + '/api/notificacoes/' + id + '/lida', {
          method: 'PATCH', headers: { 'Authorization': 'Bearer ' + tok }
        });
        if (link) {
          window.location.href = link;
        } else {
          el.classList.remove('nao-lida');
          await carregar();
        }
      });
    });
    dd.querySelector('.btn-marcar-todas')?.addEventListener('click', async () => {
      await fetch(API + '/api/notificacoes/marcar-todas-lidas', {
        method: 'PATCH', headers: { 'Authorization': 'Bearer ' + tok }
      });
      await carregarFeed();
      await carregar();
    });
  }

  function footer() {
    return `
      <div class="footer">
        <button class="btn-marcar-todas">Marcar todas como lidas</button>
        &nbsp;|&nbsp;
        <a href="${BASE}/notificacoes.html">Ver todas</a>
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function formatarData(iso) {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return Math.floor(diff / 60) + 'min atrás';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h atrás';
    return d.toLocaleDateString('pt-BR');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();