// =====================================================
// CONVERSAS — Página estilo WhatsApp Web pro candidato
// (jul/2026)
//
// Layout:
//   - Esquerda: lista de candidaturas com chat liberado
//     (etapa >= 3 + status não encerrado)
//   - Direita: conversa ativa (bolhas + input)
//
// API usada:
//   GET  /api/candidato/conversas         -> lista conversas
//   GET  /api/chat/:id/mensagens          -> msgs de uma conversa
//   POST /api/chat/:id/mensagens          -> envia msg
//   GET  /api/candidato/perfil            -> nome do candidato
// =====================================================

(function() {
  'use strict';

  const API = 'https://recrutamento-api.onrender.com';
  const token = localStorage.getItem('candidato_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  let conversas = [];
  let conversaAtivaId = null;
  let pollInterval = null;
  let pollListInterval = null;

  // === Helpers ===
  function fmtHorario(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const agora = new Date();
    const diffH = (agora - d) / 1000 / 60 / 60;
    if (diffH < 24) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffH < 24 * 7) {
      return d.toLocaleDateString('pt-BR', { weekday: 'short' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function iniciais(s) {
    if (!s) return '?';
    return s.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // === Carregar lista de conversas ===
  async function carregarLista() {
    try {
      const r = await fetch(API + '/api/candidato/conversas', { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      conversas = d.conversas || [];
      renderLista();
    } catch (e) {
      console.error('[CONVERSAS]', e);
      document.getElementById('conv-items').innerHTML = `
        <div class="conv-vazio">
          <div class="icon">⚠️</div>
          <h3>Não rolou carregar</h3>
          <p>Tenta de novo em alguns segundos.</p>
        </div>`;
    }
  }

  function renderLista() {
    const el = document.getElementById('conv-items');
    if (conversas.length === 0) {
      el.innerHTML = `
        <div class="conv-vazio">
          <div class="icon">💬</div>
          <h3>Nenhuma conversa ainda</h3>
          <p>O chat com o recrutador é liberado quando você passa da triagem (etapa 3). Continue acompanhando suas inscrições!</p>
        </div>`;
      return;
    }
    el.innerHTML = conversas.map(c => {
      const ativa = c.candidatura_id === conversaAtivaId;
      const unread = (c.nao_lidas_candidato || 0) > 0;
      const cls = `conv-item ${ativa ? 'active' : ''} ${unread ? 'unread' : ''}`;
      const titulo = c.vaga_titulo || 'Vaga';
      const empresa = c.vaga_empresa ? ` · ${c.vaga_empresa}` : '';
      const preview = c.ultima_msg ? c.ultima_msg : 'Sem mensagens ainda';
      const badge = unread ? `<span class="conv-badge">${c.nao_lidas_candidato}</span>` : '';
      return `
        <div class="${cls}" data-id="${c.candidatura_id}">
          <div class="conv-avatar">${iniciais(titulo)}</div>
          <div class="conv-info">
            <div class="conv-info-top">
              <div class="conv-titulo">${escapeHtml(titulo)}${badge}</div>
              <div class="conv-horario">${fmtHorario(c.ultima_msg_em)}</div>
            </div>
            <div class="conv-preview">${escapeHtml(preview)}</div>
            <div style="font-size:11px;color:#888;margin-top:2px">${escapeHtml(empresa.replace(/^·\s*/, ''))}</div>
          </div>
        </div>`;
    }).join('');
    // Bind clicks
    el.querySelectorAll('.conv-item').forEach(it => {
      it.addEventListener('click', () => abrirConversa(parseInt(it.dataset.id, 10)));
    });
  }

  // === Abrir uma conversa (lado direito) ===
  async function abrirConversa(id) {
    conversaAtivaId = id;
    const c = conversas.find(x => x.candidatura_id === id);
    if (!c) return;
    // No mobile, esconde a lista e mostra só a conversa (estilo WhatsApp)
    // Usa TANTO a classe no shell (CSS media query) QUANTO o style inline (fallback)
    document.getElementById('chat-shell').classList.add('com-conversa');
    if (window.innerWidth <= 768) {
      document.getElementById('conv-list').style.display = 'none';
    }
    renderLista(); // destaca a ativa
    renderPanelHead(c);
    document.getElementById('conv-panel').innerHTML = `
      <div class="conv-panel-head">
        <button class="back" onclick="window.voltarLista()" aria-label="Voltar">‹</button>
        <div class="av">${iniciais(c.vaga_titulo)}</div>
        <div>
          <h2>${escapeHtml(c.vaga_titulo || 'Vaga')}</h2>
          <p>${escapeHtml(c.vaga_empresa || '')} · Etapa ${c.etapa_atual}</p>
        </div>
        <a href="inscricao.html?id=${id}">Ver inscrição →</a>
      </div>
      <div class="conv-msgs" id="conv-msgs">
        <div class="ce-vazio"><div class="icon">⏳</div><p>Carregando mensagens...</p></div>
      </div>
      <div class="conv-input">
        <textarea id="conv-texto" placeholder="Escreve uma mensagem..." rows="1"></textarea>
        <button id="conv-enviar" disabled>➤</button>
      </div>
    `;
    // Bind
    const ta = document.getElementById('conv-texto');
    const btn = document.getElementById('conv-enviar');
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
      btn.disabled = ta.value.trim().length === 0;
    });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!btn.disabled) enviar();
      }
    });
    btn.addEventListener('click', enviar);

    await carregarMensagens(id);
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => carregarMensagens(id, true), 5000);
  }

  function renderPanelHead(c) {
    // No-op, já é feito dentro do abrirConversa
  }

  // === Carregar mensagens ===
  async function carregarMensagens(id, silent = false) {
    try {
      const r = await fetch(API + '/api/chat/' + id + '/mensagens', { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      renderMensagens(d.mensagens || []);
      // Atualiza status (caso tenha sido encerrado)
      if (d.candidatura_status) {
        const c = conversas.find(x => x.candidatura_id === id);
        if (c && c.status !== d.candidatura_status) {
          c.status = d.candidatura_status;
          renderLista();
        }
      }
    } catch (e) {
      if (!silent) console.error('[MSGS]', e);
    }
  }

  function renderMensagens(msgs) {
    const el = document.getElementById('conv-msgs');
    if (!el) return;
    if (msgs.length === 0) {
      el.innerHTML = `<div class="ce-vazio"><div class="icon">💬</div><p>Nenhuma mensagem ainda. Manda oi pro recrutador!</p></div>`;
      return;
    }
    el.innerHTML = msgs.map(m => {
      const minha = m.autor_tipo === 'candidato';
      const ini = iniciais(m.autor_nome);
      const meta = new Date(m.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      return `<div class="ce-msg ${minha ? 'minha' : m.autor_tipo}">
        <div class="ce-msg-av">${ini}</div>
        <div class="ce-msg-balao">
          <div class="ce-msg-conteudo">${escapeHtml(m.texto)}</div>
          <div class="ce-msg-meta">${m.autor_nome ? escapeHtml(m.autor_nome) + ' · ' : ''}${meta}</div>
        </div>
      </div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  // === Enviar mensagem ===
  async function enviar() {
    const ta = document.getElementById('conv-texto');
    const btn = document.getElementById('conv-enviar');
    const texto = ta.value.trim();
    if (!texto || !conversaAtivaId) return;
    btn.disabled = true;
    ta.disabled = true;
    try {
      const r = await fetch(API + '/api/chat/' + conversaAtivaId + '/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ texto })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.erro || 'Erro ao enviar');
        return;
      }
      ta.value = '';
      ta.style.height = 'auto';
      await carregarMensagens(conversaAtivaId, true);
      await carregarLista(); // atualiza preview
    } catch (e) {
      alert('Erro de conexão: ' + e.message);
    } finally {
      ta.disabled = false;
      ta.focus();
    }
  }

  // === Voltar pra lista (mobile) ===
  window.voltarLista = function() {
    document.getElementById('chat-shell').classList.remove('com-conversa');
    document.getElementById('conv-list').style.display = ''; // remove inline
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    conversaAtivaId = null;
    document.getElementById('conv-panel').innerHTML = `
      <div class="conv-empty">
        <div class="icon">💬</div>
        <h3>Selecione uma conversa</h3>
        <p>Escolha uma vaga na lista à esquerda pra começar a falar com o recrutador.</p>
      </div>`;
  };

  // === Inicialização ===
  carregarLista();
  pollListInterval = setInterval(carregarLista, 15000); // atualiza lista a cada 15s
})();
