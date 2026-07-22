// ============================================
// CHAT FLUTUANTE - CHAT COM A EMPRESA (admin)
// Bolinha DOURADA, lista todas conversas com EMPRESAS
// (diferente do chat candidato-administrador)
// ============================================

(function() {
  'use strict';

  const token = localStorage.getItem('admin_token') || localStorage.getItem('recrutador_token');
  if (!token) return;

  const API = 'https://recrutamento-api.onrender.com';
  let conversas = [];          // [{ candidatura_id, candidato_nome, vaga_titulo, empresa_nome, nao_lidas, ultima_mensagem, ultima_data, ultimo_remetente_tipo }]
  let conversaAtiva = null;    // candidatura_id selecionada
  let ultimaMensagemId = {};   // pra detectar não lidas
  let aberto = false;

  // === Estilos injetados ===
  const style = document.createElement('style');
  style.textContent = `
    .cefab-container { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column-reverse; gap: 10px; z-index: 9998; }
    .cefab-bolinha {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #d4a017 0%, #f0c14b 100%);
      border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      cursor: pointer; position: relative;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s;
    }
    .cefab-bolinha:hover { transform: scale(1.08); }
    .cefab-bolinha.aberta { border-color: #d4a017; box-shadow: 0 0 0 3px rgba(212,160,23,0.4), 0 4px 12px rgba(0,0,0,0.3); }
    .cefab-iniciais { color: white; font-weight: 700; font-size: 16px; text-transform: uppercase; }
    .cefab-badge {
      position: absolute; top: -4px; right: -4px;
      background: #dc2626; color: white; border-radius: 999px;
      min-width: 22px; height: 22px; padding: 0 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      border: 2px solid white;
    }
    .ce-window { position: fixed; bottom: 90px; right: 20px; z-index: 9997;
      width: 380px; max-width: calc(100vw - 32px); height: 540px; max-height: calc(100vh - 130px);
      background: white; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .ce-window.aberto { display: flex; animation: cePop 0.2s ease-out; }
    @keyframes cePop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .ce-head { background: linear-gradient(135deg, #d4a017 0%, #f0c14b 100%); color: white;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .ce-head-titulo { flex: 1; min-width: 0; }
    .ce-head-titulo h3 { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ce-head-titulo p { margin: 0; font-size: 11px; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ce-head-fechar { background: rgba(255,255,255,0.15); border: 0; color: white;
      width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 18px; }
    .ce-head-fechar:hover { background: rgba(255,255,255,0.25); }
    .ce-lista { flex: 1; overflow-y: auto; min-height: 0; }
    .ce-conv { padding: 12px 14px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.1s; }
    .ce-conv:hover { background: #fafafa; }
    .ce-conv.ativa { background: #fff8e1; }
    .ce-conv-topo { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
    .ce-conv-nome { font-size: 13px; font-weight: 700; color: #1a1a1a; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ce-conv-data { font-size: 11px; color: #888; flex-shrink: 0; }
    .ce-conv-vaga { font-size: 11px; color: #888; margin-bottom: 4px; }
    .ce-conv-msg { font-size: 12px; color: #555; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .ce-conv-badge { display: inline-block; background: #dc2626; color: white; border-radius: 10px; padding: 1px 6px; font-size: 10px; margin-left: 4px; }

    .ce-msg-area { flex: 1; overflow-y: auto; padding: 12px; background: #fafafa; min-height: 0; }
    .ce-msg { display: flex; margin-bottom: 10px; }
    .ce-msg.minha { flex-direction: row-reverse; }
    .ce-msg-av { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
    .ce-msg-av.empresa { background: #C9A961; color: #1a1a1a; }
    .ce-msg-av.rh { background: #d4a017; }
    .ce-msg-balao { max-width: 70%; margin: 0 8px; }
    .ce-msg-conteudo { padding: 8px 12px; border-radius: 14px; font-size: 13px;
      line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; }
    .ce-msg.empresa .ce-msg-conteudo { background: white; border: 1px solid #e5e0d8; }
    .ce-msg.rh .ce-msg-conteudo { background: #d4a017; color: white; }
    .ce-msg-meta { font-size: 10px; color: #888; margin-top: 3px; }
    .ce-msg.minha .ce-msg-meta { text-align: right; }
    .ce-vazio { text-align: center; color: #888; padding: 40px 20px; }
    .ce-vazio .icon { font-size: 40px; margin-bottom: 10px; opacity: 0.4; }
    .ce-input { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid #e5e0d8;
      background: white; align-items: flex-end; flex-shrink: 0; }
    .ce-input textarea { flex: 1; resize: none; border: 1px solid #e5e0d8; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; font-family: inherit; max-height: 80px; min-height: 36px; }
    .ce-input textarea:focus { outline: none; border-color: #d4a017; }
    .ce-send-btn { background: #d4a017; color: white; border: 0; width: 36px; height: 36px;
      border-radius: 8px; font-size: 16px; cursor: pointer; flex-shrink: 0; }
    .ce-send-btn:hover:not(:disabled) { background: #f0c14b; }
    .ce-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ce-voltar { background: rgba(255,255,255,0.15); border: 0; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; margin-right: 4px; }
    .ce-voltar:hover { background: rgba(255,255,255,0.25); }
    @media (max-width: 480px) {
      .ce-window { right: 8px; left: 8px; width: auto; bottom: 90px; }
    }
  `;
  document.head.appendChild(style);

  // === HTML: bolinha dourada ===
  const fabContainer = document.createElement('div');
  fabContainer.id = 'cefab-container';
  fabContainer.className = 'cefab-container';
  document.body.appendChild(fabContainer);

  const win = document.createElement('div');
  win.className = 'ce-window';
  win.id = 'ce-window';
  win.innerHTML = `
    <div class="ce-head">
      <button class="ce-voltar" id="ce-voltar-btn" style="display:none" onclick="window.__ceChat.voltar()">‹</button>
      <div class="ce-head-titulo">
        <h3 id="ce-head-titulo">🏢 Chat com Empresas</h3>
        <p id="ce-head-sub">Selecione uma conversa</p>
      </div>
      <button class="ce-head-fechar" onclick="window.__ceChat.fechar()">×</button>
    </div>
    <div class="ce-lista" id="ce-lista"></div>
    <div class="ce-msg-area" id="ce-msg-area" style="display:none">
      <div class="ce-vazio"><div class="icon">💬</div><p>Carregando...</p></div>
    </div>
    <div class="ce-input" id="ce-input-area" style="display:none">
      <textarea id="ce-input" placeholder="Digite sua mensagem para a empresa…" rows="1"></textarea>
      <button class="ce-send-btn" id="ce-send-btn" onclick="window.__ceChat.enviar()">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  window.__ceChat = {
    enviar: enviarMensagem,
    fechar: fecharJanela,
    voltar: voltarLista
  };

  // === API ===
  async function carregarConversas() {
    try {
      const r = await fetch(API + '/api/admin/chat-empresa-lista', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) return;
      const data = await r.json();
      conversas = data.conversas || [];
      renderFab();
      if (aberto) renderLista();
    } catch (e) { console.error('[ce-chat] carregarConversas', e); }
  }

  function renderFab() {
    const totalNaoLidas = conversas.reduce((s, c) => s + parseInt(c.nao_lidas || 0), 0);
    if (conversas.length === 0) {
      fabContainer.innerHTML = '';
      return;
    }
    // Se só 1 conversa, mostra 1 bolinha com badge
    // Se várias, mostra só 1 bolinha "Chat" com total
    if (conversas.length === 1) {
      const c = conversas[0];
      const ini = iniciais(c.candidato_nome);
      fabContainer.innerHTML = `
        <button class="cefab-bolinha" onclick="window.__ceChat.toggle()" title="Chat com a empresa: ${escapeHtml(c.candidato_nome)}">
          <span class="cefab-iniciais">${ini}</span>
          ${parseInt(c.nao_lidas || 0) > 0 ? `<span class="cefab-badge">${c.nao_lidas > 9 ? '9+' : c.nao_lidas}</span>` : ''}
        </button>`;
    } else {
      fabContainer.innerHTML = `
        <button class="cefab-bolinha" onclick="window.__ceChat.toggle()" title="${conversas.length} conversas com empresas">
          <span class="cefab-iniciais">🏢</span>
          ${totalNaoLidas > 0 ? `<span class="cefab-badge">${totalNaoLidas > 9 ? '9+' : totalNaoLidas}</span>` : ''}
        </button>`;
    }
  }

  function renderLista() {
    if (conversaAtiva) {
      // Mostrar mensagens
      document.getElementById('ce-lista').style.display = 'none';
      document.getElementById('ce-msg-area').style.display = 'block';
      document.getElementById('ce-input-area').style.display = 'flex';
      document.getElementById('ce-voltar-btn').style.display = 'inline-block';
      carregarMensagens();
      return;
    }
    // Mostrar lista de conversas
    document.getElementById('ce-lista').style.display = 'block';
    document.getElementById('ce-msg-area').style.display = 'none';
    document.getElementById('ce-input-area').style.display = 'none';
    document.getElementById('ce-voltar-btn').style.display = 'none';
    document.getElementById('ce-head-titulo').textContent = '🏢 Chat com Empresas';
    document.getElementById('ce-head-sub').textContent = conversas.length + ' conversa(s)';
    const lista = document.getElementById('ce-lista');
    if (conversas.length === 0) {
      lista.innerHTML = '<div class="ce-vazio"><div class="icon">💬</div><p>Nenhuma conversa com empresa ainda.</p></div>';
      return;
    }
    lista.innerHTML = conversas.map(c => {
      const ini = iniciais(c.candidato_nome);
      const naoLidas = parseInt(c.nao_lidas || 0);
      const ehMeu = c.ultimo_remetente_tipo === 'rh';
      return `
        <div class="ce-conv" onclick="window.__ceChat.abrir(${c.candidatura_id})">
          <div class="ce-conv-topo">
            <span class="ce-conv-nome">${ini} ${escapeHtml(c.candidato_nome)}</span>
            <span class="ce-conv-data">${formatarData(c.ultima_data)}</span>
          </div>
          <div class="ce-conv-vaga">${escapeHtml(c.vaga_titulo || '')}${c.empresa_nome ? ' • ' + escapeHtml(c.empresa_nome) : ''}</div>
          <div class="ce-conv-msg"><strong>${ehMeu ? 'Você: ' : ''}</strong>${escapeHtml(c.ultima_mensagem || '')}${naoLidas > 0 ? `<span class="ce-conv-badge">${naoLidas} nova(s)</span>` : ''}</div>
        </div>
      `;
    }).join('');
  }

  async function carregarMensagens() {
    if (!conversaAtiva) return;
    const c = conversas.find(x => x.candidatura_id === conversaAtiva);
    if (!c) return;
    document.getElementById('ce-head-titulo').textContent = c.candidato_nome || 'Candidato';
    document.getElementById('ce-head-sub').textContent = (c.vaga_titulo || '') + (c.empresa_nome ? ' • ' + c.empresa_nome : '');
    try {
      const r = await fetch(API + '/api/admin/candidatura/' + conversaAtiva + '/chat-empresa', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) return;
      const data = await r.json();
      const msgs = data.mensagens || [];
      const area = document.getElementById('ce-msg-area');
      area.innerHTML = msgs.map(m => {
        const cls = m.remetente_tipo === 'rh' ? 'rh' : 'empresa';
        const ini = iniciais(m.remetente_nome);
        return `
          <div class="ce-msg ${cls}">
            <div class="ce-msg-av ${cls}">${ini}</div>
            <div class="ce-msg-balao">
              <div class="ce-msg-conteudo">${escapeHtml(m.mensagem)}</div>
              <div class="ce-msg-meta">${escapeHtml(m.remetente_nome)} • ${formatarData(m.criado_em, true)}</div>
            </div>
          </div>
        `;
      }).join('') || '<div class="ce-vazio"><div class="icon">💬</div><p>Sem mensagens. Inicie a conversa!</p></div>';
      area.scrollTop = area.scrollHeight;
      // Atualiza o badge localmente
      c.nao_lidas = 0;
      renderFab();
    } catch (e) { console.error('[ce-chat] carregarMensagens', e); }
  }

  async function enviarMensagem() {
    if (!conversaAtiva) return;
    const inp = document.getElementById('ce-input');
    const txt = inp.value.trim();
    if (!txt) return;
    const btn = document.getElementById('ce-send-btn');
    btn.disabled = true;
    try {
      const r = await fetch(API + '/api/admin/candidatura/' + conversaAtiva + '/chat-empresa', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: txt })
      });
      if (r.ok) {
        inp.value = '';
        await carregarMensagens();
      } else {
        alert('Erro ao enviar mensagem');
      }
    } catch (e) { console.error('[ce-chat] enviar', e); }
    btn.disabled = false;
  }

  function abrir(cid) {
    conversaAtiva = cid;
    renderLista();
  }
  function voltarLista() {
    conversaAtiva = null;
    renderLista();
  }
  function fecharJanela() {
    win.classList.remove('aberto');
    aberto = false;
  }
  function toggle() {
    aberto = !aberto;
    win.classList.toggle('aberto', aberto);
    if (aberto) {
      conversaAtiva = null;
      renderLista();
    }
  }
  window.__ceChat.toggle = toggle;
  window.__ceChat.abrir = abrir;

  // === Helpers ===
  function iniciais(n) {
    if (!n) return '?';
    return n.split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');
  }
  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }
  function formatarData(d, comHora) {
    if (!d) return '';
    const dt = new Date(d);
    const hoje = new Date();
    const ehHoje = dt.toDateString() === hoje.toDateString();
    if (ehHoje) {
      return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (comHora) {
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
             dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  // === Enter pra enviar ===
  document.body.addEventListener('keydown', (e) => {
    if (e.target.id === 'ce-input' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  });

  // Se tiver ?id=XX na URL, abre direto essa conversa
  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id');
  if (idUrl) {
    setTimeout(() => {
      const cid = parseInt(idUrl);
      if (conversas.find(c => c.candidatura_id === cid)) {
        toggle();
        abrir(cid);
      }
    }, 800);
  }

  // === INIT ===
  carregarConversas();
  setInterval(carregarConversas, 30000);
  // Se tiver conversa ativa, atualiza mensagens a cada 10s
  setInterval(() => {
    if (aberto && conversaAtiva) carregarMensagens();
  }, 10000);
})();
