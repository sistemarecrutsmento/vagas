// ============================================
// ADMIN — Painel de Recrutamento
// Conecta com backend: https://recrutamento-api.onrender.com
// ============================================

const API = 'https://recrutamento-api.onrender.com';
let token = null;
let vagaEmEdicao = null;

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('admin_token');
  if (saved) {
    token = saved;
    mostrarApp();
  }
});

// ===== AUTH =====
async function fazerLogin() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  try {
    const r = await fetch(API + '/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const data = await r.json();
    if (r.ok) {
      token = data.token;
      localStorage.setItem('admin_token', token);
      mostrarApp();
    } else {
      document.getElementById('alert-login').innerHTML = `<div class="alert alert-erro">${data.erro || 'Erro ao entrar'}</div>`;
    }
  } catch (e) {
    document.getElementById('alert-login').innerHTML = `<div class="alert alert-erro">Erro de conexão</div>`;
  }
}

function sair() {
  localStorage.removeItem('admin_token');
  location.reload();
}

function toggleMenu() {
  const aside = document.getElementById('aside');
  const app = document.getElementById('app');
  const aberto = aside?.classList.toggle('aberto');
  if (aberto) app?.classList.add('aside-aberto');
  else app?.classList.remove('aside-aberto');
}

function mostrarApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').classList.add('logado');
  irPara('dashboard');
}

// ===== NAVEGAÇÃO =====
function irPara(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('ativo'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('ativo'));
  document.getElementById('page-' + page).classList.add('ativo');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('ativo');
  // Fecha menu mobile ao navegar
  document.getElementById('aside')?.classList.remove('aberto');
  document.getElementById('app')?.classList.remove('aside-aberto');
  if (page === 'dashboard') carregarDashboard();
  if (page === 'vagas') carregarVagasAdmin();
  if (page === 'candidatos') carregarCandidatos();
  if (page === 'candidaturas') carregarCandidaturas();
}

// ===== DASHBOARD =====
async function carregarDashboard() {
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  try {
    const r = await fetch(API + '/api/admin/dashboard', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    const s = data.stats || {};
    grid.innerHTML = `
      <div class="stat-card vinho"><div class="label">Vagas Ativas</div><div class="valor">${s.vagas_ativas || 0}</div></div>
      <div class="stat-card"><div class="label">Total de Candidatos</div><div class="valor">${s.total_candidatos || 0}</div></div>
      <div class="stat-card verde"><div class="label">Processos Ativos</div><div class="valor">${s.processos_ativos || 0}</div></div>
      <div class="stat-card"><div class="label">Novos (7 dias)</div><div class="valor">${s.novos_7d || 0}</div></div>
    `;
    const tb = document.querySelector('#ranking-table tbody');
    if (data.ranking && data.ranking.length) {
      tb.innerHTML = data.ranking.map(v => `<tr><td>${v.titulo}</td><td>${v.empresa||'—'}</td><td style="text-align:right;font-weight:700;color:var(--vinho);">${v.total}</td></tr>`).join('');
    } else {
      tb.innerHTML = '<tr><td colspan="3" class="empty">Nenhuma vaga com candidatos ainda</td></tr>';
    }
  } catch {
    grid.innerHTML = '<div class="alert alert-erro">Erro ao carregar dashboard</div>';
  }
}

// ===== VAGAS =====
async function carregarVagasAdmin() {
  const tb = document.querySelector('#vagas-table tbody');
  tb.innerHTML = '<tr><td colspan="5" class="empty"><div class="spinner"></div></td></tr>';
  try {
    const r = await fetch(API + '/api/admin/vagas', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    const vagas = data.vagas || [];
    if (vagas.length === 0) {
      tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma vaga cadastrada. Clique em "+ Nova vaga" pra começar.</td></tr>';
      return;
    }
    tb.innerHTML = vagas.map(v => {
      const badge = v.status === 'publicada' ? 'badge-ativa' : v.status === 'pausada' ? 'badge-pendente' : 'badge-fechada';
      return `<tr>
        <td><strong>${v.titulo}</strong></td>
        <td>${v.empresa || '—'}</td>
        <td>${v.area || v.categoria || '—'}</td>
        <td><span class="badge ${badge}">${v.status === 'publicada' ? 'Publicada' : v.status === 'pausada' ? 'Pausada' : v.status === 'fechada' ? 'Fechada' : v.status}</span></td>
        <td><div class="acoes">
          <button onclick="editarVaga(${v.id})">Editar</button>
          <button class="perigo" onclick="deletarVaga(${v.id})">Excluir</button>
        </div></td>
      </tr>`;
    }).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="5" class="alert-erro">Erro ao carregar</td></tr>';
  }
}

function abrirModalVaga(vaga) {
  vagaEmEdicao = vaga || null;
  document.getElementById('vaga-modal-titulo').textContent = vaga ? 'Editar vaga' : 'Nova vaga';
  document.getElementById('vaga-id').value = vaga?.id || '';
  document.getElementById('v-titulo').value = vaga?.titulo || '';
  document.getElementById('v-empresa').value = vaga?.empresa || '';
  document.getElementById('v-categoria').value = vaga?.area || '';
  document.getElementById('v-nivel').value = vaga?.nivel || '';
  document.getElementById('v-cidade').value = vaga?.cidade || '';
  document.getElementById('v-estado').value = vaga?.estado || '';
  document.getElementById('v-salario-min').value = vaga?.salario_min || '';
  document.getElementById('v-salario-max').value = vaga?.salario_max || '';
  document.getElementById('v-tipo').value = vaga?.tipo_contrato || 'CLT';
  document.getElementById('v-status').value = vaga?.status || 'publicada';
  document.getElementById('v-descricao').value = vaga?.descricao || '';
  document.getElementById('v-requisitos').value = vaga?.requisitos || '';
  document.getElementById('v-beneficios').value = vaga?.beneficios || '';
  document.getElementById('alert-vaga').innerHTML = '';
  abrirModal('vaga');
}

async function editarVaga(id) {
  try {
    const r = await fetch(API + '/api/admin/vagas/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) throw new Error('Vaga não encontrada');
    const data = await r.json();
    abrirModalVaga(data.vaga);
  } catch (e) {
    alert('Erro ao carregar vaga: ' + e.message);
  }
}

async function salvarVaga() {
  const id = document.getElementById('vaga-id').value;
  const body = {
    titulo: document.getElementById('v-titulo').value,
    empresa: document.getElementById('v-empresa').value,
    area: document.getElementById('v-categoria').value,
    cidade: document.getElementById('v-cidade').value,
    estado: document.getElementById('v-estado').value,
    tipo_contrato: document.getElementById('v-tipo').value,
    nivel: document.getElementById('v-nivel').value,
    status: document.getElementById('v-status').value,
    descricao: document.getElementById('v-descricao').value,
    requisitos: document.getElementById('v-requisitos').value,
    beneficios: document.getElementById('v-beneficios').value
  };
  const salMin = document.getElementById('v-salario-min').value;
  const salMax = document.getElementById('v-salario-max').value;
  if (salMin) body.salario_min = parseFloat(salMin);
  if (salMax) body.salario_max = parseFloat(salMax);
  if (!body.titulo) {
    document.getElementById('alert-vaga').innerHTML = '<div class="alert alert-erro">Título é obrigatório</div>';
    return;
  }
  try {
    const url = id ? API + '/api/admin/vagas/' + id : API + '/api/admin/vagas';
    const method = id ? 'PUT' : 'POST';
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (r.ok) {
      fecharModal('vaga');
      carregarVagasAdmin();
    } else {
      document.getElementById('alert-vaga').innerHTML = `<div class="alert alert-erro">${data.erro || 'Erro ao salvar'}</div>`;
    }
  } catch {
    document.getElementById('alert-vaga').innerHTML = '<div class="alert alert-erro">Erro de conexão</div>';
  }
}

async function deletarVaga(id) {
  if (!confirm('⚠️ Excluir (fechar) esta vaga? Ela deixará de aparecer para os candidatos.')) return;
  try {
    // Backend não tem DELETE — usa PUT para mudar status para 'fechada'
    const r = await fetch(API + '/api/admin/vagas/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status: 'fechada' })
    });
    const data = await r.json();
    if (r.ok) {
      carregarVagasAdmin();
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível excluir'));
    }
  } catch (e) {
    alert('Erro de conexão: ' + e.message);
  }
}

// ===== CANDIDATOS =====
const AREAS_INTERESSE_ADMIN = [
  'Atendimento ao Cliente','Caixa','Vendas','Comercial','Administrativo','Recepção','Estoque','Logística','Expedição','Compras',
  'Financeiro','Recursos Humanos (RH)','Marketing','Telemarketing','Suporte Técnico','Tecnologia da Informação (TI)','Desenvolvimento de Software',
  'Design Gráfico','E-commerce','Supervisão','Gerência','Liderança Comercial','Operações','Produção','Qualidade','Segurança Patrimonial','Portaria',
  'Limpeza e Conservação','Serviços Gerais','Manutenção','Transporte','Motorista','Entregas','Alimentação e Restaurantes','Hotelaria e Turismo','Saúde',
  'Educação','Farmácia','Construção Civil','Indústria','Estágio','Jovem Aprendiz','Primeiro Emprego'
];

function popularSelectAreas() {
  const sel = document.getElementById('candidatos-filtro-area');
  if (!sel || sel.options.length > 1) return;
  AREAS_INTERESSE_ADMIN.forEach(a => {
    const o = document.createElement('option');
    o.value = a;
    o.textContent = a;
    sel.appendChild(o);
  });
}

function limparFiltrosCandidatos() {
  const sel = document.getElementById('candidatos-filtro-area');
  const inp = document.getElementById('candidatos-filtro-busca');
  if (sel) sel.value = '';
  if (inp) inp.value = '';
  carregarCandidatos();
}

async function carregarCandidatos() {
  popularSelectAreas();
  const tb = document.querySelector('#candidatos-table tbody');
  tb.innerHTML = '<tr><td colspan="7" class="empty"><div class="spinner"></div></td></tr>';
  try {
    const area = document.getElementById('candidatos-filtro-area')?.value || '';
    const busca = (document.getElementById('candidatos-filtro-busca')?.value || '').toLowerCase().trim();
    const url = API + '/api/admin/candidatos' + (area ? '?area=' + encodeURIComponent(area) : '');
    const r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    let lista = data.candidatos || [];
    if (busca) {
      lista = lista.filter(c =>
        (c.nome || '').toLowerCase().includes(busca) ||
        (c.email || '').toLowerCase().includes(busca)
      );
    }
    if (lista.length === 0) {
      tb.innerHTML = '<tr><td colspan="6" class="empty">Nenhum candidato encontrado' + (area ? ' com a área "' + area + '"' : '') + '</td></tr>';
      return;
    }
    tb.innerHTML = lista.map(c => {
      return `<tr>
        <td data-label="Nome"><strong>${c.nome}</strong></td>
        <td data-label="Email">${c.email || '—'}</td>
        <td data-label="Telefone">${c.celular || '—'}</td>
        <td data-label="Cidade">${c.cidade ? c.cidade + (c.estado ? '/' + c.estado : '') : '—'}</td>
        <td data-label="Cadastro">${formatarData(c.criado_em)}</td>
        <td data-label="Ações"><a class="btn-ver" href="javascript:void(0)" onclick="abrirCurriculo(${c.id})">👁 Ver currículo</a></td>
      </tr>`;
    }).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="6" class="alert-erro">Erro ao carregar</td></tr>';
  }
}

async function abrirCurriculo(id) {
  abrirModal('curriculo');
  const body = document.getElementById('curriculo-body');
  const titulo = document.getElementById('curriculo-titulo');
  body.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  titulo.textContent = '📄 Currículo do Candidato';
  try {
    const r = await fetch(API + '/api/admin/candidato/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      body.innerHTML = '<div class="alert alert-erro">Erro: ' + (err.erro || r.status) + '</div>';
      return;
    }
    const c = await r.json();
    const cand = c.candidato || c;
    titulo.textContent = '📄 ' + (cand.nome || 'Candidato');

    const areas = Array.isArray(cand.areas_interesse) ? cand.areas_interesse : [];
    const areasHtml = areas.length
      ? areas.map(a => `<span class="badge-area">${a}</span>`).join(' ')
      : '<span style="color:var(--cinza-medio)">Nenhuma área selecionada</span>';

    body.innerHTML = `
      <div class="curriculo-grid">
        <div class="curriculo-card">
          <h4>👤 Dados pessoais</h4>
          <div class="kv"><span>Nome</span><strong>${cand.nome || '—'}</strong></div>
          <div class="kv"><span>CPF</span><strong>${cand.cpf || '—'}</strong></div>
          <div class="kv"><span>Nascimento</span><strong>${formatarData(cand.data_nascimento)}</strong></div>
          <div class="kv"><span>Sexo</span><strong>${cand.sexo || '—'}</strong></div>
          <div class="kv"><span>Email</span><strong>${cand.email || '—'}</strong></div>
          <div class="kv"><span>Celular</span><strong>${cand.celular || '—'}</strong></div>
          <div class="kv"><span>Acessibilidade</span><strong>${cand.acessibilidade || 'Nenhuma'}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>📍 Endereço</h4>
          <div class="kv"><span>CEP</span><strong>${cand.cep || '—'}</strong></div>
          <div class="kv"><span>Logradouro</span><strong>${(cand.logradouro || '—') + (cand.numero ? ', ' + cand.numero : '')}${cand.complemento ? ' — ' + cand.complemento : ''}</strong></div>
          <div class="kv"><span>Bairro</span><strong>${cand.bairro || '—'}</strong></div>
          <div class="kv"><span>Cidade/UF</span><strong>${(cand.cidade || '—') + (cand.estado ? '/' + cand.estado : '')}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>🎓 Escolaridade</h4>
          <div class="kv"><span>Formação</span><strong>${cand.formacao || '—'}</strong></div>
          <div class="kv"><span>Instituição</span><strong>${cand.instituicao || '—'}</strong></div>
          <div class="kv"><span>Curso</span><strong>${cand.curso || '—'}</strong></div>
          <div class="kv"><span>Situação</span><strong>${cand.situacao || '—'}</strong></div>
          <div class="kv"><span>Conclusão</span><strong>${formatarData(cand.data_conclusao)}</strong></div>
          <div class="kv"><span>Primeiro emprego?</span><strong>${cand.primeiro_emprego ? 'Sim' : 'Não'}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>🎯 Áreas de interesse</h4>
          <div class="areas-badges" style="margin-top:8px">${areasHtml}</div>
        </div>
        <div class="curriculo-card curriculo-full">
          <h4>💼 Experiências</h4>
          <pre style="white-space:pre-wrap;font-family:inherit;background:#fafafa;padding:10px;border-radius:6px;margin-top:6px">${cand.experiencia || 'Não informado'}</pre>
        </div>
        <div class="curriculo-card curriculo-full">
          <h4>📝 Sobre você</h4>
          <pre style="white-space:pre-wrap;font-family:inherit;background:#fafafa;padding:10px;border-radius:6px;margin-top:6px">${cand.sobre_voce || 'Não informado'}</pre>
        </div>
        <div class="curriculo-card curriculo-full">
          <h4>📊 Status no Banco de Talentos</h4>
          <div class="kv"><span>Cadastro criado em</span><strong>${formatarData(cand.criado_em)}</strong></div>
          <div class="kv"><span>Autoriza banco de talentos</span><strong>${cand.banco_talentos ? '✅ Sim' : '❌ Não'}</strong></div>
        </div>
      </div>`;
  } catch (e) {
    body.innerHTML = '<div class="alert alert-erro">Erro: ' + e.message + '</div>';
  }
}

// ===== CANDIDATURAS =====
// ===== CANDIDATURAS (visão por vaga) =====
let vagaAtualCands = null;
let candidaturaAtual = null;
let candidaturasVagaCache = [];

async function carregarCandidaturas() {
  const grid = document.getElementById('vagas-cands-grid');
  grid.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  try {
    const r = await fetch(API + '/api/admin/vagas-com-candidaturas', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      grid.innerHTML = '<div class="empty">Erro: ' + (err.erro || r.status) + '</div>';
      return;
    }
    const data = await r.json();
    const vagas = data.vagas || [];
    if (vagas.length === 0) {
      grid.innerHTML = '<div class="empty">Nenhuma vaga com candidatos ainda.</div>';
      return;
    }
    grid.innerHTML = vagas.map(v => {
      const statusBadge = v.status === 'publicada' ? 'badge-ativa' : 'badge-fechada';
      return `
        <div class="vaga-cand-card" onclick="abrirVagaCands(${v.id})" style="cursor:pointer">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <h3 style="margin:0;font-size:16px;color:var(--vinho)">${v.titulo}</h3>
            <span class="badge ${statusBadge}">${v.status === 'publicada' ? 'Publicada' : v.status === 'pausada' ? 'Pausada' : v.status === 'fechada' ? 'Fechada' : v.status}</span>
          </div>
          <div style="font-size:13px;color:var(--cinza-medio);margin-bottom:12px">${v.empresa || '—'} • ${v.cidade || ''}${v.estado ? '/' + v.estado : ''}</div>
          <div class="vaga-cand-stats">
            <div class="vaga-cand-stat">
              <div class="vaga-cand-stat-num">${v.total_ativas || 0}</div>
              <div class="vaga-cand-stat-label">Candidatos</div>
            </div>
            <div class="vaga-cand-stat">
              <div class="vaga-cand-stat-num" style="color:#28a745">${v.contratados || 0}</div>
              <div class="vaga-cand-stat-label">Contratados</div>
            </div>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:12px">👁 Ver candidatos</button>
        </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<div class="empty">Erro de conexão: ' + e.message + '</div>';
  }
}

function irParaPagina(page) {
  // Marca o item da sidebar como ativo
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('ativo', n.getAttribute('data-page') === page);
  });
  // Fecha menu mobile
  document.getElementById('aside')?.classList.remove('aberto');
  document.getElementById('app')?.classList.remove('aside-aberto');
  // Mostra a página certa
  document.querySelectorAll('.page').forEach(p => p.classList.remove('ativo'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('ativo');
}

async function abrirVagaCands(vagaId) {
  irParaPagina('candidatos-vaga');
  const tb = document.querySelector('#vaga-cands-internal-table tbody');
  tb.innerHTML = '<tr><td colspan="7" class="empty"><div class="spinner"></div></td></tr>';
  try {
    const r = await fetch(API + '/api/admin/vagas/' + vagaId + '/candidaturas', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      tb.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + (err.erro || r.status) + '</td></tr>';
      return;
    }
    const data = await r.json();
    vagaAtualCands = data.vaga;
    candidaturasVagaCache = data.candidaturas || [];

    document.getElementById('cands-vaga-titulo').textContent = '👥 ' + data.vaga.titulo + ' — Candidatos';
    document.getElementById('cands-vaga-voltar').onclick = () => irParaPagina('candidaturas');
    const info = document.getElementById('cands-vaga-info');
    info.innerHTML = `
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div><strong>Empresa:</strong> ${data.vaga.empresa || '—'}</div>
        <div><strong>Local:</strong> ${data.vaga.cidade || '—'}${data.vaga.estado ? '/' + data.vaga.estado : ''}</div>
        <div><strong>Total de candidatos:</strong> ${candidaturasVagaCache.length}</div>
        <div><strong>Criada em:</strong> ${formatarData(data.vaga.criada_em)}</div>
      </div>`;

    if (candidaturasVagaCache.length === 0) {
      tb.innerHTML = '<tr><td colspan="7" class="empty">Nenhum candidato para esta vaga.</td></tr>';
      return;
    }
    tb.innerHTML = candidaturasVagaCache.map(c => {
      const badge = c.status === 'contratado' ? 'badge-ativa' : (c.status === 'rejeitado' || c.status === 'reprovado') ? 'badge-fechada' : (c.status === 'aprovado' ? 'badge-ativa' : 'badge-pendente');
      // Resolve nome da etapa (etapa_atual é 1-based: 1=Inscrição, 2=Triagem, ...)
      // O campo 'etapas' vem na VAGA, não na candidatura.
      let etapasArr = [];
      const fonteEtapas = data.vaga && data.vaga.etapas ? data.vaga.etapas : null;
      try { etapasArr = typeof fonteEtapas === 'string' ? JSON.parse(fonteEtapas) : fonteEtapas; } catch(e) {}
      if (!Array.isArray(etapasArr)) etapasArr = [];
      const numEtapa = c.etapa_atual || 1;  // 1-based
      const idxZero = numEtapa - 1;
      const etapaNome = (etapasArr[idxZero] && (typeof etapasArr[idxZero] === 'string' ? etapasArr[idxZero] : etapasArr[idxZero].nome)) || `Etapa ${numEtapa}`;
      return `<tr>
        <td><strong>${c.nome || '—'}</strong></td>
        <td>${c.email || '—'}</td>
        <td>${c.cidade ? (c.cidade + (c.estado ? '/' + c.estado : '')) : '<span style="color:var(--cinza-medio)">Não informada</span>'}</td>
        <td>${numEtapa}. ${etapaNome}</td>
        <td><span class="badge ${badge}">${c.status === 'em_analise' ? 'Em análise' : c.status === 'em_andamento' ? 'Em andamento' : c.status === 'contratado' ? 'Contratado' : c.status === 'reprovado' ? 'Reprovado' : c.status === 'rejeitado' ? 'Rejeitado' : c.status === 'aprovado' ? 'Aprovado' : c.status}</span></td>
        <td>${formatarData(c.criada_em)}</td>
        <td>
          <a class="btn-ver" href="javascript:void(0)" onclick="analisarCandidatura(${c.id})">👁 Ver</a>
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + e.message + '</td></tr>';
  }
}

async function acaoCandidatura(id, acao) {
  const mensagens = {
    'avancar': 'Avançar o candidato para a próxima etapa do processo seletivo?',
    'reprovar': 'Marcar este candidato como NÃO SELECIONADO? Esta ação pode ser revertida.',
    'reabrir': 'Reabrir a candidatura? Voltará para análise inicial.'
  };
  if (!confirm(mensagens[acao])) return;
  try {
    const r = await fetch(API + '/api/admin/candidatura/' + id + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ acao })
    });
    const data = await r.json();
    if (!r.ok) { alert('Erro: ' + (data.erro || 'Não foi possível atualizar')); return; }
    if (vagaAtualCands) {
      const r2 = await fetch(API + '/api/admin/vagas/' + vagaAtualCands.id + '/candidaturas', { headers: { 'Authorization': 'Bearer ' + token } });
      if (r2.ok) {
        const d2 = await r2.json();
        candidaturasVagaCache = d2.candidaturas || [];
      }
    }
  } catch (e) {
    alert('Erro de conexão: ' + e.message);
  }
}

function escapeHTML(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}


  if (!confirm('Alterar status para "' + status + '"?')) return;
  try {
    const r = await fetch(API + '/api/admin/candidatura/' + id + '/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status })
    });
    const data = await r.json();
    if (r.ok) {
      carregarCandidaturas();
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível atualizar'));
    }
  } catch (e) {
    alert('Erro de conexão: ' + e.message);
  }
}

// verCandidatura stub removido (analisarCandidatura apagada)


async function mudarStatus(id, status) {
  if (!confirm('Alterar status para "' + status + '"?')) return;
  try {
    const r = await fetch(API + '/api/admin/candidatura/' + id + '/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status })
    });
    const data = await r.json();
    if (r.ok) {
      carregarCandidaturas();
    } else {
      alert('Erro: ' + (data.erro || 'Não foi possível atualizar'));
    }
  } catch (e) {
    alert('Erro de conexão: ' + e.message);
  }
}

async function verCandidatura(id) {
  const container = document.getElementById('candidatura-detalhes');
  container.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  abrirModal('candidatura');
  try {
    const r = await fetch(API + '/api/admin/candidatura/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    if (!r.ok) {
      container.innerHTML = `<div class="alert alert-erro">${data.erro || 'Erro'}</div>`;
      return;
    }
    const c = data.candidatura;
    container.innerHTML = `
      <div class="det-grid">
        <div class="det-item"><div class="det-label">Candidato</div><div class="det-value">${c.nome || '—'}</div></div>
        <div class="det-item"><div class="det-label">E-mail</div><div class="det-value">${c.email || '—'}</div></div>
        <div class="det-item"><div class="det-label">Celular</div><div class="det-value">${c.celular || '—'}</div></div>
        <div class="det-item"><div class="det-label">CPF</div><div class="det-value">${c.cpf || '—'}</div></div>
        <div class="det-item"><div class="det-label">Vaga</div><div class="det-value">${c.titulo || '—'}</div></div>
        <div class="det-item"><div class="det-label">Empresa</div><div class="det-value">${c.empresa || '—'}</div></div>
        <div class="det-item"><div class="det-label">Status</div><div class="det-value"><span class="badge ${c.status === 'contratado' ? 'badge-ativa' : (c.status === 'reprovado' || c.status === 'rejeitado') ? 'badge-fechada' : c.status === 'aprovado' ? 'badge-ativa' : 'badge-pendente'}">${c.status === 'em_analise' ? 'Em análise' : c.status === 'em_andamento' ? 'Em andamento' : c.status === 'contratado' ? 'Contratado' : c.status === 'reprovado' ? 'Reprovado' : c.status === 'rejeitado' ? 'Rejeitado' : c.status === 'aprovado' ? 'Aprovado' : c.status}</span></div></div>
        <div class="det-item"><div class="det-label">Criada em</div><div class="det-value">${formatarData(c.criada_em)}</div></div>
      </div>
      <div class="det-section">
        <h3>Histórico</h3>
        ${(c.historico && c.historico.length > 0)
          ? '<ul style="list-style:none;padding:0;">' + c.historico.map(h => {
              const d = h.data ? new Date(h.data).toLocaleString('pt-BR') : '';
              const m = h.mensagem ? '<br><em style="color:var(--cinza-medio);">' + h.mensagem + '</em>' : '';
              const p = h.por ? '<br><small>por ' + h.por + '</small>' : '';
              return '<li style="padding:10px;border-left:3px solid var(--vinho);margin-bottom:8px;background:#f9f9f9;"><strong>' + (h.etapa || h.status) + '</strong> [' + h.status + '] — ' + d + p + m + '</li>';
            }).join('') + '</ul>'
          : '<p style="color:var(--cinza-medio);">Nenhuma movimentação ainda.</p>'}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="alert alert-erro">Erro: ${e.message}</div>`;
  }
}

// ===== MODAL =====
function abrirModal(id) { document.getElementById('modal-' + id).classList.add('aberto'); }
function fecharModal(id) { document.getElementById('modal-' + id).classList.remove('aberto'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('aberto'); });
});

// ===== UTIL =====
function formatarData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}
