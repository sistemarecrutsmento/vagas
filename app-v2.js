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

// Áreas de interesse (Banco de Talentos)
const AREAS_INTERESSE = [
  'Atendimento ao Cliente','Caixa','Vendas','Comercial','Administrativo','Recepção','Estoque','Logística','Expedição','Compras',
  'Financeiro','Recursos Humanos (RH)','Marketing','Telemarketing','Suporte Técnico','Tecnologia da Informação (TI)','Desenvolvimento de Software',
  'Design Gráfico','E-commerce','Supervisão','Gerência','Liderança Comercial','Operações','Produção','Qualidade','Segurança Patrimonial','Portaria',
  'Limpeza e Conservação','Serviços Gerais','Manutenção','Transporte','Motorista','Entregas','Alimentação e Restaurantes','Hotelaria e Turismo','Saúde',
  'Educação','Farmácia','Construção Civil','Indústria','Estágio','Jovem Aprendiz','Primeiro Emprego'
];
const AREAS_MAX = 5;
let areasSelecionadas = [];

function renderAreasChips() {
  const container = document.getElementById('w2-areas');
  if (!container) return;
  container.style.cssText = 'display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;gap:6px;padding:8px;border:1px solid #ddd;border-radius:8px;background:#fafafa;min-height:50px;';
  container.innerHTML = AREAS_INTERESSE.map(a => {
    const sel = areasSelecionadas.includes(a);
    const safe = a.replace(/"/g, '&quot;');
    return `<span class="area-chip${sel ? ' selecionada' : ''}" data-area="${safe}" style="display:inline-flex;flex:0 0 auto;width:auto;align-items:center;justify-content:center;box-sizing:border-box;padding:4px 10px;background:${sel ? '#7b1830' : '#fff'};color:${sel ? '#fff' : '#222'};border:1px solid ${sel ? '#7b1830' : '#ccc'};border-radius:20px;font-size:12px;line-height:1.3;cursor:pointer;user-select:none;white-space:nowrap;">${a}</span>`;
  }).join('');
  container.querySelectorAll('.area-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const area = chip.getAttribute('data-area');
      const idx = areasSelecionadas.indexOf(area);
      if (idx >= 0) {
        areasSelecionadas.splice(idx, 1);
      } else {
        if (areasSelecionadas.length >= AREAS_MAX) return alert('Você pode escolher no máximo ' + AREAS_MAX + ' áreas.');
        areasSelecionadas.push(area);
      }
      renderAreasChips();
      atualizarContadorAreas();
    });
  });
  atualizarContadorAreas();
}

function atualizarContadorAreas() {
  const el = document.getElementById('w2-areas-contador');
  if (el) el.textContent = areasSelecionadas.length + ' de ' + AREAS_MAX + ' selecionadas';
}

window.addEventListener('DOMContentLoaded', () => {
  carregarVagas();
  checarAuth();
  // Garante o ☰ no logo (mesmo deslogado)
  setTimeout(garantirBotaoMenu, 50);
  document.querySelectorAll('#filtro-dropdown button').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      const label = btn.textContent.trim();
      document.querySelectorAll('#filtro-dropdown button').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      document.getElementById('filtro-label').textContent = '📂 ' + label;
      categoriaAtiva = cat;
      document.getElementById('filtro-dropdown').classList.remove('aberto');
      carregarVagas();
    });
  });
});

function toggleFiltroDropdown() {
  document.getElementById('filtro-dropdown').classList.toggle('aberto');
}

// Fecha dropdown ao clicar fora
document.addEventListener('click', (e) => {
  const dd = document.getElementById('filtro-dropdown');
  if (dd && !e.target.closest('.filtros-row')) {
    dd.classList.remove('aberto');
  }
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
      <a class="vaga-card" href="vaga.html?id=${v.id}" style="text-decoration:none;color:inherit;display:block;">
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
      </a>
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
    // Reset wizard
    wizardExps = [];
    wizardEtapa1 = null;
    areasSelecionadas = [];
    if (typeof wizardRenderExps === 'function') wizardRenderExps();
    if (typeof renderAreasChips === 'function') renderAreasChips();
    // Se já tem token, pula etapa 1 (conta)
    if (tokenCandidato) {
      wizardEtapa1 = { email: emailLogado, jaLogado: true };
      wizardIrPara(2);
    } else {
      wizardIrPara(1);
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

// ===== WIZARD DE CADASTRO (4 ETAPAS) =====
let wizardStep = 1;
let wizardExps = []; // experiências adicionadas no passo 4
let wizardEtapa1 = null; // email+senha do passo 1 (criar conta) — null se já logado

function wizardIrPara(n) {
  wizardStep = n;
  document.querySelectorAll('.wizard-etapa').forEach(el => el.style.setProperty('display', 'none', 'important'));
  document.querySelectorAll('.wizard-passo').forEach(el => el.classList.remove('ativo', 'concluido'));
  const etapa = document.getElementById('wizard-etapa-' + n);
  if (etapa) etapa.style.setProperty('display', 'block', 'important');
  for (let i = 1; i <= 5; i++) {
    const p = document.querySelector(`.wizard-passo[data-p="${i}"]`);
    if (!p) continue;
    if (i < n) p.classList.add('concluido');
    if (i === n) p.classList.add('ativo');
  }
  // já rolar pro topo do modal
  const modal = document.getElementById('modal-cad');
  if (modal) modal.scrollTop = 0;
  // Aplica regra do "primeiro emprego" na etapa 5
  if (n === 5) aplicarPrimeiroEmprego();
}

function wizardProximo() {
  if (wizardStep === 1) return wizardEtapa1Validar();
  if (wizardStep === 2) return wizardEtapa2Validar();
  if (wizardStep === 3) return wizardEtapa3Validar();
  if (wizardStep === 4) return wizardEtapa4Validar();
  if (wizardStep === 5) {
    // Salva flag "primeiro emprego" antes de finalizar
    wizardEtapa1.dados = wizardEtapa1.dados || {};
    wizardEtapa1.dados.primeiro_emprego = document.getElementById('w5-primeiro-emprego')?.checked || false;
    return wizardFinalizar();
  }
}

function wizardVoltar() {
  if (wizardStep > 1) wizardIrPara(wizardStep - 1);
}

function wizardEtapa1Validar() {
  // Se já tem token (caso "completar cadastro"), pula etapa 1
  if (tokenCandidato) {
    wizardEtapa1 = { email: emailLogado, jaLogado: true };
    wizardIrPara(2);
    return;
  }

  const email = document.getElementById('w1-email')?.value.trim().toLowerCase();
  const senha = document.getElementById('w1-senha')?.value;
  const senhaConf = document.getElementById('w1-senha-conf')?.value;
  if (!email || !email.includes('@')) return alert('Informe um e-mail válido');
  if (!senha || senha.length < 6) return alert('A senha deve ter no mínimo 6 caracteres');
  if (senha !== senhaConf) return alert('As senhas não coincidem');

  wizardEtapa1 = { email, senha, jaLogado: false };
  wizardIrPara(2);
}

function wizardEtapa2Validar() {
  const cpfRaw = document.getElementById('w2-cpf')?.value.trim() || '';
  const cpf = cpfRaw.replace(/\D/g, '');
  const nome = document.getElementById('w2-nome')?.value.trim();
  const dataNasc = document.getElementById('w2-nascimento')?.value;
  const sexo = document.getElementById('w2-sexo')?.value;
  const celular = document.getElementById('w2-celular')?.value.trim();
  const acessibilidade = document.getElementById('w2-acessibilidade')?.value || null;
  const politica = document.getElementById('w2-politica')?.checked;
  const comunicacoes = document.getElementById('w2-comunicacoes')?.checked || false;
  const banco = document.getElementById('w2-banco')?.checked;
  const areas = areasSelecionadas.slice();

  if (!cpf || cpf.length !== 11) return alert('CPF é obrigatório (11 dígitos)');
  if (!nome) return alert('Informe seu nome completo');
  if (!dataNasc) return alert('Informe sua data de nascimento');
  if (!sexo) return alert('Selecione o sexo');
  if (!celular || celular.replace(/\D/g, '').length < 10) return alert('Informe um celular válido');
  if (!politica) return alert('Você precisa aceitar a Política de Privacidade');

  // E-mail vem do cadastro (etapa 1) ou do candidato logado
  wizardEtapa1 = wizardEtapa1 || {};
  const emailFromLogin = (wizardEtapa1.email) || emailLogado || null;
  const sobreVoce = document.getElementById('w2-sobre-voce')?.value.trim() || null;
  wizardEtapa1.dados = { cpf, nome, data_nascimento: dataNasc, sexo, celular, email: emailFromLogin, acessibilidade, banco_talentos: banco, areas_interesse: areas, sobre_voce: sobreVoce, recebe_comunicacoes: comunicacoes };
  wizardIrPara(3);
}

function wizardEtapa3Validar() {
  const cep = document.getElementById('w3-cep')?.value.replace(/\D/g, '') || '';
  const estado = document.getElementById('w3-estado')?.value.trim().toUpperCase();
  const cidade = document.getElementById('w3-cidade')?.value.trim();
  const bairro = document.getElementById('w3-bairro')?.value.trim();
  const logradouro = document.getElementById('w3-logradouro')?.value.trim();
  const numero = document.getElementById('w3-numero')?.value.trim();
  const complemento = document.getElementById('w3-complemento')?.value.trim() || null;

  if (cep.length !== 8) return alert('CEP é obrigatório (8 dígitos)');
  if (!estado || estado.length !== 2) return alert('UF é obrigatório (ex: SP)');
  if (!cidade) return alert('Cidade é obrigatória');
  if (!bairro) return alert('Bairro é obrigatório');
  if (!logradouro) return alert('Logradouro é obrigatório');
  if (!numero) return alert('Número é obrigatório');

  wizardEtapa1.dados = wizardEtapa1.dados || {};
  Object.assign(wizardEtapa1.dados, { cep, estado, cidade, bairro, logradouro, numero, complemento });
  wizardIrPara(4);
}

function wizardEtapa4Validar() {
  const formacao = document.getElementById('w4-formacao')?.value;
  const instituicao = document.getElementById('w4-instituicao')?.value.trim() || null;
  const curso = document.getElementById('w4-curso')?.value.trim() || null;
  const situacao = document.getElementById('w4-situacao')?.value || null;
  const dataConclusao = document.getElementById('w4-conclusao')?.value || null;

  if (!formacao) return alert('Selecione a formação');

  wizardEtapa1.dados = wizardEtapa1.dados || {};
  Object.assign(wizardEtapa1.dados, { formacao, instituicao, curso, situacao, data_conclusao: dataConclusao });
  wizardIrPara(5);
}

function wizardAddExperiencia() {
  const cargo = document.getElementById('w5-cargo')?.value.trim();
  const empresa = document.getElementById('w5-empresa')?.value.trim();
  const inicio = document.getElementById('w5-inicio')?.value || null;
  const fim = document.getElementById('w5-fim')?.value || null;
  const empregoAtual = document.getElementById('w5-atual')?.checked;
  const descricao = document.getElementById('w5-descricao')?.value.trim() || null;

  if (!cargo) return alert('Informe o cargo');
  if (!empresa) return alert('Informe a empresa');

  if (empregoAtual) {
    wizardExps.push({ cargo, empresa, inicio, fim: null, emprego_atual: true, descricao });
  } else {
    if (!inicio) return alert('Informe a data de início');
    if (!fim) return alert('Informe a data de término (ou marque "Emprego atual")');
    wizardExps.push({ cargo, empresa, inicio, fim, emprego_atual: false, descricao });
  }

  // limpa form
  ['w5-cargo','w5-empresa','w5-inicio','w5-fim','w5-descricao'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const at = document.getElementById('w5-atual'); if (at) at.checked = false;
  wizardRenderExps();
}

function wizardRemoverExp(idx) {
  wizardExps.splice(idx, 1);
  wizardRenderExps();
}

function wizardRenderExps() {
  const cont = document.getElementById('w5-lista');
  if (!cont) return;
  if (wizardExps.length === 0) {
    cont.innerHTML = '<p class="muted">Nenhuma experiência adicionada ainda. Você pode adicionar ou pular essa etapa.</p>';
    return;
  }
  cont.innerHTML = wizardExps.map((e, i) => `
    <div class="exp-item">
      <div>
        <strong>${e.cargo}</strong> — ${e.empresa}
        <div class="muted" style="font-size:12px">${e.inicio || '?'} → ${e.emprego_atual ? 'Atual' : (e.fim || '?')}</div>
      </div>
      <button type="button" class="btn-x" onclick="wizardRemoverExp(${i})" title="Remover">×</button>
    </div>
  `).join('');
}

async function wizardFinalizar() {
  const dados = {
    ...(wizardEtapa1.dados || {}),
    experiencias: wizardExps
  };

  const btn = document.querySelector('#wizard-etapa-5 .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Finalizando...'; }

  try {
    // 1) Se não logado, cria a conta
    if (!wizardEtapa1.jaLogado) {
      const rc = await fetch(API + '/api/candidato/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: dados.nome,
          email: wizardEtapa1.email,
          senha: wizardEtapa1.senha,
          cpf: dados.cpf,
          celular: dados.celular,
          data_nascimento: dados.data_nascimento,
          sexo: dados.sexo
        })
      });
      const dc = await rc.json();
      if (!rc.ok) {
        alert('Erro: ' + (dc.erro || 'não foi possível criar a conta'));
        if (btn) { btn.disabled = false; btn.textContent = 'Finalizar cadastro'; }
        return;
      }
      tokenCandidato = dc.token;
      emailLogado = dc.candidato.email;
      localStorage.setItem('candidato_token', tokenCandidato);
      localStorage.setItem('candidato_email', emailLogado);
      localStorage.setItem('candidato_nome', dados.nome);
    }

    // 2) Salva o resto do perfil (endereço, escolaridade, experiências)
    const rp = await fetch(API + '/api/candidato/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenCandidato },
      body: JSON.stringify(dados)
    });
    const dp = await rp.json();
    if (!rp.ok) {
      alert('Erro: ' + (dp.erro || 'não foi possível salvar o perfil'));
      if (btn) { btn.disabled = false; btn.textContent = 'Finalizar cadastro'; }
      return;
    }

    cadastroCompleto = true;
    localStorage.setItem('candidato_nome', dados.nome);
    if (vagaSelecionada) {
      // se veio de "candidatar", já abre o detalhe da vaga
      fecharModal('cad');
      atualizarHeaderUsuario();
      const btnCand = document.getElementById('btn-candidatar');
      if (btnCand) {
        btnCand.textContent = '✅ Candidatar-se a esta vaga';
        btnCand.disabled = false;
        btnCand.onclick = () => candidatar(vagaSelecionada.id);
      }
    } else {
      fecharModal('cad');
      atualizarHeaderUsuario();
    }
  } catch (e) {
    alert('Erro de conexão. Tente novamente.');
    if (btn) { btn.disabled = false; btn.textContent = 'Finalizar cadastro'; }
  }
}

// Compat: função usada pelo HTML antigo em alguns lugares
function irParaEtapa(n) {
  if (n >= 1 && n <= 5) wizardIrPara(n);
}

// ===== PRIMEIRO EMPREGO (esconde área de experiência) =====
function aplicarPrimeiroEmprego() {
  const ck = document.getElementById('w5-primeiro-emprego');
  if (!ck) return;
  const lista = document.getElementById('w5-lista');
  const expForm = document.querySelector('#wizard-etapa-5 .exp-form');
  if (ck.checked) {
    if (lista) lista.style.display = 'none';
    if (expForm) expForm.style.display = 'none';
    wizardExps = [];
  } else {
    if (lista) lista.style.display = '';
    if (expForm) expForm.style.display = '';
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
  const headerActions = document.getElementById('header-actions');
  if (!headerActions) return;

  if (tokenCandidato && cadastroCompleto) {
    // Logado: header-actions vazio (☰ fica no lado do logo)
    headerActions.innerHTML = '';
  } else if (tokenCandidato) {
    headerActions.innerHTML = `<button class="btn-outline" onclick="abrirModal('cad')">📝 Completar cadastro</button>`;
  } else {
    headerActions.innerHTML = `
      <button class="btn-outline" onclick="abrirModal('login')">Entrar</button>
      <button id="btn-cadastrar" class="btn-outline" onclick="abrirModal('cad')">Cadastrar</button>
    `;
  }
  // SEMPRE garante que o botão ☰ no logo existe (logado ou deslogado)
  garantirBotaoMenu();
}

function garantirBotaoMenu() {
  const existe = document.getElementById('btn-menu-logo');
  // Qualquer usuário logado deve ter acesso ao menu (inclusive antes de
  // completar o cadastro), para conseguir sair da conta em qualquer página.
  if (!tokenCandidato) {
    if (existe) existe.remove();
    return;
  }
  if (existe) return;
  // Insere no final do header-actions (em vez de absolute no header) pra
  // não ficar atrás dos botões "Completar cadastro" / "Entrar" / etc.
  const actionsEl = document.getElementById('header-actions')
    || document.querySelector('.header-actions')
    || document.querySelector('header');
  if (!actionsEl) return;
  const btn = document.createElement('button');
  btn.id = 'btn-menu-logo';
  btn.className = 'btn-menu-logo';
  btn.title = 'Menu';
  btn.setAttribute('aria-label', 'Abrir menu');
  btn.innerHTML = '☰';
  btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); window.abrirDrawer && window.abrirDrawer(e); });
  actionsEl.appendChild(btn);
}

async function abrirPainelCandidato() {
  if (!tokenCandidato) { abrirModal('login'); return; }
  if (!cadastroCompleto) {
    abrirModal('cad');
    return;
  }

  // Vai pra página dedicada do candidato (não mais modal)
  location.href = 'painel.html';
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
    const painelFoto = document.getElementById('painel-foto');
    if (painelFoto) {
      if (perfil.foto_url) {
        painelFoto.style.backgroundImage = `url("${perfil.foto_url}")`;
        painelFoto.style.backgroundSize = 'cover';
        painelFoto.style.backgroundPosition = 'center';
        painelFoto.textContent = '';
      } else {
        painelFoto.style.backgroundImage = '';
        painelFoto.textContent = iniciais || '👤';
      }
    }
    document.getElementById('painel-nome').textContent = nome;
    document.getElementById('painel-email').textContent = perfil.email || emailLogado || '';
    localStorage.setItem('candidato_nome', nome);
    if (perfil.foto_url) localStorage.setItem('candidato_foto', perfil.foto_url);
  }

  // Foto de perfil no editor
  if (typeof window.perfilFotoInit === 'function') window.perfilFotoInit(perfil);

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
  carregarCands();
}

async function carregarCands() {
  const listaEl = document.getElementById('painel-cands-lista');
  if (!listaEl) return;
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
      const cnt = document.getElementById('painel-cands-count');
      if (cnt) cnt.textContent = '';
      return;
    }

    // Contador no título
    const cnt = document.getElementById('painel-cands-count');
    if (cnt) cnt.textContent = `(${lista.length} ${lista.length === 1 ? 'vaga' : 'vagas'})`;

    // Buscar etapas de cada vaga pra montar a timeline
    const ETAPAS_PADRAO = [
      { nome: 'Inscrição',              descricao: 'Você se candidatou, agora nosso time vai analisar seu perfil.' },
      { nome: 'Triagem curricular',     descricao: 'Nosso time vai analisar sua compatibilidade com a vaga.' },
      { nome: 'Entrevista RH',          descricao: 'Vamos entrar em contato para agendar um bate papo com nosso time.' },
      { nome: 'Entrevista gestor',      descricao: 'Segunda parte do processo, bate papo com o gestor/empresa.' },
      { nome: 'Coleta de documentos',   descricao: 'Nessa etapa será solicitado o anexo dos documentos necessários para contratação.' },
      { nome: 'Contratação',            descricao: 'Fim do processo.' }
    ];
    const cands = await Promise.all(lista.map(async (c) => {
      // Se a vaga tem etapas salvas, usa; senão, usa o padrão
      let etapas = c.etapas;
      if (typeof etapas === 'string') {
        try { etapas = JSON.parse(etapas); } catch (e) { etapas = null; }
      }
      if (!Array.isArray(etapas) || !etapas.length) {
        // Tenta buscar a vaga pra ver se tem etapas customizadas
        try {
          const rv = await fetch(API + '/api/vagas/' + c.vaga_id);
          const dv = await rv.json();
          const v = dv.vaga || dv;
          etapas = v.etapas;
          if (typeof etapas === 'string') {
            try { etapas = JSON.parse(etapas); } catch (e) { etapas = null; }
          }
        } catch (e) {}
      }
      if (!Array.isArray(etapas) || !etapas.length) etapas = ETAPAS_PADRAO;
      return { ...c, etapas };
    }));

    listaEl.innerHTML = cands.map(c => {
      const etapaAtual = Number(c.etapa_atual || 0);
      const totalEtapas = c.etapas.length;
      const isReprovado = (c.status === 'reprovado' || c.status === 'rejeitado');
      const isContratado = (c.status === 'contratado' || c.status === 'contratada');
      // Helper: extrai nome + descrição de uma etapa (aceita string ou objeto)
      const etapaObj = (e) => ({
        nome: (typeof e === 'string') ? e : (e?.nome || `Etapa`),
        descricao: (typeof e === 'object' && e?.descricao) ? e.descricao : ''
      });
      // --- Bolinhas de etapa (timeline visual) ---
      const etapasHTML = c.etapas.map((e, i) => {
        const { nome, descricao } = etapaObj(e);
        let cls = '';
        let bola = (i + 1).toString();
        if (i < etapaAtual) {
          cls = 'concluida';
          bola = '✓';
        } else if (i === etapaAtual) {
          if (isReprovado) { cls = 'reprovada'; bola = '✕'; }
          else if (isContratado) { cls = 'concluida'; bola = '✓'; }
          else { cls = 'andamento'; bola = '⏳'; }
        }
        const tooltip = descricao ? `${nome} — ${descricao}` : nome;
        return `<div class="cand-etapa ${cls}" title="${tooltip.replace(/"/g, '&quot;')}">
          <div class="cand-etapa-bola">${bola}</div>
          <div class="cand-etapa-label">${nome}</div>
        </div>`;
      }).join('');
      // --- Barra de progresso (% concluído) ---
      const etapasConcluidas = Math.min(etapaAtual, totalEtapas);
      const pct = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
      // --- Descrição da etapa atual (destaque) ---
      const etapaAtualObj = c.etapas[etapaAtual];
      const etapaAtualFmt = etapaObj(etapaAtualObj);
      const etapaNome = (() => {
        if (isContratado) return '🎉 Contratação concluída';
        if (isReprovado) return 'Processo encerrado';
        if (!etapaAtualObj) return 'Inscrição recebida';
        return `Etapa ${etapaAtual + 1} de ${totalEtapas} — ${etapaAtualFmt.nome}`;
      })();
      const etapaDescricao = (() => {
        if (isContratado) return 'Parabéns! Você foi aprovado em todas as etapas.';
        if (isReprovado) return 'Infelizmente o processo não seguiu dessa vez. Continue tentando!';
        if (!etapaAtualObj) return 'Aguarde a primeira movimentação do recrutador.';
        return etapaAtualFmt.descricao || '';
      })();
      const statusClass = c.status || 'em_analise';
      const cardExtras = isContratado ? ' contratado' : (isReprovado ? ' reprovado' : '');
      const fillBg = isContratado
        ? 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)'
        : isReprovado
          ? 'var(--vermelho)'
          : 'linear-gradient(90deg, var(--vinho) 0%, var(--vinho-claro) 100%)';
      const localTxt = c.cidade ? `${c.cidade}${c.estado ? ' / ' + c.estado : ''}` : '';
      return `
        <div class="cand-card${cardExtras}" onclick="location.href='inscricao.html?vaga=${c.vaga_id}'" title="Acompanhar processo seletivo">
          <div class="cand-card-top">
            <div class="cand-card-info">
              <h4>${c.titulo || 'Vaga'}</h4>
              <div class="cand-card-meta">
                <span>🏢 ${c.empresa || 'Empresa'}</span>
                ${localTxt ? `<span class="sep">•</span><span>📍 ${localTxt}</span>` : ''}
              </div>
            </div>
            <span class="cand-status status-${statusClass}"><span class="dot"></span>${statusLabel(c.status)}</span>
          </div>
          <div class="cand-progresso">
            <div class="cand-progresso-top">
              <span>${etapaNome}</span>
              <strong>${pct}%</strong>
            </div>
            <div class="cand-progresso-bar"><div class="cand-progresso-fill" style="width:${pct}%;background:${fillBg}"></div></div>
            ${etapaDescricao ? `<div class="cand-progresso-desc">${etapaDescricao}</div>` : ''}
          </div>
          <div class="cand-timeline">${etapasHTML}</div>
          <div class="cand-card-footer">
            <span>📅 Inscrito em ${formatarData(c.criada_em)}</span>
            <span class="ver-mais">Acompanhar processo →</span>
          </div>
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

async function salvarPerfilCompleto(target) {
  // Se target for o form (pelo onsubmit), o botão está dentro dele
  const form = target?.tagName === 'FORM' ? target : (target?.form || document.getElementById('perfil-form'));
  const btn = target?.tagName === 'FORM' ? target.querySelector('button[type="submit"]') : target;
  
  if (btn) { 
    btn.disabled = true; 
    btn._oldText = btn.textContent; 
    btn.textContent = 'Salvando...'; 
  }

  // Helper para buscar valor preferencialmente dentro do form para evitar colisões
  const getV = (id) => {
    const el = form ? form.querySelector('#' + id) : document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const payload = {
    nome: getV('pe-nome'),
    cpf: getV('pe-cpf').replace(/\D/g, ''),
    data_nascimento: getV('pe-nascimento') || null,
    sexo: getV('pe-sexo') || null,
    celular: getV('pe-celular').trim(),
    cep: getV('pe-cep').replace(/\D/g, ''),
    cidade: getV('pe-cidade'),
    estado: getV('pe-estado').toUpperCase(),
    bairro: getV('pe-bairro'),
    logradouro: getV('pe-logradouro'),
    numero: getV('pe-numero'),
    complemento: getV('pe-complemento'),
    formacao: getV('pe-formacao') || null,
    instituicao: getV('pe-instituicao'),
    curso: getV('pe-curso'),
    situacao: getV('pe-situacao') || null,
    primeiro_emprego: getV('pe-primeiro-emprego') === 'true',
    experiencia: getV('pe-experiencia') || null,
    sobre_voce: getV('pe-sobre-voce') || null,
    acessibilidade: getV('pe-acessibilidade') || null,
    recebe_comunicacoes: form ? (form.querySelector('#pe-comunicacoes')?.checked || false) : (document.getElementById('pe-comunicacoes')?.checked || false)
  };

  // Se a página injetou um array de experiencias (ex: perfil.html), inclui no payload
  if (Array.isArray(window.__perfilExps)) {
    payload.experiencias = window.__perfilExps;
  }

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
      setTimeout(() => { 
        if (btn) { 
          btn.textContent = btn._oldText || 'Salvar perfil'; 
          btn.style.background = ''; 
          btn.disabled = false; 
        } 
        if (typeof carregarPainel === 'function') carregarPainel();
        if (location.pathname.includes('perfil.html')) location.reload();
      }, 800);
    } else {
      alert('Erro: ' + (data.erro || ''));
      if (btn) { btn.disabled = false; btn.textContent = btn._oldText || 'Salvar perfil'; }
    }
  } catch (e) {
    alert('Erro de conexão');
    if (btn) { btn.disabled = false; btn.textContent = btn._oldText || 'Salvar perfil'; }
  }
}

// ===== FOTO DE PERFIL =====
function perfilFotoInit(perfil) {
  const preview = document.getElementById('perfil-foto-preview');
  const inicial = document.getElementById('perfil-foto-inicial');
  const btnRemover = document.getElementById('perfil-foto-remover');
  if (!preview) return;
  const fotoUrl = (perfil && perfil.foto_url) ? perfil.foto_url : '';
  const nome = (perfil && perfil.nome) ? perfil.nome : (localStorage.getItem('candidato_nome') || emailLogado || '?');
  const ini = (nome || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
  if (fotoUrl) {
    preview.style.backgroundImage = 'url("' + fotoUrl.replace(/"/g, '\\"') + '")';
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
    if (inicial) inicial.style.display = 'none';
    if (btnRemover) btnRemover.style.display = 'inline-block';
    localStorage.setItem('candidato_foto', fotoUrl);
  } else {
    preview.style.backgroundImage = '';
    if (inicial) { inicial.style.display = ''; inicial.textContent = ini || '👤'; }
    if (btnRemover) btnRemover.style.display = 'none';
  }
}

function perfilFotoEscolher(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
    alert('Formato inválido. Use JPG, PNG ou WebP.');
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('Imagem muito grande. Máximo 5 MB.');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    const preview = document.getElementById('perfil-foto-preview');
    const inicial = document.getElementById('perfil-foto-inicial');
    if (preview) {
      preview.style.backgroundImage = 'url(' + dataUrl + ')';
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
    }
    if (inicial) inicial.style.display = 'none';
    const btnRemover = document.getElementById('perfil-foto-remover');
    if (btnRemover) btnRemover.style.display = 'inline-block';
    try {
      const r = await fetch(API + '/api/candidato/foto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenCandidato },
        body: JSON.stringify({ foto_url: dataUrl })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.erro || 'Erro ao enviar');
      localStorage.setItem('candidato_foto', dataUrl);
      const painelFoto = document.getElementById('painel-foto');
      if (painelFoto) {
        painelFoto.style.backgroundImage = 'url("' + dataUrl.replace(/"/g, '\\"') + '")';
        painelFoto.style.backgroundSize = 'cover';
        painelFoto.style.backgroundPosition = 'center';
        painelFoto.textContent = '';
      }
      atualizarHeaderUsuario();
    } catch (err) {
      alert('Erro ao enviar foto: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
}

async function perfilFotoRemover() {
  if (!confirm('Remover sua foto de perfil?')) return;
  try {
    const r = await fetch(API + '/api/candidato/foto', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (!r.ok) {
      const data = await r.json();
      throw new Error(data.erro || 'Erro ao remover');
    }
    localStorage.removeItem('candidato_foto');
    const preview = document.getElementById('perfil-foto-preview');
    const inicial = document.getElementById('perfil-foto-inicial');
    const btnRemover = document.getElementById('perfil-foto-remover');
    if (preview) preview.style.backgroundImage = '';
    const nome = localStorage.getItem('candidato_nome') || emailLogado || '?';
    const ini = (nome || '?').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
    if (inicial) { inicial.style.display = ''; inicial.textContent = ini; }
    if (btnRemover) btnRemover.style.display = 'none';
    const painelFoto = document.getElementById('painel-foto');
    if (painelFoto) {
      painelFoto.style.backgroundImage = '';
      painelFoto.textContent = ini;
    }
    atualizarHeaderUsuario();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

window.perfilFotoInit = perfilFotoInit;
window.perfilFotoEscolher = perfilFotoEscolher;
window.perfilFotoRemover = perfilFotoRemover;

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
    em_andamento: 'Em andamento',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    rejeitado: 'Reprovado',
    contratado: 'Contratado',
    contratada: 'Contratado',
    entrevista: 'Entrevista'
  }[s] || s;
}

function logout() {
  if (!confirm('Tem certeza que deseja sair da sua conta?')) return;
  localStorage.removeItem('candidato_token');
  localStorage.removeItem('candidato_email');
  localStorage.removeItem('candidato_nome');
  tokenCandidato = null;
  cadastroCompleto = false;
  emailLogado = null;
  fecharDrawer();
  atualizarHeaderUsuario();
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('aberto'));
  // Redireciona pra home se não estiver lá
  if (!location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')) {
    location.href = 'index.html';
  } else {
    location.reload();
  }
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
  // Compara só a parte de DATA (sem hora) pra evitar "Hoje" aparecer quando já virou "Ontem"
  const dDia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const hDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diff = Math.round((hDia - dDia) / 86400000);
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

  // Máscaras adicionais para o perfil dedicado (pe- IDs)
  ['pe-cpf'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/-$/, '').replace(/\.$/, '');
      e.target.value = v;
    });
  });
  ['pe-cep'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
      v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '');
      e.target.value = v;
    });
  });
  ['pe-celular'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
      else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
      e.target.value = v;
    });
  });
});

// ============================================
// EXPOR NO WINDOW (para onclick inline funcionar)
// ============================================
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
window.salvarPerfilCompleto = salvarPerfilCompleto;
// Wizard
window.wizardIrPara = wizardIrPara;
window.wizardProximo = wizardProximo;
window.wizardVoltar = wizardVoltar;
window.wizardAddExperiencia = wizardAddExperiencia;
window.wizardRemoverExp = wizardRemoverExp;
window.wizardFinalizar = wizardFinalizar;
window.aplicarPrimeiroEmprego = aplicarPrimeiroEmprego;

// Expõe estado pro drawer/UI
Object.defineProperty(window, 'tokenCandidato', { get: () => tokenCandidato });
Object.defineProperty(window, 'emailLogado', { get: () => emailLogado });
Object.defineProperty(window, 'cadastroCompleto', { get: () => cadastroCompleto });
