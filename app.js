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
    grid.innerHTML = vagas.map(v => {
      const sMin = Number(v.salario_min) || null;
      const sMax = Number(v.salario_max) || null;
      const salTexto = (sMin && sMax) ? `R$ ${sMin.toLocaleString('pt-BR')} - R$ ${sMax.toLocaleString('pt-BR')}` : (v.salario || 'A combinar');
      return `
      <div class="vaga-card" onclick="abrirDetalhes(${v.id})">
        <div class="empresa">${v.empresa || 'Empresa'}</div>
        <h3>${v.titulo}</h3>
        <div class="vaga-tags">
          ${v.area ? `<span class="tag">${v.area}</span>` : ''}
          ${v.modalidade ? `<span class="tag">${v.modalidade}</span>` : ''}
          ${v.cidade ? `<span class="tag">📍 ${v.cidade}</span>` : ''}
        </div>
        <div class="salario">${salTexto}</div>
        <div class="footer">
          <span class="data">${formatarData(v.criada_em)}</span>
          <span class="cta">Ver detalhes →</span>
        </div>
      </div>
    `;
    }).join('');
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
      const salMin = Number(v.salario_min) || null;
      const salMax = Number(v.salario_max) || null;
      const sal = (salMin && salMax) ? `R$ ${salMin.toLocaleString('pt-BR')} - R$ ${salMax.toLocaleString('pt-BR')}` : (v.salario || 'A combinar');
      setTxt('det-salario', sal);
      setTxt('det-descricao', v.descricao || 'Sem descrição');
      setTxt('det-requisitos', v.requisitos || '—');
      setTxt('det-beneficios', v.beneficios || '—');
      // Processo seletivo (vem do admin em 'etapas' como JSON [{nome:"..."}])
      const procEl = document.getElementById('det-processo');
      if (procEl) {
        let etapas = v.etapas;
        // Pode vir como string JSON (banco TEXT) ou array
        if (typeof etapas === 'string') {
          try { etapas = JSON.parse(etapas); } catch (e) { etapas = null; }
        }
        if (Array.isArray(etapas) && etapas.length) {
          procEl.innerHTML = `<ol class="processo-lista">` + etapas.map((e, i) => {
            const nome = (typeof e === 'string') ? e : (e.nome || e.titulo || `Etapa ${i+1}`);
            const desc = (typeof e === 'string') ? '' : (e.descricao || '');
            return `<li><span class="proc-numero">${i+1}</span><div><strong>${nome}</strong>${desc ? `<p>${desc}</p>` : ''}</div></li>`;
          }).join('') + `</ol>`;
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
    const cadEtapa1 = document.getElementById('cad-etapa-1');
    const cadEtapa2 = document.getElementById('cad-etapa-2');
    const cadEtapa3 = document.getElementById('cad-etapa-3');
    // Se já tem token (criou conta mas falta perfil) → vai direto pra etapa 2
    // Senão → etapa 1 (criar conta com email+senha)
    if (tokenCandidato) {
      if (cadEtapa1) cadEtapa1.style.setProperty('display', 'none', 'important');
      if (cadEtapa2) cadEtapa2.style.setProperty('display', 'block', 'important');
    } else {
      if (cadEtapa1) cadEtapa1.style.setProperty('display', 'block', 'important');
      if (cadEtapa2) cadEtapa2.style.setProperty('display', 'none', 'important');
    }
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
  if (!tokenCandidato) { abrirModal('login'); return; }
  if (!cadastroCompleto) {
    abrirModal('cad');
    irParaEtapa(2);
    return;
  }

  document.getElementById('modal-minhas').classList.add('aberto');
  await carregarPainel();
}

async function carregarPainel() {
  // 1) Perfil
  let perfil = null;
  try {
    const r = await fetch(API + '/api/candidato/perfil', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (r.status === 401) { logout(); return; }
    const dp = await r.json();
    perfil = dp.candidato;
  } catch (e) {}

  if (perfil) {
    const nome = perfil.nome || emailLogado;
    const iniciais = (perfil.nome || emailLogado || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
    document.getElementById('painel-foto').textContent = iniciais || '👤';
    document.getElementById('painel-nome').textContent = nome;
    document.getElementById('painel-email').textContent = perfil.email || emailLogado || '';
    localStorage.setItem('candidato_nome', nome);
  }

  // 2) Progresso do perfil
  const pFill = document.getElementById('painel-progresso-fill');
  const pPct = document.getElementById('painel-progresso-pct');
  const pDica = document.getElementById('painel-progresso-dica');
  if (perfil) {
    const campos = ['cpf', 'data_nascimento', 'sexo', 'celular', 'cep', 'cidade', 'estado', 'bairro', 'logradouro', 'formacao', 'instituicao'];
    const preenchidos = campos.filter(c => perfil[c] && String(perfil[c]).trim() !== '').length;
    const pct = Math.round((preenchidos / campos.length) * 100);
    pFill.style.width = pct + '%';
    pPct.textContent = pct + '%';
    pDica.textContent = pct === 100
      ? '🎉 Seu perfil está completo!'
      : `Preencha mais ${campos.length - preenchidos} campos para melhorar seu currículo.`;
  }

  // 3) Preencher form de edição
  carregarDadosPerfil(perfil);

  // 4) Candidaturas
  const listaEl = document.getElementById('painel-cands-lista');
  listaEl.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  try {
    const r = await fetch(API + '/api/candidato/candidaturas', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (r.status === 401) { logout(); return; }
    const data = await r.json();
    const lista = data.candidaturas || [];

    if (lista.length === 0) {
      listaEl.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📭</div>
          <p>Você ainda não se candidatou a nenhuma vaga.</p>
          <p style="font-size:13px;color:#888;margin-top:8px">Volte para a lista de vagas e candidate-se!</p>
          <button class="btn btn-primary" style="width:auto;margin-top:16px" onclick="fecharModal('minhas')">Ver vagas</button>
        </div>`;
      return;
    }

    // Buscar etapas de cada vaga pra montar a timeline
    const cands = await Promise.all(lista.map(async (c) => {
      try {
        const rv = await fetch(API + '/api/vagas/' + c.vaga_id);
        const dv = await rv.json();
        const v = dv.vaga || dv;
        let etapas = v.etapas;
        if (typeof etapas === 'string') {
          try { etapas = JSON.parse(etapas); } catch (e) { etapas = null; }
        }
        if (!Array.isArray(etapas) || !etapas.length) {
          etapas = ['Inscrição', 'Triagem', 'Entrevista RH', 'Entrevista gestor', 'Contratação'];
        }
        return { ...c, etapas, vagaTitulo: v.titulo, vagaEmpresa: v.empresa, vagaCidade: v.cidade };
      } catch (e) {
        return { ...c, etapas: ['Inscrição', 'Triagem', 'Entrevista', 'Contratação'], vagaTitulo: c.titulo };
      }
    }));

    listaEl.innerHTML = cands.map(c => {
      const etapaAtual = Number(c.etapa_atual || 0);
      const etapasHTML = c.etapas.map((e, i) => {
        const nome = (typeof e === 'string') ? e : (e.nome || `Etapa ${i+1}`);
        const cls = i < etapaAtual ? 'concluida' : (i === etapaAtual ? 'ativa' : '');
        return `<div class="cand-etapa ${cls}">
          <div class="cand-etapa-bola">${i < etapaAtual ? '✓' : i+1}</div>
          <div class="cand-etapa-label">${nome}</div>
        </div>`;
      }).join('');
      return `
        <div class="cand-card">
          <div class="cand-card-top">
            <div>
              <h4>${c.vagaTitulo || c.titulo || 'Vaga'}</h4>
              <div class="cand-empresa">${c.vagaEmpresa || c.empresa || ''} ${c.vagaCidade || c.cidade ? '• ' + (c.vagaCidade || c.cidade) : ''}</div>
            </div>
            <span class="status status-${c.status}">${statusLabel(c.status)}</span>
          </div>
          <div class="cand-timeline">${etapasHTML}</div>
          <div style="margin-top:8px;font-size:12px;color:#888">📅 Inscrito em ${formatarData(c.criada_em)}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    listaEl.innerHTML = '<div class="empty">Erro ao carregar candidaturas.</div>';
  }
}

function carregarDadosPerfil(perfil) {
  if (!perfil) return;
  const map = {
    'pe-nome': perfil.nome,
    'pe-cpf': perfil.cpf,
    'pe-nascimento': perfil.data_nascimento ? String(perfil.data_nascimento).substring(0,10) : '',
    'pe-sexo': perfil.sexo || '',
    'pe-celular': perfil.celular,
    'pe-email': perfil.email,
    'pe-cep': perfil.cep,
    'pe-cidade': perfil.cidade,
    'pe-estado': perfil.estado,
    'pe-bairro': perfil.bairro,
    'pe-logradouro': perfil.logradouro,
    'pe-numero': perfil.numero,
    'pe-complemento': perfil.complemento,
    'pe-formacao': perfil.formacao,
    'pe-instituicao': perfil.instituicao,
    'pe-curso': perfil.curso,
    'pe-situacao': perfil.situacao,
    'pe-primeiro-emprego': perfil.primeiro_emprego ? 'true' : 'false',
    'pe-acessibilidade': perfil.acessibilidade,
    'pe-comunicacoes': !!perfil.recebe_comunicacoes
  };
  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = (val == null ? '' : val);
    }
  }
}

async function salvarPerfilCompleto(btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  const payload = {
    nome: document.getElementById('pe-nome').value.trim(),
    cpf: document.getElementById('pe-cpf').value.replace(/\D/g, ''),
    data_nascimento: document.getElementById('pe-nascimento').value || null,
    sexo: document.getElementById('pe-sexo').value || null,
    celular: document.getElementById('pe-celular').value.trim(),
    cep: document.getElementById('pe-cep').value.replace(/\D/g, ''),
    cidade: document.getElementById('pe-cidade').value.trim(),
    estado: document.getElementById('pe-estado').value.trim().toUpperCase(),
    bairro: document.getElementById('pe-bairro').value.trim(),
    logradouro: document.getElementById('pe-logradouro').value.trim(),
    numero: document.getElementById('pe-numero').value.trim(),
    complemento: document.getElementById('pe-complemento').value.trim(),
    formacao: document.getElementById('pe-formacao').value || null,
    instituicao: document.getElementById('pe-instituicao').value.trim(),
    curso: document.getElementById('pe-curso').value.trim(),
    situacao: document.getElementById('pe-situacao').value || null,
    primeiro_emprego: document.getElementById('pe-primeiro-emprego').value === 'true',
    acessibilidade: document.getElementById('pe-acessibilidade').value || null,
    recebe_comunicacoes: document.getElementById('pe-comunicacoes').checked
  };
  try {
    const r = await fetch(API + '/api/candidato/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenCandidato },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (r.ok) {
      cadastroCompleto = true;
      localStorage.setItem('candidato_nome', payload.nome);
      if (btn) { btn.textContent = '✓ Salvo!'; btn.style.background = 'var(--verde)'; }
      setTimeout(() => { if (btn) { btn.textContent = 'Salvar perfil'; btn.style.background = ''; btn.disabled = false; } carregarPainel(); }, 800);
    } else {
      alert('Erro: ' + (data.erro || ''));
      if (btn) { btn.disabled = false; btn.textContent = 'Salvar perfil'; }
    }
  } catch (e) {
    alert('Erro de conexão');
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar perfil'; }
  }
}

// ===== ABAS DO PAINEL =====
function painelIrPara(tab) {
  document.querySelectorAll('.painel-tab').forEach(t => t.classList.remove('ativo'));
  document.querySelectorAll('.painel-secao').forEach(s => s.classList.remove('ativo'));
  const tabEl = document.querySelector(`.painel-tab[data-tab="${tab}"]`);
  const secEl = document.getElementById('painel-secao-' + tab);
  if (tabEl) tabEl.classList.add('ativo');
  if (secEl) secEl.classList.add('ativo');
  if (tab === 'cands') carregarPainel();
  if (tab === 'perfil') carregarPainel(); // recarrega p/ ter dados atualizados
}
window.painelIrPara = painelIrPara;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.painel-tab[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => painelIrPara(btn.dataset.tab));
  });
  document.querySelectorAll('.perfil-aba').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.sub;
      document.querySelectorAll('.perfil-aba').forEach(b => b.classList.remove('ativo'));
      document.querySelectorAll('.perfil-bloco').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const bloco = document.querySelector(`.perfil-bloco[data-bloco="${sub}"]`);
      if (bloco) bloco.classList.add('ativo');
    });
  });
});

async function trocarSenha(btn) {
  const atual = document.getElementById('senha-atual').value;
  const nova = document.getElementById('senha-nova').value;
  const conf = document.getElementById('senha-nova-conf').value;
  if (!atual || !nova || !conf) { alert('Preencha todos os campos'); return; }
  if (nova.length < 6) { alert('A nova senha deve ter pelo menos 6 caracteres'); return; }
  if (nova !== conf) { alert('A confirmação não confere com a nova senha'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Atualizando...'; }
  try {
    const r = await fetch(API + '/api/candidato/trocar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenCandidato },
      body: JSON.stringify({ senhaAtual: atual, novaSenha: nova })
    });
    const data = await r.json();
    if (r.ok) {
      if (btn) { btn.textContent = '✓ Senha atualizada!'; btn.style.background = 'var(--verde)'; }
      setTimeout(() => { if (btn) { btn.textContent = 'Atualizar senha'; btn.style.background = ''; btn.disabled = false; } document.getElementById('senha-atual').value = ''; document.getElementById('senha-nova').value = ''; document.getElementById('senha-nova-conf').value = ''; }, 800);
    } else {
      alert('Erro: ' + (data.erro || ''));
      if (btn) { btn.disabled = false; btn.textContent = 'Atualizar senha'; }
    }
  } catch (e) {
    alert('Erro de conexão');
    if (btn) { btn.disabled = false; btn.textContent = 'Atualizar senha'; }
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
window.salvarPerfilCompleto = salvarPerfilCompleto;
window.trocarSenha = trocarSenha;
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
