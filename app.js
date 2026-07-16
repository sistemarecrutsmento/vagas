// ============================================
// VAGAS.IO — Front-end do Candidato
// Conecta com backend: https://recrutamento-api.onrender.com
// Fluxo: /api/candidato/iniciar → /verificar (código email) → /cadastrar
// ============================================

const API = 'https://recrutamento-api.onrender.com';
let categoriaAtiva = '';
let vagaSelecionada = null;
let emailVerificado = null;     // email que passou por verificação
let tokenCandidato = null;      // JWT do candidato
let cadastroCompleto = false;
let etapaCadastro = 1;          // 1=iniciar, 2=verificar código, 3=perfil

// Init
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
  document.getElementById('busca').addEventListener('input', debounce(carregarVagas, 400));
});

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ===== API: VAGAS =====
async function carregarVagas() {
  const grid = document.getElementById('vagas-grid');
  const contador = document.getElementById('contador');
  grid.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  try {
    const r = await fetch(API + '/api/vagas');
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
          ${v.area ? `<span class="tag">${v.area}</span>` : ''}
          ${v.tipo_contrato ? `<span class="tag">${v.tipo_contrato}</span>` : ''}
          ${v.nivel ? `<span class="tag">${v.nivel}</span>` : ''}
          ${v.cidade ? `<span class="tag">📍 ${v.cidade}${v.estado ? '/' + v.estado : ''}</span>` : ''}
        </div>
        <div class="salario">${formatarSalario(v.salario_min, v.salario_max)}</div>
        <div class="footer">
          <span class="data">${formatarData(v.criada_em)}</span>
          <span class="cta">Ver detalhes →</span>
        </div>
      </div>
    `).join('');
    contador.textContent = `${vagas.length} vaga${vagas.length !== 1 ? 's' : ''} encontrada${vagas.length !== 1 ? 's' : ''}`;
  } catch (e) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;color:#C00;">Erro ao carregar vagas.</div>`;
  }
}

function formatarSalario(min, max) {
  if (!min && !max) return 'A combinar';
  const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return `A partir de ${fmt(min || max)}`;
}

function abrirDetalhes(id) {
  fetch(API + '/api/vagas/' + id)
    .then(r => r.json())
    .then(d => {
      const v = d.vaga;
      vagaSelecionada = v;
      document.getElementById('det-empresa').textContent = v.empresa || '';
      document.getElementById('det-titulo').textContent = v.titulo;
      document.getElementById('det-local').textContent = (v.cidade || '—') + (v.estado ? '/' + v.estado : '');
      document.getElementById('det-contrato').textContent = v.tipo_contrato || '—';
      document.getElementById('det-nivel').textContent = v.nivel || '—';
      document.getElementById('det-area').textContent = v.area || '—';
      document.getElementById('det-salario').textContent = formatarSalario(v.salario_min, v.salario_max);
      document.getElementById('det-descricao').textContent = v.descricao || 'Sem descrição.';
      document.getElementById('det-requisitos').textContent = v.requisitos || 'Não informado.';
      document.getElementById('det-beneficios').textContent = v.beneficios || 'Não informado.';
      atualizarBotaoCandidatar(v.id);
      document.getElementById('modal-detalhes').classList.add('aberto');
    });
}

function atualizarBotaoCandidatar(vagaId) {
  const btn = document.getElementById('btn-candidatar');
  if (!tokenCandidato) {
    btn.textContent = '🔒 Faça login para se candidatar';
    btn.onclick = () => { fecharModal('detalhes'); abrirModal('cad'); };
  } else if (!cadastroCompleto) {
    btn.textContent = '📝 Complete seu cadastro para candidatar-se';
    btn.onclick = () => { fecharModal('detalhes'); abrirModal('cad'); irParaEtapa(3); };
  } else {
    btn.textContent = '✅ Candidatar-se a esta vaga';
    btn.onclick = () => candidatar(vagaId);
  }
}

async function candidatar(vagaId) {
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
    document.getElementById('cad-email-2').value = emailVerificado || document.getElementById('cad-email').value;
  }
  if (id === 'login') {
    document.getElementById('login-etapa-1').style.display = 'block';
    document.getElementById('login-etapa-2').style.display = 'none';
  }
  document.getElementById('modal-' + id).classList.add('aberto');
}

function fecharModal(id) {
  document.getElementById('modal-' + id).classList.remove('aberto');
}

function irParaEtapa(n) {
  etapaCadastro = n;
  document.getElementById('cad-etapa-1').style.display = n === 1 ? 'block' : 'none';
  document.getElementById('cad-etapa-2').style.display = n === 2 ? 'block' : 'none';
  document.getElementById('cad-etapa-3').style.display = n === 3 ? 'block' : 'none';
}

// ETAPA 1: enviar código para o email
async function enviarCodigo() {
  const email = document.getElementById('cad-email').value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    alert('Informe um e-mail válido');
    return;
  }
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const r = await fetch(API + '/api/candidato/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await r.json();
    if (r.ok) {
      emailVerificado = email;
      document.getElementById('cad-email-2').value = email;
      document.getElementById('codigo-enviado-msg').textContent = 'Enviamos um código de 6 dígitos para ' + email;
      irParaEtapa(2);
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível enviar'));
    }
  } catch (e) {
    alert('Erro de conexão. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar código';
  }
}

// ETAPA 2: verificar código
async function verificarCodigo() {
  const codigo = document.getElementById('cad-codigo').value.trim();
  if (!codigo || codigo.length !== 6) {
    alert('Digite o código de 6 dígitos recebido por e-mail');
    return;
  }
  const btn = event.target;
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
      // checar se já tem perfil completo
      await checarPerfil();
      irParaEtapa(3);
    } else {
      alert('Erro: ' + (data.erro || 'Código inválido'));
    }
  } catch (e) {
    alert('Erro de conexão');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verificar código';
  }
}

async function checarPerfil() {
  try {
    const r = await fetch(API + '/api/candidato/perfil', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    const data = await r.json();
    if (data.candidato) {
      cadastroCompleto = true;
      // preencher form
      const c = data.candidato;
      document.getElementById('perfil-nome').value = c.nome || '';
      document.getElementById('perfil-cpf').value = c.cpf || '';
      document.getElementById('perfil-celular').value = c.celular || '';
      document.getElementById('perfil-nascimento').value = c.data_nascimento || '';
      document.getElementById('perfil-sexo').value = c.sexo || '';
      document.getElementById('perfil-cidade').value = c.cidade || '';
      document.getElementById('perfil-estado').value = c.estado || '';
      document.getElementById('perfil-formacao').value = c.formacao || '';
    }
  } catch (e) {}
}

// ETAPA 3: salvar perfil
async function salvarPerfil() {
  const perfil = {
    nome: document.getElementById('perfil-nome').value.trim(),
    cpf: document.getElementById('perfil-cpf').value.trim(),
    celular: document.getElementById('perfil-celular').value.trim(),
    data_nascimento: document.getElementById('perfil-nascimento').value || null,
    sexo: document.getElementById('perfil-sexo').value || null,
    cidade: document.getElementById('perfil-cidade').value.trim(),
    estado: document.getElementById('perfil-estado').value.trim().toUpperCase(),
    formacao: document.getElementById('perfil-formacao').value.trim()
  };
  if (!perfil.nome || !perfil.cpf) {
    alert('Nome e CPF são obrigatórios');
    return;
  }
  const btn = event.target;
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
      alert('✅ Cadastro concluído! Agora você pode se candidatar às vagas.');
      fecharModal('cad');
      atualizarHeaderUsuario();
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível salvar'));
    }
  } catch (e) {
    alert('Erro de conexão');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar e continuar';
  }
}

// LOGIN (reenviar código)
async function loginEnviarCodigo() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    alert('Informe um e-mail válido');
    return;
  }
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const r = await fetch(API + '/api/candidato/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (r.ok) {
      emailVerificado = email;
      document.getElementById('login-email-2').value = email;
      document.getElementById('login-etapa-1').style.display = 'none';
      document.getElementById('login-etapa-2').style.display = 'block';
    } else {
      const data = await r.json();
      alert('Erro: ' + (data.erro || ''));
    }
  } catch (e) {
    alert('Erro de conexão');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar código';
  }
}

async function loginVerificarCodigo() {
  const codigo = document.getElementById('login-codigo').value.trim();
  if (!codigo || codigo.length !== 6) {
    alert('Código inválido');
    return;
  }
  const btn = event.target;
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
      alert('✅ Login efetuado!');
    } else {
      alert('Erro: ' + (data.erro || 'Código inválido'));
    }
  } catch (e) {
    alert('Erro de conexão');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

function checarAuth() {
  const t = localStorage.getItem('candidato_token');
  if (t) {
    tokenCandidato = t;
    emailVerificado = localStorage.getItem('candidato_email');
    checarPerfil().then(atualizarHeaderUsuario);
  }
}

function atualizarHeaderUsuario() {
  const btnEntrar = document.querySelector('header .btn-outline');
  if (!btnEntrar) return;
  if (tokenCandidato) {
    btnEntrar.textContent = '👤 ' + (emailVerificado || 'Perfil');
    btnEntrar.onclick = () => abrirPainelCandidato();
  } else {
    btnEntrar.textContent = 'Entrar';
    btnEntrar.onclick = () => abrirModal('login');
  }
}

async function abrirPainelCandidato() {
  if (!cadastroCompleto) {
    irParaEtapa(3);
    abrirModal('cad');
    return;
  }
  // buscar candidaturas
  try {
    const r = await fetch(API + '/api/candidato/candidaturas', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    const data = await r.json();
    const lista = data.candidaturas || [];
    const html = lista.length === 0
      ? '<div class="empty"><p>Você ainda não se candidatou a nenhuma vaga.</p></div>'
      : lista.map(c => `
        <div class="cand-item">
          <div>
            <strong>${c.titulo}</strong>
            <div class="muted">${c.empresa} • ${c.cidade || ''}</div>
          </div>
          <span class="status status-${c.status}">${statusLabel(c.status)}</span>
        </div>
      `).join('');
    document.getElementById('minhas-cand-lista').innerHTML = html;
    document.getElementById('minhas-cand-email').textContent = emailVerificado;
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
    contratado: 'Contratado'
  }[s] || s;
}

function logout() {
  localStorage.removeItem('candidato_token');
  localStorage.removeItem('candidato_email');
  tokenCandidato = null;
  cadastroCompleto = false;
  emailVerificado = null;
  fecharModal('minhas');
  atualizarHeaderUsuario();
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
