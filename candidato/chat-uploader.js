// ============================================
// CHAT UPLOADER - envio de arquivos (jul/2026)
// Usado tanto pelo candidato quanto pelo admin
// Limite: 6MB, tipos: imagem, PDF, doc, xls, txt, csv
// ============================================

window.ChatUploader = (function() {
  const LIMITE_MB = 6;
  const TIPOS_PERMITIDOS = {
    'image/jpeg': '🖼️', 'image/jpg': '🖼️', 'image/png': '🖼️',
    'image/gif': '🖼️', 'image/webp': '🖼️',
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'text/plain': '📃', 'text/csv': '📊'
  };

  function formatarTamanho(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function lerComoBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        // r.result é "data:mime;base64,XXXX" — extrai só o base64
        const idx = r.result.indexOf(',');
        resolve(r.result.substring(idx + 1));
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // Cria botão de anexo (devolve HTMLElement)
  function criarBotaoAnexo(onArquivoSelecionado) {
    const btn = document.createElement('button');
    btn.className = 'chat-anexo-btn';
    btn.innerHTML = '📎';
    btn.title = 'Anexar arquivo';
    btn.type = 'button';
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = Object.keys(TIPOS_PERMITIDOS).join(',');
    btn.onclick = () => input.click();
    input.onchange = async () => {
      const f = input.files[0];
      if (!f) return;
      if (f.size > LIMITE_MB * 1024 * 1024) {
        alert(`Arquivo muito grande. Limite: ${LIMITE_MB}MB`);
        input.value = '';
        return;
      }
      if (!TIPOS_PERMITIDOS[f.type]) {
        alert('Tipo de arquivo não permitido. Use: imagem, PDF, Word, Excel, TXT ou CSV.');
        input.value = '';
        return;
      }
      onArquivoSelecionado(f);
      input.value = '';
    };
    btn.appendChild(input);
    return btn;
  }

  // Renderiza preview do arquivo numa mensagem
  function renderAnexo(arquivo) {
    const isImage = arquivo.mime_type.startsWith('image/');
    const url = `https://recrutamento-api.onrender.com/api/chat/arquivo/${arquivo.id}`;
    if (isImage) {
      return `<a href="${url}" target="_blank" rel="noopener">
                <img src="${url}" alt="${escapeAttr(arquivo.nome_original)}"
                     style="max-width:240px;max-height:240px;border-radius:8px;display:block;margin-top:4px;cursor:pointer;" />
              </a>`;
    }
    return `<a href="${url}" target="_blank" rel="noopener"
              class="chat-anexo-link">
              ${TIPOS_PERMITIDOS[arquivo.mime_type] || '📎'}
              <span>${escapeHtml(arquivo.nome_original)}</span>
              <small>${formatarTamanho(arquivo.tamanho_bytes)}</small>
            </a>`;
  }

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }
  function escapeAttr(t) {
    return String(t).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return { criarBotaoAnexo, lerComoBase64, renderAnexo, formatarTamanho, TIPOS_PERMITIDOS };
})();
