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
async function carregarCandidatos() {
  const tb = document.querySelector('#candidatos-table tbody');
  tb.innerHTML = '<tr><td colspan="5" class="empty"><div class="spinner"></div></td></tr>';
  try {
    const r = await fetch(API + '/api/admin/candidatos', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    const lista = data.candidatos || [];
    if (lista.length === 0) {
      tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhum candidato cadastrado</td></tr>';
      return;
    }
    tb.innerHTML = lista.map(c => `<tr>
      <td><strong>${c.nome}</strong></td>
      <td>${c.email || '—'}</td>
      <td>${c.cpf || '—'}</td>
      <td>${c.cidade || '—'}</td>
      <td>${formatarData(c.criado_em)}</td>
    </tr>`).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="5" class="alert-erro">Erro ao carregar</td></tr>';
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
          <a class="btn-ver" href="analisar.html?id=${c.id}">👁 Ver</a>
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + e.message + '</td></tr>';
  }
}

async function analisarCandidatura(id) {
  candidaturaAtual = id;
  irParaPagina('analisar');
  const body = document.getElementById('analisar-internal-body');
  body.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  document.getElementById('analisar-voltar').onclick = () => {
    if (vagaAtualCands) abrirVagaCands(vagaAtualCands.id);
    else irParaPagina('candidaturas');
  };
  try {
    const r = await fetch(API + '/api/admin/candidatura/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      body.innerHTML = '<div class="empty">Erro: ' + (err.erro || r.status) + '</div>';
      return;
    }
    const data = await r.json();
    const c = data.candidatura;
    document.getElementById('analisar-internal-titulo').textContent = (c.nome || 'Candidato') + ' — ' + (c.titulo || 'Vaga');
    renderAnalise(c, body);
  } catch (e) {
    body.innerHTML = '<div class="empty">Erro: ' + e.message + '</div>';
  }
}

function renderAnalise(c, container) {
  // Etapas da vaga
  let etapas = c.etapas;
  if (typeof etapas === 'string') {
    try { etapas = JSON.parse(etapas); } catch (e) { etapas = null; }
  }
  if (!Array.isArray(etapas) || !etapas.length) {
    etapas = ['Inscrição','Triagem curricular','Entrevista RH','Entrevista gestor','Proposta','Coleta de documentos','Contratação'];
  }
  const etapaAtual = Number(c.etapa_atual || 0);
  const reprovado = c.status === 'rejeitado' || c.status === 'reprovado';
  const contratado = c.status === 'contratado';

  const etapasHTML = etapas.map((e, i) => {
    const nome = (typeof e === 'string') ? e : (e.nome || `Etapa ${i+1}`);
    let cls = '';
    if (reprovado) {
      cls = i < etapaAtual ? 'concluida' : (i === etapaAtual ? 'rejeitada' : '');
    } else if (contratado) {
      cls = 'concluida';
    } else if (i < etapaAtual) {
      cls = 'concluida';
    } else if (i === etapaAtual) {
      cls = 'atual';
    }
    return '<div class="analisar-etapa ' + cls + '">' +
      '<div class="analisar-etapa-bola">' + (cls === 'concluida' ? '✓' : (i+1)) + '</div>' +
      '<div class="analisar-etapa-label">' + nome + '</div>' +
    '</div>';
  }).join('');

  const expsHTML = (c.experiencias && c.experiencias.length)
    ? c.experiencias.map(x => {
        return '<div style="border-left:3px solid var(--vinho);padding:8px 12px;margin-bottom:8px;background:#f9f9f9;border-radius:0 6px 6px 0">' +
          '<strong>' + (x.cargo || '—') + '</strong>' + (x.empresa ? ' • ' + x.empresa : '') +
          '<div style="font-size:12px;color:var(--cinza-medio);margin-top:2px">' +
            (x.inicio ? new Date(x.inicio).toLocaleDateString('pt-BR') : '—') + ' → ' + (x.emprego_atual ? 'Atual' : (x.fim ? new Date(x.fim).toLocaleDateString('pt-BR') : '—')) +
          '</div>' +
          (x.descricao ? '<div style="margin-top:6px;font-size:13px">' + escapeHTML(x.descricao) + '</div>' : '') +
        '</div>';
      }).join('')
    : '<p style="color:var(--cinza-medio);font-size:13px">Nenhuma experiência cadastrada.</p>';

  const statusLabel = contratado ? 'Contratado ✅' : reprovado ? 'Não selecionado ❌' : (c.status === 'aprovado' ? 'Aprovado ✅' : (c.status === 'em_andamento' ? 'Em andamento' : 'Em análise'));

  container.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">' +
      '<div>' +
        '<h3 style="margin:0 0 8px 0;font-size:18px">' + (c.nome || '—') + '</h3>' +
        '<div style="color:var(--cinza-medio);font-size:14px;line-height:1.7">' +
          '📧 ' + (c.email || '—') + '<br>' +
          '📱 ' + (c.celular || '—') + '<br>' +
          '🆔 CPF: ' + (c.cpf || '—') + '<br>' +
          '🎂 Nasc.: ' + (c.data_nascimento ? new Date(c.data_nascimento).toLocaleDateString('pt-BR') : '—') + '<br>' +
          '📍 ' + (c.cd_cidade || '—') + (c.cd_estado ? '/' + c.cd_estado : '') + '<br>' +
          '🏠 ' + (c.logradouro ? c.logradouro + ', ' + (c.numero || 's/n') : '—') +
        '</div>' +
      '</div>' +
      '<div>' +
        '<h3 style="margin:0 0 8px 0;font-size:16px">Vaga: ' + (c.titulo || '—') + '</h3>' +
        '<div style="color:var(--cinza-medio);font-size:14px;line-height:1.7">' +
          '🏢 ' + (c.empresa || '—') + '<br>' +
          '📍 ' + (c.cidade || '—') + (c.estado ? '/' + c.estado : '') + '<br>' +
          '📅 Inscrição: ' + formatarData(c.criada_em) + '<br>' +
          '<strong style="color:var(--vinho)">Status atual: ' + statusLabel + '</strong><br>' +
          '<strong>Etapa atual: ' + (etapaAtual + 1) + ' de ' + etapas.length + '</strong>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="analisar-timeline">' + etapasHTML + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">' +
      '<div class="analisar-bloco">' +
        '<h4>🎓 Formação</h4>' +
        '<p><strong>' + (c.formacao || 'Não informada') + '</strong></p>' +
        (c.curso ? '<p>Curso: ' + c.curso + '</p>' : '') +
        (c.instituicao ? '<p>Instituição: ' + c.instituicao + '</p>' : '') +
        (c.situacao ? '<p>Situação: ' + c.situacao + '</p>' : '') +
        (c.data_conclusao ? '<p>Conclusão: ' + new Date(c.data_conclusao).toLocaleDateString('pt-BR') + '</p>' : '') +
      '</div>' +
      '<div class="analisar-bloco">' +
        '<h4>💼 Experiências</h4>' +
        expsHTML +
      '</div>' +
    '</div>' +
    '<div class="analisar-bloco" style="margin-top:16px">' +
      '<h4>📝 Sobre você</h4>' +
      '<p style="white-space:pre-wrap">' + (c.sobre_voce ? escapeHTML(c.sobre_voce) : '<em style="color:var(--cinza-medio)">Não informado</em>') + '</p>' +
    '</div>' +
    '<div class="analisar-bloco" style="margin-top:16px">' +
      '<h4>📋 Requisitos da vaga</h4>' +
      '<p style="white-space:pre-wrap;font-size:13px;color:var(--cinza-medio)">' + (c.requisitos ? escapeHTML(c.requisitos) : '—') + '</p>' +
    '</div>' +
    '<div class="analisar-bloco" style="margin-top:16px">' +
      '<h4>📜 Histórico do processo</h4>' +
      ((c.historico && c.historico.length)
        ? '<ul style="list-style:none;padding:0;margin:0">' + c.historico.map(h => {
            const d = h.data ? new Date(h.data).toLocaleString('pt-BR') : '';
            const acaoTxt = h.acao ? '[' + h.acao + '] ' : '';
            return '<li style="padding:10px;border-left:3px solid var(--vinho);margin-bottom:8px;background:#f9f9f9"><strong>Etapa ' + ((h.etapa || 0) + 1) + '</strong> ' + acaoTxt + '[' + h.status + '] — ' + d + (h.por ? ' <small style="color:var(--cinza-medio)">por ' + h.por + '</small>' : '') + (h.mensagem ? '<br><em>' + escapeHTML(h.mensagem) + '</em>' : '') + '</li>';
          }).join('') + '</ul>'
        : '<p style="color:var(--cinza-medio);font-size:13px">Nenhuma movimentação ainda.</p>') +
    '</div>' +
    '<div class="analisar-acoes" id="analisar-acoes">' +
      '<h4>⚙️ Ações do processo</h4>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        (!contratado && !reprovado
          ? '<button class="btn btn-success" onclick="acaoCandidatura(' + c.id + ', \'avancar\')">' + (etapaAtual + 1 >= etapas.length ? '✅ Contratar' : '▶ Avançar para próxima etapa') + '</button>' +
            '<button class="btn btn-vinho-outline" onclick="acaoCandidatura(' + c.id + ', \'reprovar\')">✖ Reprovar</button>'
          : '') +
        (reprovado || contratado ? '<button class="btn btn-vinho-outline" onclick="acaoCandidatura(' + c.id + ', \'reabrir\')">↻ Reabrir</button>' : '') +
        '<button class="btn" style="background:#eee" onclick="analisarCandidatura(' + c.id + ')">↻ Atualizar</button>' +
      '</div>' +
    '</div>';
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
    analisarCandidatura(id);
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
  analisarCandidatura(id);
}

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
