// ============================================
// CHAT FLUTUANTE - ADMIN x EMPRESA (jul/2026)
// Bolinha AZUL (#1A4D7A), mesmo tamanho/estilo do candidato,
// posicionada ACIMA da lista de candidatos (alinhada à direita)
// Chat contextual: SÓ aparece no analisar.html? id=X
// ============================================

(function() {
  'use strict';

  const token = localStorage.getItem('admin_token') || localStorage.getItem('recrutador_token');
  if (!token) return;

  const API = 'https://recrutamento-api.onrender.com';
  let conversaAtiva = null;
  let mensagensCache = {};
  let ultimaMensagemId = {};
  let aberto = false;

  // Só roda se tiver ?id=XX na URL (analisar.html?id=X)
  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id');
  const idUrlInt = idUrl ? parseInt(idUrl) : null;
  if (!idUrlInt) {
    console.log('[chatfab-empresa] sem ?id= na URL — não carrega');
    return;
  }

  console.log('[chatfab-empresa] init', { idUrl, idUrlInt });

  // === Estilos injetados ===
  // MESMO padrão visual do .chatfab-candidato, só mudando cor (azul em vez de dourado)
  // e usando position: fixed pra controlar empilhamento acima da lista
  const style = document.createElement('style');
  style.textContent = `
    /* Bolinha do chat empresa - IGUAL à chatfab-candidato (56x56, border 3px branco) */
    .chatfab-empresa-btn {
      position: fixed; right: 20px; z-index: 9999;
      box-sizing: border-box; width: 56px !important; height: 56px !important;
      min-width: 56px; min-height: 56px; max-width: 56px; max-height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1A4D7A 0%, #2E6BA8 100%);
      border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s;
      color: white; font-size: 24px;
    }
    .chatfab-empresa-btn:hover { transform: scale(1.08); }
    .chatfab-empresa-btn.aberta {
      border-color: #1A4D7A;
      box-shadow: 0 0 0 3px rgba(26,77,122,0.4), 0 4px 12px rgba(0,0,0,0.3);
    }

    /* Badge (mesma posição da .chatfab-candidato .chatfab-badge) */
    .chatfab-empresa-btn .chatfab-badge {
      position: absolute; top: -4px; right: -4px;
      background: #dc2626; color: white; border-radius: 999px;
      min-width: 22px; height: 22px; padding: 0 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      border: 2px solid white;
    }

    /* Janela do chat empresa - mesma largura/visual, cor azul */
    .chatfab-empresa-window {
      position: fixed; right: 20px; z-index: 9998;
      width: 380px; max-width: calc(100vw - 32px); height: 540px;
      max-height: calc(100vh - 130px);
      background: white; border-radius: 16px;
      box-shadow: 0 12px 40px rgba(26,77,122,0.25);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .chatfab-empresa-window.aberto {
      display: flex; animation: chatfabPop 0.2s ease-out;
    }
    @keyframes chatfabPop {
      from { transform: scale(0.9); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .chatfab-empresa-head {
      background: linear-gradient(135deg, #1A4D7A 0%, #2E6BA8 100%);
      color: white;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    .chatfab-empresa-head h3 { margin: 0; font-size: 15px; font-weight: 700; }
    .chatfab-empresa-head p { margin: 0; font-size: 11px; opacity: 0.9; }
    .chatfab-empresa-head-fechar {
      background: rgba(255,255,255,0.15); border: 0; color: white;
      width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
      font-size: 18px;
    }
    .chatfab-empresa-head-fechar:hover { background: rgba(255,255,255,0.25); }

    .chatfab-empresa-msg-area {
      flex: 1; overflow-y: auto; padding: 12px;
      background: #F0F7FF; min-height: 0;
    }
    .chatfab-empresa-msg {
      display: flex; margin-bottom: 10px;
    }
    .chatfab-empresa-msg.minha { flex-direction: row-reverse; }
    .chatfab-empresa-msg-av {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: white;
    }
    .chatfab-empresa-msg-av.empresa { background: #1A4D7A; }
    .chatfab-empresa-msg-av.rh { background: #6B0F1A; }
    .chatfab-empresa-msg-balao { max-width: 70%; margin: 0 8px; }
    .chatfab-empresa-msg-conteudo {
      padding: 8px 12px; border-radius: 14px; font-size: 13px;
      line-height: 1.4; word-wrap: break-word; white-space: pre-wrap;
    }
    .chatfab-empresa-msg.empresa .chatfab-empresa-msg-conteudo {
      background: white; border: 1px solid #D6E4F2;
    }
    .chatfab-empresa-msg.rh .chatfab-empresa-msg-conteudo {
      background: #1A4D7A; color: white;
    }
    .chatfab-empresa-msg-meta { font-size: 10px; color: #888; margin-top: 3px; }
    .chatfab-empresa-msg.minha .chatfab-empresa-msg-meta { text-align: right; }

    .chatfab-empresa-vazio {
      text-align: center; color: #6B7C8C; padding: 40px 20px;
    }
    .chatfab-empresa-vazio .icon { font-size: 40px; margin-bottom: 10px; opacity: 0.4; }

    .chatfab-empresa-input {
      display: flex; gap: 6px; padding: 10px 12px;
      border-top: 1px solid #D6E4F2; background: white;
      align-items: flex-end; flex-shrink: 0;
    }
    .chatfab-empresa-input textarea {
      flex: 1; resize: none; border: 1px solid #D6E4F2; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; font-family: inherit;
      max-height: 80px; min-height: 36px;
    }
    .chatfab-empresa-input textarea:focus {
      outline: none; border-color: #1A4D7A;
    }
    .chatfab-empresa-send {
      background: #1A4D7A; color: white; border: 0;
      width: 36px; height: 36px; border-radius: 8px;
      font-size: 16px; cursor: pointer; flex-shrink: 0;
    }
    .chatfab-empresa-send:hover:not(:disabled) { background: #15416A; }
    .chatfab-empresa-send:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Mobile */
    @media (max-width: 480px) {
      .chatfab-empresa-window { right: 8px; left: 8px; width: auto; }
      .chatfab-empresa-btn { right: 20px; }
    }
  `;
  document.head.appendChild(style);

  // === HTML: bolinha + janela ===
  const btn = document.createElement('button');
  btn.className = 'chatfab-empresa-btn';
  btn.id = 'chatfab-empresa-btn';
  btn.title = 'Chat com a Empresa';
  btn.innerHTML = '🏢';
  document.body.appendChild(btn);

  const win = document.createElement('div');
  win.className = 'chatfab-empresa-window';
  win.id = 'chatfab-empresa-window';
  win.innerHTML = `
    <div class="chatfab-empresa-head">
      <div style="flex:1">
        <h3>🏢 Chat com a Empresa</h3>
        <p id="chatfab-empresa-sub">Empresa responsável por esta vaga</p>
      </div>
      <button class="chatfab-empresa-head-fechar" onclick="window.__chatFabEmpresa.fechar()">×</button>
    </div>
    <div class="chatfab-empresa-msg-area" id="chatfab-empresa-msg-area">
      <div class="chatfab-empresa-vazio">
        <div class="icon">🏢</div>
        <p>Carregando conversa com a empresa...</p>
      </div>
    </div>
    <div class="chatfab-empresa-input" id="chatfab-empresa-input-area">
      <textarea id="chatfab-empresa-input" placeholder="Mensagem para a empresa…" rows="1"></textarea>
      <button class="chatfab-empresa-send" onclick="window.__chatFabEmpresa.enviar()">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  // === API global ===
  window.__chatFabEmpresa = {
    enviar: enviarMensagem,
    fechar: fecharJanela
  };

  // === POSICIONAMENTO DINÂMICO ===
  // A bolinha azul precisa ficar ACIMA da lista de candidatos (#chatfab-container)
  // e a janela azul ACIMA da janela do candidato (.chat-window)
  // Estratégia: mede a posição real via getBoundingClientRect a cada redraw

  function posicionar() {
    const fabContainer = document.getElementById('chatfab-container');
    if (fabContainer) {
      const rect = fabContainer.getBoundingClientRect();
      // Usa a borda da própria bolinha do candidato, não a largura do container.
      // Isso garante uma única reta vertical mesmo no celular.
      const candidato = fabContainer.querySelector('.chatfab-candidato');
      const eixoDireito = candidato ? candidato.getBoundingClientRect().right : rect.right;
      btn.style.right = (window.innerWidth - eixoDireito) + 'px';
      const gap = 16;
      const bottomBolinha = (window.innerHeight - rect.top) + gap;
      btn.style.bottom = bottomBolinha + 'px';
    } else {
      btn.style.bottom = '88px';
    }

    const chatWin = document.querySelector('.chat-window');
    if (chatWin) {
      const rect = chatWin.getBoundingClientRect();
      // Mesmo eixo vertical das bolinhas (reforço do alinhamento)
      win.style.right = btn.style.right;
      const bottomJanela = (window.innerHeight - rect.top) + 16;
      win.style.bottom = bottomJanela + 'px';
    } else {
      const btnRect = btn.getBoundingClientRect();
      const bottomJanela = (window.innerHeight - btnRect.top) + 16;
      win.style.bottom = bottomJanela + 'px';
    }
  }

  // Posiciona inicial e em resize
  posicionar();
  window.addEventListener('resize', posicionar);

  // Re-medir a cada 2s (caso a lista de candidatos mude de altura ao longo do uso)
  setInterval(posicionar, 2000);

  // === Lógica ===

  function abrir() {
    if (aberto) return;
    aberto = true;
    conversaAtiva = idUrlInt;
    btn.classList.add('aberta');
    win.classList.add('aberto');
    carregarMensagens();
    posicionar();
  }

  function fecharJanela() {
    aberto = false;
    btn.classList.remove('aberta');
    win.classList.remove('aberto');
  }

  function toggle() {
    if (aberto) fecharJanela(); else abrir();
  }

  async function carregarMensagens() {
    try {
      const r = await fetch(API + '/api/admin/candidatura/' + idUrlInt + '/chat-empresa', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) {
        btn.style.display = 'none';
        return;
      }
      const j = await r.json();
      const msgs = j.mensagens || [];
      mensagensCache[idUrlInt] = msgs;

      const primeiraComNome = msgs.find(m => m.remetente_nome && m.remetente_tipo === 'empresa');
      if (primeiraComNome) {
        const sub = document.getElementById('chatfab-empresa-sub');
        if (sub) sub.textContent = primeiraComNome.remetente_nome;
      }

      if (aberto) renderMensagens();
      atualizarBadge();
    } catch (e) {
      console.error('[chatfab-empresa] carregarMensagens', e);
    }
  }

  function renderMensagens() {
    const area = document.getElementById('chatfab-empresa-msg-area');
    const input = document.getElementById('chatfab-empresa-input-area');
    const msgs = mensagensCache[idUrlInt] || [];

    if (msgs.length === 0) {
      area.innerHTML = `<div class="chatfab-empresa-vazio">
        <div class="icon">🏢</div>
        <p>Nenhuma mensagem ainda. Inicie a conversa com a empresa!</p>
      </div>`;
      input.style.display = 'flex';
      return;
    }
    input.style.display = 'flex';
    area.innerHTML = msgs.map(m => {
      const minha = m.remetente_tipo === 'rh';
      const tipo = m.remetente_tipo === 'rh' ? 'rh' : 'empresa';
      const iniciais = (m.remetente_nome || (tipo === 'rh' ? 'RH' : 'Empresa'))
        .split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
      const d = new Date(m.criado_em);
      const dataFmt = d.toLocaleString('pt-BR', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit'
      });
      return `<div class="chatfab-empresa-msg ${minha ? 'minha' : tipo}">
        <div class="chatfab-empresa-msg-av ${tipo}">${iniciais}</div>
        <div class="chatfab-empresa-msg-balao">
          <div class="chatfab-empresa-msg-conteudo">${escapeHtml(m.mensagem || '')}</div>
          <div class="chatfab-empresa-msg-meta">${escapeHtml(m.remetente_nome || (tipo === 'rh' ? 'RH' : 'Empresa'))} • ${dataFmt}</div>
        </div>
      </div>`;
    }).join('');
    area.scrollTop = area.scrollHeight;
  }

  async function enviarMensagem() {
    const ta = document.getElementById('chatfab-empresa-input');
    const texto = ta.value.trim();
    if (!texto) return;
    const btnSend = document.querySelector('.chatfab-empresa-send');
    btnSend.disabled = true;
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
        throw new Error(j.erro || 'Falha ao enviar');
      }
      ta.value = '';
      await carregarMensagens();
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    } finally {
      btnSend.disabled = false;
      ta.focus();
    }
  }

  function atualizarBadge() {
    const msgs = mensagensCache[idUrlInt] || [];
    if (msgs.length === 0) {
      const b = btn.querySelector('.chatfab-badge');
      if (b) b.remove();
      return;
    }
    const ultima = msgs[msgs.length - 1];
    let naoLidas = 0;
    if (ultima.remetente_tipo === 'empresa' && !aberto) {
      naoLidas = msgs.length - (ultimaMensagemId[idUrlInt] || 0);
    }
    let badge = btn.querySelector('.chatfab-badge');
    if (naoLidas > 0) {
      if (badge) {
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
      } else {
        badge = document.createElement('span');
        badge.className = 'chatfab-badge';
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        btn.appendChild(badge);
      }
    } else {
      if (badge) badge.remove();
    }
    if (aberto) ultimaMensagemId[idUrlInt] = msgs.length;
  }

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  // === INIT ===
  btn.onclick = toggle;

  document.body.addEventListener('keydown', (e) => {
    if (e.target.id === 'chatfab-empresa-input' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  });

  // Carrega e posiciona após dados prontos
  // NOTA: NÃO abre sozinho — só abre com clique na bolinha (Fabio, jul/2026)
  carregarMensagens().then(() => {
    posicionar();
  });

  // Polling
  setInterval(carregarMensagens, 10000);
})();