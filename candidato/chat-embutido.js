// ============================================
// CHAT EMBUTIDO NO INSCRICAO.HTML (jul/2026)
// Bloco de conversa fixo na página, vinculado
// a UMA candidatura específica (cand.id)
// - Aparece se etapa >= 3 e status não encerrado
// - Se candidatura encerrada, mostra "Chat indisponível"
// ============================================

(function() {
  'use strict';

  const bloco = document.getElementById('bloco-chat-candidato');
  if (!bloco) return;
  const candidaturaId = bloco.dataset.candidatura;
  const statusInicial = bloco.dataset.status;
  const etapaInicial = parseInt(bloco.dataset.etapa || '0', 10);
  if (!candidaturaId) return;

  const token = localStorage.getItem('candidato_token');
  if (!token) return;
  const API = 'https://recrutamento-api.onrender.com';

  const ENCERRADO = ['rejeitado', 'reprovado', 'cancelado', 'contratado'];

  // === Regras de visibilidade ===
  // Só mostra se:
  // - etapa >= 3 (passou da triagem)
  // - status não é encerrado
  const etapaNum = isNaN(etapaInicial) ? 0 : etapaInicial;
  if (etapaNum < 3 || ENCERRADO.includes(statusInicial)) {
    // Se encerrado, mostra a tela de "indisponível" mesmo assim
    if (ENCERRADO.includes(statusInicial)) {
      renderizarEncerrado(statusInicial);
    }
    return;
  }

  // === CSS ===
  const style = document.createElement('style');
  style.textContent = `
    .chat-embutido { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden; }
    .chat-embutido-head { background: linear-gradient(135deg, #722F37, #8a3a44); color: white; padding: 16px 20px; display: flex; align-items: center; gap: 12px; }
    .chat-embutido-head .icon { font-size: 24px; }
    .chat-embutido-head h3 { margin: 0; font-size: 16px; }
    .chat-embutido-head p { margin: 2px 0 0; font-size: 12px; opacity: 0.85; }
    .chat-embutido-msgs { padding: 16px 20px; max-height: 360px; overflow-y: auto; background: #faf7f2; }
    .ce-msg { display: flex; gap: 8px; margin-bottom: 12px; }
    .ce-msg.minha { flex-direction: row-reverse; }
    .ce-msg-av { width: 32px; height: 32px; border-radius: 50%; background: #722F37; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .ce-msg.admin .ce-msg-av { background: #d4a017; color: #1a1a1a; }
    .ce-msg-balao { background: white; padding: 8px 12px; border-radius: 12px; max-width: 75%; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .ce-msg.minha .ce-msg-balao { background: #722F37; color: white; }
    .ce-msg-conteudo { font-size: 14px; line-height: 1.4; word-wrap: break-word; }
    .ce-msg-meta { font-size: 10px; opacity: 0.7; margin-top: 4px; }
    .ce-msg.minha .ce-msg-meta { text-align: right; color: rgba(255,255,255,0.85); }
    .ce-vazio { text-align: center; color: #888; padding: 32px 16px; }
    .ce-vazio .icon { font-size: 36px; opacity: 0.4; margin-bottom: 8px; }
    .chat-embutido-input { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e5e0d8; background: white; align-items: flex-end; }
    .chat-embutido-input textarea { flex: 1; resize: none; border: 1px solid #e5e0d8; border-radius: 8px; padding: 8px 10px; font-size: 14px; font-family: inherit; max-height: 80px; min-height: 36px; }
    .chat-embutido-input textarea:focus { outline: none; border-color: #722F37; }
    .chat-embutido-input button { background: #722F37; color: white; border: 0; width: 40px; height: 40px; border-radius: 8px; font-size: 18px; cursor: pointer; flex-shrink: 0; }
    .chat-embutido-input button:hover:not(:disabled) { background: #8a3a44; }
    .chat-embutido-input button:disabled { opacity: 0.5; cursor: not-allowed; }
    .ce-encerrado { padding: 40px 20px; text-align: center; }
    .ce-encerrado .icon { font-size: 48px; margin-bottom: 12px; }
    .ce-encerrado h4 { margin: 0 0 8px; color: #333; font-size: 16px; }
    .ce-encerrado p { margin: 0; font-size: 13px; line-height: 1.5; color: #777; }
    .ce-encerrado.contratado { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
    .ce-encerrado.rejeitado { background: linear-gradient(135deg, #fee2e2, #fecaca); }
  `;
  document.head.appendChild(style);

  // === Render inicial ===
  bloco.innerHTML = `
    <div class="chat-embutido">
      <div class="chat-embutido-head">
        <div class="icon">💬</div>
        <div>
          <h3>Mensagens com o recrutador</h3>
          <p>Converse sobre esta vaga específica</p>
        </div>
      </div>
      <div class="chat-embutido-msgs" id="ce-msgs">
        <div class="ce-vazio">
          <div class="icon">⏳</div>
          <p>Carregando...</p>
        </div>
      </div>
      <div class="chat-embutido-input" id="ce-input">
        <textarea id="ce-texto" placeholder="Digite sua mensagem..." rows="1"></textarea>
        <button id="ce-send" type="button">➤</button>
      </div>
    </div>
  `;

  const $msgs = document.getElementById('ce-msgs');
  const $input = document.getElementById('ce-input');
  const $texto = document.getElementById('ce-texto');
  const $send = document.getElementById('ce-send');

  $send.onclick = enviar;
  $texto.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  });

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  async function carregar() {
    try {
      const r = await fetch(`${API}/api/chat/${candidaturaId}/mensagens`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!r.ok) return;
      const j = await r.json();
      const msgs = j.mensagens || [];
      const status = j.candidatura_status;

      if (ENCERRADO.includes(status)) {
        renderizarEncerrado(status);
        return;
      }

      if (msgs.length === 0) {
        $msgs.innerHTML = `<div class="ce-vazio"><div class="icon">💬</div><p>Nenhuma mensagem ainda. Manda oi pro recrutador!</p></div>`;
      } else {
        $msgs.innerHTML = msgs.map(m => {
          const minha = m.autor_tipo === 'candidato';
          const iniciais = (m.autor_nome || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
          const dataFmt = new Date(m.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          return `<div class="ce-msg ${minha ? 'minha' : m.autor_tipo}">
            <div class="ce-msg-av">${iniciais}</div>
            <div class="ce-msg-balao">
              <div class="ce-msg-conteudo">${escapeHtml(m.texto || '')}</div>
              <div class="ce-msg-meta">${escapeHtml(m.autor_nome || '')} • ${dataFmt}</div>
            </div>
          </div>`;
        }).join('');
      }
      $msgs.scrollTop = $msgs.scrollHeight;
    } catch (e) {
      $msgs.innerHTML = `<div class="ce-vazio"><p style="color:#dc2626">Erro ao carregar: ${escapeHtml(e.message)}</p></div>`;
    }
  }

  function renderizarEncerrado(status) {
    let classe, icone, titulo, msg;
    if (status === 'contratado') {
      classe = 'contratado';
      icone = '🎉';
      titulo = 'Parabéns! Você foi contratado(a)';
      msg = 'Esta candidatura foi finalizada com sucesso. Em breve entraremos em contato.';
    } else {
      classe = 'rejeitado';
      icone = '🚫';
      titulo = 'Chat indisponível';
      msg = 'Esta candidatura foi encerrada. O chat não está mais disponível para esta vaga.';
    }
    bloco.innerHTML = `<div class="chat-embutido"><div class="ce-encerrado ${classe}"><div class="icon">${icone}</div><h4>${titulo}</h4><p>${msg}</p></div></div>`;
  }

  async function enviar() {
    const texto = $texto.value.trim();
    if (!texto) return;
    $send.disabled = true;
    try {
      const r = await fetch(`${API}/api/chat/${candidaturaId}/mensagens`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.erro || 'Falha ao enviar');
      }
      $texto.value = '';
      await carregar();
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    } finally {
      $send.disabled = false;
      $texto.focus();
    }
  }

  carregar();
  // Polling a cada 15s
  setInterval(carregar, 15000);
})();
