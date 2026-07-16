// ============================================
// VAGAS.IO — Front-end do Candidato
// Conecta com backend: https://recrutamento-api.onrender.com
// Fluxo: Cadastro/Login com e-mail + senha (sem código de verificação)
// ============================================

const API = 'https://recrutamento-api.onrender.com';
let categoriaAtiva = '';
let vagaSelecionada = null;
let emailLogado = null;
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
  if (!grid) return;
  grid.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  const buscaEl = document.getElementById('busca');
  const busca = buscaEl ? buscaEl.value : '';
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
      if (contador) contador.textContent = '0 vagas encontradas';
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
    if (contador) contador.textContent = `${vagas.length} vaga${vagas.length !== 1 ? 's' : ''} encontrada${vagas.length !== 1 ? 's' : ''}`;
  } catch (e) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;color:#C00;">
      <div class="empty-icon">⚠️</div><h3>Não foi possível carregar as vagas</h3>
      <p>O servidor pode estar iniciando. Tente novamente.</p>
      <button class="btn btn-primary" style="width:auto;margin-top:16px" onclick="carregarVagas()">Tentar novamente</button>
    </div>`;
    if (contador) contador.textContent = 'Não foi possível carregar';
  }
}

function abrirDetalhes(id) {
  fetch(API + '/api/vagas/' + id)
    .then(r => r.json())
    .then(data => {
      const v = data.vaga || data;
      vagaSelecionada = v;
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setTxt('det-empresa', v.empresa || 'Confidencial');
      setTxt('det-titulo', v.titulo);
      setTxt('det-local', v.cidade || '—');
      setTxt('det-contrato', v.tipo_contrato || '—');
      setTxt('det-nivel', v.nivel || '—');
      setTxt('det-area', v.area || '—');
      const sal = (v.salario_min && v.salario_max) ? `R$ ${v.salario_min} - R$ ${v.salario_max}` : (v.salario || 'A combinar');
      setTxt('det-salario', sal);
      setTxt('det-descricao', v.descricao || 'Sem descrição');
      setTxt('det-requisitos', v.requisitos || '—');
      setTxt('det-beneficios', v.beneficios || '—');
      // Processo seletivo (se o backend devolver)
      const procEl = document.getElementById('det-processo');
      if (procEl) {
        if (v.processo_seletivo) {
          procEl.innerHTML = v.processo_seletivo;
        } else {
          procEl.innerHTML = `
            <ol class="processo-lista">
              <li><span class="proc-numero">1</span><div><strong>Inscrição</strong><p>Envie sua candidatura pela plataforma</p></div></li>
              <li><span class="proc-numero">2</span><div><strong>Triagem curricular</strong><p>Análise do perfil e documentos</p></div></li>
              <li><span class="proc-numero">3</span><div><strong>Entrevista RH</strong><p>Conversa inicial com o time de recrutamento</p></div></li>
              <li><span class="proc-numero">4</span><div><strong>Entrevista técnica</strong><p>Avaliação com o gestor da área</p></div></li>
              <li><span class="proc-numero">5</span><div><strong>Contratação</strong><p>Proposta formal e início</p></div></li>
            </ol>`;
        }
      }
      atualizarBotaoCandidatar(v.id);
      document.getElementById('modal-detalhes').classList.add('aberto');
    })
    .catch(() => alert('Erro ao carregar detalhes da vaga'));
}

function atualizarBotaoCandidatar(vagaId) {
  const btn = document.getElementById('btn-candidatar');
  if (!btn) return;
  if (!tokenCandidato) {
    btn.textContent = '🔒 Faça login para se candidatar';
    btn.disabled = false;
    btn.onclick = () => { fecharModal('detalhes'); abrirModal('login'); };
  } else if (!cadastroCompleto) {
    btn.textContent = '📝 Complete seu cadastro para candidatar-se';
    btn.disabled = false;
    btn.onclick = () => {
      emailLogado = localStorage.getItem('candidato_email') || emailLogado;
      const cadEmail = document.getElementById('cad-email');
      if (cadEmail) cadEmail.value = emailLogado || '';
      fecharModal('detalhes');
      abrirModal('cad');
      irParaEtapa(2);
    };
  } else {
    btn.textContent = '✅ Candidatar-se a esta vaga';
    btn.disabled = false;
    btn.onclick = () => candidatar(vagaId);
  }
}

async function candidatar(vagaId) {
  if (!tokenCandidato) {
    alert('Você precisa fazer login antes de se candidatar.');
    fecharModal('detalhes');
    abrirModal('login');
    return;
  }
  if (!cadastroCompleto) {
    alert('Complete seu cadastro antes de se candidatar.');
    fecharModal('detalhes');
    abrirModal('cad');
    irParaEtapa(2);
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

// ===== MODAIS =====
function abrirModal(id) {
  if (id === 'cad') {
    // Mostra etapa 2 (perfil). A etapa 1 (criar conta) só aparece se não estiver logado.
    const cadEtapa1 = document.getElementById('cad-etapa-1');
    if (cadEtapa1) cadEtapa1.style.setProperty('display', 'none', 'important');
    document.getElementById('cad-etapa-2').style.setProperty('display', 'block', 'important');
    const cadEtapa3 = document.getElementById('cad-etapa-3');
    if (cadEtapa3) cadEtapa3.style.setProperty('display', 'none', 'important');
    if (emailLogado) {
      const el = document.getElementById('cad-email');
      if (el) el.value = emailLogado;
    }
  }
  if (id === 'login') {
    // Reset login para etapa 1
    const etapa1 = document.getElementById('login-etapa-1');
    const etapa2 = document.getElementById('login-etapa-2');
    if (etapa1) etapa1.style.setProperty('display', 'block', 'important');
    if (etapa2) etapa2.style.setProperty('display', 'none', 'important');
  }
  if (id === 'cad-completo') {
    // Modal só com perfil (usuário já logado, quer editar)
    document.getElementById('cad-etapa-completo-1').style.setProperty('display', 'block', 'important');
    carregarDadosPerfil();
  }
  const modal = document.getElementById('modal-' + id);
  if (modal) modal.classList.add('aberto');
}

function fecharModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (modal) modal.classList.remove('aberto');
}

// Compat: o HTML antigo tem 3 etapas (1=código, 2=verificar, 3=perfil).
// Agora simplificamos: etapa 1 = criar conta, etapa 2 = perfil. Etapa 3 (legado) some.
function irParaEtapa(n) {
  const e1 = document.getElementById('cad-etapa-1');
  const e2 = document.getElementById('cad-etapa-2');
  const e3 = document.getElementById('cad-etapa-3');
  if (e1) e1.style.setProperty('display', 'none', 'important');
  if (e2) e2.style.setProperty('display', 'none', 'important');
  if (e3) e3.style.setProperty('display', 'none', 'important');
  if (n === 1 && e1) e1.style.setProperty('display', 'block', 'important');
  if (n === 2 && e2) e2.style.setProperty('display', 'block', 'important');
  if (n === 3 && e3) e3.style.setProperty('display', 'block', 'important');
}

// ===== CADASTRO (etapa 1: criar conta, etapa 2: completar perfil) =====
async function cadastrarConta(btn) {
  const nome = document.getElementById('cad-nome')?.value.trim();
  const email = document.getElementById('cad-email')?.value.trim().toLowerCase();
  const celular = document.getElementById('cad-celular')?.value.trim();
  const senha = document.getElementById('cad-senha')?.value;
  const senhaConf = document.getElementById('cad-senha-conf')?.value;

  if (!nome) return alert('Informe seu nome');
  if (!email || !email.includes('@')) return alert('Informe um e-mail válido');
  if (!celular) return alert('Informe seu celular/WhatsApp');
  if (!senha || senha.length < 6) return alert('A senha deve ter no mínimo 6 caracteres');
  if (senha !== senhaConf) return alert('As senhas não coincidem');

  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Criando conta...';
  try {
    const r = await fetch(API + '/api/candidato/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, celular, senha })
    });
    const data = await r.json();
    if (r.ok) {
      tokenCandidato = data.token;
      emailLogado = data.candidato.email;
      localStorage.setItem('candidato_token', tokenCandidato);
      localStorage.setItem('candidato_email', emailLogado);
      cadastroCompleto = false; // ainda não tem CPF, etc.
      // Avança para etapa 2 (perfil completo)
      irParaEtapa(2);
      atualizarHeaderUsuario();
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível criar a conta'));
    }
  } catch (e) {
    alert('Erro de conexão. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

async function salvarPerfil(btn) {
  const cpfRaw = document.getElementById('perfil-cpf')?.value.trim() || '';
  const cpf = cpfRaw.replace(/\D/g, '');
  const perfil = {
    nome: document.getElementById('perfil-nome')?.value.trim(),
    cpf: cpf,
    email: emailLogado,
    celular: document.getElementById('perfil-celular')?.value.trim(),
    data_nascimento: document.getElementById('perfil-nascimento')?.value || null,
    sexo: document.getElementById('perfil-sexo')?.value || null,
    cidade: document.getElementById('perfil-cidade')?.value.trim(),
    estado: document.getElementById('perfil-estado')?.value.trim().toUpperCase(),
    formacao: document.getElementById('perfil-formacao')?.value.trim()
  };
  if (!perfil.nome) { alert('Nome é obrigatório'); return; }
  if (!perfil.cpf || perfil.cpf.length !== 11) { alert('CPF é obrigatório (11 dígitos)'); return; }
  if (!tokenCandidato) { alert('Você precisa estar logado'); return; }
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
      fecharModal('cad-completo');
      atualizarHeaderUsuario();
      if (!btn.dataset.silencioso) {
        alert('✅ Cadastro concluído! Agora você pode se candidatar às vagas.');
      }
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

// ===== LOGIN (email + senha, etapa única) =====
async function loginEntrar(btn) {
  const email = document.getElementById('login-email')?.value.trim().toLowerCase();
  const senha = document.getElementById('login-senha')?.value;
  if (!email || !email.includes('@')) return alert('Informe um e-mail válido');
  if (!senha) return alert('Informe sua senha');

  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try {
    const r = await fetch(API + '/api/candidato/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const data = await r.json();
    if (r.ok) {
      tokenCandidato = data.token;
      emailLogado = data.candidato.email;
      localStorage.setItem('candidato_token', tokenCandidato);
      localStorage.setItem('candidato_email', emailLogado);
      await checarPerfil();
      fecharModal('login');
      atualizarHeaderUsuario();
      if (!cadastroCompleto) {
        abrirModal('cad');
        irParaEtapa(2);
      }
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível entrar'));
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
    if (r.status === 401) { logout(); return; }
    const data = await r.json();
    if (data.candidato) {
      const c = data.candidato;
      // Considera perfil completo se tem nome + cpf
      cadastroCompleto = !!(c.nome && c.cpf);
      // guarda no localStorage pra usar no header
      if (c.nome) localStorage.setItem('candidato_nome', c.nome);
    } else {
      cadastroCompleto = false;
    }
  } catch (e) {
    console.warn('Falha ao checar perfil:', e);
  }
}

async function carregarDadosPerfil() {
  if (!tokenCandidato) return;
  try {
    const r = await fetch(API + '/api/candidato/perfil', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (!r.ok) return;
    const data = await r.json();
    if (!data.candidato) return;
    const c = data.candidato;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== null && val !== undefined) el.value = val; };
    setVal('perfil-nome', c.nome);
    setVal('perfil-cpf', c.cpf);
    setVal('perfil-celular', c.celular);
    // Para <input type="date">, o backend manda DATE; o input aceita yyyy-mm-dd
    if (c.data_nascimento) {
      const dn = c.data_nascimento.substring(0, 10);
      setVal('perfil-nascimento', dn);
    }
    setVal('perfil-sexo', c.sexo);
    setVal('perfil-cidade', c.cidade);
    setVal('perfil-estado', c.estado);
    setVal('perfil-formacao', c.formacao);
    setVal('perfil-email-readonly', emailLogado);
  } catch (e) { console.warn(e); }
}

function checarAuth() {
  const t = localStorage.getItem('candidato_token');
  const e = localStorage.getItem('candidato_email');
  if (t && e) {
    tokenCandidato = t;
    emailLogado = e;
    checarPerfil().then(atualizarHeaderUsuario);
  }
}

function atualizarHeaderUsuario() {
  const btnEntrar = document.querySelector('header .btn-outline');
  if (!btnEntrar) return;
  if (tokenCandidato && cadastroCompleto) {
    const nome = localStorage.getItem('candidato_nome') || emailLogado;
    btnEntrar.textContent = '👤 ' + nome;
    btnEntrar.onclick = () => abrirPainelCandidato();
  } else if (tokenCandidato) {
    btnEntrar.textContent = '📝 Completar cadastro';
    btnEntrar.onclick = () => { abrirModal('cad'); irParaEtapa(2); };
  } else {
    btnEntrar.textContent = 'Entrar';
    btnEntrar.onclick = () => abrirModal('login');
  }
}

async function abrirPainelCandidato() {
  if (!cadastroCompleto) {
    abrirModal('cad');
    irParaEtapa(2);
    return;
  }
  // Recarrega dados do perfil pra ter o nome atualizado
  try {
    const rPerfil = await fetch(API + '/api/candidato/perfil', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (rPerfil.ok) {
      const dp = await rPerfil.json();
      if (dp.candidato && dp.candidato.nome) {
        localStorage.setItem('candidato_nome', dp.candidato.nome);
      }
    }
  } catch (e) { /* silencioso */ }

  try {
    const r = await fetch(API + '/api/candidato/candidaturas', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (r.status === 401) { logout(); alert('Sessão expirada'); return; }
    const data = await r.json();
    const lista = data.candidaturas || [];
    const nome = localStorage.getItem('candidato_nome') || emailLogado || '';
    const html = lista.length === 0
      ? '<div class="empty"><div class="empty-icon">📭</div><p>Você ainda não se candidatou a nenhuma vaga.</p><p style="font-size:13px;color:#888;margin-top:8px">Volte para a lista de vagas e candidate-se!</p></div>'
      : lista.map(c => `
        <div class="cand-item">
          <div>
            <strong>${c.titulo || 'Vaga'}</strong>
            <div class="muted">${c.empresa || ''} • ${c.cidade || ''}</div>
            <div class="muted" style="font-size:12px;margin-top:4px">📅 ${formatarData(c.criada_em)}</div>
          </div>
          <span class="status status-${c.status}">${statusLabel(c.status)}</span>
        </div>
      `).join('');
    document.getElementById('minhas-cand-lista').innerHTML = html;
    document.getElementById('minhas-cand-email').textContent = nome;
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
  localStorage.removeItem('candidato_nome');
  tokenCandidato = null;
  cadastroCompleto = false;
  emailLogado = null;
  atualizarHeaderUsuario();
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
  // celular do cadastro (semelhante)
  const cadCel = document.getElementById('cad-celular');
  if (cadCel) {
    cadCel.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length <= 10) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
      } else {
        v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
      }
      e.target.value = v;
    });
  }
});

// ============================================
// EXPOR NO WINDOW (para onclick inline funcionar)
// ============================================
window.cadastrarConta = cadastrarConta;
window.salvarPerfil = salvarPerfil;
window.loginEntrar = loginEntrar;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.irParaEtapa = irParaEtapa;
window.logout = logout;
window.carregarVagas = carregarVagas;
window.abrirDetalhes = abrirDetalhes;
window.candidatar = candidatar;
window.abrirPainelCandidato = abrirPainelCandidato;
window.atualizarHeaderUsuario = atualizarHeaderUsuario;
