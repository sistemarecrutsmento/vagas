// ============================================
// CHAT FLUTUANTE - CANDIDATO ↔ ADMIN (jul/2026)
// Bolinha tipo WhatsApp Web, abre 1 conversa por vaga
// Aparece SÓ se candidato foi APROVADO NA TRIAGEM (etapa >= 3)
// Some quando processo encerra (rejeitado/reprovado/contratado)
// ============================================

(function() {
  'use strict';

  // Não carrega se não tiver login
  const token = localStorage.getItem('candidato_token');
  if (!token) return;

  const API = 'https://recrutamento-api.onrender.com';
  let candidaturas = [];      // candidaturas com chat ativo
  let candidaturaAtiva = null; // ID da vaga selecionada no momento
  let mensagensCache = {};     // mensagens por candidatura_id
  let ultimaMensagemId = {};   // pra detectar não lidas
  let pollInterval = null;
  let aberto = false;

  // === Estilos injetados ===
  const style = document.createElement('style');
  style.textContent = `
    .chatfab { position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 60px; height: 60px; border-radius: 50%; background: #722F37;
      color: white; border: none; box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      cursor: pointer; font-size: 28px; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    .chatfab:hover { transform: scale(1.08); background: #8a3a44; }
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
    .chat-head { background: linear-gradient(135deg, #722F37 0%, #8a3a44 100%); color: white;
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
    .chat-vaga-tab.ativa { background: #722F37; color: white; border-color: #722F37; }
    .chat-vaga-tab .badge { background: #ef4444; color: white; border-radius: 10px;
      padding: 1px 6px; font-size: 10px; margin-left: 4px; }
    .chat-msg-area { flex: 1; overflow-y: auto; padding: 12px; background: #fafafa; min-height: 0; }
    .chat-msg { display: flex; margin-bottom: 10px; }
    .chat-msg.minha { flex-direction: row-reverse; }
    .chat-msg-av { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
    .chat-msg-av.candidato { background: #C9A961; color: #1a1a1a; }
    .chat-msg-av.admin { background: #722F37; }
    .chat-msg-balao { max-width: 70%; margin: 0 8px; }
    .chat-msg-conteudo { padding: 8px 12px; border-radius: 14px; font-size: 13px;
      line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; }
    .chat-msg.candidato .chat-msg-conteudo { background: white; border: 1px solid #e5e0d8; }
    .chat-msg.admin .chat-msg-conteudo { background: #722F37; color: white; }
    .chat-msg-meta { font-size: 10px; color: #888; margin-top: 3px; }
    .chat-msg.minha .chat-msg-meta { text-align: right; }
    .chat-vazio { text-align: center; color: #888; padding: 40px 20px; }
    .chat-vazio .icon { font-size: 40px; margin-bottom: 10px; opacity: 0.4; }
    .chat-input { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid #e5e0d8;
      background: white; align-items: flex-end; flex-shrink: 0; }
    .chat-input textarea { flex: 1; resize: none; border: 1px solid #e5e0d8; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; font-family: inherit; max-height: 80px; min-height: 36px; }
    .chat-input textarea:focus { outline: none; border-color: #722F37; }
    .chat-send-btn { background: #722F37; color: white; border: 0; width: 36px; height: 36px;
      border-radius: 8px; font-size: 16px; cursor: pointer; flex-shrink: 0; }
    .chat-send-btn:hover:not(:disabled) { background: #8a3a44; }
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

  // Uploader já vem no <head> via tag <script>, só aguarda carregar
  function carregarUploader() {
    return new Promise(resolve => {
      if (window.ChatUploader) return resolve();
      // Aguarda até 2s o uploader carregar
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
        <h3 id="chat-head-titulo">💬 Mensagens</h3>
        <p id="chat-head-sub">Com o recrutador</p>
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
    if (aberto && candidaturaAtiva === null && candidaturas.length > 0) {
      selecionarCandidatura(candidaturas[0].id);
    }
    if (aberto) {
      // Marca como lida
      ultimaMensagemId[candidaturaAtiva] = mensagensCache[candidaturaAtiva]?.length || 0;
      atualizarBadge();
    }
  }

  async function carregarCandidaturas() {
    try {
      const r = await fetch(API + '/api/candidato/candidaturas', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (r.status === 401) return; // deslogado
      const j = await r.json();
      const todas = j.candidaturas || [];

      // FILTRO: só aparece se:
      // - etapa_atual >= 3 (após triagem)
      // - status não é finalizado (rejeitado/reprovado/contratado)
      candidaturas = todas.filter(c => {
        if (c.status === 'rejeitado' || c.status === 'reprovado' || c.status === 'contratado') return false;
        return (c.etapa_atual || 1) >= 3;
      });

      // Se era pra mostrar mas não tem mais nenhuma → some
      if (candidaturas.length === 0) {
        fab.style.display = 'none';
        win.classList.remove('aberto');
        return;
      }
      fab.style.display = 'flex';

      // Renderiza abas
      const tabs = document.getElementById('chat-vagas');
      if (candidaturas.length === 1) {
        tabs.style.display = 'none';
      } else {
        tabs.style.display = 'flex';
        tabs.innerHTML = candidaturas.map(c =>
          `<button class="chat-vaga-tab ${c.id === candidaturaAtiva ? 'ativa' : ''}" onclick="window.__chatFab.selecionar(${c.id})">${escapeHtml(c.titulo || c.empresa || 'Vaga')}</button>`
        ).join('');
      }

      // Se a candidatura ativa não tá mais disponível, troca pra primeira
      if (!candidaturas.find(c => c.id === candidaturaAtiva)) {
        candidaturaAtiva = candidaturas[0].id;
        carregarMensagens(candidaturaAtiva);
      }
    } catch (e) {
      console.error('[chatfab] carregarCandidaturas', e);
    }
  }

  function selecionarCandidatura(cid) {
    candidaturaAtiva = cid;
    // Atualiza abas
    document.querySelectorAll('.chat-vaga-tab').forEach(t => t.classList.remove('ativa'));
    document.querySelectorAll('.chat-vaga-tab')[
      Array.from(document.querySelectorAll('.chat-vaga-tab')).findIndex(t => t.textContent.trim() === (candidaturas.find(c => c.id === cid)?.titulo || ''))
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
        if (!aberto || candidaturaAtiva !== cid) {
          ultimaMensagemId[cid] = (ultimaMensagemId[cid] || 0);
        } else {
          ultimaMensagemId[cid] = mensagensCache[cid].length;
        }
      }
      if (cid === candidaturaAtiva) renderMensagens();
      atualizarBadge();
    } catch (e) {
      console.error('[chatfab] carregarMensagens', e);
    }
  }

  function renderMensagens() {
    const area = document.getElementById('chat-msg-area');
    const input = document.getElementById('chat-input-area');
    const msgs = mensagensCache[candidaturaAtiva] || [];
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
    if (!candidaturaAtiva) return;
    const btn = document.getElementById('chat-send-btn');
    btn.disabled = true;
    try {
      let endpoint = API + '/api/chat/' + candidaturaAtiva + '/mensagens';
      let body;
      let headers = { 'Authorization': 'Bearer ' + token };

      if (anexoPendente) {
        endpoint = API + '/api/chat/' + candidaturaAtiva + '/upload';
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
      await carregarMensagens(candidaturaAtiva);
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    } finally {
      btn.disabled = false;
      ta.focus();
    }
  }

  function atualizarBadge() {
    let total = 0;
    candidaturas.forEach(c => {
      const msgs = mensagensCache[c.id] || [];
      if (msgs.length > 0) {
        const ultima = msgs[msgs.length - 1];
        if (ultima.autor_tipo === 'admin' && (ultimaMensagemId[c.id] || 0) < msgs.length) {
          // chat tá aberto e olhando outra vaga OU chat tá fechado
          if (!aberto || candidaturaAtiva !== c.id) total += msgs.length - (ultimaMensagemId[c.id] || 0);
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
  // Recarrega candidaturas a cada 30s (pode entrar/sair do filtro)
  setInterval(carregarCandidaturas, 30000);
  // Polling de mensagens a cada 15s
  setInterval(() => {
    candidaturas.forEach(c => carregarMensagens(c.id));
  }, 15000);
})();
