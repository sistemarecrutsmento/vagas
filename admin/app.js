// ============================================
// ADMIN — Painel de Recrutamento
// Conecta com backend: https://recrutamento-api-novo.onrender.com
// ============================================

const API = 'https://recrutamento-api-novo.onrender.com';
let token = null;
let vagaEmEdicao = null;

// FIX Etapa 2 (2026-07-27): wrapper de fetch com auto-refresh.
// Se auth-helper.js está carregado, usa authFetch (com refresh automático).
// Se não está, fallback pro fetch direto com token.
async function authedFetch(url, opts = {}) {
  if (typeof window.authFetch === 'function') {
    return window.authFetch(url, opts);
  }
  // Fallback: adiciona Authorization Bearer manualmente
  const headers = opts.headers ? { ...opts.headers } : {};
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return fetch(url, { ...opts, headers });
}
let loginCodigoId = null;        // id do código 2FA pendente
let loginEmailEmProgresso = null; // email do login em andamento (2FA)
let loginCooldownInterval = null; // timer do cooldown do reenviar

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('admin_token');
  if (saved && saved !== 'undefined' && saved !== 'null') {
    token = saved;
    mostrarApp();
  }
});

// ===== AUTH =====
// Tenta login como admin primeiro, depois como recrutador (fallback)
// O backend tem DUAS tabelas: admins (acesso total) e recrutadores (limitado)
// e DUAS rotas: /api/admin/login e /api/auth/login-recrutador
// Aqui a gente tenta as duas automaticamente pra não dar erro esquisito.
// NOVIDADE: agora o login admin exige 2FA. A função abaixo cuida do 2-step.
// Primeiro passo: descobrir se 2FA foi exigido; se sim, mostra tela de código.
async function fazerLogin() {
  console.log('[login] fazerLogin() chamado');
  const emailEl = document.getElementById('login-email');
  const senhaEl = document.getElementById('login-senha');
  const btn = document.getElementById('btn-entrar');
  const alertEl = document.getElementById('alert-login');

  if (!emailEl || !senhaEl || !btn) {
    console.error('[login] Elementos não encontrados', {emailEl: !!emailEl, senhaEl: !!senhaEl, btn: !!btn});
    return;
  }

  const email = emailEl.value.trim();
  const senha = senhaEl.value;

  if (!email || !senha) {
    if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">Digite email e senha</div>';
    return;
  }

  // Feedback visual
  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Entrando...';
  if (alertEl) alertEl.innerHTML = '';

  // Helper: fetch com timeout de 15s (pra não travar se Render tiver hibernando)
  const fetchComTimeout = (url, opts) => {
    return new Promise((resolve, reject) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')); }, 15000);
      fetch(url, { ...opts, signal: ctrl.signal })
        .then(r => { clearTimeout(t); resolve(r); })
        .catch(e => { clearTimeout(t); reject(e); });
    });
  };

  try {
    console.log('[login] chamando API admin...');
    // 1ª tentativa: admin
    let r = await authedFetch(API + '/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    let data = await r.json().catch(() => ({}));

    // 2FA: se o backend exigiu verificação de 2 etapas, mostra tela de código
    if (r.ok && data.requer_2fa && data.codigo_id) {
      console.log('[login] 2FA requerido, codigo_id=', data.codigo_id);
      loginCodigoId = data.codigo_id;
      loginEmailEmProgresso = data.email || email;
      if (alertEl) alertEl.innerHTML = '';
      btn.disabled = false;
      btn.textContent = textoOriginal;
      mostrarStep2FA();
      return;
    }

    // 2ª tentativa: recrutador (se admin falhou com 401 "credenciais inválidas")
    if (!r.ok && (r.status === 401 || r.status === 400)) {
      console.log('[login] tentando rota recrutador...');
      try {
        const r2 = await authedFetch(API + '/api/auth/login-recrutador', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        if (r2.ok) { r = r2; data = await r2.json().catch(() => ({})); }
      } catch (e2) { console.warn('[login] recrutador timeout:', e2); }
    }

    if (r.ok && data.token) {
      console.log('[login] sucesso, salvando token');
      token = data.token;
      const tipoUsuario = data.usuario?.tipo || 'admin';
      const userId = data.usuario?.id || null;
      localStorage.setItem('admin_token', token);
      // ETAPA 2: salva refresh token para auto-refresh
      if (data.refreshToken) {
        localStorage.setItem('admin_refresh', data.refreshToken);
      }
      localStorage.setItem('admin_tipo', tipoUsuario);
      localStorage.setItem('admin_user_id', userId);
      localStorage.setItem('admin_usuario', JSON.stringify(data.usuario || {}));
      if (alertEl) alertEl.innerHTML = '<div class="alert alert-ok">Logado! Entrando...</div>';
      btn.textContent = '✓ Logado!';
      // Mostra app sem reload pra evitar problemas de cache
      setTimeout(() => mostrarApp(), 200);
      return;
    } else {
      console.warn('[login] falhou:', r.status, data);
      if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">' + (data.erro || ('Erro ' + r.status)) + '</div>';
      btn.disabled = false;
      btn.textContent = textoOriginal;
      return;
    }
  } catch (e) {
    console.error('[login] ERRO:', e);
    let msg = 'Erro: ' + (e.message || 'sem conexão');
    if (e.message === 'timeout' || e.name === 'AbortError') {
      msg = '⏱️ Servidor demorou mais de 15s. Render está "dormindo" — clique Entrar de novo em 30s.';
    }
    if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">' + msg + '</div>';
    btn.disabled = false;
    btn.textContent = textoOriginal;
    return;
  }
}

// ===== 2FA =====
function mostrarStep2FA() {
  const s1 = document.getElementById('login-step-1');
  const s2 = document.getElementById('login-step-2');
  if (s1) s1.style.display = 'none';
  if (s2) s2.style.display = 'block';
  const emailEl = document.getElementById('login-2fa-email');
  if (emailEl) emailEl.textContent = loginEmailEmProgresso;
  const alertEl = document.getElementById('alert-2fa');
  if (alertEl) alertEl.innerHTML = '<div class="alert alert-ok">📩 Código enviado para seu e-mail</div>';
  const input = document.getElementById('login-2fa-codigo');
  if (input) { input.value = ''; input.focus(); }
  iniciarCooldownReenviar();
}

function voltarLogin() {
  const s1 = document.getElementById('login-step-1');
  const s2 = document.getElementById('login-step-2');
  if (s1) s1.style.display = 'block';
  if (s2) s2.style.display = 'none';
  if (loginCooldownInterval) clearInterval(loginCooldownInterval);
  loginCodigoId = null;
  loginEmailEmProgresso = null;
  const alertEl = document.getElementById('alert-2fa');
  if (alertEl) alertEl.innerHTML = '';
  const alertEl1 = document.getElementById('alert-login');
  if (alertEl1) alertEl1.innerHTML = '';
  const sBtn = document.getElementById('login-senha');
  if (sBtn) { sBtn.value = ''; sBtn.focus(); }
}

async function verificar2FA() {
  const inp = document.getElementById('login-2fa-codigo');
  const btn = document.getElementById('btn-verificar-2fa');
  const alertEl = document.getElementById('alert-2fa');
  if (!inp || !btn) return;
  const codigo = inp.value.trim().replace(/\D/g, '');
  if (codigo.length !== 6) {
    if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">Digite os 6 dígitos do código</div>';
    return;
  }
  if (!loginCodigoId) {
    if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">Sessão 2FA expirou. Volte ao login.</div>';
    return;
  }
  btn.disabled = true;
  const txtOriginal = btn.textContent;
  btn.textContent = 'Verificando...';
  if (alertEl) alertEl.innerHTML = '';
  const fetchComTimeout = (url, opts) => {
    return new Promise((resolve, reject) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')); }, 15000);
      fetch(url, { ...opts, signal: ctrl.signal })
        .then(r => { clearTimeout(t); resolve(r); })
        .catch(e => { clearTimeout(t); reject(e); });
    });
  };
  try {
    const r = await authedFetch(API + '/api/admin/2fa/verificar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_id: loginCodigoId, codigo })
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.token) {
      console.log('[2FA] verificado, salvando token');
      token = data.token;
      const tipoUsuario = data.usuario?.tipo || 'admin';
      const userId = data.usuario?.id || null;
      localStorage.setItem('admin_token', token);
      // ETAPA 2: salva refresh token para auto-refresh
      if (data.refreshToken) {
        localStorage.setItem('admin_refresh', data.refreshToken);
      }
      localStorage.setItem('admin_tipo', tipoUsuario);
      localStorage.setItem('admin_user_id', userId);
      localStorage.setItem('admin_usuario', JSON.stringify(data.usuario || {}));
      if (alertEl) alertEl.innerHTML = '<div class="alert alert-ok">✓ Verificado! Entrando...</div>';
      btn.textContent = '✓ Logado!';
      setTimeout(() => mostrarApp(), 200);
      return;
    }
    if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">' + (data.erro || 'Código inválido') + '</div>';
    btn.disabled = false;
    btn.textContent = txtOriginal;
  } catch (e) {
    if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">Erro: ' + (e.message || 'sem conexão') + '</div>';
    btn.disabled = false;
    btn.textContent = txtOriginal;
  }
}

function iniciarCooldownReenviar() {
  const cooldownEl = document.getElementById('reenviar-cooldown');
  const segEl = document.getElementById('cooldown-seg');
  const btn = document.getElementById('btn-reenviar-2fa');
  if (!cooldownEl || !segEl || !btn) return;
  let seg = 60;
  cooldownEl.style.display = 'inline';
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.5';
  segEl.textContent = seg;
  if (loginCooldownInterval) clearInterval(loginCooldownInterval);
  loginCooldownInterval = setInterval(() => {
    seg--;
    if (seg <= 0) {
      clearInterval(loginCooldownInterval);
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
      cooldownEl.style.display = 'none';
    } else {
      segEl.textContent = seg;
    }
  }, 1000);
}

async function reenviar2FA() {
  if (!loginCodigoId) return;
  const btn = document.getElementById('btn-reenviar-2fa');
  const alertEl = document.getElementById('alert-2fa');
  if (!btn) return;
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.5';
  const fetchComTimeout = (url, opts) => {
    return new Promise((resolve, reject) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')); }, 15000);
      fetch(url, { ...opts, signal: ctrl.signal })
        .then(r => { clearTimeout(t); resolve(r); })
        .catch(e => { clearTimeout(t); reject(e); });
    });
  };
  try {
    const r = await authedFetch(API + '/api/admin/2fa/reenviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_id: loginCodigoId })
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      if (alertEl) alertEl.innerHTML = '<div class="alert alert-ok">📩 Código reenviado</div>';
      iniciarCooldownReenviar();
    } else {
      if (alertEl) alertEl.innerHTML = '<div class="alert alert-erro">' + (data.erro || 'Erro ao reenviar') + '</div>';
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
    }
  } catch (e) {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
  }
}

function sair() {
  // ETAPA 2: revoga refresh token no backend (best-effort)
  const refresh = localStorage.getItem('admin_refresh');
  if (refresh) {
    fetch(API + '/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh })
    }).catch(() => {}); // ignora erro de rede
  }
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh');
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
  carregarUsuarioSidebar();
  irPara('dashboard');
}

// === Sidebar: avatar + nome do admin logado ===
function carregarUsuarioSidebar() {
  try {
    const t = token || localStorage.getItem('admin_token');
    if (!t) return;
    const parts = t.split('.');
    if (parts.length < 2) return;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const nome = payload.nome || 'Admin';
    const iniciais = nome.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    const elAvatar = document.getElementById('aside-user-avatar');
    const elNome = document.getElementById('aside-user-nome');
    const elEmpresa = document.getElementById('aside-user-empresa');
    if (elAvatar) elAvatar.textContent = iniciais || 'A';
    if (elNome) elNome.textContent = nome;
    if (elEmpresa) elEmpresa.textContent = payload.email || '';
  } catch (e) { /* silencioso */ }
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
    const r = await authedFetch(API + '/api/admin/equipe', { headers: {} });
    const data = await r.json();

    // Recrutadores
    const recDiv = document.getElementById('lista-recrutadores');
    if (data.recrutadores && data.recrutadores.length > 0) {
      recDiv.innerHTML = data.recrutadores.map(u => `
        <div class="vaga-card">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--vinho); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px;">${escapeHtml((u.nome||'?').charAt(0).toUpperCase())}</div>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:16px;">${escapeHtml(u.nome)}</div>
              <div style="color:#888; font-size:13px;">${escapeHtml(u.email)}</div>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; gap:8px; flex-wrap:wrap;">
            <span style="background:${u.ativo === false ? '#fee2e2' : '#dcfce7'}; color:${u.ativo === false ? '#b91c1c' : '#16a34a'}; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600;">${u.ativo === false ? 'Inativo' : 'Recrutador'}</span>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sec btn-sm" onclick="editarRecrutador(${u.id}, '${escapeHtml((u.nome||'').replace(/'/g, "\\'"))}', ${u.ativo === false})">✏️ Editar</button>
              <button class="btn btn-sec btn-sm" style="color:var(--vermelho,#b91c1c);" onclick="excluirRecrutador(${u.id}, '${escapeHtml((u.nome||'').replace(/'/g, "\\'"))}')">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      recDiv.innerHTML = '<div class="empty">Nenhum recrutador cadastrado. Use "+ Novo Recrutador" acima.</div>';
    }

    // Empresas
    const empDiv = document.getElementById('lista-empresas');
    const todosUsuarios = data.empresaUsuarios || [];
    if (data.empresas && data.empresas.length > 0) {
      empDiv.innerHTML = data.empresas.map(e => {
        const usuariosEmp = todosUsuarios.filter(u => u.empresa_id === e.id);
        const usuariosHtml = usuariosEmp.length > 0
          ? usuariosEmp.map(u => `
              <div style="display:flex; align-items:center; gap:8px; padding:8px; background:#f8fafc; border-radius:6px; margin-top:6px;">
                <div style="width:32px; height:32px; border-radius:50%; background:#1e40af; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px;">${escapeHtml((u.nome||'?').charAt(0).toUpperCase())}</div>
                <div style="flex:1; min-width:0;">
                  <div style="font-size:13px; font-weight:600; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(u.nome)}</div>
                  <div style="font-size:11px; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(u.email)}${u.cargo ? ' • ' + escapeHtml(u.cargo) : ''}</div>
                </div>
                <button class="btn btn-sec btn-sm" title="Editar" onclick="editarUsuarioEmpresa(${u.id}, ${e.id}, '${escapeHtml((u.nome||'').replace(/'/g, "\\'"))}', '${escapeHtml((u.email||'').replace(/'/g, "\\'"))}', '${escapeHtml((u.cargo||'').replace(/'/g, "\\'"))}', ${u.ativo === false})">✏️</button>
                <button class="btn btn-sec btn-sm" style="color:var(--vermelho,#b91c1c);" title="Excluir" onclick="excluirUsuarioEmpresa(${u.id}, '${escapeHtml((u.nome||'').replace(/'/g, "\\'"))}')">🗑️</button>
              </div>
            `).join('')
          : '<div style="font-size:12px; color:#999; font-style:italic; padding:6px 0;">Nenhum usuário cadastrado</div>';

        return `
        <div class="vaga-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">
            <div style="font-weight:700; font-size:16px;">🏢 ${escapeHtml(e.nome)}</div>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sec btn-sm" onclick="abrirModalVincularVagas(${e.id}, '${escapeHtml((e.nome||'').replace(/'/g, "\\'"))}')">🔗 Vagas (${e.qtd_vagas || 0})</button>
              <button class="btn btn-sec btn-sm" onclick="editarEmpresa(${e.id}, '${escapeHtml((e.nome||'').replace(/'/g, "\\'"))}', '${escapeHtml((e.cnpj||'').replace(/'/g, "\\'"))}', '${escapeHtml((e.email_principal||'').replace(/'/g, "\\'"))}', '${escapeHtml((e.telefone||'').replace(/'/g, "\\'"))}')">✏️ Editar</button>
              <button class="btn btn-sec btn-sm" style="color:var(--vermelho,#b91c1c);" onclick="excluirEmpresa(${e.id}, '${escapeHtml((e.nome||'').replace(/'/g, "\\'"))}')">🗑️</button>
            </div>
          </div>
          <div style="color:#888; font-size:13px;">${escapeHtml(e.email_principal || '—')}</div>
          ${e.cnpj ? `<div style="color:#888; font-size:12px; margin-top:4px;">CNPJ: ${escapeHtml(e.cnpj)}</div>` : ''}
          ${e.telefone ? `<div style="color:#888; font-size:12px;">Tel: ${escapeHtml(e.telefone)}</div>` : ''}
          <div style="margin-top:10px;"><span style="background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600;">Empresa</span></div>

          <div style="margin-top:12px; padding-top:10px; border-top:1px solid #eee;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div style="font-size:12px; font-weight:700; color:#555;">👥 Usuários (${usuariosEmp.length})</div>
              <button class="btn btn-sec btn-sm" onclick="abrirModalNovoUsuarioEmpresa(${e.id}, '${escapeHtml((e.nome||'').replace(/'/g, "\\'"))}')">+ Usuário</button>
            </div>
            ${usuariosHtml}
          </div>
        </div>
        `;
      }).join('');
    } else {
      empDiv.innerHTML = '<div class="empty">Nenhuma empresa parceira cadastrada.</div>';
    }
    equipeCarregada = true;
  } catch (e) {
    document.getElementById('lista-recrutadores').innerHTML = '<div class="empty" style="color:var(--vermelho);">Erro ao carregar equipe. Verifique sua conexão.</div>';
  }
}

function abrirModalRecrutador() {
  document.getElementById('membro-nome').value = '';
  document.getElementById('membro-email').value = '';
  document.getElementById('membro-senha').value = 'mudar123';
  abrirModal('novo-membro');
  setTimeout(() => document.getElementById('membro-nome').focus(), 100);
}

async function salvarNovoRecrutador() {
  const nome = document.getElementById('membro-nome').value.trim();
  const email = document.getElementById('membro-email').value.trim();
  const senha = document.getElementById('membro-senha').value;
  if (!nome || !email || !senha) {
    alert('Preencha nome, e-mail e senha.');
    return;
  }
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/recrutadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });
    const data = await r.json();
    if (r.ok) {
      fecharModal('novo-membro');
      alert('✅ Recrutador criado com sucesso!');
      carregarEquipe();
    } else {
      alert('Erro: ' + (data.erro || JSON.stringify(data)));
    }
  } catch (e) { alert('Erro de conexão'); }
}

function abrirModalEmpresa() {
  document.getElementById('emp-nome').value = '';
  document.getElementById('emp-cnpj').value = '';
  document.getElementById('emp-telefone').value = '';
  document.getElementById('emp-email').value = '';
  document.getElementById('emp-user-nome').value = '';
  document.getElementById('emp-user-email').value = '';
  document.getElementById('emp-user-senha').value = 'mudar123';
  abrirModal('nova-empresa');
  setTimeout(() => document.getElementById('emp-nome').focus(), 100);
}

async function salvarNovaEmpresa() {
  const nome = document.getElementById('emp-nome').value.trim();
  const cnpj = document.getElementById('emp-cnpj').value.trim() || null;
  const telefone = document.getElementById('emp-telefone').value.trim() || null;
  const email_principal = document.getElementById('emp-email').value.trim() || null;
  const userNome = document.getElementById('emp-user-nome').value.trim();
  const userEmail = document.getElementById('emp-user-email').value.trim();
  const userSenha = document.getElementById('emp-user-senha').value;
  if (!nome) {
    alert('Preencha pelo menos o nome da empresa.');
    return;
  }
  // Monta payload
  const payload = { nome, cnpj, telefone, email_principal };
  // Se preenchou pelo menos nome+email do usuário, inclui (senha tem default)
  if (userNome && userEmail) {
    payload.usuario = { nome: userNome, email: userEmail, senha: userSenha || 'mudar123', cargo: 'admin' };
  }
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (r.ok) {
      fecharModal('nova-empresa');
      alert('✅ Empresa criada com sucesso!');
      carregarEquipe();
    } else {
      alert('Erro: ' + (data.erro || JSON.stringify(data)));
    }
  } catch (e) { alert('Erro de conexão'); }
}

function editarRecrutador(id, nomeAtual, inativo) {
  document.getElementById('emembro-id').value = id;
  document.getElementById('emembro-nome').value = nomeAtual || '';
  document.getElementById('emembro-ativo').checked = !inativo;
  document.getElementById('emembro-senha').value = '';
  abrirModal('editar-membro');
  setTimeout(() => document.getElementById('emembro-nome').focus(), 100);
}

async function salvarEdicaoRecrutador() {
  const id = document.getElementById('emembro-id').value;
  const nome = document.getElementById('emembro-nome').value.trim();
  const ativo = document.getElementById('emembro-ativo').checked;
  const senha = document.getElementById('emembro-senha').value.trim();
  if (!nome) { alert('O nome é obrigatório.'); return; }
  const payload = { nome, ativo };
  if (senha) payload.senha = senha;
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/recrutadores/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (r.ok) {
      fecharModal('editar-membro');
      alert('✅ Recrutador atualizado!');
      carregarEquipe();
    } else {
      alert('Erro: ' + (data.erro || JSON.stringify(data)));
    }
  } catch (e) { alert('Erro de conexão'); }
}

function excluirRecrutador(id, nome) {
  if (!confirm('Excluir o recrutador "' + nome + '"?\n\nEssa ação não pode ser desfeita.')) return;
  authedFetch(API + '/api/admin/recrutadores/' + id, {
    method: 'DELETE',
    headers: {}
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) { alert('Recrutador excluído!'); carregarEquipe(); }
      else alert('Erro: ' + (data.erro || JSON.stringify(data)));
    })
    .catch(() => alert('Erro de conexão'));
}

function editarEmpresa(id, nome, cnpj, email, telefone) {
  document.getElementById('eemp-id').value = id;
  document.getElementById('eemp-nome').value = nome || '';
  document.getElementById('eemp-cnpj').value = cnpj || '';
  document.getElementById('eemp-telefone').value = telefone || '';
  document.getElementById('eemp-email').value = email || '';
  abrirModal('editar-empresa');
  setTimeout(() => document.getElementById('eemp-nome').focus(), 100);
}

async function salvarEdicaoEmpresa() {
  const id = document.getElementById('eemp-id').value;
  const nome = document.getElementById('eemp-nome').value.trim();
  const cnpj = document.getElementById('eemp-cnpj').value.trim() || null;
  const telefone = document.getElementById('eemp-telefone').value.trim() || null;
  const email_principal = document.getElementById('eemp-email').value.trim() || null;
  if (!nome) { alert('O nome é obrigatório.'); return; }
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/empresas/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cnpj, telefone, email_principal })
    });
    const data = await r.json();
    if (r.ok) {
      fecharModal('editar-empresa');
      alert('✅ Empresa atualizada!');
      carregarEquipe();
    } else {
      alert('Erro: ' + (data.erro || JSON.stringify(data)));
    }
  } catch (e) { alert('Erro de conexão'); }
}

function excluirEmpresa(id, nome) {
  if (!confirm('Excluir a empresa "' + nome + '"?\n\nEssa ação não pode ser desfeita.')) return;
  authedFetch(API + '/api/admin/empresas/' + id, {
    method: 'DELETE',
    headers: {}
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) { alert('Empresa excluída!'); carregarEquipe(); }
      else alert('Erro: ' + (data.erro || JSON.stringify(data)));
    })
    .catch(() => alert('Erro de conexão'));
}

// ===== VINCULAR VAGAS À EMPRESA =====
let vincEmpresaId = null;
let vincTodasVagas = [];
let vincLiberadas = [];

async function abrirModalVincularVagas(empresaId, empresaNome) {
  vincEmpresaId = empresaId;
  document.getElementById('vinc-empresa-nome').textContent = empresaNome;
  document.getElementById('vinc-liberadas').innerHTML = '<div class="empty">Carregando...</div>';
  document.getElementById('vinc-disponiveis').innerHTML = '';
  abrirModal('vincular-vagas');
  await carregarVincularVagas();
}

async function carregarVincularVagas() {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    // Busca todas as vagas + as já liberadas pra essa empresa em paralelo
    const [rVagas, rLiberadas] = await Promise.all([
      authedFetch(API + '/api/admin/vagas', { headers: {} }),
      authedFetch(API + '/api/admin/empresa-vaga/' + vincEmpresaId, { headers: {} })
    ]);
    const dVagas = await rVagas.json();
    const dLiberadas = await rLiberadas.json();
    vincTodasVagas = dVagas.vagas || dVagas || [];
    vincLiberadas = dLiberadas.vagas || [];
    renderVincularVagas();
  } catch (e) {
    document.getElementById('vinc-liberadas').innerHTML = '<div class="empty" style="color:var(--vermelho);">Erro ao carregar vagas.</div>';
  }
}

function renderVincularVagas() {
  const liberadasIds = new Set(vincLiberadas.map(v => v.id));
  const liberadas = vincTodasVagas.filter(v => liberadasIds.has(v.id));
  const disponiveis = vincTodasVagas.filter(v => !liberadasIds.has(v.id));

  // Vagas liberadas
  const libDiv = document.getElementById('vinc-liberadas');
  if (liberadas.length === 0) {
    libDiv.innerHTML = '<div class="empty" style="padding: 14px;">Nenhuma vaga liberada ainda. Clique em ➕ abaixo pra liberar.</div>';
  } else {
    libDiv.innerHTML = liberadas.map(v => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid #16a34a; background:#f0fdf4; border-radius:6px; margin-bottom:6px;">
        <div>
          <div style="font-weight:600; color:#15803d;">${v.titulo}</div>
          <div style="font-size:12px; color:#666;">${v.empresa || ''} ${v.cidade ? '• ' + v.cidade : ''}</div>
        </div>
        <button class="btn btn-sec btn-sm" style="color:var(--vermelho,#b91c1c);" onclick="desvincularVagaEmpresa(${v.id})">❌ Remover</button>
      </div>
    `).join('');
  }

  // Vagas disponíveis
  const dispDiv = document.getElementById('vinc-disponiveis');
  if (disponiveis.length === 0) {
    dispDiv.innerHTML = '<div class="empty" style="padding: 14px;">Todas as vagas já estão liberadas pra essa empresa.</div>';
  } else {
    dispDiv.innerHTML = disponiveis.map(v => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--borda); border-radius:6px; margin-bottom:6px;">
        <div>
          <div style="font-weight:600;">${v.titulo}</div>
          <div style="font-size:12px; color:#666;">${v.empresa || ''} ${v.cidade ? '• ' + v.cidade : ''}</div>
        </div>
        <button class="btn btn-primary btn-sm" style="width:auto;" onclick="vincularVagaEmpresa(${v.id})">➕ Liberar</button>
      </div>
    `).join('');
  }
}

async function vincularVagaEmpresa(vagaId) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/empresa-vaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id: vincEmpresaId, vaga_id: vagaId })
    });
    const d = await r.json();
    if (d.ok || d.empresa_id) { await carregarVincularVagas(); }
    else alert('Erro: ' + (d.erro || JSON.stringify(d)));
  } catch (e) { alert('Erro de conexão'); }
}

async function desvincularVagaEmpresa(vagaId) {
  if (!confirm('Remover acesso dessa vaga para a empresa?')) return;
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/empresa-vaga', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id: vincEmpresaId, vaga_id: vagaId })
    });
    const d = await r.json();
    if (d.ok) { await carregarVincularVagas(); }
    else alert('Erro: ' + (d.erro || JSON.stringify(d)));
  } catch (e) { alert('Erro de conexão'); }
}

// ===== USUÁRIOS DA EMPRESA =====
function abrirModalNovoUsuarioEmpresa(empresaId, empresaNome) {
  document.getElementById('ue-id').value = '';
  document.getElementById('ue-empresa-id').value = empresaId;
  document.getElementById('ue-empresa-nome').value = empresaNome;
  document.getElementById('ue-nome').value = '';
  document.getElementById('ue-email').value = '';
  document.getElementById('ue-cargo').value = '';
  document.getElementById('ue-senha').value = '';
  document.getElementById('ue-ativo').checked = true;
  document.getElementById('titu-usuario-empresa').textContent = '👤 Novo Usuário — ' + empresaNome;
  document.getElementById('lue-senha').innerHTML = 'Senha *';
  document.getElementById('hint-senha').style.display = 'block';
  document.getElementById('hint-senha').textContent = 'Mínimo 6 caracteres. Será enviado ao usuário.';
  document.getElementById('grp-ue-ativo').style.display = 'none';
  document.getElementById('ue-email').disabled = false;
  abrirModal('usuario-empresa');
}

function editarUsuarioEmpresa(id, empresaId, nome, email, cargo, inativo) {
  document.getElementById('ue-id').value = id;
  document.getElementById('ue-empresa-id').value = empresaId;
  document.getElementById('ue-empresa-nome').value = '';
  // Pega o nome da empresa do card (busca no DOM)
  const empNome = document.querySelector(`#lista-empresas .vaga-card:nth-child(${empresaId}) > div > div`)?.textContent || '';
  document.getElementById('ue-empresa-nome').value = empNome.replace('🏢', '').trim();
  document.getElementById('ue-nome').value = nome;
  document.getElementById('ue-email').value = email;
  document.getElementById('ue-cargo').value = cargo;
  document.getElementById('ue-senha').value = '';
  document.getElementById('ue-ativo').checked = !inativo;
  document.getElementById('titu-usuario-empresa').textContent = '✏️ Editar Usuário';
  document.getElementById('lue-senha').innerHTML = 'Nova senha (opcional)';
  document.getElementById('hint-senha').style.display = 'block';
  document.getElementById('hint-senha').textContent = 'Deixe vazio para manter a senha atual.';
  document.getElementById('grp-ue-ativo').style.display = 'block';
  document.getElementById('ue-email').disabled = true;
  abrirModal('usuario-empresa');
}

async function salvarUsuarioEmpresa() {
  const id = document.getElementById('ue-id').value;
  const empresaId = document.getElementById('ue-empresa-id').value;
  const nome = document.getElementById('ue-nome').value.trim();
  const email = document.getElementById('ue-email').value.trim();
  const cargo = document.getElementById('ue-cargo').value.trim();
  const senha = document.getElementById('ue-senha').value;
  const ativo = document.getElementById('ue-ativo').checked;

  if (!nome) return alert('Informe o nome.');
  if (!email) return alert('Informe o e-mail.');
  if (!id && !senha) return alert('Informe a senha inicial.');
  if (senha && senha.length < 6) return alert('A senha deve ter no mínimo 6 caracteres.');

  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    let r;
    if (id) {
      // Editar
      const body = { nome, cargo, ativo };
      if (senha) body.senha = senha;
      r = await authedFetch(API + '/api/admin/empresa-usuarios/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } else {
      // Criar
      r = await authedFetch(API + '/api/admin/empresas/' + empresaId + '/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, cargo })
      });
    }
    const d = await r.json();
    if (r.ok && d.ok !== false) {
      fecharModal('usuario-empresa');
      alert('✅ Usuário ' + (id ? 'atualizado' : 'criado') + ' com sucesso!');
      carregarEquipe();
    } else {
      alert('Erro: ' + (d.erro || JSON.stringify(d)));
    }
  } catch (e) { alert('Erro de conexão'); }
}

async function excluirUsuarioEmpresa(id, nome) {
  if (!confirm('Excluir o usuário "' + nome + '"?\n\nEle não conseguirá mais acessar o portal da empresa.')) return;
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/empresa-usuarios/' + id, {
      method: 'DELETE',
      headers: {}
    });
    const d = await r.json();
    if (d.ok) { alert('Usuário excluído!'); carregarEquipe(); }
    else alert('Erro: ' + (d.erro || JSON.stringify(d)));
  } catch (e) { alert('Erro de conexão'); }
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
    const r = await authedFetch(API + '/api/admin/entrevistas?periodo=' + agendaPeriodoAtual, {
      headers: {}
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
              ${e.link_reuniao
                ? `🎥 Online (Google Meet) • <a href="${e.link_reuniao}" target="_blank" style="color:#16A34A; font-weight:600;">🔗 Entrar no Meet</a>`
                : (e.local
                    ? `📍 ${e.local}`
                    : '🎥 Online (Google Meet)')}
              ${e.observacoes ? `<div style="margin-top:6px; color:#666; font-style:italic;">"${e.observacoes}"</div>` : ''}
            </div>
          </div>
          <div class="agenda-acoes">
            <span class="badge" style="background:${cor.bg}; color:${cor.fg};">${e.status}</span>
            ${!isPassada ? `
              <div style="display:flex; gap:4px; margin-top:8px; flex-wrap:wrap;">
                <button class="btn btn-sm btn-sec" onclick="atualizarEntrevista(${e.id},'confirmada')">✓ Confirmar</button>
                <button class="btn btn-sm btn-sec" onclick="atualizarEntrevista(${e.id},'realizada')">✔ Realizada</button>
                <button class="btn btn-sm btn-sec" style="background:#FEE2E2;color:#991B1B;border-color:#FCA5A5;" onclick="cancelarEntrevistaFalhou(${e.id})" title="Libera novo agendamento. Use se a entrevista não aconteceu.">❌ Falhou</button>
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
    const r = await authedFetch(API + '/api/admin/entrevista/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (r.ok) carregarAgenda();
    else alert('Erro ao atualizar');
  } catch (e) { alert('Erro de conexão'); }
}

// Marca a entrevista como FALHOU — usa a rota de cancelamento pra deletar do Calendar e liberar novo agendamento
async function cancelarEntrevistaFalhou(id) {
  if (!confirm('A entrevista não aconteceu?\n\nEla será cancelada (deleta o Meet, se houver) e o recrutador poderá fazer um novo agendamento.')) return;
  const motivo = prompt('Motivo (opcional):') || '';
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  try {
    const r = await authedFetch(API + '/api/admin/entrevista/' + id + '/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    });
    const res = await r.json();
    if (r.ok) {
      alert('✅ Entrevista marcada como "Falhou". O recrutador pode fazer um novo agendamento.');
      carregarAgenda();
    } else {
      alert('Erro: ' + (res.erro || 'desconhecido'));
    }
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
  authedFetch(API + '/api/admin/entrevista', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

// === Modal: Contratações (lista + comparação mensal) ===
async function abrirModalContratacoes(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  const body = document.getElementById('contratacoes-body');
  const grafico = document.getElementById('contratacoes-grafico');
  if (!body) return;
  body.innerHTML = '<div class="spinner"></div>';
  if (grafico) grafico.innerHTML = '';
  abrirModal('contratacoes');
  const _token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || sessionStorage.getItem('recrutador_token') || '';
  try {
    const r = await authedFetch(API + '/api/admin/contratacoes', {
      headers: {}
    });
    const data = await r.json();
    const lista = data.contratacoes || [];
    const mensal = data.comparacao_mensal || [];

    // Renderiza gráfico de barras (comparação mensal)
    if (grafico && mensal.length) {
      const max = Math.max(...mensal.map(m => m.total), 1);
      grafico.innerHTML = `
        <div class="contratacoes-grafico">
          <div class="contratacoes-grafico-titulo">📊 Contratações por mês (últimos 6 meses)</div>
          <div class="contratacoes-bars">
            ${mensal.map(m => `
              <div class="contratacoes-bar-col">
                <div class="contratacoes-bar-valor">${m.total}</div>
                <div class="contratacoes-bar" style="height: ${(m.total / max) * 100}%;">
                </div>
                <div class="contratacoes-bar-label">${m.mes_label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (grafico) {
      grafico.innerHTML = '<div class="empty">Sem contratações nos últimos 6 meses ainda.</div>';
    }

    // Renderiza lista de contratações
    if (lista.length === 0) {
      body.innerHTML = '<div class="empty">Nenhuma contratação registrada ainda.</div>';
      return;
    }
    body.innerHTML = `
      <div class="contratacoes-lista">
        <div class="contratacoes-lista-header">
          <div>Candidato</div>
          <div>Vaga</div>
          <div>Empresa</div>
          <div>Dias</div>
          <div>Ações</div>
        </div>
        ${lista.map(c => `
          <div class="contratacoes-row">
            <div class="contratacoes-candidato">
              <strong>${escapeHtml(c.candidato_nome)}</strong>
              <span class="contratacoes-email">${escapeHtml(c.candidato_email)}</span>
            </div>
            <div>${escapeHtml(c.vaga_titulo || '—')}</div>
            <div>${escapeHtml(c.vaga_empresa || '—')}</div>
            <div><span class="badge-dias">${c.dias_processo ?? '—'}d</span></div>
            <div>
              <button class="btn-modal btn-modal-ver" onclick="irParaCandidatura(${c.candidatura_id})" title="Abrir análise do candidato">
                👁 Ver
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    body.innerHTML = '<div class="alert-erro">Erro ao carregar contratações: ' + e.message + '</div>';
  }
}

// === Modal: Vagas Abertas há mais de 30 dias sem contratação ===
async function abrirModalVagasAntigas(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  const body = document.getElementById('vagas-antigas-body');
  if (!body) return;
  body.innerHTML = '<div class="spinner"></div>';
  abrirModal('vagas-antigas');
  const _token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || sessionStorage.getItem('recrutador_token') || '';
  try {
    const r = await authedFetch(API + '/api/admin/vagas-abertas-antigas', {
      headers: {}
    });
    const data = await r.json();
    const vagas = data.vagas || [];
    if (vagas.length === 0) {
      body.innerHTML = `
        <div class="vagas-antigas-resumo">
          <div class="alert alert-info">✅ Nenhuma vaga aberta há mais de 30 dias sem contratação. Tudo em dia!</div>
        </div>
      `;
      return;
    }
    body.innerHTML = `
      <div class="vagas-antigas-resumo">
        <div class="alert alert-warn">
          ⚠️ <strong>${vagas.length}</strong> vaga(s) publicada(s) há mais de 30 dias ainda sem contratação.
        </div>
      </div>
      <div class="vagas-antigas-lista">
        <div class="vagas-antigas-header">
          <div>Título</div>
          <div>Empresa</div>
          <div>Aberta há</div>
          <div>Candidatos</div>
          <div>Ativos</div>
          <div>Ações</div>
        </div>
        ${vagas.map(v => {
          const gravidade = v.dias_aberta > 90 ? 'critica' : v.dias_aberta > 60 ? 'alta' : 'media';
          return `
            <div class="vagas-antigas-row gravidade-${gravidade}">
              <div class="vagas-antigas-titulo">
                <strong>${escapeHtml(v.titulo)}</strong>
                ${v.cidade || v.estado ? `<span class="vagas-antigas-local">${escapeHtml(v.cidade || '')}${v.cidade && v.estado ? '/' : ''}${escapeHtml(v.estado || '')}</span>` : ''}
              </div>
              <div>${escapeHtml(v.empresa || '—')}</div>
              <div><span class="badge-dias badge-${gravidade}">${v.dias_aberta}d</span></div>
              <div>${v.total_candidatos}</div>
              <div>${v.processos_ativos}</div>
              <div class="vagas-antigas-acoes">
                <a href="../candidato/vaga.html?id=${v.id}" target="_blank" class="btn-modal btn-modal-ver" title="Ver como candidato">
                  👁 Ver
                </a>
                <button class="btn-modal btn-modal-editar" onclick="editarVaga(${v.id});fecharModal('vagas-antigas');" title="Editar vaga">
                  ✏️ Editar
                </button>
                <button class="btn-modal btn-modal-ver-cand" onclick="irParaCandidatosDaVaga(${v.id});fecharModal('vagas-antigas');" title="Ver candidatos dessa vaga">
                  👥 Candidatos
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  } catch (e) {
    body.innerHTML = '<div class="alert-erro">Erro ao carregar vagas: ' + e.message + '</div>';
  }
}

// === Modal: Candidatos em uma etapa específica (clicado no gráfico de etapas) ===
async function abrirModalCandidatosEtapa(etapaNum, etapaNome) {
  const body = document.getElementById('candidatos-etapa-body');
  if (!body) return;
  body.innerHTML = '<div class="spinner"></div>';
  document.getElementById('candidatos-etapa-titulo').textContent = '🎯 Candidatos na etapa ' + etapaNome;
  abrirModal('candidatos-etapa');
  try {
    const _token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || sessionStorage.getItem('recrutador_token') || sessionStorage.getItem('token');
    const r = await authedFetch(API + '/api/admin/candidaturas-por-etapa?etapa=' + etapaNum, {
      headers: {}
    });
    const data = await r.json();
    if (!r.ok) {
      body.innerHTML = '<div class="alert-erro">' + (data.erro || 'Erro ao carregar') + '</div>';
      return;
    }
    if (!data.candidaturas || data.candidaturas.length === 0) {
      body.innerHTML = '<div class="empty-msg" style="padding:32px 16px;">Nenhum candidato nessa etapa no momento.</div>';
      return;
    }
    body.innerHTML = `
      <div class="candidatos-etapa-resumo">${data.total} candidato(s) na etapa <strong>${data.etapa_nome}</strong></div>
      <div class="candidatos-etapa-lista">
        <div class="candidatos-etapa-header">
          <div>Candidato</div>
          <div>Vaga</div>
          <div>Entrou em</div>
          <div>Parado há</div>
          <div>Ações</div>
        </div>
        ${data.candidaturas.map(c => {
          const entrou = c.entrou_na_etapa_em ? new Date(c.entrou_na_etapa_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
          const d = c.dias_parado || 0;
          let badgeClass = 'badge-dias';
          if (d >= 7) badgeClass += ' badge-alta';
          else if (d >= 3) badgeClass += ' badge-media';
          return `
            <div class="candidatos-etapa-row${c.alerta_parado ? ' gravidade-alta' : ''}">
              <div class="candidatos-etapa-candidato"><strong>${c.candidato_nome || '—'}</strong><br><span style="font-size:11px;color:var(--cinza-medio)">${c.candidato_email || ''}</span></div>
              <div class="candidatos-etapa-vaga"><strong>${c.vaga_titulo || '—'}</strong><br><span style="font-size:11px;color:var(--cinza-medio)">${c.vaga_empresa || ''}</span></div>
              <div class="candidatos-etapa-data">${entrou}</div>
              <div><span class="${badgeClass}">${d}d</span></div>
              <div><button class="btn-modal btn-modal-ver-cand" onclick="irParaCandidatura(${c.candidatura_id});fecharModal('candidatos-etapa');" title="Ver análise do candidato">Ver</button></div>
            </div>`;
        }).join('')}
      </div>`;
  } catch (e) {
    body.innerHTML = '<div class="alert-erro">Erro de conexão: ' + e.message + '</div>';
  }
}

// Helper: navegar para análise do candidato
function irParaCandidatura(candidaturaId) {
  window.location.href = 'analisar.html?id=' + candidaturaId;
}

// Helper: navegar para candidatos da vaga
function irParaCandidatosDaVaga(vagaId) {
  window.location.href = 'candidatos.html?vaga=' + vagaId;
}

// === Modal: lista de vagas ativas (ESCOPO GLOBAL pra onclick funcionar) ===
async function abrirModalVagasAtivas(event) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  const body = document.getElementById('vagas-ativas-lista');
  if (!body) { console.warn('Modal vagas-ativas não encontrado no DOM'); return; }
  body.innerHTML = '<div class="spinner"></div>';
  abrirModal('vagas-ativas');
  const _token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || sessionStorage.getItem('recrutador_token') || '';
  try {
    const r = await authedFetch(API + '/api/admin/vagas?status=publicada', {
      headers: {}
    });
    const data = await r.json();
    const vagas = data.vagas || [];
    if (vagas.length === 0) {
      body.innerHTML = '<div class="empty">Nenhuma vaga ativa no momento.</div>';
      return;
    }
    // Ordena: mais recentes primeiro
    vagas.sort((a, b) => new Date(b.criada_em || 0) - new Date(a.criada_em || 0));
    body.innerHTML = `
      <div class="vagas-ativas-tabela">
        <div class="vagas-ativas-header">
          <div>Título</div>
          <div>Empresa</div>
          <div>Publicada em</div>
          <div>Ações</div>
        </div>
        ${vagas.map(v => {
          const dataPub = v.criada_em ? new Date(v.criada_em).toLocaleDateString('pt-BR') : '—';
          return `
            <div class="vagas-ativas-row">
              <div class="vagas-ativas-titulo">
                <strong>${escapeHtml(v.titulo)}</strong>
                ${v.cidade || v.estado ? `<span class="vagas-ativas-local">${escapeHtml(v.cidade || '')}${v.cidade && v.estado ? '/' : ''}${escapeHtml(v.estado || '')}</span>` : ''}
              </div>
              <div>${escapeHtml(v.empresa || '—')}</div>
              <div class="vagas-ativas-data">${dataPub}</div>
              <div class="vagas-ativas-acoes">
                <a href="../candidato/vaga.html?id=${v.id}" target="_blank" class="btn-modal btn-modal-ver" title="Ver como o candidato vê">
                  👁 Ver
                </a>
                <button class="btn-modal btn-modal-editar" onclick="editarVaga(${v.id});fecharModal('vagas-ativas');" title="Editar vaga">
                  ✏️ Editar
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  } catch (e) {
    body.innerHTML = '<div class="alert-erro">Erro ao carregar vagas: ' + e.message + '</div>';
  }
}

// ==== DASHBOARD V2 (jul/2026 - profissional) ====
async function carregarDashboardV2() {
  try {
    const r = await authedFetch(API + '/api/admin/dashboard', { headers: {} });
    const data = await r.json();
    if (!r.ok) {
      console.error('[DASHBOARD]', data);
      const grid = document.getElementById('kpis-grid') || document.getElementById('stats-grid');
      if (grid) grid.innerHTML = `<div class="alert alert-erro">Erro: ${escapeHtml(data.erro || 'desconhecido')}</div>`;
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
      { label: 'Contratações (30d)', valor: k.contratacoes_30d || 0, delta: k.deltas?.contratacoes, icon: '🎉', cor: 'verde-escuro' },
      { label: 'Abertas +30d', valor: k.vagas_abertas_mais_30d || 0, delta: null, icon: '⏳', cor: 'amarelo' }
    ];
    document.getElementById('kpis-grid').innerHTML = kpis.map(k => {
      const delta = k.delta == null ? '' : (k.delta > 0 ? `<span class="kpi-delta up">+${k.delta}% este mês</span>` : k.delta < 0 ? `<span class="kpi-delta down">${k.delta}% este mês</span>` : `<span class="kpi-delta flat">0% este mês</span>`);

      // Cards clicáveis — cada um leva pra página própria (mesmo SPA, via irPara)
      let link = null, linkText = null, titleLink = null;
      if (k.label === 'Vagas ativas') {
        link = "abrirModalVagasAtivas(event)"; linkText = 'ver lista →'; titleLink = 'Ver todas as vagas ativas';
      } else if (k.label === 'Candidatos') {
        link = "irPara('candidatos')"; linkText = 'base de talentos →'; titleLink = 'Abrir base de talentos';
      } else if (k.label === 'Processos ativos') {
        link = "irPara('candidaturas')"; linkText = 'ver processos →'; titleLink = 'Abrir lista de processos/candidaturas';
      } else if (k.label === 'Entrevistas agendadas') {
        link = "irPara('agenda')"; linkText = 'abrir agenda →'; titleLink = 'Abrir agenda de entrevistas';
      } else if (k.label === 'Contratações (30d)') {
        link = "abrirModalContratacoes(event)"; linkText = 'ver lista →'; titleLink = 'Ver contratações com comparação mensal';
      } else if (k.label === 'Abertas +30d') {
        link = "abrirModalVagasAntigas(event)"; linkText = 'ver vagas →'; titleLink = 'Ver vagas abertas há mais de 30 dias sem contratação';
      }
      const clickable = !!link;
      return `<div class="kpi-card kpi-${k.cor}${clickable ? ' kpi-clickable' : ''}"${clickable ? ` onclick="${link}" title="${titleLink}" style="cursor:pointer;"` : ''}>
        <div class="kpi-top">
          <div class="kpi-icon">${k.icon}</div>
          ${clickable ? '<div class="kpi-link-icon">🔗</div>' : ''}
        </div>
        <div class="kpi-label">${k.label}${linkText ? ' <span class="kpi-abre">' + linkText + '</span>' : ''}</div>
        <div class="kpi-valor">${k.valor}</div>
        ${delta}
      </div>`;
    }).join('');

    // === Modal: lista de vagas ativas (definido globalmente mais acima) ===

    // === Gráfico: Candidatos por etapa ===
    const etapasObj = data.etapas || {};
    const labels = data.etapas_labels || ['Inscrição', 'Triagem', 'RH', 'Gestor', 'Proposta', 'Coleta Docs', 'Contratação'];
    const cores = ['#FF8FA3', '#5B9BD5', '#A78BFA', '#34D399', '#FBBF24', '#F472B6', '#722F37'];
    const maxEtapa = Math.max(1, ...Object.values(etapasObj).map(v => parseInt(v) || 0));
    document.getElementById('grafico-etapas').innerHTML = labels.map((label, i) => {
      const etapaNum = i + 1;
      const val = parseInt(etapasObj[etapaNum] || 0);
      const pct = (val / maxEtapa) * 100;
      return `<div class="etapa-row etapa-clickable" onclick="abrirModalCandidatosEtapa(${etapaNum}, '${label.replace(/'/g, "\\'")}')" title="Ver candidatos em ${label}">
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
    // Texto "aprovados x contratados" — IDs preenchidos pelo HTML:
    //   conversao-contratados = nº de "aprovados" (= passaram da triagem = c.total)
    //   conversao-total       = nº de "contratados" (= c.contratados)
    const elAprov = document.getElementById('conversao-contratados');
    const elContr = document.getElementById('conversao-total');
    if (elAprov) elAprov.textContent = (c.total ?? 0);
    if (elContr) elContr.textContent = (c.contratados ?? 0);
    
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

    // === Atividades Recentes ===
    const atividades = data.atividades_recentes || [];
    const atvCount = document.getElementById('atividades-count');
    if (atvCount) atvCount.textContent = atividades.length;
    if (atividades.length > 0) {
      document.getElementById('atividades-recentes').innerHTML = atividades.map(a => {
        const icones = { inscricao: '📝', avancar: '⬆️', reprovar: '✖️', proposta: '📨', documento: '📎', entrevista: '📅', sistema: '🔔' };
        const icone = icones[a.tipo] || '🔔';
        const cls = `tipo-${a.tipo}` + (a.alerta_parado ? ' alerta-parado' : '');
        const quando = a.quando ? new Date(a.quando).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
        const alerta = a.alerta_parado ? `<span style="background:#FEE2E2;color:#B91C1C;padding:2px 8px;border-radius:6px;font-size:10px;margin-left:6px">⚠️ Parado ${a.dias_parado || 0}d</span>` : '';
        return `<div class="atividade-item ${cls}" onclick="irParaCandidatura(${a.candidatura_id})" style="cursor:pointer">
          <div class="atividade-icone">${icone}</div>
          <div class="atividade-corpo">
            <div class="atividade-topo">
              <span class="atividade-tipo">${a.texto || 'Atualização'}${alerta}</span>
              <span class="atividade-tempo">${quando}</span>
            </div>
            <div class="atividade-candidato">${a.candidato || '—'}</div>
            <div class="atividade-vaga">${a.vaga || ''}</div>
          </div>
        </div>`;
      }).join('');
    } else {
      document.getElementById('atividades-recentes').innerHTML = '<div class="empty-msg">Nenhuma atividade recente</div>';
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
    
    // === Gráfico: Vagas ATIVAS com mais candidatos (barras verticais + curva) ===
    const vRanking = data.vagas_mais_candidatos || [];
    const containerRanking = document.getElementById('grafico-ranking');
    const containerLegend = document.getElementById('grafico-ranking-legend');
    if (vRanking.length > 0) {
      const maxCands = Math.max(1, ...vRanking.map(v => v.total_candidatos || 0));
      // Gera os pontos da curva (pontos no topo de cada barra) — interpolação suave (Catmull-Rom -> cubic Bézier)
      const n = vRanking.length;
      const colPts = []; // {xPct, yPct} em % do gráfico
      vRanking.forEach((v, i) => {
        const total = v.total_candidatos || 0;
        const yPct = (total / maxCands) * 100; // 0 (base) → 100 (topo)
        const xPct = n === 1 ? 50 : (i / (n - 1)) * 100;
        colPts.push({ xPct, yPct });
      });
      // Constrói path suave (Catmull-Rom -> Bézier)
      let curvaPath = '';
      if (colPts.length > 0) {
        // Substitui y por 100-y (porque y SVG cresce pra baixo, e aqui queremos top→0)
        const pts = colPts.map(p => ({ x: p.xPct, y: 100 - p.yPct }));
        if (pts.length === 1) {
          curvaPath = `M ${pts[0].x},${pts[0].y}`;
        } else {
          let d = `M ${pts[0].x},${pts[0].y}`;
          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = i === 0 ? pts[0] : pts[i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = i + 2 < pts.length ? pts[i + 2] : p2;
            // Pontos de controle Bézier (Catmull-Rom simplificado, tension 0.5)
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x},${p2.y}`;
          }
          curvaPath = d;
        }
      }
      const curvaFill = curvaPath
        ? curvaPath + ` L ${colPts[colPts.length - 1].xPct},100 L ${colPts[0].xPct},100 Z`
        : '';

const chartH = 220; // deve bater com CSS
      // Cores vivas (mesmas do funil de etapas e KPIs)
      // Cores vivas (estilo escada)
      const coresVivas = [
        { fill: '#EC4899', stroke: '#F472B6', label: 'rosa' },
        { fill: '#FACC15', stroke: '#FDE047', label: 'amarelo' },
        { fill: '#374151', stroke: '#4B5563', label: 'cinza' },
        { fill: '#22D3EE', stroke: '#67E8F9', label: 'ciano' },
        { fill: '#FACC15', stroke: '#FDE047', label: 'amarelo2' },
        { fill: '#60A5FA', stroke: '#93C5FD', label: 'azul' },
        { fill: '#34D399', stroke: '#6EE7B7', label: 'verde' }
      ];
      // Estilo de Cards Modernos (Vagas em Destaque) — % em relação ao TOTAL do sistema
      // Mostrar só as top 4 vagas com mais candidatos
      const topRanking = vRanking.slice(0, 4);
      const totalGeral = topRanking.reduce((s, v) => s + (v.total_candidatos || 0), 0) || 1;
      containerRanking.innerHTML = `
        <div class="ranking-cards-grid">
          ${topRanking.map((v, i) => {
            const total = v.total_candidatos || 0;
            const contrat = v.contratados || 0;
            const pct = Math.round((total / totalGeral) * 100);
            const cor = coresVivas[i % coresVivas.length].fill;
            return `
              <div class="vaga-destaque-card" onclick="abrirVagaCands(${v.id})">
                <div class="card-bg-icon">💼</div>
                <div class="vaga-card-header">
                  <div class="vaga-card-info">
                    <div class="vaga-card-title">${v.titulo || '—'}</div>
                    <div class="vaga-card-empresa">${v.empresa || ''}</div>
                  </div>
                  <div class="vaga-card-pct-badge" style="color:${cor};background:${cor}15">${pct}% do total</div>
                </div>
                <div class="vaga-card-stats">
                  <div class="vaga-stat-item">
                    <div class="vaga-stat-val">${total}</div>
                    <div class="vaga-stat-label">Candidatos</div>
                  </div>
                  ${contrat > 0 ? `
                  <div class="vaga-stat-item">
                    <div class="vaga-stat-val" style="color:#7B2330">${contrat}</div>
                    <div class="vaga-stat-label">Contratados</div>
                  </div>` : ''}
                </div>
                <div class="vaga-card-progress">
                  <div class="vaga-card-progress-fill" style="width:${pct}%; background:${cor}"></div>
                </div>
              </div>`;
          }).join('')}
        </div>`;

      containerLegend.innerHTML = `
        <div><span class="leg-dot" style="background:#EC4899"></span>Volume por vaga</div>
        <div style="color:#888;font-size:11px;margin-left:auto;">💡 Clique em uma área para ver os candidatos</div>`;
    } else {
      containerRanking.innerHTML = '<div class="empty">Nenhuma vaga ativa com candidatos</div>';
      containerLegend.innerHTML = '';
    }
    
    // === KPIs secundários ===
    const ks = data.kpis_secundarios || {};
    document.getElementById('ks-tempo').textContent = (ks.tempo_medio_contratacao || 0) + 'd';
    const elKsAprov = document.getElementById('ks-aprovacao');
    if (elKsAprov) {
      const pct = ks.taxa_aprovacao_30d || 0;
      const qtd = ks.taxa_aprovacao_30d_qtd || 0;
      const tot = ks.taxa_aprovacao_30d_total || 0;
      elKsAprov.textContent = `${pct}%`;
      elKsAprov.title = `${qtd} de ${tot} vagas chegaram em Contratação em até 30 dias`;
    }
    document.getElementById('ks-desistencia').textContent = (ks.taxa_desistencia || 0) + '%';
    const ksFech = document.getElementById('ks-fechadas-sem-contrato');
    if (ksFech) ksFech.textContent = (ks.vagas_fechadas_sem_contratacao || 0);
    document.getElementById('ks-encerradas').textContent = ks.vagas_encerradas || 0;
    document.getElementById('ks-empresas').textContent = ks.empresas_ativas || 0;
  } catch (e) {
    console.error('[DASHBOARD V2] ERRO:', e.message, e.stack);
    const grid = document.getElementById('kpis-grid') || document.getElementById('stats-grid');
    if (grid) grid.innerHTML = `<div class="alert alert-erro">Erro ao carregar: ${escapeHtml(e.message)}</div>`;
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
// Estado interno da nova tela de vagas (filtros, paginação, ordenação)
const _vagasState = {
  page: 1, limit: 10, status: '', search: '', empresa: '', area: '',
  ordenar: 'criada_em', ordem_dir: 'DESC',
  total: 0, vagas: []
};

async function carregarVagasAdmin() {
  // Compatibilidade com chamada legacy (botão +, modais etc.)
  // A renderização nova agora usa /api/admin/vagas com filtros server-side.
  _vagasState.page = 1;
  await carregarVagasAdminNovo();
  // Inicializa UI uma vez (listeners de busca/filtro/abas/pag)
  if (!window._vagasUIInicializada) {
    window._vagasUIInicializada = true;
    inicializarUIVagas();
  }
}

function inicializarUIVagas() {
  // Busca (debounce 350ms)
  let timer = null;
  const busca = document.getElementById('vagas-busca');
  if (busca) {
    busca.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        _vagasState.search = busca.value.trim();
        _vagasState.page = 1;
        carregarVagasAdminNovo();
      }, 350);
    });
  }
  // Filtros select
  const statusEl = document.getElementById('vagas-filtro-status');
  if (statusEl) statusEl.addEventListener('change', () => {
    _vagasState.status = statusEl.value;
    _vagasState.page = 1;
    // Sincroniza visualmente com a aba ativa
    document.querySelectorAll('#vagas-abas .vaga-aba').forEach(b => {
      b.classList.toggle('ativa', (b.getAttribute('data-status') || '') === statusEl.value);
    });
    carregarVagasAdminNovo();
  });
  const empEl = document.getElementById('vagas-filtro-empresa');
  if (empEl) empEl.addEventListener('change', () => {
    _vagasState.empresa = empEl.value;
    _vagasState.page = 1;
    carregarVagasAdminNovo();
  });
  const areaEl = document.getElementById('vagas-filtro-area');
  if (areaEl) areaEl.addEventListener('change', () => {
    _vagasState.area = areaEl.value;
    _vagasState.page = 1;
    carregarVagasAdminNovo();
  });
  // Botão Filtros (mostra/esconde painel — placeholder funcional)
  const fBtn = document.getElementById('vagas-filtros-toggle');
  if (fBtn) fBtn.addEventListener('click', () => {
    // Sem filtros adicionais no momento — apenas alterna foco na busca
    busca && busca.focus();
  });
  // Abas de status
  document.querySelectorAll('#vagas-abas .vaga-aba').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#vagas-abas .vaga-aba').forEach(b => b.classList.remove('ativa'));
      btn.classList.add('ativa');
      _vagasState.status = btn.getAttribute('data-status') || '';
      _vagasState.page = 1;
      carregarVagasAdminNovo();
    });
  });
  // Paginação
  document.getElementById('vagas-pag-ant').addEventListener('click', () => {
    if (_vagasState.page > 1) { _vagasState.page--; carregarVagasAdminNovo(); }
  });
  document.getElementById('vagas-pag-prox').addEventListener('click', () => {
    const max = Math.max(1, Math.ceil(_vagasState.total / _vagasState.limit));
    if (_vagasState.page < max) { _vagasState.page++; carregarVagasAdminNovo(); }
  });
  // Fecha menu de ações ao clicar fora
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('vaga-menu-acoes');
    if (menu && menu.style.display !== 'none' && !menu.contains(e.target) && !e.target.closest('.vaga-linha-acoes-btn')) {
      menu.style.display = 'none';
    }
  });
}

async function carregarVagasAdminNovo() {
  const lista = document.getElementById('vagas-lista');
  if (lista) lista.innerHTML = '<div class="vagas-lista-vazia"><div class="spinner"></div></div>';

  // Monta query string
  const params = new URLSearchParams({
    page: _vagasState.page,
    limit: _vagasState.limit,
    ordenar: _vagasState.ordenar,
    ordem_dir: _vagasState.ordem_dir
  });
  if (_vagasState.status) params.set('status', _vagasState.status);
  if (_vagasState.search) params.set('search', _vagasState.search);
  if (_vagasState.empresa) params.set('empresa', _vagasState.empresa);
  if (_vagasState.area) params.set('area', _vagasState.area);

  try {
    const r = await authedFetch(API + '/api/admin/vagas?' + params.toString(), {
      headers: {}
    });
    const data = await r.json();
    _vagasState.vagas = data.vagas || [];
    _vagasState.total = data.total || 0;
    renderizarVagas(_vagasState.vagas);
    atualizarAbasVagas();     // contagens das abas (sempre todas, ignorando filtro de aba atual)
    atualizarPaginacaoVagas();
    popularFiltrosVagas(_vagasState.vagas);
  } catch (e) {
    if (lista) lista.innerHTML = '<div class="vagas-lista-vazia">❌ Erro ao carregar vagas: ' + escapeHtml(e.message) + '</div>';
  }
}

function renderizarVagas(vagas) {
  const lista = document.getElementById('vagas-lista');
  if (!lista) return;
  if (!vagas.length) {
    // Estado vazio (com busca ou não)
    const hasFilter = _vagasState.search || _vagasState.status || _vagasState.empresa || _vagasState.area;
    lista.innerHTML = `
      <div class="vagas-lista-vazia">
        <div class="vagas-lista-vazia-icone">🔎</div>
        <h3>Nenhuma vaga encontrada</h3>
        <p>${hasFilter ? 'Não encontramos vagas com os filtros selecionados.' : 'Nenhuma vaga cadastrada. Clique em "+ Nova vaga" pra começar.'}</p>
        ${hasFilter ? '<button class="btn btn-sec" onclick="limparFiltrosVagas()">Limpar filtros</button>' : ''}
      </div>`;
    return;
  }
  lista.innerHTML = vagas.map(v => renderizarVagaLinha(v)).join('');
}

function renderizarVagaLinha(v) {
  // Ícone por área da vaga
  const { iconeClass, iconeEmoji } = vagaIconePorArea(v.area);

  // Status pílula + extras
  let statusPillHtml = '';
  let statusExtra = '';
  if (v.status === 'publicada') {
    statusPillHtml = '<span class="vaga-linha-status-pill publicada"><span class="vaga-linha-status-dot"></span>Publicada</span>';
  } else if (v.status === 'fechada') {
    statusPillHtml = '<span class="vaga-linha-status-pill fechada"><span class="vaga-linha-status-dot"></span>Encerrada</span>';
    // Mostra "Sem contratação" se não foi contratado nenhum candidato
    const temContratado = (v.candidatos_count || 0) > 0 && (v.status_contratacao === 'contratado' || v.tem_contratacao === true);
    if (!temContratado) {
      statusExtra = '<span class="vaga-linha-status-extra">Sem contratação</span>';
    }
  } else if (v.status === 'pausada') {
    statusPillHtml = '<span class="vaga-linha-status-pill pausada"><span class="vaga-linha-status-dot"></span>Rascunho</span>';
  } else {
    statusPillHtml = '<span class="vaga-linha-status-pill fechada">' + escapeHtml(v.status || '—') + '</span>';
  }

  // Tag inline de status (ao lado do ID) — destaca "Publicada" / "Rascunho"
  let tagInline = '';
  if (v.status === 'publicada') {
    tagInline = '<span class="vaga-linha-tag tag-publicada">🟢 Publicada</span>';
  } else if (v.status === 'pausada') {
    tagInline = '<span class="vaga-linha-tag tag-rascunho">🔵 Rascunho</span>';
  } else if (v.status === 'fechada' && (v.candidatos_count || 0) === 0) {
    tagInline = '<span class="vaga-linha-tag tag-rascunho">Rascunho</span>';
  }

  // Publicada há X dias (calcula a partir de criada_em)
  let publicadaHa = '—';
  if (v.criada_em) {
    const d = new Date(v.criada_em);
    const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (v.status === 'publicada') {
      publicadaHa = diff <= 0 ? 'hoje' : (diff === 1 ? '1 dia' : (diff + ' dias'));
    } else if (v.status === 'fechada' || v.status === 'pausada') {
      // Pra fechadas/rascunhos, mostra a data de criação
      publicadaHa = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }

  const cand = v.candidatos_count || 0;
  const candPlural = cand === 1 ? 'candidato' : 'candidatos';
  const candHtml = cand > 0
    ? `<a href="#" class="vaga-linha-cand-wrap" onclick="abrirVagaCands(${v.id}); return false;" title="Ver candidatos">
         <span class="vaga-linha-cand-num">${cand}</span>
         <span class="vaga-linha-cand-label">${candPlural}</span>
       </a>`
    : `<span class="vaga-linha-cand-wrap zero">
         <span class="vaga-linha-cand-num">${cand}</span>
         <span class="vaga-linha-cand-label">${candPlural}</span>
       </span>`;

  return `
    <div class="vaga-linha" data-id="${v.id}">
      <div class="vaga-linha-icone ${iconeClass}" aria-hidden="true">${iconeEmoji}</div>
      <div data-label="Vaga">
        <div class="vaga-linha-titulo-row">
          <strong class="vaga-linha-titulo">${escapeHtml(v.titulo || '(sem título)')}</strong>
        </div>
        <div class="vaga-linha-id-row">
          <span class="vaga-linha-id">ID: ${v.id}</span>
          ${tagInline}
        </div>
      </div>
      <div class="vaga-linha-empresa" data-label="Empresa">${escapeHtml(v.empresa || '—')}</div>
      <div class="vaga-linha-categoria" data-label="Categoria">${escapeHtml(v.area || '—')}</div>
      <div class="vaga-linha-candidatos" data-label="Candidatos">${candHtml}</div>
      <div class="vaga-linha-tempo ${publicadaHa === '—' ? 'vazio' : ''}" data-label="Publicada há"><span class="vaga-linha-tempo-icone">📅</span> ${publicadaHa}</div>
      <div class="vaga-linha-status" data-label="Status">
        ${statusPillHtml}
        ${statusExtra}
      </div>
      <div class="vaga-linha-acoes" data-label="">
        <button class="vaga-linha-acoes-btn" onclick="abrirMenuAcoesVaga(event, ${v.id})" title="Ações" aria-label="Ações da vaga">⋮</button>
      </div>
    </div>`;
}

// Ícone por área da vaga (escolhe emoji + cor de fundo)
function vagaIconePorArea(area) {
  const a = (area || '').toLowerCase();
  if (a.includes('administ') || a.includes('gestão') || a.includes('gerenc'))
    return { iconeClass: 'icone-administracao', iconeEmoji: '💼' };
  if (a.includes('atend') || a.includes('vend') || a.includes('hospital') || a.includes('servi'))
    return { iconeClass: 'icone-atendimento', iconeEmoji: '🍽' };
  if (a.includes('saúde') || a.includes('saude') || a.includes('farma') || a.includes('enferm'))
    return { iconeClass: 'icone-saude', iconeEmoji: '💊' };
  if (a.includes('tec') || a.includes('ti') || a.includes('inform'))
    return { iconeClass: 'icone-tecnologia', iconeEmoji: '💻' };
  if (a.includes('educ') || a.includes('aprender') || a.includes('estagi') || a.includes('profess'))
    return { iconeClass: 'icone-educacao', iconeEmoji: '🎓' };
  if (a.includes('engenh') || a.includes('indúst'))
    return { iconeClass: 'icone-engenharia', iconeEmoji: '🔧' };
  if (a.includes('financeir') || a.includes('financ') || a.includes('contab') || a.includes('contábil'))
    return { iconeClass: 'icone-financeiro', iconeEmoji: '📊' };
  if (a.includes('marketing') || a.includes('design') || a.includes('comunicaç'))
    return { iconeClass: 'icone-marketing', iconeEmoji: '🎨' };
  if (a.includes('logist') || a.includes('armaz') || a.includes('transport'))
    return { iconeClass: 'icone-logistica', iconeEmoji: '🚚' };
  return { iconeClass: 'icone-default', iconeEmoji: '💼' };
}

function abrirMenuAcoesVaga(event, vagaId) {
  event.stopPropagation();
  const v = _vagasState.vagas.find(x => x.id === vagaId);
  if (!v) return;
  const menu = document.getElementById('vaga-menu-acoes');
  // Define ações baseado no status
  // Estrutura: { icon, label, onclick, divisor?: true (separa visualmente), perigo?: true (vermelho) }
  const acoes = [];
  // === Grupo 1: Ações de visualização ===
  acoes.push({ icon: '✏️', label: 'Editar vaga', onclick: `editarVaga(${v.id}); fecharMenuAcoesVaga();` });
  acoes.push({ icon: '👥', label: 'Ver candidatos', onclick: `abrirVagaCands(${v.id}); fecharMenuAcoesVaga();` });
  // Divisor antes do próximo grupo
  if (v.status === 'publicada' || v.status === 'pausada') {
    acoes.push({ divisor: true });
  }
  // === Grupo 2: Ações de ciclo de vida ===
  if (v.status === 'publicada' || v.status === 'pausada') {
    acoes.push({ icon: '📋', label: 'Duplicar vaga', onclick: `duplicarVagaAdmin(${v.id}); fecharMenuAcoesVaga();` });
  }
  if (v.status === 'publicada') {
    acoes.push({ icon: '⏸', label: 'Pausar vaga', onclick: `pausarVagaAdmin(${v.id}); fecharMenuAcoesVaga();` });
  }
  if (v.status === 'pausada') {
    acoes.push({ icon: '▶', label: 'Reativar vaga', onclick: `reativarVagaAdmin(${v.id}); fecharMenuAcoesVaga();` });
  }
  if (v.status !== 'fechada') {
    acoes.push({ icon: '🚩', label: 'Encerrar vaga', onclick: `encerrarVagaAdmin(${v.id}); fecharMenuAcoesVaga();` });
  }
  // === Grupo 3: Ações destrutivas (separadas por divisor) ===
  if (v.status !== 'publicada' || v.status === 'publicada') {
    acoes.push({ divisor: true });
  }
  acoes.push({ icon: '🗑', label: 'Excluir vaga', perigo: true, onclick: `confirmarExcluirVaga(${v.id}); fecharMenuAcoesVaga();` });
  menu.innerHTML = acoes.map(a => {
    if (a.divisor) return '<div class="vaga-menu-divisor"></div>';
    return `<button class="vaga-menu-item ${a.perigo ? 'perigo' : ''}" onclick="${a.onclick}">
       <span class="vaga-menu-item-icone">${a.icon}</span>
       <span>${a.label}</span>
     </button>`;
  }).join('');
  // Posiciona o menu perto do botão
  const rect = event.target.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
  menu.style.display = 'block';
}

function fecharMenuAcoesVaga() {
  const menu = document.getElementById('vaga-menu-acoes');
  if (menu) menu.style.display = 'none';
}

function confirmarExcluirVaga(id) {
  const v = _vagasState.vagas.find(x => x.id === id);
  if (!v) return;
  const modal = document.getElementById('vaga-modal-confirmar');
  const nomeEl = document.getElementById('vaga-modal-confirmar-nome');
  const detalhesEl = document.getElementById('vaga-modal-confirmar-detalhes');
  const btn = document.getElementById('vaga-modal-confirmar-btn');
  nomeEl.textContent = v.titulo || ('Vaga #' + id);
  // Mostra detalhes da vaga pra contextualizar
  const totalCands = v._totalCands ?? v.total_candidatos ?? 0;
  const statusLabel = { publicada: '🟢 Publicada', pausada: '⏸ Pausada', fechada: '🚩 Encerrada' }[v.status] || v.status;
  detalhesEl.innerHTML = `
    <div class="vaga-modal-chip">${statusLabel}</div>
    <div class="vaga-modal-chip">👥 ${totalCands} candidato(s)</div>
    ${v.empresa ? `<div class="vaga-modal-chip">🏢 ${escapeHtml(v.empresa)}</div>` : ''}
  `;
  // Substitui o onclick pra evitar handlers antigos
  btn.onclick = () => { fecharModalConfirmarVaga(); deletarVaga(id); };
  modal.style.display = 'flex';
}

function fecharModalConfirmarVaga() {
  const modal = document.getElementById('vaga-modal-confirmar');
  if (modal) modal.style.display = 'none';
}

function limparFiltrosVagas() {
  _vagasState.search = ''; _vagasState.empresa = ''; _vagasState.area = ''; _vagasState.status = '';
  document.getElementById('vagas-busca').value = '';
  document.getElementById('vagas-filtro-empresa').value = '';
  document.getElementById('vagas-filtro-area').value = '';
  document.querySelectorAll('#vagas-abas .vaga-aba').forEach(b => b.classList.remove('ativa'));
  document.querySelector('#vagas-abas .vaga-aba[data-status=""]').classList.add('ativa');
  _vagasState.page = 1;
  carregarVagasAdminNovo();
}

function atualizarAbasVagas() {
  // Atualiza a contagem de cada aba (ignora o filtro de status atual pra mostrar contagens reais)
  ['todas', 'publicadas', 'fechadas', 'pausadas'].forEach(async (key) => {
    const statusMap = { todas: '', publicadas: 'publicada', fechadas: 'fechada', pausadas: 'pausada' };
    try {
      const r = await authedFetch(API + '/api/admin/vagas?status=' + statusMap[key] + '&limit=1', {
        headers: {}
      });
      const d = await r.json();
      const el = document.getElementById('vagas-aba-count-' + key);
      if (el) el.textContent = '(' + (d.total || 0) + ')';
    } catch {}
  });
  // Atualiza o total à direita
  const totalTodas = _vagasState.total;
  const elTotal = document.getElementById('vagas-aba-count-total-novo');
  if (elTotal) elTotal.textContent = totalTodas + (totalTodas === 1 ? ' vaga' : ' vagas');
}

function atualizarPaginacaoVagas() {
  const total = _vagasState.total;
  const page = _vagasState.page;
  const limit = _vagasState.limit;
  const max = Math.max(1, Math.ceil(total / limit));
  const inicio = total === 0 ? 0 : ((page - 1) * limit + 1);
  const fim = Math.min(page * limit, total);
  document.getElementById('vagas-paginacao-info').textContent =
    total === 0 ? 'Nenhuma vaga' : ('Mostrando ' + inicio + ' a ' + fim + ' de ' + total + ' vaga' + (total === 1 ? '' : 's'));
  // Numerais (max 5 botões: 1 ... 4 5 6 ... 10)
  const nums = document.getElementById('vagas-pag-nums');
  nums.innerHTML = '';
  const paginas = [];
  if (max <= 7) {
    for (let i = 1; i <= max; i++) paginas.push(i);
  } else {
    paginas.push(1);
    if (page > 3) paginas.push('…');
    const start = Math.max(2, page - 1);
    const end = Math.min(max - 1, page + 1);
    for (let i = start; i <= end; i++) paginas.push(i);
    if (page < max - 2) paginas.push('…');
    paginas.push(max);
  }
  paginas.forEach(p => {
    if (p === '…') {
      const span = document.createElement('span');
      span.className = 'vagas-pag-elipse';
      span.textContent = '…';
      nums.appendChild(span);
    } else {
      const b = document.createElement('button');
      b.className = 'vagas-pag-btn' + (p === page ? ' ativo' : '');
      b.textContent = p;
      b.onclick = () => { _vagasState.page = p; carregarVagasAdminNovo(); };
      nums.appendChild(b);
    }
  });
  // Estado dos botões ← e →
  document.getElementById('vagas-pag-ant').disabled = (page <= 1);
  document.getElementById('vagas-pag-prox').disabled = (page >= max);
}

function popularFiltrosVagas(vagas) {
  // Coleta empresas e áreas distintas da listagem atual (limitado ao exibido)
  const empresas = [...new Set(vagas.map(v => v.empresa).filter(Boolean))].sort();
  const areas = [...new Set(vagas.map(v => v.area).filter(Boolean))].sort();
  const empEl = document.getElementById('vagas-filtro-empresa');
  const areaEl = document.getElementById('vagas-filtro-area');
  if (empEl) {
    const atual = empEl.value;
    empEl.innerHTML = '<option value="">Empresa: Todas</option>' +
      empresas.map(e => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join('');
    // Mantém o valor selecionado se ainda existir
    if (empresas.includes(atual)) empEl.value = atual;
  }
  if (areaEl) {
    const atual = areaEl.value;
    areaEl.innerHTML = '<option value="">Categoria: Todas</option>' +
      areas.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');
    if (areas.includes(atual)) areaEl.value = atual;
  }
}

// Ações da vaga (mantêm compatibilidade com o backend existente)
async function duplicarVagaAdmin(id) {
  const vOrig = _vagasState.vagas.find(x => x.id === id);
  const nome = vOrig?.titulo ? `"${vOrig.titulo}"` : 'esta vaga';
  if (!confirm(`📋 Duplicar ${nome}?\n\nSerá criada uma cópia como rascunho (status "pausada") que você poderá editar e publicar depois.`)) return;
  try {
    // Busca dados da vaga
    const r1 = await authedFetch(API + '/api/admin/vagas/' + id, { headers: {} });
    const d1 = await r1.json();
    const v = d1.vaga || d1;
    if (!v || !v.titulo) { alert('Erro ao carregar dados da vaga'); return; }
    // Monta nova vaga sem ID, criada com status 'pausada' (rascunho)
    const nova = {
      titulo: v.titulo + ' (cópia)',
      empresa: v.empresa, cidade: v.cidade, estado: v.estado,
      tipo_contrato: v.tipo_contrato, nivel: v.nivel, area: v.area,
      salario_min: v.salario_min, salario_max: v.salario_max,
      descricao: v.descricao, requisitos: v.requisitos, beneficios: v.beneficios,
      etapas: v.etapas, status: 'pausada'
    };
    const r2 = await authedFetch(API + '/api/admin/vagas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nova)
    });
    const d2 = await r2.json();
    if (r2.ok) {
      alert('✓ Vaga duplicada como rascunho!');
      carregarVagasAdminNovo();
    } else {
      alert('Erro ao duplicar: ' + (d2.erro || r2.status));
    }
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

async function pausarVagaAdmin(id) {
  const v = _vagasState.vagas.find(x => x.id === id);
  const nome = v?.titulo ? `"${v.titulo}"` : 'esta vaga';
  if (!confirm(`⏸ Pausar ${nome}?\n\nEla deixará de aparecer para novos candidatos, mas os processos em andamento continuam normalmente.`)) return;
  await atualizarStatusVagaAdmin(id, 'pausada', 'Vaga pausada');
}
async function reativarVagaAdmin(id) {
  const v = _vagasState.vagas.find(x => x.id === id);
  const nome = v?.titulo ? `"${v.titulo}"` : 'esta vaga';
  if (!confirm(`▶ Reativar ${nome}?\n\nEla voltará a aparecer para novos candidatos.`)) return;
  await atualizarStatusVagaAdmin(id, 'publicada', 'Vaga reativada');
}
async function encerrarVagaAdmin(id) {
  const v = _vagasState.vagas.find(x => x.id === id);
  const nome = v?.titulo ? `"${v.titulo}"` : 'esta vaga';
  const totalCands = v?._totalCands ?? v?.total_candidatos ?? '?';
  if (!confirm(`🚩 Encerrar ${nome}?\n\nEla deixará de receber novos candidatos e será movida para "Encerradas".\n\n📊 ${totalCands} candidato(s) já inscrito(s) — o histórico será preservado.`)) return;
  await atualizarStatusVagaAdmin(id, 'fechada', 'Vaga encerrada');
}
async function atualizarStatusVagaAdmin(id, novoStatus, msg) {
  try {
    const r = await authedFetch(API + '/api/admin/vagas/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    const d = await r.json();
    if (r.ok) {
      carregarVagasAdminNovo();
    } else {
      alert('Erro: ' + (d.erro || r.status));
    }
  } catch (e) {
    alert('Erro: ' + e.message);
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
    const r = await authedFetch(API + '/api/admin/vagas/' + id, { headers: {} });
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
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (r.ok) {
      fecharModal('vaga');
      carregarVagasAdmin();
    } else {
      document.getElementById('alert-vaga').innerHTML = `<div class="alert alert-erro">${escapeHtml(data.erro || 'Erro ao salvar')}</div>`;
    }
  } catch {
    document.getElementById('alert-vaga').innerHTML = '<div class="alert alert-erro">Erro de conexão</div>';
  }
}

async function deletarVaga(id) {
  if (!confirm('⚠️ Excluir (fechar) esta vaga? Ela deixará de aparecer para os candidatos.')) return;
  try {
    // Backend não tem DELETE — usa PUT para mudar status para 'fechada'
    const r = await authedFetch(API + '/api/admin/vagas/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
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

function popularSelectCidades(candidatos) {
  const sel = document.getElementById('candidatos-filtro-cidade');
  if (!sel) return;
  // Preserva seleção atual para não resetar visualmente
  const valorAtual = sel.value;
  // Coleta cidades distintas e ordena
  const set = new Set();
  (candidatos || []).forEach(c => {
    if (c.cidade) set.add(String(c.cidade).trim());
  });
  const cidades = Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  sel.innerHTML = '<option value="">🏙 Todas as cidades</option>';
  cidades.forEach(cid => {
    const o = document.createElement('option');
    o.value = cid;
    o.textContent = cid;
    sel.appendChild(o);
  });
  if (valorAtual && cidades.includes(valorAtual)) sel.value = valorAtual;
}

function limparFiltrosCandidatos() {
  ['candidatos-filtro-area','candidatos-filtro-cidade','candidatos-filtro-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const inp = document.getElementById('candidatos-filtro-busca');
  if (inp) inp.value = '';
  carregarCandidatos();
}

// === BASE DE TALENTOS — VERSÃO NOVA ===
let _candidatosState = {
  todos: [],
  filtrados: [],
  aba: 'todos',
  pagina: 1,
  porPagina: 12,
  fotoBgCache: {}
};

const TONS_AVATAR = [
  '#722F37', '#8B3A45', '#A04555', '#9C5A6A',
  '#5E7280', '#7B8B7B', '#A0765A', '#8E6F5A'
];
function corAvatarPara(nome) {
  if (!nome) return TONS_AVATAR[0];
  if (_candidatosState.fotoBgCache[nome]) return _candidatosState.fotoBgCache[nome];
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  const cor = TONS_AVATAR[h % TONS_AVATAR.length];
  _candidatosState.fotoBgCache[nome] = cor;
  return cor;
}
function iniciaisDe(nome) {
  if (!nome) return '?';
  const stopwords = new Set(['de','da','do','dos','das','e']);
  const partes = nome.trim().split(/\s+/).filter(Boolean).filter(p => !stopwords.has(p.toLowerCase()));
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}
function htmlAvatar(c, classes) {
  const cls = classes || 'cand-iniciais';
  const temFoto = c.foto_url && typeof c.foto_url === 'string' && c.foto_url.startsWith('data:image/');
  if (temFoto) {
    return `<img class="${cls}" src="${c.foto_url}" alt="Foto de ${escapeHtml(c.nome || 'candidato')}" loading="lazy" />`;
  }
  return `<div class="${cls}" style="background:${corAvatarPara(c.nome)}">${iniciaisDe(c.nome)}</div>`;
}
function formatarCelular(v) {
  if (!v) return '';
  const d = String(v).replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return v;
}
function statusCandidato(c) {
  const ult = (c.ultimo_status || '').toLowerCase();
  if (ult === 'contratado') return 'contratado';
  if (ult === 'em_andamento' || ult === 'aprovado' || ult === 'em_processo') return 'em_processo';
  return null;
}
function labelStatus(s) {
  return { em_processo: '🟡 Em processo', contratado: '🔵 Contratado' }[s] || '';
}

async function carregarCandidatos() {
  popularSelectAreas();
  const tb = document.querySelector('#candidatos-table tbody');
  const cards = document.getElementById('candidatos-cards');
  if (tb) tb.innerHTML = '<tr><td colspan="6" class="empty"><div class="spinner"></div></td></tr>';
  if (cards) cards.innerHTML = '<div class="talentos-vazio"><div class="spinner"></div></div>';
  try {
    const area = document.getElementById('candidatos-filtro-area')?.value || '';
    const url = API + '/api/admin/candidatos' + (area ? '?area=' + encodeURIComponent(area) : '');
    const r = await fetch(url, { headers: {} });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    _candidatosState.todos = data.candidatos || [];
    popularSelectCidades(_candidatosState.todos);
    aplicarBuscaEAbaCandidatos();
  } catch (e) {
    if (tb) tb.innerHTML = '<tr><td colspan="6" class="empty">Erro ao carregar</td></tr>';
    if (cards) cards.innerHTML = '<div class="talentos-vazio"><div class="talentos-vazio-icone">⚠️</div><div class="talentos-vazio-titulo">Erro ao carregar candidatos</div><div class="talentos-vazio-texto">' + escapeHtml(e.message) + '</div></div>';
    atualizarContadorCandidatos(0);
  }
}

function aplicarBuscaEAbaCandidatos() {
  const busca = (document.getElementById('candidatos-filtro-busca')?.value || '').toLowerCase().trim();
  const cidade = (document.getElementById('candidatos-filtro-cidade')?.value || '').trim();
  const statusFiltro = (document.getElementById('candidatos-filtro-status')?.value || '').trim();
  let lista = _candidatosState.todos.slice();
  if (busca) {
    lista = lista.filter(c => {
      const campos = [c.nome, c.email, c.celular, c.cidade, c.estado]
        .filter(Boolean).map(v => String(v).toLowerCase());
      return campos.some(v => v.includes(busca));
    });
  }
  if (cidade) {
    lista = lista.filter(c => String(c.cidade || '').trim() === cidade);
  }
  if (statusFiltro) {
    if (statusFiltro === 'disponivel') {
      lista = lista.filter(c => statusCandidato(c) === null);
    } else {
      lista = lista.filter(c => statusCandidato(c) === statusFiltro);
    }
  }
  const aba = _candidatosState.aba;
  if (aba !== 'todos') {
    lista = lista.filter(c => statusCandidato(c) === aba);
  }
  _candidatosState.filtrados = lista;
  _candidatosState.pagina = 1;
  renderizarCandidatos();
  atualizarAbasCandidatos();
  atualizarContadorCandidatos(_candidatosState.todos.length);
}

function atualizarContadorCandidatos(qtdFiltrados) {
  const el = document.getElementById('talentos-contador');
  if (!el) return;
  el.querySelector('.talentos-contador-num').textContent = String(qtdFiltrados);
}

function atualizarAbasCandidatos() {
  const total = _candidatosState.todos.length;
  if (total === 0) {
    const abas = document.getElementById('talentos-abas');
    if (abas) abas.style.display = 'none';
    return;
  }
  const counts = { todos: total, em_processo: 0, contratado: 0 };
  _candidatosState.todos.forEach(c => {
    const status = statusCandidato(c);
    if (status && counts[status] !== undefined) counts[status]++;
  });
  const temVariedade = (counts.em_processo + counts.contratado) > 0;
  const abas = document.getElementById('talentos-abas');
  if (abas) abas.style.display = temVariedade ? 'flex' : 'none';
  ['todos','em_processo','contratado'].forEach(k => {
    const el = document.getElementById('talentos-aba-' + k + '-num');
    if (el) el.textContent = String(counts[k]);
  });
}

function filtrarCandidatosPorAba(aba) {
  _candidatosState.aba = aba;
  document.querySelectorAll('#talentos-abas .talentos-aba').forEach(b => {
    b.classList.toggle('ativa', b.dataset.aba === aba);
  });
  aplicarBuscaEAbaCandidatos();
}

function renderizarCandidatos() {
  const tb = document.querySelector('#candidatos-table tbody');
  const cards = document.getElementById('candidatos-cards');
  const lista = _candidatosState.filtrados;
  if (lista.length === 0) {
    const area = document.getElementById('candidatos-filtro-area')?.value || '';
    const cidade = document.getElementById('candidatos-filtro-cidade')?.value || '';
    const statusF = document.getElementById('candidatos-filtro-status')?.value || '';
    const busca = (document.getElementById('candidatos-filtro-busca')?.value || '').trim();
    const partes = [];
    if (area) partes.push(`área "${escapeHtml(area)}"`);
    if (cidade) partes.push(`cidade "${escapeHtml(cidade)}"`);
    if (statusF) partes.push(`status "${escapeHtml(statusF)}"`);
    if (busca) partes.push(`"${escapeHtml(busca)}"`);
    const contexto = partes.length ? ' com ' + partes.join(', ') : '';
    const vazio = `<div class="talentos-vazio">
      <div class="talentos-vazio-icone">🔎</div>
      <div class="talentos-vazio-titulo">Nenhum candidato encontrado${contexto}</div>
      <div class="talentos-vazio-texto">Ajuste os filtros ou limpe para ver todos os candidatos cadastrados.</div>
      <button class="talentos-vazio-btn" onclick="limparFiltrosCandidatos()">Limpar filtros</button>
    </div>`;
    if (tb) tb.innerHTML = '<tr><td colspan="6" class="empty">Nenhum candidato encontrado</td></tr>';
    if (cards) cards.innerHTML = vazio;
    const pag = document.getElementById('candidatos-paginacao');
    if (pag) pag.style.display = 'none';
    return;
  }
  const total = lista.length;
  const porPagina = _candidatosState.porPagina;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  if (_candidatosState.pagina > totalPaginas) _candidatosState.pagina = totalPaginas;
  const inicio = (_candidatosState.pagina - 1) * porPagina;
  const pagina = lista.slice(inicio, inicio + porPagina);

  if (tb) {
    tb.innerHTML = pagina.map(c => {
      const cidade = c.cidade ? (c.cidade + (c.estado ? '/' + c.estado : '')) : '—';
      return `<tr>
        <td data-label="Nome"><div class="cand-nome-cell">${htmlAvatar(c, 'cand-foto cand-iniciais')}<strong>${escapeHtml(c.nome || '—')}</strong></div></td>
        <td data-label="Email">${escapeHtml(c.email || '—')}</td>
        <td data-label="Telefone">${escapeHtml(formatarCelular(c.celular) || '—')}</td>
        <td data-label="Cidade">${escapeHtml(cidade)}</td>
        <td data-label="Cadastro">${formatarData(c.criado_em)}</td>
        <td data-label="Ações"><button class="btn btn-primary cand-tabela-btn-ver" onclick="abrirCurriculo(${c.id})">👁 Ver perfil</button></td>
      </tr>`;
    }).join('');
  }

  if (cards) {
    cards.innerHTML = pagina.map(c => {
      const cidade = c.cidade ? (c.cidade + (c.estado ? '/' + c.estado : '')) : 'Não informado';
      const tel = formatarCelular(c.celular) || 'Não informado';
      const email = c.email || 'Não informado';
      const status = statusCandidato(c);
      const temFoto = c.foto_url && typeof c.foto_url === 'string' && c.foto_url.startsWith('data:image/');
      return `<div class="cand-card" data-id="${c.id}">
        <div class="cand-card-topo">
          <div class="cand-card-avatar" style="background:${corAvatarPara(c.nome)}">${
            temFoto
              ? `<img src="${c.foto_url}" alt="Foto de ${escapeHtml(c.nome || 'candidato')}" loading="lazy" />`
              : iniciaisDe(c.nome)
          }</div>
          <div class="cand-card-nome">${escapeHtml(c.nome || '—')}</div>
        </div>
        <div class="cand-card-info">
          <div class="cand-card-info-linha"><span class="ico">✉</span><span>${escapeHtml(email)}</span></div>
          <div class="cand-card-info-linha"><span class="ico">📱</span><span>${escapeHtml(tel)}</span></div>
          <div class="cand-card-info-linha">
            <span class="ico">📍</span><span>${escapeHtml(cidade)}</span>
            <span style="color:#bbb">·</span>
            <span class="ico">📅</span><span>${formatarData(c.criado_em)}</span>
          </div>
        </div>
        ${status ? `<div class="cand-card-meta"><span class="cand-status ${status}">${labelStatus(status)}</span></div>` : ''}
        <div class="cand-card-rodape">
          <button class="cand-card-btn-ver" onclick="abrirCurriculo(${c.id})">👁 Ver perfil</button>
        </div>
      </div>`;
    }).join('');
  }

  const pagEl = document.getElementById('candidatos-paginacao');
  const infoEl = document.getElementById('candidatos-paginacao-info');
  const btnsEl = document.getElementById('candidatos-paginacao-btns');
  if (total > porPagina) {
    if (pagEl) pagEl.style.display = 'flex';
    if (infoEl) infoEl.textContent = `Mostrando ${inicio + 1}–${Math.min(inicio + porPagina, total)} de ${total} candidatos`;
    if (btnsEl) {
      const html = [];
      html.push(`<button class="talentos-pag-btn" ${_candidatosState.pagina === 1 ? 'disabled' : ''} onclick="irPaginaCandidatos(${_candidatosState.pagina - 1})">‹</button>`);
      for (let p = 1; p <= totalPaginas; p++) {
        html.push(`<button class="talentos-pag-btn ${p === _candidatosState.pagina ? 'ativa' : ''}" onclick="irPaginaCandidatos(${p})">${p}</button>`);
      }
      html.push(`<button class="talentos-pag-btn" ${_candidatosState.pagina === totalPaginas ? 'disabled' : ''} onclick="irPaginaCandidatos(${_candidatosState.pagina + 1})">›</button>`);
      btnsEl.innerHTML = html.join('');
    }
  } else {
    if (pagEl) pagEl.style.display = 'none';
  }
}

function irPaginaCandidatos(p) {
  if (p < 1) return;
  _candidatosState.pagina = p;
  renderizarCandidatos();
  const page = document.getElementById('page-candidatos');
  if (page) page.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function abrirPainelFiltrosCandidatos() {
  const sel = document.getElementById('candidatos-filtro-area');
  if (sel) { sel.scrollIntoView({ behavior: 'smooth', block: 'center' }); sel.focus(); }
}

async function abrirCurriculo(id) {
  abrirModal('curriculo');
  const body = document.getElementById('curriculo-body');
  const titulo = document.getElementById('curriculo-titulo');
  body.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  titulo.textContent = '📄 Currículo do Candidato';
  try {
    const r = await authedFetch(API + '/api/admin/candidato/' + id, { headers: {} });
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
      ? areas.map(a => `<span class="badge-area">${escapeHtml(a)}</span>`).join(' ')
      : '<span style="color:var(--cinza-medio)">Nenhuma área selecionada</span>';

    const temFoto = cand.foto_url && typeof cand.foto_url === 'string' && cand.foto_url.startsWith('data:image/');
    const avatarHtml = temFoto
      ? `<img class="curriculo-foto" src="${cand.foto_url}" alt="Foto de ${escapeHtml(cand.nome || 'candidato')}" />`
      : `<div class="curriculo-foto-iniciais" style="background:${corAvatarPara(cand.nome)}">${iniciaisDe(cand.nome)}</div>`;
    const statusCand = statusCandidato(cand);
    const headerHtml = `
      <div class="curriculo-header">
        ${avatarHtml}
        <div class="curriculo-header-info">
          <h2 class="curriculo-nome">${escapeHtml(cand.nome || '—')}</h2>
          <div class="curriculo-sub">${escapeHtml(cand.email || '—')}</div>
          <div class="curriculo-sub">${escapeHtml(formatarCelular(cand.celular) || 'Não informado')}</div>
          <div class="curriculo-badges">
            ${statusCand ? `<span class="cand-status ${statusCand}">${labelStatus(statusCand)}</span>` : ''}
            <span class="curriculo-meta-inline">📅 Cadastrado em ${formatarData(cand.criado_em)}</span>
          </div>
        </div>
      </div>`;

    body.innerHTML = `
      ${headerHtml}
      <div class="curriculo-grid">
        <div class="curriculo-card curriculo-full">
          <h4>📁 Áreas de interesse</h4>
          <div class="areas-badges">${areasHtml}</div>
        </div>
        <div class="curriculo-card">
          <h4>👤 Dados pessoais</h4>
          <div class="kv"><span>Nome</span><strong>${escapeHtml(cand.nome || 'Não informado')}</strong></div>
          <div class="kv"><span>Email</span><strong>${escapeHtml(cand.email || 'Não informado')}</strong></div>
          <div class="kv"><span>CPF</span><strong>${escapeHtml(cand.cpf || 'Não informado')}</strong></div>
          <div class="kv"><span>Celular</span><strong>${escapeHtml(formatarCelular(cand.celular) || 'Não informado')}</strong></div>
          <div class="kv"><span>Data de nascimento</span><strong>${cand.data_nascimento ? formatarData(cand.data_nascimento) : 'Não informado'}</strong></div>
          <div class="kv"><span>Sexo</span><strong>${escapeHtml(cand.sexo || 'Não informado')}</strong></div>
          <div class="kv"><span>Acessibilidade</span><strong>${escapeHtml(cand.acessibilidade || 'Não informado')}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>📍 Endereço</h4>
          <div class="kv"><span>CEP</span><strong>${escapeHtml(cand.cep || 'Não informado')}</strong></div>
          <div class="kv"><span>Cidade/UF</span><strong>${escapeHtml((cand.cidade || '—') + (cand.estado ? '/' + cand.estado : ''))}</strong></div>
          <div class="kv"><span>Bairro</span><strong>${escapeHtml(cand.bairro || 'Não informado')}</strong></div>
          <div class="kv"><span>Logradouro</span><strong>${escapeHtml(cand.logradouro || 'Não informado')}${cand.numero ? ', ' + escapeHtml(cand.numero) : ''}</strong></div>
          <div class="kv"><span>Complemento</span><strong>${escapeHtml(cand.complemento || 'Não informado')}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>🎓 Formação</h4>
          <div class="kv"><span>Escolaridade</span><strong>${escapeHtml(cand.formacao || 'Não informado')}</strong></div>
          <div class="kv"><span>Instituição</span><strong>${escapeHtml(cand.instituicao || 'Não informado')}</strong></div>
          <div class="kv"><span>Curso</span><strong>${escapeHtml(cand.curso || 'Não informado')}</strong></div>
          <div class="kv"><span>Situação</span><strong>${escapeHtml(cand.situacao || 'Não informado')}</strong></div>
          <div class="kv"><span>Conclusão</span><strong>${cand.data_conclusao ? formatarData(cand.data_conclusao) : 'Não informado'}</strong></div>
          <div class="kv"><span>Primeiro emprego?</span><strong>${cand.primeiro_emprego ? '✅ Sim' : 'Não'}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>💼 Experiência</h4>
          <div class="kv"><span>Histórico</span><strong style="white-space:pre-wrap">${escapeHtml(cand.experiencia || 'Não informado')}</strong></div>
        </div>
        <div class="curriculo-card curriculo-full">
          <h4>📝 Sobre você</h4>
          <div style="font-size:13px;color:#333;white-space:pre-wrap">${escapeHtml(cand.sobre_voce || 'Não informado')}</div>
        </div>
        <div class="curriculo-card">
          <h4>🔒 Preferências</h4>
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
    const r = await authedFetch(API + '/api/admin/vagas-com-candidaturas', { headers: {} });
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

// Abre a lista de vagas fechadas sem contratação
async function abrirVagasFechadasSemContratacao() {
  irParaPagina('vagas-fechadas-sem-contrato');
  const tb = document.querySelector('#vagas-fechadas-sem-contrato-table tbody');
  tb.innerHTML = '<tr><td colspan="7" class="empty"><div class="spinner"></div></td></tr>';
  try {
    const r = await authedFetch(API + '/api/admin/vagas-fechadas-sem-contratacao', { headers: {} });
    if (!r.ok) { tb.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + r.status + '</td></tr>'; return; }
    const data = await r.json();
    const vagas = data.vagas || [];
    if (vagas.length === 0) {
      tb.innerHTML = '<tr><td colspan="7" class="empty">Nenhuma vaga fechada sem contratação. Bom trabalho! 🎉</td></tr>';
      return;
    }
    tb.innerHTML = vagas.map(v => {
      const local = (v.cidade || '') + (v.estado ? ' / ' + v.estado : '');
      const fechadaEm = v.fechada_em ? new Date(v.fechada_em).toLocaleDateString('pt-BR') : '—';
      return `<tr>
        <td><strong>${v.titulo}</strong></td>
        <td>${v.empresa || '—'}</td>
        <td>${local || '—'}</td>
        <td>${v.total_candidatos || 0}</td>
        <td><span class="status-badge status-fechada">Fechada</span></td>
        <td>${fechadaEm}</td>
        <td><button class="btn-mini" onclick="irParaCandidatosDaVaga(${v.id})">👁 Ver candidatos</button></td>
      </tr>`;
    }).join('');
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + e.message + '</td></tr>';
  }
}

async function abrirVagaCands(vagaId) {
  irParaPagina('candidatos-vaga');
  const tb = document.querySelector('#vaga-cands-internal-table tbody');
  tb.innerHTML = '<tr><td colspan="7" class="empty"><div class="spinner"></div></td></tr>';
  try {
    const r = await authedFetch(API + '/api/admin/vagas/' + vagaId + '/candidaturas', { headers: {} });
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
    const r = await authedFetch(API + '/api/admin/candidatura/' + id + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao })
    });
    const data = await r.json();
    if (!r.ok) { alert('Erro: ' + (data.erro || 'Não foi possível atualizar')); return; }
    if (vagaAtualCands) {
      const r2 = await authedFetch(API + '/api/admin/vagas/' + vagaAtualCands.id + '/candidaturas', { headers: {} });
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
    const r = await authedFetch(API + '/api/admin/candidatura/' + id, { headers: {} });
    const data = await r.json();
    if (!r.ok) {
      container.innerHTML = `<div class="alert alert-erro">${escapeHtml(data.erro || 'Erro')}</div>`;
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
    container.innerHTML = `<div class="alert alert-erro">Erro: ${escapeHtml(e.message)}</div>`;
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
    const r = await authedFetch(API + '/api/admin/seed-vagas-demo', {
      method: 'POST',
      headers: {}
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
