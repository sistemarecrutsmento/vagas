// ============================================
// VAGAS.IO — Front-end do Candidato
// Conecta com backend: https://recrutamento-api.onrender.com
// ============================================

const API = 'https://recrutamento-api.onrender.com';
let categoriaAtiva = '';
let vagaSelecionada = null;
let candidatoLogado = null;

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
    if (busca) params.set('q', busca);
    if (categoriaAtiva) params.set('categoria', categoriaAtiva);
    if (params.toString()) url += '?' + params;
    const r = await fetch(url);
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
        <div class="local">${v.local || ''}</div>
        <div class="footer">
          <span class="data">${formatarData(v.criada_em)}</span>
          <span class="cta">Ver detalhes →</span>
        </div>
      </div>
    `).join('');
    contador.textContent = `${vagas.length} vaga${vagas.length !== 1 ? 's' : ''} encontrada${vagas.length !== 1 ? 's' : ''}`;
  } catch (e) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;color:#C00;">Erro ao carregar vagas. Tente novamente.</div>`;
  }
}

function abrirDetalhes(id) {
  fetch(API + '/api/vagas/' + id)
    .then(r => r.json())
    .then(v => {
      vagaSelecionada = v;
      document.getElementById('det-empresa').textContent = v.empresa || '';
      document.getElementById('det-titulo').textContent = v.titulo;
      document.getElementById('det-local').textContent = v.cidade || '—';
      document.getElementById('det-modalidade').textContent = v.modalidade || '—';
      document.getElementById('det-salario').textContent = v.salario || 'A combinar';
      document.getElementById('det-tipo').textContent = v.tipo_contrato || '—';
      document.getElementById('det-descricao').textContent = v.descricao || '—';
      document.getElementById('det-requisitos').textContent = v.requisitos || '—';
      abrirModal('detalhes');
    });
}

async function candidatar() {
  if (!candidatoLogado) {
    fecharModal('detalhes');
    abrirAuth();
    return;
  }
  const btn = document.getElementById('det-cta');
  btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    const r = await fetch(API + '/api/candidaturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + candidatoLogado.token },
      body: JSON.stringify({ vaga_id: vagaSelecionada.id })
    });
    const data = await r.json();
    if (r.ok) {
      btn.textContent = '✓ Candidatura enviada!';
      setTimeout(() => fecharModal('detalhes'), 1500);
    } else {
      btn.textContent = data.erro || 'Erro';
      setTimeout(() => { btn.disabled = false; btn.textContent = 'Candidatar-se'; }, 2000);
    }
  } catch {
    btn.textContent = 'Erro de conexão';
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Candidatar-se'; }, 2000);
  }
}

// ===== AUTH =====
function abrirAuth() { abrirModal('auth'); }
function trocarTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('ativo', t.dataset.tab === tab));
  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-cadastro').style.display = tab === 'cadastro' ? 'block' : 'none';
  document.getElementById('alert-auth').innerHTML = '';
}

async function fazerLogin() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  try {
    const r = await fetch(API + '/api/candidato/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const data = await r.json();
    if (r.ok) {
      localStorage.setItem('candidato', JSON.stringify(data));
      candidatoLogado = data;
      fecharModal('auth');
      location.reload();
    } else {
      mostrarAuthErro(data.erro || 'Erro ao entrar');
    }
  } catch { mostrarAuthErro('Erro de conexão'); }
}

async function fazerCadastro() {
  const nome = document.getElementById('cad-nome').value;
  const email = document.getElementById('cad-email').value;
  const telefone = document.getElementById('cad-telefone').value;
  const senha = document.getElementById('cad-senha').value;
  try {
    const r = await fetch(API + '/api/candidato/cadastrar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, telefone, senha })
    });
    const data = await r.json();
    if (r.ok) {
      localStorage.setItem('candidato', JSON.stringify(data));
      candidatoLogado = data;
      fecharModal('auth');
      location.reload();
    } else {
      mostrarAuthErro(data.erro || 'Erro ao cadastrar');
    }
  } catch { mostrarAuthErro('Erro de conexão'); }
}

function mostrarAuthErro(msg) {
  document.getElementById('alert-auth').innerHTML = `<div class="alert alert-erro">${msg}</div>`;
}

function checarAuth() {
  const saved = localStorage.getItem('candidato');
  if (saved) {
    candidatoLogado = JSON.parse(saved);
    const nav = document.getElementById('nav-perfil');
    nav.textContent = 'Meu perfil';
    nav.onclick = () => alert('Perfil: ' + (candidatoLogado.candidato?.nome || candidatoLogado.nome || 'OK'));
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
  if (!iso) return 'Recente';
  const d = new Date(iso);
  const hoje = new Date();
  const diff = Math.floor((hoje - d) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `${diff} dias atrás`;
  return d.toLocaleDateString('pt-BR');
}
