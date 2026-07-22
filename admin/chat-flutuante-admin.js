// ============================================
// CHAT FLUTUANTE - ADMIN (jul/2026)
// Bolinha DOURADA, lista TODAS conversas com mensagens
// de qualquer candidato (agrupadas por candidato)
// ============================================

(function() {
  'use strict';

  // Não carrega se não tiver login admin
  const token = localStorage.getItem('admin_token') || localStorage.getItem('recrutador_token');
  if (!token) return;

  const API = 'https://recrutamento-api.onrender.com';
  let conversas = [];          // [{ candidatura_id, candidato_nome, vaga_titulo, nao_lidas_admin }]
  let conversaAtiva = null;    // candidatura_id selecionada
  let mensagensCache = {};     // mensagens por candidatura_id
  let ultimaMensagemId = {};   // pra detectar não lidas
  let aberto = false;

  // Se tiver ?id=XX na URL (ex: analisar.html?id=19), abre direto essa conversa
  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id');
  const idUrlInt = idUrl ? parseInt(idUrl) : null;

  // === Estilos injetados ===
  const style = document.createElement('style');
  style.textContent = `
    .chatfab { position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 60px; height: 60px; border-radius: 50%; background: #d4a017;
      color: white; border: none; box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      cursor: pointer; font-size: 28px; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    .chatfab:hover { transform: scale(1.08); background: #f0c14b; }
    .chatfab-badge { position: absolute; top: -2px; right: -2px; background: #ef4444;
      color: white; border-radius: 50%; min-width: 20px; height: 20px; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; padding: 0 5px;
      border: 2px solid white;
    }
    .chat-window { position: fixed; bottom: 100px; right: 24px; z-index: 9998;
      width: 380px; max-width: calc(100vw - 32px); height: 540px; max-height: calc(100vh - 130px);
      background: white; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .chat-window.aberto { display: flex; animation: chatPop 0.2s ease-out; }
    @keyframes chatPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .chat-head { background: linear-gradient(135deg, #d4a017 0%, #f0c14b 100%); color: white;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .chat-head-titulo { flex: 1; min-width: 0; }
    .chat-head-titulo h3 { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chat-head-titulo p { margin: 0; font-size: 11px; opacity: 0.9; }
    .chat-head-fechar { background: rgba(255,255,255,0.15); border: 0; color: white;
      width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 18px; }
    .chat-head-fechar:hover { background: rgba(255,255,255,0.25); }
    .chat-vagas { display: flex; gap: 6px; padding: 8px; border-bottom: 1px solid #e5e0d8;
      background: #fafafa; overflow-x: auto; flex-shrink: 0; }
    .chat-vagas:empty { display: none; }
    .chat-vaga-tab { padding: 6px 12px; border-radius: 16px; border: 1px solid #e5e0d8;
      font-size: 12px; font-weight: 600; cursor: pointer; background: white; color: #1a1a1a;
      white-space: nowrap; flex-shrink: 0; transition: all 0.15s;
    }
    .chat-vaga-tab.ativa { background: #d4a017; color: white; border-color: #d4a017; }
    .chat-vaga-tab .badge { background: #ef4444; color: white; border-radius: 10px;
      padding: 1px 6px; font-size: 10px; margin-left: 4px; }
    .chat-msg-area { flex: 1; overflow-y: auto; padding: 12px; background: #fafafa; min-height: 0; }
    .chat-msg { display: flex; margin-bottom: 10px; }
    .chat-msg.minha { flex-direction: row-reverse; }
    .chat-msg-av { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
    .chat-msg-av.candidato { background: #C9A961; color: #1a1a1a; }
    .chat-msg-av.admin { background: #d4a017; }
    .chat-msg-balao { max-width: 70%; margin: 0 8px; }
    .chat-msg-conteudo { padding: 8px 12px; border-radius: 14px; font-size: 13px;
      line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; }
    .chat-msg.candidato .chat-msg-conteudo { background: white; border: 1px solid #e5e0d8; }
    .chat-msg.admin .chat-msg-conteudo { background: #d4a017; color: white; }
    .chat-msg-meta { font-size: 10px; color: #888; margin-top: 3px; }
    .chat-msg.minha .chat-msg-meta { text-align: right; }
    .chat-vazio { text-align: center; color: #888; padding: 40px 20px; }
    .chat-vazio .icon { font-size: 40px; margin-bottom: 10px; opacity: 0.4; }
    .chat-input { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid #e5e0d8;
      background: white; align-items: flex-end; flex-shrink: 0; }
    .chat-input textarea { flex: 1; resize: none; border: 1px solid #e5e0d8; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; font-family: inherit; max-height: 80px; min-height: 36px; }
    .chat-input textarea:focus { outline: none; border-color: #d4a017; }
    .chat-send-btn { background: #d4a017; color: white; border: 0; width: 36px; height: 36px;
      border-radius: 8px; font-size: 16px; cursor: pointer; flex-shrink: 0; }
    .chat-send-btn:hover:not(:disabled) { background: #f0c14b; }
    .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    @media (max-width: 480px) {
      .chat-window { right: 8px; left: 8px; width: auto; bottom: 90px; }
    }
  `;
  document.head.appendChild(style);

  // CSS extra do uploader (injetado depois pra ter prioridade)
  const styleUploader = document.createElement('style');
  styleUploader.textContent = `
    .chat-anexo-btn { background:transparent;border:0;font-size:22px;cursor:pointer;padding:0 6px;color:var(--dourado,#d4a017); }
    .chat-anexo-btn:hover { transform:scale(1.1); }
    .chat-anexo-btn:disabled { opacity:0.4;cursor:not-allowed; }
    .chat-anexo-link { display:flex;align-items:center;gap:6px;padding:8px 10px;background:rgba(255,255,255,0.15);border-radius:8px;color:inherit;text-decoration:none;margin-top:4px;font-size:13px; }
    .chat-anexo-link span { flex:1;word-break:break-all; }
    .chat-anexo-link small { opacity:0.7;font-size:11px; }
    .chat-anexo-preview { display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f1f1f1;border-radius:8px;margin-top:6px;font-size:12px; }
    .chat-anexo-preview button { background:#dc2626;color:white;border:0;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px; }
  `;
  document.head.appendChild(styleUploader);

  // Uploader já vem no <head> via <script src="../candidato/chat-uploader.js">
  function carregarUploader() {
    return new Promise(resolve => {
      if (window.ChatUploader) return resolve();
      let tentativas = 0;
      const t = setInterval(() => {
        tentativas++;
        if (window.ChatUploader || tentativas > 20) { clearInterval(t); resolve(); }
      }, 100);
    });
  }

  // === HTML da bolinha e janela ===
  const fab = document.createElement('button');
  fab.className = 'chatfab';
  fab.id = 'chatfab-btn';
  fab.innerHTML = '💬<span class="chatfab-badge" id="chatfab-badge" style="display:none;">0</span>';
  fab.onclick = toggleChat;
  document.body.appendChild(fab);

  const win = document.createElement('div');
  win.className = 'chat-window';
  win.id = 'chat-window';
  win.innerHTML = `
    <div class="chat-head">
      <div class="chat-head-titulo">
        <h3 id="chat-head-titulo">💬 Conversas</h3>
        <p id="chat-head-sub">Com os candidatos</p>
      </div>
      <button class="chat-head-fechar" onclick="document.getElementById('chat-window').classList.remove('aberto')">×</button>
    </div>
    <div class="chat-vagas" id="chat-vagas"></div>
    <div class="chat-msg-area" id="chat-msg-area">
      <div class="chat-vazio">
        <div class="icon">💬</div>
        <p>Suas conversas com o recrutador aparecem aqui.</p>
      </div>
    </div>
    <div class="chat-input" id="chat-input-area" style="display:none;">
      <span id="chat-anexo-slot"></span>
      <textarea id="chat-input" placeholder="Digite sua mensagem…" rows="1"></textarea>
      <button class="chat-send-btn" id="chat-send-btn" onclick="window.__chatFab.enviar()">➤</button>
    </div>
    <div id="chat-anexo-preview"></div>
  `;
  document.body.appendChild(win);

  // Anexo pendente
  let anexoPendente = null;

  // Carrega uploader e injeta botão
  carregarUploader().then(() => {
    if (window.ChatUploader) {
      const slot = document.getElementById('chat-anexo-slot');
      const btn = window.ChatUploader.criarBotaoAnexo((file) => {
        anexoPendente = file;
        // Mostra preview embaixo do input
        const prev = document.getElementById('chat-anexo-preview');
        prev.innerHTML = `
          <div class="chat-anexo-preview">
            <span>📎 ${escapeHtml(file.name)} <small>(${window.ChatUploader.formatarTamanho(file.size)})</small></span>
            <button onclick="window.__chatFab.cancelarAnexo()">remover</button>
          </div>`;
      });
      slot.appendChild(btn);
    }
  });

  // Expor API global pros handlers inline
  window.__chatFab = {
    enviar: enviarMensagem,
    selecionar: selecionarCandidatura,
    cancelarAnexo: () => {
      anexoPendente = null;
      document.getElementById('chat-anexo-preview').innerHTML = '';
    }
  };

  // === Lógica ===

  function toggleChat() {
    aberto = !aberto;
    win.classList.toggle('aberto', aberto);
    if (aberto && conversaAtiva === null && conversas.length > 0) {
      selecionarCandidatura(conversas[0].id);
    }
    if (aberto) {
      // Marca como lida
      ultimaMensagemId[conversaAtiva] = mensagensCache[conversaAtiva]?.length || 0;
      atualizarBadge();
    }
  }

  async function carregarCandidaturas() {
    try {
      // Admin: usa rota que retorna TODAS as conversas (candidatos com msg)
      const r = await fetch(API + '/api/admin/conversas', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (r.status === 401) return; // deslogado
      const j = await r.json();
      conversas = j.conversas || [];

      // Se não tem nenhuma conversa → some
      if (conversas.length === 0 && !idUrlInt) {
        fab.style.display = 'none';
        win.classList.remove('aberto');
        return;
      }
      fab.style.display = 'flex';

      // Se tem ?id= na URL, já abre essa
      if (idUrlInt && !conversaAtiva) {
        conversaAtiva = idUrlInt;
      }

      // Renderiza abas (mostra "Nome Candidato - Vaga")
      const tabs = document.getElementById('chat-vagas');
      if (conversas.length === 0) {
        tabs.style.display = 'none';
      } else {
        tabs.style.display = 'flex';
        tabs.innerHTML = conversas.map(c => {
          const ativa = c.candidatura_id === conversaAtiva;
          const naoLidas = c.nao_lidas_admin > 0 ? `<span class="chat-nao-lida">${c.nao_lidas_admin}</span>` : '';
          return `<button class="chat-vaga-tab ${ativa ? 'ativa' : ''}" onclick="window.__chatFab.selecionar(${c.candidatura_id})" title="${escapeHtml(c.candidato_nome)} - ${escapeHtml(c.vaga_titulo)}">${escapeHtml((c.candidato_nome || '?').split(' ')[0])} ${naoLidas}</button>`;
        }).join('');
      }

      // Se a conversa ativa não tá mais disponível, troca pra primeira
      if (!conversas.find(c => c.candidatura_id === conversaAtiva)) {
        conversaAtiva = conversas[0] ? conversas[0].candidatura_id : idUrlInt;
        if (conversaAtiva) carregarMensagens(conversaAtiva);
      }
    } catch (e) {
      console.error('[chatfab-admin] carregarCandidaturas', e);
    }
  }

  function selecionarCandidatura(cid) {
    conversaAtiva = cid;
    // Atualiza abas
    document.querySelectorAll('.chat-vaga-tab').forEach(t => t.classList.remove('ativa'));
    document.querySelectorAll('.chat-vaga-tab')[
      Array.from(document.querySelectorAll('.chat-vaga-tab')).findIndex(t => t.textContent.trim() === (conversas.find(c => c.candidatura_id === cid)?.candidato_nome || ''))
    ]?.classList.add('ativa');
    carregarMensagens(cid);
  }

  async function carregarMensagens(cid) {
    try {
      const r = await fetch(API + '/api/chat/' + cid + '/mensagens', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) return;
      const j = await r.json();
      mensagensCache[cid] = j.mensagens || [];
      // Detecta não lidas: se tem msg nova do admin e chat não tá aberto nessa conversa
      const ultima = mensagensCache[cid].length > 0 ? mensagensCache[cid][mensagensCache[cid].length - 1] : null;
      if (ultima && ultima.autor_tipo === 'admin') {
        if (!aberto || conversaAtiva !== cid) {
          ultimaMensagemId[cid] = (ultimaMensagemId[cid] || 0);
        } else {
          ultimaMensagemId[cid] = mensagensCache[cid].length;
        }
      }
      if (cid === conversaAtiva) renderMensagens();
      atualizarBadge();
    } catch (e) {
      console.error('[chatfab] carregarMensagens', e);
    }
  }

  function renderMensagens() {
    const area = document.getElementById('chat-msg-area');
    const input = document.getElementById('chat-input-area');
    const msgs = mensagensCache[conversaAtiva] || [];
    if (msgs.length === 0) {
      area.innerHTML = `<div class="chat-vazio"><div class="icon">💬</div><p>Nenhuma mensagem ainda. Manda oi pro recrutador!</p></div>`;
      input.style.display = 'flex';
      return;
    }
    input.style.display = 'flex';
    area.innerHTML = msgs.map(m => {
      const minha = m.autor_tipo === 'candidato';
      const iniciais = (m.autor_nome || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
      const dataFmt = new Date(m.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const arqs = (m.arquivos || []).map(a => window.ChatUploader ? window.ChatUploader.renderAnexo(a) : `📎 ${a.nome_original}`).join('');
      return `<div class="chat-msg ${minha ? 'minha' : m.autor_tipo}">
        <div class="chat-msg-av ${m.autor_tipo}">${iniciais}</div>
        <div class="chat-msg-balao">
          <div class="chat-msg-conteudo">${escapeHtml(m.texto || '')}${arqs}</div>
          <div class="chat-msg-meta">${escapeHtml(m.autor_nome || '')} • ${dataFmt}</div>
        </div>
      </div>`;
    }).join('');
    area.scrollTop = area.scrollHeight;
  }

  async function enviarMensagem() {
    const ta = document.getElementById('chat-input');
    const texto = ta.value.trim();
    if (!texto && !anexoPendente) return;
    if (!conversaAtiva) return;
    const btn = document.getElementById('chat-send-btn');
    btn.disabled = true;
    try {
      let endpoint = API + '/api/chat/' + conversaAtiva + '/mensagens';
      let body;
      let headers = { 'Authorization': 'Bearer ' + token };

      if (anexoPendente) {
        endpoint = API + '/api/chat/' + conversaAtiva + '/upload';
        const base64 = await window.ChatUploader.lerComoBase64(anexoPendente);
        body = {
          texto: texto || null,
          arquivo: {
            nome: anexoPendente.name,
            mime: anexoPendente.type,
            base64
          }
        };
        headers['Content-Type'] = 'application/json';
      } else {
        body = { texto };
        headers['Content-Type'] = 'application/json';
      }

      const r = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.erro || 'Falha ao enviar');
      }
      ta.value = '';
      anexoPendente = null;
      document.getElementById('chat-anexo-preview').innerHTML = '';
      await carregarMensagens(conversaAtiva);
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    } finally {
      btn.disabled = false;
      ta.focus();
    }
  }

  function atualizarBadge() {
    let total = 0;
    conversas.forEach(c => {
      const msgs = mensagensCache[c.candidatura_id] || [];
      if (msgs.length > 0) {
        const ultima = msgs[msgs.length - 1];
        if (ultima.autor_tipo === 'admin' && (ultimaMensagemId[c.candidatura_id] || 0) < msgs.length) {
          // chat tá aberto e olhando outra vaga OU chat tá fechado
          if (!aberto || conversaAtiva !== c.candidatura_id) total += msgs.length - (ultimaMensagemId[c.candidatura_id] || 0);
        }
      }
    });
    const badge = document.getElementById('chatfab-badge');
    if (total > 0) {
      badge.style.display = 'flex';
      badge.textContent = total > 9 ? '9+' : total;
    } else {
      badge.style.display = 'none';
    }
  }

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  // === INIT ===
  // Enter pra enviar
  document.body.addEventListener('keydown', (e) => {
    if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  });

  carregarCandidaturas();
  // Recarrega conversas a cada 30s (pode entrar/sair do filtro)
  setInterval(carregarCandidaturas, 30000);
  // Polling de mensagens a cada 15s
  setInterval(() => {
    conversas.forEach(c => carregarMensagens(c.candidatura_id));
  }, 15000);
})();
