// ============================================
// CHAT FLUTUANTE - ADMIN x EMPRESA (jul/2026)
// Bolinha AZUL (#1A4D7A), canto inferior direito,
// acima da lista de bolinhas dos candidatos.
// Chat contextual: SÓ aparece no analisar.html?id=X
// ============================================

(function() {
  'use strict';

  // === 1. Token e URL ===
  const token = localStorage.getItem('admin_token') || localStorage.getItem('recrutador_token');
  if (!token) return;

  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id');
  const idUrlInt = idUrl ? parseInt(idUrl) : null;
  if (!idUrlInt) return;

  const API = 'https://recrutamento-api-novo.onrender.com';

  // === 2. Estado ===
  let aberto = false;
  let mensagensCache = [];

  // === 3. CSS injetado (simples, sem bugs) ===
  const style = document.createElement('style');
  style.textContent = `
    .chatfab-empresa-btn {
      position: fixed !important;
      right: 20px !important;
      bottom: 88px !important;
      z-index: 10000 !important;
      width: 56px !important;
      height: 56px !important;
      border-radius: 50%;
      background: linear-gradient(135deg, #1A4D7A 0%, #2E6BA8 100%);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      cursor: pointer;
      display: flex !important;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      z-index: 9999;
      transition: transform .15s;
    }
    .chatfab-empresa-btn:hover { transform: scale(1.08); }
    .chatfab-empresa-btn.active {
      border-color: #1A4D7A;
      box-shadow: 0 0 0 3px rgba(26,77,122,.4), 0 4px 12px rgba(0,0,0,.3);
    }
    .chatfab-empresa-btn .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #dc2626;
      color: white;
      border-radius: 999px;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid white;
    }

    .chatfab-empresa-window {
      position: fixed !important;
      right: 20px !important;
      bottom: 160px !important;
      z-index: 10000 !important;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 420px;
      max-height: calc(100vh - 200px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.3);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 9998;
    }
    .chatfab-empresa-window.open {
      display: flex !important;
    }
    .chatfab-empresa-head {
      background: linear-gradient(135deg, #1A4D7A 0%, #2E6BA8 100%);
      color: white;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .chatfab-empresa-head h3 { margin: 0; font-size: 15px; font-weight: 700; }
    .chatfab-empresa-head p { margin: 0; font-size: 11px; opacity: .9; }
    .chatfab-empresa-head-close {
      background: rgba(255,255,255,.15);
      border: 0;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
    }
    .chatfab-empresa-head-close:hover { background: rgba(255,255,255,.25); }
    .chatfab-empresa-msg-area {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background: #F0F7FF;
      min-height: 0;
    }
    .chatfab-empresa-msg {
      display: flex;
      margin-bottom: 10px;
    }
    .chatfab-empresa-msg.mine { flex-direction: row-reverse; }
    .chatfab-empresa-msg-av {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: white;
    }
    .chatfab-empresa-msg-av.empresa { background: #1A4D7A; }
    .chatfab-empresa-msg-av.rh { background: #6B0F1A; }
    .chatfab-empresa-msg-balao { max-width: 70%; margin: 0 8px; }
    .chatfab-empresa-msg-conteudo {
      padding: 8px 12px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.4;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .chatfab-empresa-msg.empresa .chatfab-empresa-msg-conteudo {
      background: white;
      border: 1px solid #D6E4F2;
    }
    .chatfab-empresa-msg.rh .chatfab-empresa-msg-conteudo {
      background: #1A4D7A;
      color: white;
    }
    .chatfab-empresa-msg-meta { font-size: 10px; color: #888; margin-top: 3px; }
    .chatfab-empresa-msg.mine .chatfab-empresa-msg-meta { text-align: right; }
    .chatfab-empresa-empty {
      text-align: center;
      color: #6B7C8C;
      padding: 40px 20px;
    }
    .chatfab-empresa-empty .icon { font-size: 40px; margin-bottom: 10px; opacity: .4; }
    .chatfab-empresa-input {
      display: flex;
      gap: 6px;
      padding: 10px 12px;
      border-top: 1px solid #D6E4F2;
      background: white;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .chatfab-empresa-input textarea {
      flex: 1;
      resize: none;
      border: 1px solid #D6E4F2;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      font-family: inherit;
      max-height: 80px;
      min-height: 36px;
      outline: none;
    }
    .chatfab-empresa-input textarea:focus { border-color: #1A4D7A; }
    .chatfab-empresa-send {
      background: #1A4D7A;
      color: white;
      border: 0;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .chatfab-empresa-send:hover:not(:disabled) { background: #15416A; }
    .chatfab-empresa-send:disabled { opacity: .5; cursor: not-allowed; }

    @media (max-width: 480px) {
      .chatfab-empresa-window {
        right: 0 !important;
        left: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
      }
      .chatfab-empresa-btn { right: 16px !important; bottom: 88px !important; }
      .chatfab-empresa-window .chatfab-empresa-header { border-radius: 0 !important; }
    }
  `;
  document.head.appendChild(style);

  // === 4. Criar bolinha ===
  const btn = document.createElement('button');
  btn.className = 'chatfab-empresa-btn';
  btn.id = 'chatfab-empresa-btn';
  btn.type = 'button';
  btn.title = 'Chat com a Empresa';
  btn.innerHTML = '🏢';
  document.body.appendChild(btn);

  // === 5. Criar janela ===
  const win = document.createElement('div');
  win.className = 'chatfab-empresa-window';
  win.id = 'chatfab-empresa-window';
  win.innerHTML = `
    <div class="chatfab-empresa-head">
      <div style="flex:1">
        <h3>🏢 Chat com a Empresa</h3>
        <p id="chatfab-empresa-sub">Empresa responsável por esta vaga</p>
      </div>
      <button type="button" class="chatfab-empresa-head-close" id="chatfab-empresa-close">×</button>
    </div>
    <div class="chatfab-empresa-msg-area" id="chatfab-empresa-msg-area">
      <div class="chatfab-empresa-empty">
        <div class="icon">🏢</div>
        <p>Carregando conversa...</p>
      </div>
    </div>
    <div class="chatfab-empresa-input">
      <textarea id="chatfab-empresa-input" placeholder="Mensagem para a empresa…" rows="1"></textarea>
      <button type="button" class="chatfab-empresa-send" id="chatfab-empresa-send">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  // === 6. Helpers ===
  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  function abrir() {
    if (aberto) return;
    aberto = true;
    btn.classList.add('active');
    win.classList.add('open');
    carregarMensagens();
    const ta = document.getElementById('chatfab-empresa-input');
    if (ta) setTimeout(() => ta.focus(), 100);
  }

  function fecharJanela() {
    aberto = false;
    btn.classList.remove('active');
    win.classList.remove('open');
  }

  function toggle() {
    if (aberto) fecharJanela();
    else abrir();
  }

  // === 7. Render ===
  function renderMensagens() {
    const area = document.getElementById('chatfab-empresa-msg-area');
    if (!area) return;
    if (mensagensCache.length === 0) {
      area.innerHTML = `
        <div class="chatfab-empresa-empty">
          <div class="icon">🏢</div>
          <p>Nenhuma mensagem ainda. Inicie a conversa com a empresa!</p>
        </div>`;
      return;
    }
    area.innerHTML = mensagensCache.map(m => {
      const mine = m.remetente_tipo === 'rh';
      const tipo = m.remetente_tipo === 'rh' ? 'rh' : 'empresa';
      const iniciais = (m.remetente_nome || (tipo === 'rh' ? 'RH' : 'Empresa'))
        .split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
      let dataFmt = '';
      try {
        dataFmt = new Date(m.criado_em).toLocaleString('pt-BR', {
          day: '2-digit', month: 'short',
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) { dataFmt = ''; }
      return `<div class="chatfab-empresa-msg ${mine ? 'mine' : tipo}">
        <div class="chatfab-empresa-msg-av ${tipo}">${escapeHtml(iniciais)}</div>
        <div class="chatfab-empresa-msg-balao">
          <div class="chatfab-empresa-msg-conteudo">${escapeHtml(m.mensagem || '')}</div>
          <div class="chatfab-empresa-msg-meta">${escapeHtml(m.remetente_nome || (tipo === 'rh' ? 'RH' : 'Empresa'))} • ${escapeHtml(dataFmt)}</div>
        </div>
      </div>`;
    }).join('');
    area.scrollTop = area.scrollHeight;
  }

  // === 8. API ===
  async function carregarMensagens() {
    try {
      const r = await fetch(API + '/api/admin/candidatura/' + idUrlInt + '/chat-empresa', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) {
        console.error('[chatfab-empresa] API', r.status);
        if (r.status === 404) {
          btn.style.display = 'none';
        }
        return;
      }
      const j = await r.json();
      mensagensCache = j.mensagens || [];

      // Atualiza subtítulo se primeira msg da empresa tem nome
      const primeiraEmpresa = mensagensCache.find(m => m.remetente_tipo === 'empresa' && m.remetente_nome);
      if (primeiraEmpresa) {
        const sub = document.getElementById('chatfab-empresa-sub');
        if (sub) sub.textContent = primeiraEmpresa.remetente_nome;
      }

      if (aberto) renderMensagens();
    } catch (e) {
      console.error('[chatfab-empresa] err', e);
    }
  }

  async function enviarMensagem() {
    const ta = document.getElementById('chatfab-empresa-input');
    const texto = (ta && ta.value || '').trim();
    if (!texto) return;
    const btnSend = document.getElementById('chatfab-empresa-send');
    if (btnSend) btnSend.disabled = true;
    try {
      const r = await fetch(API + '/api/admin/candidatura/' + idUrlInt + '/chat-empresa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ mensagem: texto })
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert('Erro ao enviar: ' + (j.erro || 'Falha ao enviar mensagem'));
        return;
      }
      ta.value = '';
      await carregarMensagens();
      if (aberto) renderMensagens();
    } catch (e) {
      alert('Erro: ' + e.message);
    } finally {
      if (btnSend) btnSend.disabled = false;
      if (ta) ta.focus();
    }
  }

  // === 9. Eventos ===
  btn.addEventListener('click', toggle);
  document.getElementById('chatfab-empresa-close').addEventListener('click', fecharJanela);
  document.getElementById('chatfab-empresa-send').addEventListener('click', enviarMensagem);
  const taEl = document.getElementById('chatfab-empresa-input');
  if (taEl) {
    taEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }

  // === 10. Init: carrega mensagens uma vez ===
  carregarMensagens();

  // Polling de 15s pra badge/atualização (só recarrega se não estiver aberto, pra não perder o scroll)
  setInterval(() => {
    if (!aberto) carregarMensagens();
  }, 15000);
})();
