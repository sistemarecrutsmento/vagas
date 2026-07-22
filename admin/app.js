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
  if (page === 'equipe') {
    carregarEquipe();
  }
  if (page === 'agenda') {
    carregarAgenda('hoje');
  }
}

// ===== EQUIPE =====
let equipeCarregada = false;

function trocarTabEquipe(tab) {
  document.querySelectorAll('.tab-equipe').forEach(t => t.classList.remove('ativo'));
  document.querySelector(`.tab-equipe[data-tab="${tab}"]`)?.classList.add('ativo');
  document.querySelectorAll('.tab-content-equipe').forEach(c => c.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'block';
  // Troca label/handler do botão de acordo com a aba
  const btn = document.getElementById('btn-novo-equipe');
  if (tab === 'empresas') {
    btn.textContent = '+ Nova Empresa';
    btn.onclick = abrirModalEmpresa;
  } else {
    btn.textContent = '+ Novo Recrutador';
    btn.onclick = abrirModalRecrutador;
  }
}

async function carregarEquipe() {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await fetch(API + '/api/admin/equipe', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();

    // Recrutadores
    const recDiv = document.getElementById('lista-recrutadores');
    if (data.recrutadores && data.recrutadores.length > 0) {
      recDiv.innerHTML = data.recrutadores.map(u => `
        <div class="vaga-card">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--vinho); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px;">${(u.nome||'?').charAt(0).toUpperCase()}</div>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:16px;">${u.nome}</div>
              <div style="color:#888; font-size:13px;">${u.email}</div>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; gap:8px; flex-wrap:wrap;">
            <span style="background:${u.ativo === false ? '#fee2e2' : '#dcfce7'}; color:${u.ativo === false ? '#b91c1c' : '#16a34a'}; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600;">${u.ativo === false ? 'Inativo' : 'Recrutador'}</span>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sec btn-sm" onclick="editarRecrutador(${u.id}, '${(u.nome||'').replace(/'/g, "\\'")}', ${u.ativo === false})">✏️ Editar</button>
              <button class="btn btn-sec btn-sm" style="color:var(--vermelho,#b91c1c);" onclick="excluirRecrutador(${u.id}, '${(u.nome||'').replace(/'/g, "\\'")}')">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      recDiv.innerHTML = '<div class="empty">Nenhum recrutador cadastrado. Use "+ Novo Recrutador" acima.</div>';
    }

    // Empresas
    const empDiv = document.getElementById('lista-empresas');
    if (data.empresas && data.empresas.length > 0) {
      empDiv.innerHTML = data.empresas.map(e => `
        <div class="vaga-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">
            <div style="font-weight:700; font-size:16px;">🏢 ${e.nome}</div>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sec btn-sm" onclick="editarEmpresa(${e.id}, '${(e.nome||'').replace(/'/g, "\\'")}', '${(e.cnpj||'').replace(/'/g, "\\'")}', '${(e.email_principal||'').replace(/'/g, "\\'")}', '${(e.telefone||'').replace(/'/g, "\\'")}')">✏️ Editar</button>
              <button class="btn btn-sec btn-sm" style="color:var(--vermelho,#b91c1c);" onclick="excluirEmpresa(${e.id}, '${(e.nome||'').replace(/'/g, "\\'")}')">🗑️</button>
            </div>
          </div>
          <div style="color:#888; font-size:13px;">${e.email_principal || '—'}</div>
          ${e.cnpj ? `<div style="color:#888; font-size:12px; margin-top:4px;">CNPJ: ${e.cnpj}</div>` : ''}
          ${e.telefone ? `<div style="color:#888; font-size:12px;">Tel: ${e.telefone}</div>` : ''}
          <div style="margin-top:10px;"><span style="background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600;">Empresa</span></div>
        </div>
      `).join('');
    } else {
      empDiv.innerHTML = '<div class="empty">Nenhuma empresa parceira cadastrada.</div>';
    }
    equipeCarregada = true;
  } catch (e) {
    document.getElementById('lista-recrutadores').innerHTML = '<div class="empty" style="color:var(--vermelho);">Erro ao carregar equipe. Verifique sua conexão.</div>';
  }
}

function abrirModalRecrutador() {
  const nome = prompt('Nome do recrutador:');
  if (!nome) return;
  const email = prompt('Email:');
  if (!email) return;
  const senha = prompt('Senha provisória:', 'mudar123');
  if (!senha) return;
  criarRecrutador({ nome, email, senha });
}

async function criarRecrutador(dados) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await fetch(API + '/api/admin/recrutadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(dados)
    });
    const data = await r.json();
    if (r.ok) { alert('Recrutador criado com sucesso!'); carregarEquipe(); }
    else alert('Erro: ' + (data.erro || JSON.stringify(data)));
  } catch (e) { alert('Erro de conexão'); }
}

function abrirModalEmpresa() {
  const nome = prompt('Nome da empresa:');
  if (!nome) return;
  const cnpj = prompt('CNPJ (opcional):') || null;
  const email = prompt('Email principal (opcional):') || null;
  const telefone = prompt('Telefone (opcional):') || null;
  criarEmpresa({ nome, cnpj, email_principal: email, telefone });
}

async function criarEmpresa(dados) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await fetch(API + '/api/admin/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(dados)
    });
    const data = await r.json();
    if (r.ok) { alert('Empresa criada com sucesso!'); carregarEquipe(); }
    else alert('Erro: ' + (data.erro || JSON.stringify(data)));
  } catch (e) { alert('Erro de conexão'); }
}

function editarRecrutador(id, nomeAtual, inativo) {
  const novoNome = prompt('Nome do recrutador:', nomeAtual);
  if (novoNome === null) return;
  const acaoAtivo = confirm('O recrutador deve ficar ATIVO?\n\nOK = Ativar\nCancelar = Desativar');
  const resetar = confirm('Deseja resetar a senha para "mudar123"?\n\n(OK = sim, o recrutador terá que trocar no próximo login)');
  const payload = { nome: novoNome, ativo: acaoAtivo };
  if (resetar) payload.senha = 'mudar123';
  atualizarRecrutador(id, payload);
}

async function atualizarRecrutador(id, dados) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await fetch(API + '/api/admin/recrutadores/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(dados)
    });
    const data = await r.json();
    if (r.ok) { alert('Recrutador atualizado!'); carregarEquipe(); }
    else alert('Erro: ' + (data.erro || JSON.stringify(data)));
  } catch (e) { alert('Erro de conexão'); }
}

function excluirRecrutador(id, nome) {
  if (!confirm('Excluir o recrutador "' + nome + '"?\n\nEssa ação não pode ser desfeita.')) return;
  fetch(API + '/api/admin/recrutadores/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('admin_token') || localStorage.getItem('token')) }
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) { alert('Recrutador excluído!'); carregarEquipe(); }
      else alert('Erro: ' + (data.erro || JSON.stringify(data)));
    })
    .catch(() => alert('Erro de conexão'));
}

function editarEmpresa(id, nome, cnpj, email, telefone) {
  const novoNome = prompt('Nome da empresa:', nome);
  if (novoNome === null) return;
  const novoCnpj = prompt('CNPJ:', cnpj) || null;
  const novoEmail = prompt('Email principal:', email) || null;
  const novoTel = prompt('Telefone:', telefone) || null;
  atualizarEmpresa(id, { nome: novoNome, cnpj: novoCnpj, email_principal: novoEmail, telefone: novoTel });
}

async function atualizarEmpresa(id, dados) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await fetch(API + '/api/admin/empresas/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(dados)
    });
    const data = await r.json();
    if (r.ok) { alert('Empresa atualizada!'); carregarEquipe(); }
    else alert('Erro: ' + (data.erro || JSON.stringify(data)));
  } catch (e) { alert('Erro de conexão'); }
}

function excluirEmpresa(id, nome) {
  if (!confirm('Excluir a empresa "' + nome + '"?\n\nEssa ação não pode ser desfeita.')) return;
  fetch(API + '/api/admin/empresas/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('admin_token') || localStorage.getItem('token')) }
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) { alert('Empresa excluída!'); carregarEquipe(); }
      else alert('Erro: ' + (data.erro || JSON.stringify(data)));
    })
    .catch(() => alert('Erro de conexão'));
}

// ===== AGENDA =====
let agendaPeriodoAtual = 'hoje';

async function carregarAgenda(periodo) {
  agendaPeriodoAtual = periodo || agendaPeriodoAtual;
  document.querySelectorAll('.tab-agenda').forEach(t => t.classList.remove('ativo'));
  document.querySelector(`.tab-agenda[data-periodo="${agendaPeriodoAtual}"]`)?.classList.add('ativo');

  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  const lista = document.getElementById('agenda-lista');
  lista.innerHTML = '<div class="empty">Carregando agenda...</div>';

  try {
    const r = await fetch(API + '/api/admin/entrevistas?periodo=' + agendaPeriodoAtual, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await r.json();
    const entrevistas = data.entrevistas || [];

    // Stats
    const stats = document.getElementById('agenda-stats');
    const cntHoje = entrevistas.filter(e => new Date(e.data_hora).toDateString() === new Date().toDateString()).length;
    stats.innerHTML = `
      <div class="card-mini"><div class="label">Hoje</div><div class="valor">${cntHoje}</div></div>
      <div class="card-mini"><div class="label">Total no período</div><div class="valor">${entrevistas.length}</div></div>
      <div class="card-mini"><div class="label">Confirmadas</div><div class="valor" style="color:#16a34a;">${entrevistas.filter(e => e.status === 'confirmada').length}</div></div>
      <div class="card-mini"><div class="label">Agendadas</div><div class="valor" style="color:#2563eb;">${entrevistas.filter(e => e.status === 'agendada').length}</div></div>
    `;

    if (entrevistas.length === 0) {
      lista.innerHTML = '<div class="empty">Nenhuma entrevista neste período. Clique em "+ Nova Entrevista" para agendar.</div>';
      return;
    }

    lista.innerHTML = entrevistas.map(e => {
      const dt = new Date(e.data_hora);
      const dia = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const etapaNome = { 3: 'RH', 4: 'Gestor', 5: 'Proposta' }[e.etapa] || `Etapa ${e.etapa}`;
      const statusCores = {
        agendada: { bg: '#dbeafe', fg: '#1e40af' },
        confirmada: { bg: '#dcfce7', fg: '#16a34a' },
        realizada: { bg: '#f3e8ff', fg: '#7c3aed' },
        cancelada: { bg: '#fee2e2', fg: '#dc2626' },
        faltou: { bg: '#fef3c7', fg: '#d97706' }
      };
      const cor = statusCores[e.status] || { bg: '#f3f4f6', fg: '#6b7280' };
      const isPassada = dt < new Date();
      return `
        <div class="agenda-item">
          <div class="agenda-data">
            <div class="agenda-dia">${dia}</div>
            <div class="agenda-hora">${hora}</div>
            <div class="agenda-duracao">${e.duracao_minutos || 60}min</div>
          </div>
          <div class="agenda-info">
            <div class="agenda-candidato">${e.candidato_nome || '—'}</div>
            <div class="agenda-vaga">📋 ${e.vaga_titulo || 'Vaga'} <span style="color:#888;">• Etapa ${e.etapa} (${etapaNome})</span></div>
            <div class="agenda-meta">
              ${e.local ? `📍 ${e.local}` : ''}
              ${e.link_reuniao ? ` • <a href="${e.link_reuniao}" target="_blank">🔗 Link da reunião</a>` : ''}
              ${e.observacoes ? `<div style="margin-top:6px; color:#666; font-style:italic;">"${e.observacoes}"</div>` : ''}
            </div>
          </div>
          <div class="agenda-acoes">
            <span class="badge" style="background:${cor.bg}; color:${cor.fg};">${e.status}</span>
            ${!isPassada ? `
              <div style="display:flex; gap:4px; margin-top:8px;">
                <button class="btn btn-sm btn-sec" onclick="atualizarEntrevista(${e.id},'confirmada')">✓ Confirmar</button>
                <button class="btn btn-sm btn-sec" onclick="atualizarEntrevista(${e.id},'realizada')">✔ Realizada</button>
                <button class="btn btn-sm btn-sec" onclick="atualizarEntrevista(${e.id},'cancelada')">✕ Cancelar</button>
              </div>
            ` : `
              <div style="display:flex; gap:4px; margin-top:8px;">
                <button class="btn btn-sm btn-sec" onclick="atualizarEntrevista(${e.id},'realizada')">✔ Realizada</button>
                <button class="btn btn-sm btn-sec" onclick="atualizarEntrevista(${e.id},'faltou')">⚠ Faltou</button>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    lista.innerHTML = '<div class="empty" style="color:var(--vermelho);">Erro ao carregar agenda.</div>';
  }
}

async function atualizarEntrevista(id, status) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await fetch(API + '/api/admin/entrevista/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status })
    });
    if (r.ok) carregarAgenda();
    else alert('Erro ao atualizar');
  } catch (e) { alert('Erro de conexão'); }
}

function abrirModalNovaEntrevista() {
  const candidaturaId = prompt('ID da candidatura (você encontra no analisar.html):');
  if (!candidaturaId) return;
  const etapa = prompt('Etapa (3=RH, 4=Gestor):', '3');
  const dataHora = prompt('Data e hora (YYYY-MM-DD HH:MM):', new Date(Date.now() + 86400000).toISOString().slice(0,16).replace('T',' '));
  if (!dataHora) return;
  const duracao = prompt('Duração em minutos:', '60');
  const local = prompt('Local (opcional):', '');
  const link = prompt('Link da reunião (opcional):', '');

  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  fetch(API + '/api/admin/entrevista', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      candidatura_id: parseInt(candidaturaId),
      etapa: parseInt(etapa),
      data_hora: dataHora,
      duracao_minutos: parseInt(duracao) || 60,
      local: local || null,
      link_reuniao: link || null
    })
  }).then(r => r.json()).then(d => {
    if (d.erro) { alert('Erro: ' + d.erro); }
    else { alert('Entrevista agendada com sucesso!'); carregarAgenda(); }
  }).catch(() => alert('Erro de conexão'));
}

// ===== DASHBOARD =====
// ==== DASHBOARD V2 (jul/2026 - profissional) ====
async function carregarDashboardV2() {
  try {
    const r = await fetch(API + '/api/admin/dashboard', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    if (!r.ok) {
      console.error('[DASHBOARD]', data);
      const grid = document.getElementById('kpis-grid') || document.getElementById('stats-grid');
      if (grid) grid.innerHTML = `<div class="alert alert-erro">Erro: ${data.erro || 'desconhecido'}</div>`;
      return;
    }
    // === Saudação dinâmica (bom dia / boa tarde / boa noite) ===
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const primeiroNome = (data.admin?.nome || 'Recrutador').split(' ')[0];
    document.getElementById('dash-greeting').textContent = `${saudacao}, ${primeiroNome}! 👋`;
    
    // === KPIs principais (5) ===
    const k = data.kpis || {};
    const kpis = [
      { label: 'Vagas ativas', valor: k.vagas_ativas || 0, delta: k.deltas?.vagas, icon: '💼', cor: 'rosa' },
      { label: 'Candidatos', valor: k.total_candidatos || 0, delta: k.deltas?.candidatos, icon: '👥', cor: 'azul' },
      { label: 'Processos ativos', valor: k.processos_ativos || 0, delta: k.deltas?.processos, icon: '📋', cor: 'roxo' },
      { label: 'Entrevistas agendadas', valor: k.entrevistas_agendadas || 0, delta: k.deltas?.entrevistas, icon: '📅', cor: 'verde' },
      { label: 'Novos (7 dias)', valor: k.candidatos_novos_7d || 0, delta: k.deltas?.candidatos, icon: '✨', cor: 'laranja' }
    ];
    document.getElementById('kpis-grid').innerHTML = kpis.map(k => {
      const delta = k.delta == null ? '' : (k.delta > 0 ? `<span class="kpi-delta up">+${k.delta}% este mês</span>` : k.delta < 0 ? `<span class="kpi-delta down">${k.delta}% este mês</span>` : `<span class="kpi-delta flat">0% este mês</span>`);
      return `<div class="kpi-card kpi-${k.cor}">
        <div class="kpi-top">
          <div class="kpi-icon">${k.icon}</div>
        </div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-valor">${k.valor}</div>
        ${delta}
      </div>`;
    }).join('');
    
    // === Gráfico: Candidatos por etapa ===
    const etapasObj = data.etapas || {};
    const labels = data.etapas_labels || ['Inscrição', 'Triagem', 'RH', 'Gestor', 'Proposta', 'Coleta Docs', 'Contratação'];
    const cores = ['#FF8FA3', '#5B9BD5', '#A78BFA', '#34D399', '#FBBF24', '#F472B6', '#722F37'];
    const maxEtapa = Math.max(1, ...Object.values(etapasObj).map(v => parseInt(v) || 0));
    document.getElementById('grafico-etapas').innerHTML = labels.map((label, i) => {
      const etapaNum = i + 1;
      const val = parseInt(etapasObj[etapaNum] || 0);
      const pct = (val / maxEtapa) * 100;
      return `<div class="etapa-row">
        <div class="etapa-label">${label}</div>
        <div class="etapa-bar-bg">
          <div class="etapa-bar" style="width:${pct}%;background:${cores[i]}">
            <span class="etapa-val">${val}</span>
          </div>
        </div>
      </div>`;
    }).join('');
    
    // === Taxa de conversão ===
    const c = data.conversao || {};
    const hist = c.historico || [];
    const maxConv = Math.max(1, ...hist);
    const w = 200, h = 60;
    let pathD = '';
    if (hist.length > 1) {
      const stepX = w / (hist.length - 1);
      const points = hist.map((v, i) => `${i * stepX},${h - (v / maxConv) * h}`);
      pathD = `M ${points[0]} L ` + points.slice(1).join(' L ');
      const fillD = pathD + ` L ${(hist.length - 1) * stepX},${h} L 0,${h} Z`;
      // Atualiza o SVG já existente no HTML
      const pathEl = document.getElementById('conversao-path');
      const lineEl = document.getElementById('conversao-line');
      if (pathEl) pathEl.setAttribute('d', fillD);
      if (lineEl) lineEl.setAttribute('d', pathD);
    } else {
      const pathEl = document.getElementById('conversao-path');
      const lineEl = document.getElementById('conversao-line');
      if (pathEl) pathEl.setAttribute('d', '');
      if (lineEl) lineEl.setAttribute('d', '');
    }
    document.getElementById('conversao-valor').textContent = (c.atual || 0) + '%';
    const convDetalhes = document.getElementById('conversao-contratados');
    if (convDetalhes) {
      // texto já existe no HTML ("contratados de X processos")
    }
    
    // === Próximas Entrevistas ===
    const entrevistas = data.proximas_entrevistas || [];
    if (entrevistas.length > 0) {
      document.getElementById('proximas-entrevistas').innerHTML = entrevistas.map(e => {
        const dataE = new Date(e.data_hora);
        const dataStr = dataE.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
        const horaStr = dataE.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const badgeClass = e.etapa === 3 ? 'rh' : 'gestor';
        const nome = e.candidato_nome || e.nome || 'Candidato';
        const vaga = e.vaga_titulo || e.vaga || '—';
        const etapaNome = e.etapa === 3 ? 'RH' : e.etapa === 4 ? 'Gestor' : (e.etapa_nome || 'Entrevista');
        const iniciais = nome.split(' ').map(s => s.charAt(0)).slice(0, 2).join('').toUpperCase();
        return `<div class="entrevista-item">
          <div class="entrevista-avatar">${iniciais}</div>
          <div class="entrevista-info">
            <div class="entrevista-nome">${nome}</div>
            <div class="entrevista-vaga">${vaga}</div>
            <div class="entrevista-data">📅 ${dataStr} às ${horaStr}</div>
          </div>
          <div class="entrevista-badge entrevista-${badgeClass}">${etapaNome}</div>
        </div>`;
      }).join('');
    } else {
      document.getElementById('proximas-entrevistas').innerHTML = '<div class="empty-msg">Nenhuma entrevista agendada</div>';
    }
    
    // === Documentação (taxa de aprovação) ===
    const taxaDoc = data.kpis_secundarios?.taxa_documentacao || 0;
    const totalDocs = 16;
    const aprovados = Math.round(totalDocs * taxaDoc / 100);
    const circ = 2 * Math.PI * 50; // raio=50 conforme o HTML
    const dashTotal = circ;
    const offset = circ - (taxaDoc / 100) * circ;
    const docFill = document.getElementById('doc-rosca-fill');
    const docTexto = document.getElementById('doc-rosca-texto');
    const docPercent = document.getElementById('doc-percent');
    if (docFill) docFill.setAttribute('stroke-dasharray', `${dashTotal - offset} ${dashTotal}`);
    if (docTexto) docTexto.textContent = taxaDoc + '%';
    if (docPercent) docPercent.textContent = taxaDoc + '%';
    const docProg = document.getElementById('doc-progresso-barra');
    if (docProg) {
      docProg.style.width = taxaDoc + '%';
      docProg.textContent = taxaDoc > 10 ? `${aprovados}/${totalDocs} aprovados` : '';
    }
    
    // === Vagas com mais candidatos ===
    const vRanking = data.vagas_mais_candidatos || [];
    if (vRanking.length > 0) {
      document.getElementById('ranking-table-body').innerHTML = vRanking.map(v => `
        <tr>
          <td><strong>${v.titulo || '—'}</strong><br><span style="color:#888;font-size:12px;">${v.empresa || '—'}</span></td>
          <td><span class="badge ${v.status === 'publicada' ? 'badge-ativa' : 'badge-fechada'}">${v.status === 'publicada' ? 'Ativa' : 'Encerrada'}</span></td>
          <td style="text-align:right;">
            <span style="color:#722F37;font-weight:700;">${v.total_candidatos || 0}</span>
            <span style="color:#888;font-size:12px;"> / ${v.contratados || 0} contrat.</span>
          </td>
        </tr>
      `).join('');
    } else {
      document.getElementById('ranking-table-body').innerHTML = '<tr><td colspan="3" class="empty">Nenhuma vaga com candidatos</td></tr>';
    }
    
    // === Atividades recentes ===
    const ats = data.atividades_recentes || [];
    if (ats.length > 0) {
      const tipoMap = {
        'inscricao':        { icone: '✨', label: 'Nova inscrição',  tipo: 'inscricao' },
        'avancar':          { icone: '▶️', label: 'Avançou etapa',   tipo: 'avancar' },
        'reprovar':         { icone: '✖', label: 'Reprovado',       tipo: 'reprovar' },
        'reabrir':          { icone: '↩', label: 'Reaberto',        tipo: 'reabrir' },
        'recusar_proposta': { icone: '✖', label: 'Proposta recusada', tipo: 'proposta' },
        'aceitar_proposta': { icone: '✓', label: 'Proposta aceita',  tipo: 'proposta' },
        'enviar_proposta':  { icone: '📨', label: 'Proposta enviada', tipo: 'proposta' },
        'entrevista':       { icone: '📅', label: 'Entrevista agendada', tipo: 'entrevista' }
      };
      document.getElementById('atividades-recentes').innerHTML = ats.slice(0, 8).map(a => {
        const t = tipoMap[a.texto] || { icone: '•', label: a.texto, tipo: 'reabrir' };
        const quando = tempoRelativo(a.quando);
        return `<div class="atividade-item tipo-${t.tipo}">
          <div class="atividade-icone">${t.icone}</div>
          <div class="atividade-corpo">
            <div class="atividade-topo">
              <span class="atividade-tipo">${t.label}</span>
              <span class="atividade-tempo">${quando}</span>
            </div>
            <div class="atividade-candidato">${a.candidato || '—'}</div>
            <div class="atividade-vaga">${a.vaga || '—'}</div>
          </div>
        </div>`;
      }).join('');
      const countEl = document.getElementById('atividades-count');
      if (countEl) countEl.textContent = ats.length;
    } else {
      document.getElementById('atividades-recentes').innerHTML = '<div class="atividade-empty">Nenhuma atividade recente</div>';
    }
    
    // === KPIs secundários ===
    const ks = data.kpis_secundarios || {};
    document.getElementById('ks-tempo').textContent = (ks.tempo_medio_contratacao || 0) + 'd';
    document.getElementById('ks-aprovacao').textContent = (ks.taxa_aprovacao || 0) + '%';
    document.getElementById('ks-desligamento').textContent = (ks.taxa_desligamento || 0) + '%';
    document.getElementById('ks-encerradas').textContent = ks.vagas_encerradas || 0;
    document.getElementById('ks-empresas').textContent = ks.empresas_ativas || 0;
  } catch (e) {
    console.error('[DASHBOARD V2] ERRO:', e.message, e.stack);
    const grid = document.getElementById('kpis-grid') || document.getElementById('stats-grid');
    if (grid) grid.innerHTML = `<div class="alert alert-erro">Erro ao carregar: ${e.message}</div>`;
  }
}

function tempoRelativo(dataIso) {
  if (!dataIso) return '—';
  const agora = new Date();
  const data = new Date(dataIso);
  const diffMs = agora - data;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} hora${diffH > 1 ? 's' : ''}`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD} dia${diffD > 1 ? 's' : ''}`;
  return data.toLocaleDateString('pt-BR');
}

// Mantém a função antiga pra compatibilidade
async function carregarDashboard() {
  return carregarDashboardV2();
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
  // Carregar etapas (se for array de objetos, pegar só os nomes)
  let etapasArr = vaga?.etapas;
  if (typeof etapasArr === 'string') { try { etapasArr = JSON.parse(etapasArr); } catch (e) { etapasArr = []; } }
  let etapasNomes;
  if (Array.isArray(etapasArr) && etapasArr.length > 0) {
    etapasNomes = etapasArr.map(e => typeof e === 'string' ? e : (e.nome || '')).filter(Boolean);
  } else {
    etapasNomes = ['Inscrição', 'Triagem', 'Entrevista RH', 'Entrevista gestor', 'Contratação'];
  }
  // Garante que Inscrição e Triagem SEMPRE estejam no início (e nessa ordem)
  etapasNomes = etapasNomes.filter(e => e.toLowerCase() !== 'inscrição' && e.toLowerCase() !== 'triagem');
  etapasNomes.unshift('Inscrição', 'Triagem');
  _etapasVagaTemp = etapasNomes;
  document.getElementById('v-template').value = '';
  renderEtapasVaga();
  document.getElementById('alert-vaga').innerHTML = '';
  abrirModal('vaga');
}

let _etapasVagaTemp = [];

const TEMPLATES_ETAPAS = {
  operacional: ['Inscrição', 'Triagem', 'Teste prático', 'Entrevista gestor', 'Contratação'],
  administrativo: ['Inscrição', 'Triagem', 'Entrevista RH', 'Entrevista gestor', 'Contratação'],
  ti: ['Inscrição', 'Triagem', 'Teste técnico', 'Entrevista RH', 'Entrevista gestor', 'Contratação'],
  comercial: ['Inscrição', 'Triagem', 'Dinâmica de vendas', 'Entrevista gestor', 'Contratação'],
  estagio: ['Inscrição', 'Triagem', 'Entrevista RH', 'Teste prático', 'Contratação'],
  personalizado: '__vazio__'
};

function aplicarTemplateEtapas() {
  const tpl = document.getElementById('v-template').value;
  if (!tpl) return;
  const etapas = TEMPLATES_ETAPAS[tpl];
  if (etapas && etapas !== '__vazio__') {
    _etapasVagaTemp = [...etapas];
  } else if (etapas === '__vazio__') {
    _etapasVagaTemp = ['Inscrição', 'Triagem', ''];
  }
  renderEtapasVaga();
}

function renderEtapasVaga() {
  const container = document.getElementById('v-etapas-lista');
  if (!container) return;
  container.innerHTML = '';
  _etapasVagaTemp.forEach((nome, idx) => {
    const isFixa = idx < 2;
    const bg = isFixa ? '#fef7e8' : '#fff';
    const bd = isFixa ? '#f0c040' : 'var(--borda)';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:6px; align-items:center; background:' + bg + '; border:1px solid ' + bd + '; border-radius:6px; padding:8px 10px;';
    const inputStyle = isFixa
      ? 'flex:1; background:transparent; border:0; font-weight:600; color:var(--vinho); outline:none;'
      : 'flex:1; padding:4px 6px; border:1px solid transparent; border-radius:4px;';
    const inputAttrs = isFixa
      ? `readonly style="${inputStyle}"`
      : `oninput="_etapasVagaTemp[${idx}]=this.value" style="${inputStyle}"`;
    const podeMoverCima = idx > 2;
    const podeMoverBaixo = idx < _etapasVagaTemp.length - 1;
    const botoes = isFixa
      ? '<span title="Etapa obrigatória (fixa)" style="color:#c08020; font-size:14px;">🔒</span>'
      : `<button type="button" onclick="moverEtapaVaga(${idx},-1)" ${podeMoverCima ? '' : 'disabled'} style="background:none; border:0; cursor:${podeMoverCima ? 'pointer' : 'not-allowed'}; padding:2px 4px; color:#888; font-size:13px;${podeMoverCima ? '' : 'opacity:0.3;'}">↑</button>
         <button type="button" onclick="moverEtapaVaga(${idx},1)" ${podeMoverBaixo ? '' : 'disabled'} style="background:none; border:0; cursor:${podeMoverBaixo ? 'pointer' : 'not-allowed'}; padding:2px 4px; color:#888; font-size:13px;${podeMoverBaixo ? '' : 'opacity:0.3;'}">↓</button>
         <button type="button" onclick="removerEtapaVaga(${idx})" style="background:none; border:0; cursor:pointer; padding:2px 6px; color:#c00; font-size:14px;" title="Remover">✕</button>`;
    row.innerHTML =
      '<span style="font-weight:700; color:#888; min-width:22px; text-align:center;">' + (idx + 1) + '</span>' +
      '<input type="text" value="' + escapeHtml(nome) + '" ' + inputAttrs + ' placeholder="Nome da etapa">' +
      botoes;
    container.appendChild(row);
  });
  // Atualiza hidden com array de etapas (vai pro backend)
  const validas = _etapasVagaTemp.filter(e => e && e.trim());
  document.getElementById('v-etapas').value = JSON.stringify(validas.map(nome => ({ nome })));
}

function adicionarEtapaVaga() {
  if (_etapasVagaTemp.length === 0) {
    _etapasVagaTemp = ['Inscrição', 'Triagem', ''];
  } else {
    _etapasVagaTemp.push('');
  }
  renderEtapasVaga();
  setTimeout(() => {
    const inputs = document.querySelectorAll('#v-etapas-lista input');
    const last = inputs[inputs.length - 1];
    if (last && !last.readOnly) last.focus();
  }, 50);
}

function removerEtapaVaga(idx) {
  if (idx < 2) { alert('⚠️ Inscrição e Triagem são etapas obrigatórias e não podem ser removidas.'); return; }
  _etapasVagaTemp.splice(idx, 1);
  renderEtapasVaga();
}

function moverEtapaVaga(idx, dir) {
  const novo = idx + dir;
  if (novo < 2) return;
  if (novo >= _etapasVagaTemp.length) return;
  [_etapasVagaTemp[idx], _etapasVagaTemp[novo]] = [_etapasVagaTemp[novo], _etapasVagaTemp[idx]];
  renderEtapasVaga();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
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
  // Etapas (já estão montadas no hidden como JSON array de {nome})
  const etapasVal = document.getElementById('v-etapas').value;
  if (etapasVal) {
    try { body.etapas = JSON.parse(etapasVal); } catch (e) { /* ignora */ }
  }
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

// Abre a página de análise completa da candidatura
function analisarCandidatura(id) {
  window.location.href = 'analisar.html?id=' + id;
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

// ===== SEED DEMO: Importa 6 vagas de exemplo =====
async function importarVagasDemo() {
  if (!confirm('🌱 Importar 6 vagas de demonstração?\n\nSe alguma vaga com mesmo título+empresa já existir, ela será IGNORADA (não duplica).')) return;
  const token = localStorage.getItem('admin_token');
  if (!token) { alert('Faça login primeiro.'); return; }
  try {
    const r = await fetch(API + '/api/admin/seed-vagas-demo', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.erro || 'Erro ao importar');
    const lista = (j.detalhes.criadas || []).map(v => '✅ ' + v.titulo + ' (' + v.empresa + ')').join('\n');
    const exist = (j.detalhes.jaExistiam || []).map(v => '⚠️ ' + v.titulo + ' (' + v.empresa + ')').join('\n');
    let msg = `🎉 Concluído!\n\n${j.criadas} vagas criadas.\n${j.jaExistiam} já existiam (ignoradas).`;
    if (lista) msg += '\n\n--- Criadas ---\n' + lista;
    if (exist) msg += '\n\n--- Já existiam ---\n' + exist;
    alert(msg);
    // Atualiza a lista de vagas se estiver na página
    if (typeof carregarVagas === 'function') carregarVagas();
  } catch (e) {
    alert('❌ Erro: ' + e.message);
  }
}
