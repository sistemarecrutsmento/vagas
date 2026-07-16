// ============================================
// VAGAS.IO — Front-end do Candidato
// Conecta com backend: https://recrutamento-api.onrender.com
// Fluxo: /api/candidato/iniciar → /verificar (código email) → /cadastrar (com CPF)
// ============================================

const API = 'https://recrutamento-api.onrender.com';
document.title = '[ZAPIA] ' + document.title + ' @ ' + Date.now();
let categoriaAtiva = '';
let vagaSelecionada = null;
let emailVerificado = null;
let tokenCandidato = null;
let cadastroCompleto = false;

window.addEventListener('DOMContentLoaded', () => {
  carregarVagas();
  checarAuth();
  document.querySelectorAll('.filtro-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filtro-chip').forEach(c => c.classList.remove('ativo'));
      chip.classList.add('ativo');
      categoriaAtiva = chip.dataset.cat;
      carregarVagas();
    });
  });
});

// ===== API: VAGAS =====
async function carregarVagas() {
  const grid = document.getElementById('vagas-grid');
  const contador = document.getElementById('contador');
  grid.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  const busca = document.getElementById('busca').value;
  try {
    let url = API + '/api/vagas';
    const params = new URLSearchParams();
    if (busca) params.set('busca', busca);
    if (categoriaAtiva) params.set('area', categoriaAtiva);
    if (params.toString()) url += '?' + params;
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeoutId);
    const data = await r.json();
    const vagas = data.vagas || [];
    if (vagas.length === 0) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1;">
          <div class="empty-icon">📋</div>
          <h3>Nenhuma vaga disponível no momento</h3>
          <p>Volte mais tarde — atualizamos toda semana.</p>
        </div>`;
      contador.textContent = '0 vagas encontradas';
      return;
    }
    grid.innerHTML = vagas.map(v => `
      <div class="vaga-card" onclick="abrirDetalhes(${v.id})">
        <div class="empresa">${v.empresa || 'Empresa'}</div>
        <h3>${v.titulo}</h3>
        <div class="vaga-tags">
          ${v.categoria ? `<span class="tag">${v.categoria}</span>` : ''}
          ${v.modalidade ? `<span class="tag">${v.modalidade}</span>` : ''}
          ${v.cidade ? `<span class="tag">📍 ${v.cidade}</span>` : ''}
        </div>
        <div class="salario">${v.salario || 'A combinar'}</div>
        <div class="footer">
          <span class="data">${formatarData(v.criada_em)}</span>
          <span class="cta">Ver detalhes →</span>
        </div>
      </div>
    `).join('');
    contador.textContent = `${vagas.length} vaga${vagas.length !== 1 ? 's' : ''} encontrada${vagas.length !== 1 ? 's' : ''}`;
  } catch (e) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;color:#C00;">
      <div class="empty-icon">⚠️</div><h3>Não foi possível carregar as vagas</h3>
      <p>O servidor pode estar iniciando. Tente novamente.</p>
      <button class="btn btn-primary" style="width:auto;margin-top:16px" onclick="carregarVagas()">Tentar novamente</button>
    </div>`;
    contador.textContent = 'Não foi possível carregar';
  }
}

function abrirDetalhes(id) {
  fetch(API + '/api/vagas/' + id)
    .then(r => r.json())
    .then(data => {
      const v = data.vaga || data;
      vagaSelecionada = v;
      document.getElementById('det-empresa').textContent = v.empresa || 'Confidencial';
      document.getElementById('det-titulo').textContent = v.titulo;
      document.getElementById('det-local').textContent = v.cidade || '—';
      document.getElementById('det-contrato').textContent = v.tipo_contrato || '—';
      document.getElementById('det-nivel').textContent = v.nivel || '—';
      document.getElementById('det-area').textContent = v.area || '—';
      const sal = (v.salario_min && v.salario_max) ? `R$ ${v.salario_min} - R$ ${v.salario_max}` : 'A combinar';
      document.getElementById('det-salario').textContent = sal;
      document.getElementById('det-descricao').textContent = v.descricao || 'Sem descrição';
      document.getElementById('det-requisitos').textContent = v.requisitos || '—';
      document.getElementById('det-beneficios').textContent = v.beneficios || '—';
      atualizarBotaoCandidatar(v.id);
      document.getElementById('modal-detalhes').classList.add('aberto');
    })
    .catch(() => alert('Erro ao carregar detalhes da vaga'));
}

function atualizarBotaoCandidatar(vagaId) {
  const btn = document.getElementById('btn-candidatar');
  if (!tokenCandidato) {
    btn.textContent = '🔒 Faça login para se candidatar';
    btn.disabled = false;
    btn.onclick = () => { fecharModal('detalhes'); abrirModal('login'); };
  } else if (!cadastroCompleto) {
    btn.textContent = '📝 Complete seu cadastro para candidatar-se';
    btn.disabled = false;
    btn.onclick = () => {
      emailVerificado = localStorage.getItem('candidato_email') || emailVerificado;
      document.getElementById('cad-email-2').value = emailVerificado || '';
      fecharModal('detalhes');
      abrirModal('cad');
      irParaEtapa(3);
    };
  } else {
    btn.textContent = '✅ Candidatar-se a esta vaga';
    btn.disabled = false;
    btn.onclick = () => candidatar(vagaId);
  }
}

async function candidatar(vagaId) {
  // Proteção: se não tiver token, manda pro login
  if (!tokenCandidato) {
    alert('Você precisa fazer login antes de se candidatar.');
    fecharModal('detalhes');
    abrirModal('login');
    return;
  }
  if (!cadastroCompleto) {
    alert('Complete seu cadastro (CPF, cidade, etc.) antes de se candidatar.');
    fecharModal('detalhes');
    abrirModal('cad');
    irParaEtapa(3);
    return;
  }
  const btn = document.getElementById('btn-candidatar');
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const r = await fetch(API + '/api/candidato/candidatar/' + vagaId, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    const data = await r.json();
    if (r.ok) {
      btn.textContent = '✓ Candidatura enviada!';
      btn.style.background = '#2E7D32';
      btn.style.color = 'white';
    } else if (r.status === 401) {
      // Token expirou ou é inválido
      logout();
      btn.textContent = '🔒 Faça login para se candidatar';
      btn.disabled = false;
      btn.onclick = () => { fecharModal('detalhes'); abrirModal('login'); };
      alert('Sua sessão expirou. Faça login novamente.');
    } else {
      btn.textContent = '❌ ' + (data.erro || 'Erro');
      btn.disabled = false;
    }
  } catch (e) {
    btn.textContent = '❌ Erro de conexão';
    btn.disabled = false;
  }
}

// ===== AUTH / CADASTRO =====
function abrirModal(id) {
  if (id === 'cad') {
    document.getElementById('cad-etapa-1').style.display = 'block';
    document.getElementById('cad-etapa-2').style.display = 'none';
    document.getElementById('cad-etapa-3').style.display = 'none';
    if (emailVerificado) {
      document.getElementById('cad-email').value = emailVerificado;
    }
  }
  if (id === 'login') {
    document.getElementById('login-etapa-1').style.display = 'block';
    document.getElementById('login-etapa-2').style.display = 'none';
    if (emailVerificado) {
      document.getElementById('login-email').value = emailVerificado;
    }
  }
  document.getElementById('modal-' + id).classList.add('aberto');
}

function fecharModal(id) {
  document.getElementById('modal-' + id).classList.remove('aberto');
}

function irParaEtapa(n) {
  console.log('[ZAPIA-IR] irParaEtapa(' + n + ')');
  __zapiaShow('IR irParaEtapa(' + n + ')');
  const e1 = document.getElementById('cad-etapa-1');
  const e2 = document.getElementById('cad-etapa-2');
  const e3 = document.getElementById('cad-etapa-3');
  e1.style.display = n === 1 ? 'block' : 'none';
  e2.style.display = n === 2 ? 'block' : 'none';
  e3.style.display = n === 3 ? 'block' : 'none';
  __zapiaShow('IR DEPOIS: e1=' + e1.style.display + ' e2=' + e2.style.display + ' e3=' + e3.style.display);
}

// ETAPA 1: enviar código para o email
async function enviarCodigo(btn) {
  console.log('[ZAPIA] enviarCodigo chamada');
  const email = document.getElementById('cad-email').value.trim().toLowerCase();
  if (!email || !email.includes('@') || !email.includes('.')) {
    console.warn('[ZAPIA] email inválido');
    return;
  }
  console.log('[ZAPIA] email ok:', email);
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 35000);
    const r = await fetch(API + '/api/candidato/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: ctrl.signal
    });
    clearTimeout(timeoutId);
    console.log('[ZAPIA] /iniciar resposta:', r.status);
    const data = await r.json();
    console.log('[ZAPIA] /iniciar data:', data);
    if (r.ok) {
      emailVerificado = email;
      localStorage.setItem('candidato_email', email);
      document.getElementById('cad-email-2').value = email;
      // Se o backend devolveu o código (modo DEV sem SMTP), mostra em destaque
      const devBox = document.getElementById('codigo-dev');
      console.log('[ZAPIA] devBox=', devBox, 'data.codigo_debug=', data.codigo_debug);
      if (data.codigo_debug && devBox) {
        devBox.innerHTML = '🔧 <b>Modo DEV:</b> o envio de e-mail está desativado. Seu código é <b>' + data.codigo_debug + '</b>';
        devBox.style.display = 'block';
      } else if (devBox) {
        devBox.style.display = 'none';
      }
      document.getElementById('codigo-enviado-msg').textContent = 'Enviamos um código de 6 dígitos para ' + email;
      __zapiaShow('chamando irParaEtapa(2)');
      __zapiaShow('cad-etapa-1 ANTES: ' + document.getElementById('cad-etapa-1').style.display);
      __zapiaShow('cad-etapa-2 ANTES: ' + document.getElementById('cad-etapa-2').style.display);
      irParaEtapa(2);
      __zapiaShow('cad-etapa-1 DEPOIS: ' + document.getElementById('cad-etapa-1').style.display);
      __zapiaShow('cad-etapa-2 DEPOIS: ' + document.getElementById('cad-etapa-2').style.display);
      console.log('[ZAPIA] DEPOIS de irParaEtapa(2)');
    } else {
      console.error('[ZAPIA] erro:', data);
      alert('Erro: ' + (data.erro || 'Não foi possível enviar'));
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      alert('O servidor demorou demais. Tente novamente em alguns segundos.');
    } else {
      alert('Erro de conexão. Tente novamente.');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

// ETAPA 2: verificar código
async function verificarCodigo(btn) {
  const codigo = document.getElementById('cad-codigo').value.trim();
  if (!codigo || codigo.length !== 6) {
    alert('Digite o código de 6 dígitos recebido por e-mail');
    return;
  }
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  try {
    const r = await fetch(API + '/api/candidato/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailVerificado, codigo })
    });
    const data = await r.json();
    if (r.ok) {
      tokenCandidato = data.token;
      localStorage.setItem('candidato_token', tokenCandidato);
      localStorage.setItem('candidato_email', emailVerificado);
      await checarPerfil();
      irParaEtapa(3);
    } else {
      alert('Erro: ' + (data.erro || 'Código inválido'));
    }
  } catch (e) {
    alert('Erro de conexão');
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

async function checarPerfil() {
  if (!tokenCandidato) return;
  try {
    const r = await fetch(API + '/api/candidato/perfil', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (r.status === 401) {
      logout();
      return;
    }
    const data = await r.json();
    if (data.candidato) {
      cadastroCompleto = true;
      const c = data.candidato;
      const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      setVal('perfil-nome', c.nome);
      setVal('perfil-cpf', c.cpf);
      setVal('perfil-celular', c.celular);
      setVal('perfil-nascimento', c.data_nascimento);
      setVal('perfil-sexo', c.sexo);
      setVal('perfil-cidade', c.cidade);
      setVal('perfil-estado', c.estado);
      setVal('perfil-formacao', c.formacao);
      atualizarHeaderUsuario();
    }
  } catch (e) {
    console.warn('Falha ao checar perfil:', e);
  }
}

// ETAPA 3: salvar perfil
async function salvarPerfil(btn) {
  const cpfRaw = document.getElementById('perfil-cpf').value.trim();
  const cpf = cpfRaw.replace(/\D/g, '');
  const perfil = {
    nome: document.getElementById('perfil-nome').value.trim(),
    cpf: cpf,
    email: emailVerificado,
    celular: document.getElementById('perfil-celular').value.trim(),
    data_nascimento: document.getElementById('perfil-nascimento').value || null,
    sexo: document.getElementById('perfil-sexo').value || null,
    cidade: document.getElementById('perfil-cidade').value.trim(),
    estado: document.getElementById('perfil-estado').value.trim().toUpperCase(),
    formacao: document.getElementById('perfil-formacao').value.trim()
  };
  if (!perfil.nome) { alert('Nome é obrigatório'); return; }
  if (!perfil.cpf || perfil.cpf.length !== 11) { alert('CPF é obrigatório (11 dígitos)'); return; }
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    const r = await fetch(API + '/api/candidato/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenCandidato },
      body: JSON.stringify(perfil)
    });
    const data = await r.json();
    if (r.ok) {
      cadastroCompleto = true;
      fecharModal('cad');
      atualizarHeaderUsuario();
      alert('✅ Cadastro concluído! Agora você pode se candidatar às vagas.');
      // Se o modal de detalhes estava aberto, atualizar o botão
      if (vagaSelecionada) {
        const btnCand = document.getElementById('btn-candidatar');
        if (btnCand) {
          btnCand.textContent = '✅ Candidatar-se a esta vaga';
          btnCand.disabled = false;
          btnCand.onclick = () => candidatar(vagaSelecionada.id);
        }
      }
    } else if (r.status === 401) {
      logout();
      alert('Sessão expirada. Faça login novamente.');
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível salvar'));
    }
  } catch (e) {
    alert('Erro de conexão');
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

// LOGIN (reenviar código)
async function loginEnviarCodigo(btn) {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    alert('Informe um e-mail válido');
    return;
  }
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch(API + '/api/candidato/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: ctrl.signal
    });
    clearTimeout(timeoutId);
    const data = await r.json();
    if (r.ok) {
      emailVerificado = email;
      localStorage.setItem('candidato_email', email);
      document.getElementById('login-email-2').value = email;
      // Se o backend devolveu o código (modo DEV sem SMTP), mostra em destaque
      const devBox = document.getElementById('codigo-dev-login');
      if (data.codigo_debug && devBox) {
        devBox.innerHTML = '🔧 <b>Modo DEV:</b> o envio de e-mail está desativado. Seu código é <b>' + data.codigo_debug + '</b>';
        devBox.style.display = 'block';
      } else if (devBox) {
        devBox.style.display = 'none';
      }
      document.getElementById('login-etapa-1').style.display = 'none';
      document.getElementById('login-etapa-2').style.display = 'block';
    } else {
      alert('Erro: ' + (data.erro || ''));
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      alert('O servidor demorou demais. Tente novamente.');
    } else {
      alert('Erro de conexão');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

async function loginVerificarCodigo(btn) {
  const codigo = document.getElementById('login-codigo').value.trim();
  if (!codigo || codigo.length !== 6) {
    alert('Código inválido');
    return;
  }
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try {
    const r = await fetch(API + '/api/candidato/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailVerificado, codigo })
    });
    const data = await r.json();
    if (r.ok) {
      tokenCandidato = data.token;
      localStorage.setItem('candidato_token', tokenCandidato);
      localStorage.setItem('candidato_email', emailVerificado);
      await checarPerfil();
      fecharModal('login');
      atualizarHeaderUsuario();
      if (cadastroCompleto) {
        alert('✅ Login efetuado!');
      } else {
        // Se não tem perfil, abre direto a etapa 3 do cadastro
        abrirModal('cad');
        irParaEtapa(3);
      }
    } else {
      alert('Erro: ' + (data.erro || 'Código inválido'));
    }
  } catch (e) {
    alert('Erro de conexão');
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

function checarAuth() {
  const t = localStorage.getItem('candidato_token');
  const e = localStorage.getItem('candidato_email');
  if (t && e) {
    tokenCandidato = t;
    emailVerificado = e;
    checarPerfil().then(atualizarHeaderUsuario);
  }
}

function atualizarHeaderUsuario() {
  const btnEntrar = document.querySelector('header .btn-outline');
  if (!btnEntrar) return;
  if (tokenCandidato && cadastroCompleto) {
    btnEntrar.textContent = '👤 ' + (emailVerificado || 'Perfil');
    btnEntrar.onclick = () => abrirPainelCandidato();
  } else if (tokenCandidato) {
    btnEntrar.textContent = '📝 Completar cadastro';
    btnEntrar.onclick = () => { abrirModal('cad'); irParaEtapa(3); };
  } else {
    btnEntrar.textContent = 'Entrar';
    btnEntrar.onclick = () => abrirModal('login');
  }
}

async function abrirPainelCandidato() {
  if (!cadastroCompleto) {
    abrirModal('cad');
    irParaEtapa(3);
    return;
  }
  try {
    const r = await fetch(API + '/api/candidato/candidaturas', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (r.status === 401) {
      logout();
      alert('Sessão expirada');
      return;
    }
    const data = await r.json();
    const lista = data.candidaturas || [];
    const html = lista.length === 0
      ? '<div class="empty"><div class="empty-icon">📭</div><p>Você ainda não se candidatou a nenhuma vaga.</p></div>'
      : lista.map(c => `
        <div class="cand-item">
          <div>
            <strong>${c.titulo || 'Vaga'}</strong>
            <div class="muted">${c.empresa || ''} • ${c.cidade || ''}</div>
          </div>
          <span class="status status-${c.status}">${statusLabel(c.status)}</span>
        </div>
      `).join('');
    document.getElementById('minhas-cand-lista').innerHTML = html;
    document.getElementById('minhas-cand-email').textContent = emailVerificado || '';
    document.getElementById('modal-minhas').classList.add('aberto');
  } catch (e) {
    alert('Erro ao buscar candidaturas');
  }
}

function statusLabel(s) {
  return {
    em_analise: 'Em análise',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    contratado: 'Contratado',
    entrevista: 'Entrevista'
  }[s] || s;
}

function logout() {
  localStorage.removeItem('candidato_token');
  localStorage.removeItem('candidato_email');
  tokenCandidato = null;
  cadastroCompleto = false;
  emailVerificado = null;
  atualizarHeaderUsuario();
  // Fechar todos os modais
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('aberto'));
}

// fechar modal ao clicar fora
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('aberto'); });
});

// ===== UTIL =====
function formatarData(iso) {
  if (!iso) return 'Recente';
  const d = new Date(iso);
  const hoje = new Date();
  const diff = Math.floor((hoje - d) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `${diff} dias atrás`;
  return d.toLocaleDateString('pt-BR');
}

// Formatar CPF automaticamente
document.addEventListener('DOMContentLoaded', () => {
  const cpfInput = document.getElementById('perfil-cpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }
  const celInput = document.getElementById('perfil-celular');
  if (celInput) {
    celInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length <= 10) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
      } else {
        v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
      }
      e.target.value = v;
    });
  }
  const codigoInput = document.getElementById('cad-codigo');
  if (codigoInput) {
    codigoInput.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
  }
  const codigoInput2 = document.getElementById('login-codigo');
  if (codigoInput2) {
    codigoInput2.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
  }
});

// ============================================
// EXPOR NO WINDOW (para onclick inline funcionar)
// ============================================
window.enviarCodigo = enviarCodigo;
window.verificarCodigo = verificarCodigo;
window.loginEnviarCodigo = loginEnviarCodigo;
window.loginVerificarCodigo = loginVerificarCodigo;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.irParaEtapa = irParaEtapa;
window.cadastrarPerfil = salvarPerfil;

// ============================================
// ZAPIA DEBUG: instrumento
// ============================================
function __zapiaShow(txt) {
  let el = document.getElementById('__zapia_div__');
  if (!el) {
    el = document.createElement('div');
    el.id = '__zapia_div__';
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:200px;overflow:auto;background:#000;color:#0f0;font:10px monospace;padding:6px;z-index:99999;white-space:pre-wrap;border-top:2px solid #0f0';
    document.body.appendChild(el);
  }
  el.textContent += new Date().toISOString().substr(11, 8) + ' ' + txt + '\n';
  el.scrollTop = el.scrollHeight;
}
window.addEventListener('error', e => {
  __zapiaShow('ERR: ' + e.message + ' @ ' + (e.filename || '?') + ':' + e.lineno);
});
window.addEventListener('unhandledrejection', e => {
  __zapiaShow('PROMISE: ' + (e.reason?.message || e.reason));
});

const _origIr = irParaEtapa;
window.irParaEtapa = function(n) {
  __zapiaShow('irParaEtapa(' + n + ')');
  _origIr(n);
};
const _origAbrir = abrirModal;
window.abrirModal = function(id) {
  __zapiaShow('abrirModal(' + id + ')');
  _origAbrir(id);
};
const _origEnviar = enviarCodigo;
window.enviarCodigo = async function(btn) {
  __zapiaShow('enviarCodigo btn=' + (btn && btn.textContent));
  try {
    await _origEnviar(btn);
    __zapiaShow('enviarCodigo OK');
  } catch (e) {
    __zapiaShow('enviarCodigo ERRO: ' + e.message);
  }
};
