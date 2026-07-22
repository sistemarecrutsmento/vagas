// ============================================
// CHAT FLUTUANTE - CHAT COM O RH (empresa)
// Bolinha DOURADA, lista conversas com RH
// Disponível desde a ETAPA 1 (inscrição)
// ============================================

(function() {
  'use strict';

  const token = localStorage.getItem('empresa_token');
  if (!token) return;

  const API = 'https://recrutamento-api.onrender.com';
  let conversas = [];
  let conversaAtiva = null;
  let aberto = false;

  // === Estilos injetados (mesmo padrão do admin) ===
  const style = document.createElement('style');
  style.textContent = `
    .crfab-container { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column-reverse; gap: 10px; z-index: 9998; }
    .crfab-bolinha {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #d4a017 0%, #f0c14b 100%);
      border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      cursor: pointer; position: relative;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s;
    }
    .crfab-bolinha:hover { transform: scale(1.08); }
    .crfab-bolinha.aberta { border-color: #d4a017; box-shadow: 0 0 0 3px rgba(212,160,23,0.4), 0 4px 12px rgba(0,0,0,0.3); }
    .crfab-iniciais { color: white; font-weight: 700; font-size: 16px; text-transform: uppercase; }
    .crfab-badge {
      position: absolute; top: -4px; right: -4px;
      background: #dc2626; color: white; border-radius: 999px;
      min-width: 22px; height: 22px; padding: 0 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      border: 2px solid white;
    }
    .cr-window { position: fixed; bottom: 90px; right: 20px; z-index: 9997;
      width: 380px; max-width: calc(100vw - 32px); height: 540px; max-height: calc(100vh - 130px);
      background: white; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .cr-window.aberto { display: flex; animation: crPop 0.2s ease-out; }
    @keyframes crPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .cr-head { background: linear-gradient(135deg, #d4a017 0%, #f0c14b 100%); color: white;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .cr-head-titulo { flex: 1; min-width: 0; }
    .cr-head-titulo h3 { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cr-head-titulo p { margin: 0; font-size: 11px; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cr-head-fechar { background: rgba(255,255,255,0.15); border: 0; color: white;
      width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 18px; }
    .cr-head-fechar:hover { background: rgba(255,255,255,0.25); }
    .cr-lista { flex: 1; overflow-y: auto; min-height: 0; }
    .cr-conv { padding: 12px 14px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.1s; }
    .cr-conv:hover { background: #fafafa; }
    .cr-conv.ativa { background: #fff8e1; }
    .cr-conv-topo { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
    .cr-conv-nome { font-size: 13px; font-weight: 700; color: #1a1a1a; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cr-conv-data { font-size: 11px; color: #888; flex-shrink: 0; }
    .cr-conv-vaga { font-size: 11px; color: #888; margin-bottom: 4px; }
    .cr-conv-msg { font-size: 12px; color: #555; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .cr-conv-badge { display: inline-block; background: #dc2626; color: white; border-radius: 10px; padding: 1px 6px; font-size: 10px; margin-left: 4px; }

    .cr-msg-area { flex: 1; overflow-y: auto; padding: 12px; background: #fafafa; min-height: 0; }
    .cr-msg { display: flex; margin-bottom: 10px; }
    .cr-msg.minha { flex-direction: row-reverse; }
    .cr-msg-av { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
    .cr-msg-av.empresa { background: #C9A961; color: #1a1a1a; }
    .cr-msg-av.rh { background: #d4a017; }
    .cr-msg-balao { max-width: 70%; margin: 0 8px; }
    .cr-msg-conteudo { padding: 8px 12px; border-radius: 14px; font-size: 13px;
      line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; }
    .cr-msg.empresa .cr-msg-conteudo { background: white; border: 1px solid #e5e0d8; }
    .cr-msg.rh .cr-msg-conteudo { background: #d4a017; color: white; }
    .cr-msg-meta { font-size: 10px; color: #888; margin-top: 3px; }
    .cr-msg.minha .cr-msg-meta { text-align: right; }
    .cr-vazio { text-align: center; color: #888; padding: 40px 20px; }
    .cr-vazio .icon { font-size: 40px; margin-bottom: 10px; opacity: 0.4; }
    .cr-input { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid #e5e0d8;
      background: white; align-items: flex-end; flex-shrink: 0; }
    .cr-input textarea { flex: 1; resize: none; border: 1px solid #e5e0d8; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; font-family: inherit; max-height: 80px; min-height: 36px; }
    .cr-input textarea:focus { outline: none; border-color: #d4a017; }
    .cr-send-btn { background: #d4a017; color: white; border: 0; width: 36px; height: 36px;
      border-radius: 8px; font-size: 16px; cursor: pointer; flex-shrink: 0; }
    .cr-send-btn:hover:not(:disabled) { background: #f0c14b; }
    .cr-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .cr-voltar { background: rgba(255,255,255,0.15); border: 0; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; margin-right: 4px; }
    .cr-voltar:hover { background: rgba(255,255,255,0.25); }
    @media (max-width: 480px) {
      .cr-window { right: 8px; left: 8px; width: auto; bottom: 90px; }
    }
  `;
  document.head.appendChild(style);

  // === HTML ===
  const fabContainer = document.createElement('div');
  fabContainer.id = 'crfab-container';
  fabContainer.className = 'crfab-container';
  document.body.appendChild(fabContainer);

  const win = document.createElement('div');
  win.className = 'cr-window';
  win.id = 'cr-window';
  win.innerHTML = `
    <div class="cr-head">
      <button class="cr-voltar" id="cr-voltar-btn" style="display:none" onclick="window.__crChat.voltar()">‹</button>
      <div class="cr-head-titulo">
        <h3 id="cr-head-titulo">💬 Chat com o RH</h3>
        <p id="cr-head-sub">Selecione uma conversa</p>
      </div>
      <button class="cr-head-fechar" onclick="window.__crChat.fechar()">×</button>
    </div>
    <div class="cr-lista" id="cr-lista"></div>
    <div class="cr-msg-area" id="cr-msg-area" style="display:none">
      <div class="cr-vazio"><div class="icon">💬</div><p>Carregando...</p></div>
    </div>
    <div class="cr-input" id="cr-input-area" style="display:none">
      <textarea id="cr-input" placeholder="Digite sua mensagem para o RH…" rows="1"></textarea>
      <button class="cr-send-btn" id="cr-send-btn" onclick="window.__crChat.enviar()">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  window.__crChat = {
    enviar: enviarMensagem,
    fechar: fecharJanela,
    voltar: voltarLista
  };

  // === API ===
  async function carregarConversas() {
    try {
      const r = await fetch(API + '/api/empresa/chat-rh-lista', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) return;
      const data = await r.json();
      conversas = data.conversas || [];
      renderFab();
      if (aberto) renderLista();
    } catch (e) { console.error('[cr-chat] carregarConversas', e); }
  }

  function renderFab() {
    const totalNaoLidas = conversas.reduce((s, c) => s + parseInt(c.nao_lidas || 0), 0);
    if (conversas.length === 0) {
      fabContainer.innerHTML = '';
      return;
    }
    if (conversas.length === 1) {
      const c = conversas[0];
      const ini = iniciais(c.candidato_nome);
      fabContainer.innerHTML = `
        <button class="crfab-bolinha" onclick="window.__crChat.toggle()" title="Chat com RH: ${escapeHtml(c.candidato_nome)}">
          <span class="crfab-iniciais">${ini}</span>
          ${parseInt(c.nao_lidas || 0) > 0 ? `<span class="crfab-badge">${c.nao_lidas > 9 ? '9+' : c.nao_lidas}</span>` : ''}
        </button>`;
    } else {
      fabContainer.innerHTML = `
        <button class="crfab-bolinha" onclick="window.__crChat.toggle()" title="${conversas.length} conversas com o RH">
          <span class="crfab-iniciais">💬</span>
          ${totalNaoLidas > 0 ? `<span class="crfab-badge">${totalNaoLidas > 9 ? '9+' : totalNaoLidas}</span>` : ''}
        </button>`;
    }
  }

  function renderLista() {
    if (conversaAtiva) {
      document.getElementById('cr-lista').style.display = 'none';
      document.getElementById('cr-msg-area').style.display = 'block';
      document.getElementById('cr-input-area').style.display = 'flex';
      document.getElementById('cr-voltar-btn').style.display = 'inline-block';
      carregarMensagens();
      return;
    }
    document.getElementById('cr-lista').style.display = 'block';
    document.getElementById('cr-msg-area').style.display = 'none';
    document.getElementById('cr-input-area').style.display = 'none';
    document.getElementById('cr-voltar-btn').style.display = 'none';
    document.getElementById('cr-head-titulo').textContent = '💬 Chat com o RH';
    document.getElementById('cr-head-sub').textContent = conversas.length + ' conversa(s)';
    const lista = document.getElementById('cr-lista');
    if (conversas.length === 0) {
      lista.innerHTML = '<div class="cr-vazio"><div class="icon">💬</div><p>Nenhuma conversa com o RH ainda.</p></div>';
      return;
    }
    lista.innerHTML = conversas.map(c => {
      const ini = iniciais(c.candidato_nome);
      const naoLidas = parseInt(c.nao_lidas || 0);
      const ehMeu = c.ultimo_remetente_tipo === 'empresa';
      return `
        <div class="cr-conv" onclick="window.__crChat.abrir(${c.candidatura_id})">
          <div class="cr-conv-topo">
            <span class="cr-conv-nome">${ini} ${escapeHtml(c.candidato_nome)}</span>
            <span class="cr-conv-data">${formatarData(c.ultima_data)}</span>
          </div>
          <div class="cr-conv-vaga">${escapeHtml(c.vaga_titulo || '')}</div>
          <div class="cr-conv-msg"><strong>${ehMeu ? 'Você: ' : ''}</strong>${escapeHtml(c.ultima_mensagem || '')}${naoLidas > 0 ? `<span class="cr-conv-badge">${naoLidas} nova(s)</span>` : ''}</div>
        </div>
      `;
    }).join('');
  }

  async function carregarMensagens() {
    if (!conversaAtiva) return;
    const c = conversas.find(x => x.candidatura_id === conversaAtiva);
    if (!c) return;
    document.getElementById('cr-head-titulo').textContent = c.candidato_nome || 'Candidato';
    document.getElementById('cr-head-sub').textContent = c.vaga_titulo || '';
    try {
      const r = await fetch(API + '/api/empresa/candidatura/' + conversaAtiva + '/chat', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) return;
      const data = await r.json();
      const msgs = data.mensagens || [];
      const area = document.getElementById('cr-msg-area');
      area.innerHTML = msgs.map(m => {
        const cls = m.remetente_tipo === 'empresa' ? 'empresa' : 'rh';
        const ini = iniciais(m.remetente_nome);
        return `
          <div class="cr-msg ${cls}">
            <div class="cr-msg-av ${cls}">${ini}</div>
            <div class="cr-msg-balao">
              <div class="cr-msg-conteudo">${escapeHtml(m.mensagem)}</div>
              <div class="cr-msg-meta">${escapeHtml(m.remetente_nome)} • ${formatarData(m.criado_em, true)}</div>
            </div>
          </div>
        `;
      }).join('') || '<div class="cr-vazio"><div class="icon">💬</div><p>Sem mensagens. Inicie a conversa!</p></div>';
      area.scrollTop = area.scrollHeight;
      c.nao_lidas = 0;
      renderFab();
    } catch (e) { console.error('[cr-chat] carregarMensagens', e); }
  }

  async function enviarMensagem() {
    if (!conversaAtiva) return;
    const inp = document.getElementById('cr-input');
    const txt = inp.value.trim();
    if (!txt) return;
    const btn = document.getElementById('cr-send-btn');
    btn.disabled = true;
    try {
      const r = await fetch(API + '/api/empresa/candidatura/' + conversaAtiva + '/chat', {
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
    } catch (e) { console.error('[cr-chat] enviar', e); }
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
  window.__crChat.toggle = toggle;
  window.__crChat.abrir = abrir;

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

  document.body.addEventListener('keydown', (e) => {
    if (e.target.id === 'cr-input' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  });

  // Chat abre SOMENTE quando o usuário clicar (sem auto-open)

  carregarConversas();
  setInterval(carregarConversas, 30000);
  setInterval(() => {
    if (aberto && conversaAtiva) carregarMensagens();
  }, 10000);
})();
