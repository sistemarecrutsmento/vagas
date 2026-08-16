function avisarShellAuthCandidato(){ try { window.top.postMessage({type:'candidate-auth-changed'}, window.location.origin); } catch(_) {} }
// ============================================
// VagasIO — Front-end do Candidato
// Usa a configuração de ambiente carregada em runtime
// Fluxo: Cadastro/Login com e-mail + senha (sem código de verificação)
// ============================================

const API = window.VAGASIO_API_BASE;
async function fetchCandidatoAuth(url, options={}){
  const access=localStorage.getItem('candidato_token')||tokenCandidato||'';
  const refresh=localStorage.getItem('candidato_refresh')||'';
  const first=await fetch(url,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+access}});
  if(first.status!==401||!refresh)return first;
  const rr=await fetch(API+'/api/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:refresh})});
  const rd=await rr.json().catch(()=>({}));
  if(!rr.ok||!rd.token)return first;
  localStorage.setItem('candidato_token',rd.token);if(rd.refreshToken)localStorage.setItem('candidato_refresh',rd.refreshToken);tokenCandidato=rd.token;
  return fetch(url,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+rd.token}});
}
window.fetchCandidatoAuth=fetchCandidatoAuth;
let categoriaAtiva = '';
let vagaSelecionada = null;
let emailLogado = null;
let tokenCandidato = null;
let cadastroCompleto = false;

// Feedback visual compartilhado pela Home, Login e Cadastro.
// Mantém a lógica existente, mas evita interromper o candidato com alert().
function showCandidateFeedback(message, type = 'error', targetId = null) {
  const modalCad = document.getElementById('modal-cad');
  const modalLogin = document.getElementById('modal-login');
  const id = targetId || (modalCad?.classList.contains('aberto') ? 'cad-feedback' : (modalLogin?.classList.contains('aberto') ? 'login-feedback' : null));
  const target = id ? document.getElementById(id) : null;
  if (target) {
    target.textContent = message || '';
    target.className = 'candidate-feedback' + (message ? ' visible' : '') + (type === 'success' ? ' success' : '');
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  let toast = document.getElementById('candidate-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'candidate-toast';
    toast.className = 'candidate-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message || '';
  toast.classList.toggle('success', type === 'success');
  toast.classList.add('visible');
  clearTimeout(window.__candidateToastTimer);
  window.__candidateToastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
}
window.showCandidateFeedback = showCandidateFeedback;

function clearCandidateFeedback(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.className = 'candidate-feedback'; }
}

// Portal universal ou portal público de uma empresa.
// O mesmo aplicativo é usado nos dois casos; só muda a fonte das vagas.
const CANDIDATO_EMPRESA_SLUG = (() => {
  const qsSlug = new URLSearchParams(location.search).get('slug');
  if (qsSlug && /^[a-z0-9-]{1,80}$/i.test(qsSlug)) return qsSlug.toLowerCase();
  const partes = location.pathname.split('/').filter(Boolean);
  const i = partes.indexOf('candidato');
  const proximo = i >= 0 ? partes[i + 1] : '';
  if (proximo && !['index.html','vaga.html','painel.html','inscricao.html'].includes(proximo.toLowerCase()) && /^[a-z0-9-]{1,80}$/i.test(proximo)) return proximo.toLowerCase();
  return '';
})();
window.CANDIDATO_EMPRESA_SLUG = CANDIDATO_EMPRESA_SLUG;

// =====================================================
// FONTE DA VERDADE — Cálculo de % do perfil do candidato
// Use em QUALQUER página: window.calcularProgressoPerfil(perfil)
// Retorna { pct, completos, total, faltam, faltamObrig[], cadastroCompleto }
//
// Regras:
//  - obrigatorio: true  → conta no "faltam" e bloqueia cadastro até preencher
//  - bonus: true        → se preenchido, SOMA na %. Se vazio, NÃO bloqueia
//                          (foto, experiencias, acessibilidade)
// =====================================================
// Helpers de segurança — escapa caracteres HTML perigosos
// (defesa contra XSS armazenado / refletido em qualquer lugar onde usamos innerHTML)
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function safeAttr(s) {
  // Escapa valores de atributos HTML (mesmo escopo, mas mais conservador)
  return escapeHtml(s);
}

window.CAMPOS_PERFIL = [
  { key: 'nome',            obrigatorio: true,  label: 'Nome' },
  { key: 'cpf',             obrigatorio: true,  label: 'CPF' },
  { key: 'data_nascimento', obrigatorio: false, label: 'Data de nascimento' },
  { key: 'celular',         obrigatorio: true,  label: 'Celular' },
  { key: 'sexo',            obrigatorio: false, label: 'Sexo' },
  { key: 'cep',             obrigatorio: true,  label: 'CEP' },
  { key: 'cidade',          obrigatorio: true,  label: 'Cidade' },
  { key: 'estado',          obrigatorio: true,  label: 'Estado' },
  { key: 'logradouro',      obrigatorio: true,  label: 'Logradouro' },
  { key: 'numero',          obrigatorio: true,  label: 'Número' },
  { key: 'bairro',          obrigatorio: false, label: 'Bairro' },
  { key: 'formacao',        obrigatorio: true,  label: 'Formação' },
  { key: 'instituicao',     obrigatorio: false, label: 'Instituição' },
  { key: 'curso',           obrigatorio: false, label: 'Curso' },
  { key: 'situacao',        obrigatorio: true,  label: 'Situação da formação' },
  { key: 'sobre_voce',      obrigatorio: false, label: 'Sobre você' },
  // bônus — não obrigatórios, mas se preenchidos somam na %
  { key: 'experiencia',     obrigatorio: false, bonus: true,  label: 'Experiências profissionais' },
  { key: 'foto_url',        obrigatorio: false, bonus: true,  label: 'Foto de perfil' },
  { key: 'acessibilidade',  obrigatorio: false, bonus: true,  label: 'Acessibilidade' }
];

window.calcularProgressoPerfil = function(perfil) {
  const todos = window.CAMPOS_PERFIL;
  const total = todos.length;
  if (!perfil) return { pct: 0, completos: 0, total, faltam: [], faltamObrig: total, cadastroCompleto: false };
  const temValor = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim() !== '' && v.trim() !== 'null' && v.trim() !== 'undefined';
    if (Array.isArray(v)) return v.length > 0;
    return true;
  };
  const getVal = (c) => c.key === 'experiencia'
    ? (Array.isArray(perfil.experiencia) ? perfil.experiencia : (typeof perfil.experiencia === 'string' && perfil.experiencia.trim() !== '' ? [perfil.experiencia] : []))
    : perfil[c.key];

  // A % é calculada sobre os campos NÃO-BÔNUS
  // (foto, experiencia e acessibilidade não bloqueiam, são "extras")
  const naoBonus = todos.filter(c => !c.bonus);
  const totalContado = naoBonus.length;
  let completosContados = 0;
  const faltamObrig = [];
  for (const c of naoBonus) {
    if (temValor(getVal(c))) completosContados++;
    else if (c.obrigatorio) faltamObrig.push(c.label);
  }
  let pct = Math.round((completosContados / totalContado) * 100);
  // Se ela adicionou bônus, dá um boost (ex: +5% por bônus, até 100)
  let bonus = 0;
  for (const c of todos) {
    if (c.bonus && temValor(getVal(c))) bonus += 5;
  }
  pct = Math.min(100, pct + (pct >= 100 ? 0 : 0)); // sem boost se já tá 100
  const cadastroCompleto = faltamObrig.length === 0;
  // faltam = tudo que ainda não tá preenchido (inclui bônus vazios, como "sugestão")
  const faltam = todos
    .filter(c => !temValor(getVal(c)))
    .map(c => c.label);
  return { pct, completos: completosContados, total: totalContado, faltam, faltamObrig, cadastroCompleto };
};

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
        if (areasSelecionadas.length >= AREAS_MAX) return showCandidateFeedback('Você pode escolher no máximo ' + AREAS_MAX + ' áreas.');
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

// ETAPA 2 (2026-07-27): inicializa auth-helper (chaves do localStorage).
// auth-helper.js cuida do auto-refresh + sessão durável.
if (typeof window.setStorageKeys === 'function') {
  setStorageKeys('candidato_token', 'candidato_refresh');
}

window.addEventListener('DOMContentLoaded', async () => {
  // FIX Etapa 2 (27/07): tenta refresh silencioso ANTES de mostrar login.
  // Se o usuário tem refresh token válido, renova o access sem precisar logar.
  if (typeof window.authInit === 'function') {
    const refreshed = await window.authInit();
    if (refreshed) {
      // Atualiza variável local com token novo (renovado em background)
      tokenCandidato = localStorage.getItem('candidato_token');
    }
  }

  carregarVagas();
  checarAuth();
  // Garante o ☰ no logo (mesmo deslogado)
  setTimeout(processarRetornoSocial, 120);
  document.querySelectorAll('#filtro-dropdown button').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      const label = btn.textContent.trim();
      document.querySelectorAll('#filtro-dropdown button').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      document.getElementById('filtro-label').textContent = label === 'Todas' ? 'Todas as áreas' : label;
      categoriaAtiva = cat;
      document.getElementById('filtro-dropdown').classList.remove('aberto');
      carregarVagas();
    });
  });
  ['busca', 'busca-cidade'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); carregarVagas(); }
    });
  });

  // FIX FASE 5 (28/07): se veio de um portal público com ?vaga=ID&slug=X,
  // mostra modal de detalhes da vaga automaticamente (após carregar)
  const qs = new URLSearchParams(location.search);
  const vagaQS = parseInt(qs.get('vaga'), 10);
  if (Number.isInteger(vagaQS) && vagaQS > 0) {
    // Espera carregar vagas e tenta abrir detalhe
    setTimeout(() => {
      const v = (typeof vagas !== 'undefined' ? vagas : window.vagas || []).find(x => x.id === vagaQS);
      if (v && typeof abrirDetalhes === 'function') {
        abrirDetalhes(vagaQS);
      } else {
        // Busca direta via API
        fetch((typeof API !== 'undefined' ? API : '') + '/api/vagas/' + vagaQS)
          .then(r => r.json())
          .then(d => {
            if (d && d.ok && typeof abrirDetalhes === 'function') {
              // injeta em window.vagas pra abrirDetalhes funcionar
              window.vagas = window.vagas || [];
              if (!window.vagas.find(x => x.id === vagaQS)) window.vagas.push(d.vaga);
              abrirDetalhes(vagaQS);
            }
          }).catch(() => {});
      }
    }, 1500);
  }
});

function usarBuscaPopular(termo) {
  const campo = document.getElementById('busca');
  if (!campo) return;
  campo.value = termo;
  carregarVagas();
  document.getElementById('vagas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.usarBuscaPopular = usarBuscaPopular;

function normalizarArea(valor) {
  return String(valor || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function areaCorresponde(valor, categoria) {
  const area = normalizarArea(valor);
  const filtro = normalizarArea(categoria);
  const equivalencias = {
    'operacional': ['operacional', 'operacao', 'operacoes'],
    'administrativo': ['administrativo', 'administracao', 'gestao'],
    'comercial': ['comercial', 'vendas'],
    'atendimento / vendas': ['atendimento', 'vendas'],
    'administracao / gestao': ['administrativo', 'administracao', 'gestao'],
    'saude': ['saude', 'farmacia'],
    'saude / farmacia': ['saude', 'farmacia'],
    'farmaceutico': ['farmaceutico', 'farmacia', 'saude']
  };
  return (equivalencias[filtro] || [filtro]).some(termo => area.includes(termo));
}

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
    let vagas = [];
    let nomeEmpresa = '';
    let podeCarregarMais = false;
    let urlPaginacao = '';
    if (CANDIDATO_EMPRESA_SLUG) {
      // Portal da empresa: mesma interface, apenas vagas publicadas daquele tenant.
      const [re, rv] = await Promise.all([
        fetch(API + '/api/public/empresa/' + encodeURIComponent(CANDIDATO_EMPRESA_SLUG)),
        fetch(API + '/api/public/empresa/' + encodeURIComponent(CANDIDATO_EMPRESA_SLUG) + '/vagas')
      ]);
      if (!re.ok || !rv.ok) throw new Error('Empresa não encontrada');
      const empresaData = await re.json();
      const vagasData = await rv.json();
      nomeEmpresa = empresaData.empresa?.nome || CANDIDATO_EMPRESA_SLUG;
      vagas = (vagasData.vagas || []).map(v => ({ ...v, empresa: nomeEmpresa }));
      // O endpoint público da empresa não recebe os mesmos filtros do catálogo
      // universal; aplica os filtros localmente sem alterar a integração.
      const termo = busca.trim().toLocaleLowerCase('pt-BR');
      const local = (document.getElementById('busca-cidade')?.value || '').trim().toLocaleLowerCase('pt-BR');
      if (termo) {
        vagas = vagas.filter(v => [v.titulo, v.empresa, v.area, v.modalidade].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(termo));
      }
      if (local) {
        vagas = vagas.filter(v => [v.cidade, v.estado].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(local));
      }
      if (categoriaAtiva) {
        vagas = vagas.filter(v => areaCorresponde(v.area, categoriaAtiva));
      }
      document.title = 'Vagas de ' + nomeEmpresa + ' · VagasIO';
      const titulo = document.querySelector('.section-title');
      if (titulo) titulo.textContent = 'Vagas abertas de ' + nomeEmpresa;
    } else {
      let url = API + '/api/vagas';
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      const cidade = (document.getElementById('busca-cidade')?.value || '').trim();
      if (cidade) {
        if (/^[A-Za-z]{2}$/.test(cidade)) params.set('estado', cidade.toUpperCase());
        else params.set('cidade', cidade);
      }
      // A área é filtrada localmente para funcionar também quando a API retorna
      // nomes equivalentes (por exemplo, "Operações" e "Operacional").
      const paginada = !categoriaAtiva;
      if (paginada) { params.set('limite', '20'); params.set('offset', '0'); }
      if (params.toString()) url += '?' + params;
      urlPaginacao = url;
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeoutId);
      const data = await r.json();
      vagas = data.vagas || [];
      podeCarregarMais = !!data.mais;
      if (categoriaAtiva) {
        vagas = vagas.filter(v => areaCorresponde(v.area, categoriaAtiva));
      }
    }
    window.vagas = vagas;
    if (vagas.length === 0) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;"><div class="empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 9h8M8 13h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div><h3>Nenhuma vaga disponível no momento</h3><p>Volte mais tarde — atualizamos toda semana.</p></div>';
      if (contador) contador.textContent = '0 vagas encontradas';
      return;
    }
    const compartilharVaga = async v => {
      const titulo = v?.titulo || 'uma vaga';
      const empresa = v?.empresa || v?.empresa_nome || 'uma empresa';
      const url = `${location.origin}/candidato/index.html?vaga=${encodeURIComponent(v?.id || '')}`;
      const texto = `Confira a vaga para ${titulo}, na empresa ${empresa}. Ver detalhes em: ${url}`;
      try {
        if (navigator.share) { await navigator.share({ title: titulo, text: texto, url }); }
        else if (navigator.clipboard) { await navigator.clipboard.writeText(texto); alert('Mensagem copiada. Agora é só colar no WhatsApp, Mensagens ou outro chat.'); }
        else { window.prompt('Copie a mensagem para compartilhar:', texto); }
      } catch (_) {}
    };
    window.compartilharVaga = compartilharVaga;
    let limiteVagas = 20;
    const renderVagas = () => {
      const pagina = vagas.slice(0, limiteVagas);
      grid.innerHTML = pagina.map(v => {
        const sMin = Number(v.salario_min) || null;
        const sMax = Number(v.salario_max) || null;
        const salTexto = (sMin && sMax) ? `R$ ${sMin.toLocaleString('pt-BR')} - R$ ${sMax.toLocaleString('pt-BR')}` : (v.salario || 'A combinar');
        return `<div class="vaga-card" role="button" tabindex="0" data-vaga-id="${Number(v.id)}"><div class="empresa">${escapeHtml(v.empresa || 'Empresa')}</div><h3>${escapeHtml(v.titulo)}</h3><div class="vaga-tags">${v.area ? `<span class="tag">${escapeHtml(v.area)}</span>` : ''}${v.modalidade ? `<span class="tag">${escapeHtml(v.modalidade)}</span>` : ''}${v.cidade ? `<span class="tag">${escapeHtml(v.cidade)}</span>` : ''}</div><div class="salario">${escapeHtml(salTexto)}</div><div class="footer"><span class="data">${formatarData(v.criada_em)}</span><span class="cta">Ver detalhes →</span><button type="button" class="vaga-share-btn" data-share-vaga="${Number(v.id)}" aria-label="Compartilhar vaga" title="Compartilhar vaga">↗</button></div></div>`;
      }).join('');
      grid.querySelectorAll('[data-share-vaga]').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); const vaga = vagas.find(x => String(x.id) === btn.dataset.shareVaga); compartilharVaga(vaga); });
      });
      grid.querySelectorAll('[data-vaga-id]').forEach(card => {
        const abrir = () => abrirDetalhes(card.dataset.vagaId);
        card.addEventListener('click', abrir);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
        });
      });
      if (limiteVagas < vagas.length || podeCarregarMais) {
        const mais = document.createElement('button');
        mais.type = 'button';
        mais.className = 'btn-ver-mais';
        mais.textContent = 'Ver mais';
        mais.style.cssText = 'grid-column:1/-1;justify-self:center;margin:8px auto 0;min-width:140px;';
        mais.addEventListener('click', async () => {
          if (!podeCarregarMais) { limiteVagas += 20; renderVagas(); return; }
          mais.disabled = true; mais.textContent = 'Carregando...';
          try {
            const u = new URL(urlPaginacao, location.origin);
            u.searchParams.set('offset', String(vagas.length));
            const r = await fetch(u.toString());
            if (!r.ok) throw new Error('Falha ao carregar mais vagas');
            const data = await r.json();
            vagas = vagas.concat(data.vagas || []);
            podeCarregarMais = !!data.mais;
            limiteVagas = vagas.length;
            renderVagas();
          } catch (_) {
            mais.disabled = false; mais.textContent = 'Tentar novamente';
          }
        });
        grid.appendChild(mais);
      }
    };
    renderVagas();
    if (contador) contador.textContent = `${vagas.length} vaga${vagas.length !== 1 ? 's' : ''} encontrada${vagas.length !== 1 ? 's' : ''}`;
  } catch (e) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;color:#C00;"><div class="empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 21 19H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 9v5M12 17h.01" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div><h3>Não foi possível carregar as vagas</h3><p>O servidor pode estar iniciando. Tente novamente.</p><button class="btn btn-primary" style="width:auto;margin-top:16px" onclick="carregarVagas()">Tentar novamente</button></div>`;
    if (contador) contador.textContent = 'Não foi possível carregar';
  }
}

function renderDetalheTexto(id, valor, vazio = 'Não informado') {
  const el = document.getElementById(id);
  if (!el) return;
  const texto = String(valor || '').trim();
  if (!texto) { el.textContent = vazio; return; }
  const linhas = texto.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const lista = linhas.length > 1 && linhas.every(x => /^[-•*]\s+/.test(x) || /^\d+[.)]\s+/.test(x));
  if (lista) {
    el.innerHTML = '<ul class="det-lista">' + linhas.map(x => '<li>' + escapeHtml(x.replace(/^([-•*]|\d+[.)])\s+/, '')) + '</li>').join('') + '</ul>';
  } else {
    el.textContent = texto;
  }
}

// Fecha somente o painel de detalhes ao clicar no fundo, sem interferir nos outros modais.
document.addEventListener('click', e => {
  const modal = document.getElementById('modal-detalhes');
  if (modal && e.target === modal && modal.classList.contains('aberto')) fecharModal('detalhes');
});
document.addEventListener('keydown', e => {
  const modal = document.getElementById('modal-detalhes');
  if (e.key === 'Escape' && modal?.classList.contains('aberto')) fecharModal('detalhes');
});
document.querySelectorAll('#modal-detalhes .det-accordion-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true')));
});

function abrirDetalhes(id) {
  const modalInicial = document.getElementById('modal-detalhes');
  ['det-titulo','det-empresa','det-local','det-area-badge','det-contrato','det-nivel','det-area','det-salario','det-contrato-meta','det-nivel-meta','det-area-meta','det-salario-meta'].forEach(k => { const el = document.getElementById(k); if (el) el.textContent = 'Carregando…'; });
  const beneficioInicial = document.getElementById('det-bloco-beneficios');
  if (beneficioInicial) beneficioInicial.hidden = false;
  document.querySelectorAll('#modal-detalhes .det-accordion-toggle').forEach(t => t.setAttribute('aria-expanded', 'true'));
  document.body.classList.add('detalhes-aberto');
  if (modalInicial) modalInicial.classList.add('aberto');
  if (window.top !== window.self) window.parent.postMessage({ type: 'candidate-modal', open: true }, '*');
  const detalheUrl = CANDIDATO_EMPRESA_SLUG
    ? API + '/api/public/empresa/' + encodeURIComponent(CANDIDATO_EMPRESA_SLUG) + '/vagas/' + id
    : API + '/api/vagas/' + id;
  fetch(detalheUrl)
    .then(r => r.json())
    .then(data => {
      const v = data.vaga || data;
      vagaSelecionada = v;
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setTxt('det-empresa', v.empresa || v.empresa_nome || (CANDIDATO_EMPRESA_SLUG ? CANDIDATO_EMPRESA_SLUG : 'Confidencial'));
      setTxt('det-titulo', v.titulo || 'Vaga sem título');
      setTxt('det-local', [v.cidade, v.estado].filter(Boolean).join(', ') || 'Localização não informada');
      setTxt('det-contrato', v.tipo_contrato || 'Não informado');
      setTxt('det-nivel', v.nivel || 'Não informado');
      setTxt('det-area', v.area || 'Não informado');
      setTxt('det-area-badge', v.area || 'Área não informada');
      const temMin = v.salario_min !== null && v.salario_min !== undefined && String(v.salario_min).trim() !== '';
      const temMax = v.salario_max !== null && v.salario_max !== undefined && String(v.salario_max).trim() !== '';
      const formatarSalario = valor => `R$ ${Number(valor).toLocaleString('pt-BR')}`;
      const sal = temMin && temMax
        ? `${formatarSalario(v.salario_min)} - ${formatarSalario(v.salario_max)}`
        : temMin ? formatarSalario(v.salario_min)
        : temMax ? formatarSalario(v.salario_max)
        : 'Não informado';
      setTxt('det-salario', sal);
      setTxt('det-contrato-meta', v.tipo_contrato || 'Não informado');
      setTxt('det-nivel-meta', v.nivel || 'Não informado');
      setTxt('det-area-meta', v.area || 'Não informado');
      setTxt('det-salario-meta', sal);
      setTxt('det-descricao', v.descricao, 'Descrição não informada');
      renderDetalheTexto('det-requisitos', v.requisitos, 'Requisitos não informados');
      // O endpoint pode não retornar benefícios; nesse caso, mantém a seção e informa a ausência.
      const blocoBeneficios = document.getElementById('det-bloco-beneficios');
      if (blocoBeneficios) blocoBeneficios.hidden = false;
      renderDetalheTexto('det-beneficios', v.beneficios, 'Benefícios não informados');
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
            return `<li><span class="proc-numero">${i+1}</span><div><strong>${escapeHtml(nome)}</strong>${desc ? `<p>${escapeHtml(desc)}</p>` : ''}</div></li>`;
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
      // Fase 11 — Tags
      renderTagsVaga(v.tags || []);
      // Favoritar é visível para todos; a autenticação só é solicitada ao tocar na ação.
      const btnFav = document.getElementById('btn-favoritar');
      if (btnFav) btnFav.style.display = '';
      if (tokenCandidato) carregarFavoritoStatus(v.id);
      const bm = document.getElementById('bloco-match');
      if (bm && !tokenCandidato) bm.style.display = 'none';
      document.querySelectorAll('#modal-detalhes .det-accordion-toggle').forEach(t => t.setAttribute('aria-expanded', 'true'));
      document.body.classList.add('detalhes-aberto');
      document.getElementById('modal-detalhes').classList.add('aberto');
      if (window.top !== window.self) window.parent.postMessage({ type: 'candidate-modal', open: true }, '*');
      // Analytics: vaga visualizada
      if (window.vagiasTrack) window.vagiasTrack('vaga_visualizada', { vaga_id: id, metadata: { origem: 'portal' } });
    })
    .catch(() => {
      const el = document.getElementById('det-descricao');
      if (el) el.textContent = 'Não foi possível carregar os detalhes desta vaga. Tente novamente.';
    });
}

function atualizarBotaoCandidatar(vagaId) {
  const btn = document.getElementById('btn-candidatar');
  if (!btn) return;
  if (!tokenCandidato) {
    btn.textContent = 'Candidatar-se a esta vaga';
    btn.disabled = false;
    btn.onclick = () => { fecharModal('detalhes'); abrirModal('login'); };
  } else if (!cadastroCompleto) {
    btn.textContent = 'Complete seu cadastro para candidatar-se';
    btn.disabled = false;
    btn.onclick = () => {
      emailLogado = localStorage.getItem('candidato_email') || emailLogado;
      const cadEmail = document.getElementById('w1-email') || document.getElementById('cad-email');
      if (cadEmail) cadEmail.value = emailLogado || '';
      fecharModal('detalhes');
      abrirModal('cad');
      irParaEtapa(2);
    };
  } else {
    btn.textContent = 'Candidatar-se a esta vaga';
    btn.disabled = false;
    btn.onclick = () => candidatar(vagaId);
  }
}

async function candidatar(vagaId) {
  if (!tokenCandidato) {
    fecharModal('detalhes');
    abrirModal('login');
    showCandidateFeedback('Entre na sua conta para se candidatar.', 'error', 'login-feedback');
    return;
  }
  if (!cadastroCompleto) {
    fecharModal('detalhes');
    abrirModal('cad');
    irParaEtapa(2);
    showCandidateFeedback('Complete seu perfil para se candidatar.', 'error', 'cad-feedback');
    return;
  }
  const btn = document.getElementById('btn-candidatar');
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const r = await fetchAuth(API + '/api/candidato/candidatar/' + vagaId, {
      method: 'POST'
    });
    const data = await r.json();
    if (r.ok) {
      btn.textContent = 'Candidatura enviada';
      btn.style.background = '#2E7D32';
      btn.style.color = 'white';
    } else if (r.status === 401) {
      logout();
      btn.textContent = 'Faça login para se candidatar';
      btn.disabled = false;
      btn.onclick = () => { fecharModal('detalhes'); abrirModal('login'); };
      showCandidateFeedback('Sua sessão expirou. Faça login novamente.', 'error', 'login-feedback');
    } else {
      btn.textContent = data.erro || 'Não foi possível concluir';
      btn.disabled = false;
    }
  } catch (e) {
    btn.textContent = 'Erro de conexão';
    btn.disabled = false;
  }
}

// ===== MODAIS =====
function abrirModal(id) {
  if (id === 'cad') {
    clearCandidateFeedback('cad-feedback');
    // Reset wizard
    wizardExps = [];
    wizardCompetencias = [];
    document.getElementById('w2-competencias-importadas-wrap')?.remove();
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
    clearCandidateFeedback('login-feedback');
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
  if (id === 'detalhes') {
    document.body.classList.remove('detalhes-aberto');
    if (window.top !== window.self) window.parent.postMessage({ type: 'candidate-modal', open: false }, '*');
  }
}

// ===== WIZARD DE CADASTRO (4 ETAPAS) =====
let wizardStep = 1;
let wizardAtCurriculo = false;
let wizardExps = []; // experiências adicionadas no passo 5
let wizardCompetencias = []; // competências preservadas pela importação
let wizardEtapa1 = null; // email+senha do passo 1 (criar conta) — null se já logado
let wizardCurriculoArquivo = null;

function wizardIrPara(n) {
  wizardAtCurriculo = n === 'curriculo';
  if (!wizardAtCurriculo) wizardStep = n;
  document.querySelectorAll('.wizard-etapa').forEach(el => el.style.setProperty('display', 'none', 'important'));
  document.querySelectorAll('.wizard-passo').forEach(el => el.classList.remove('ativo', 'concluido'));
  const etapa = document.getElementById(wizardAtCurriculo ? 'wizard-etapa-curriculo' : 'wizard-etapa-' + n);
  if (etapa) etapa.style.setProperty('display', 'block', 'important');
  clearCandidateFeedback('cad-feedback');
  const progresso = wizardAtCurriculo ? 2 : (Number(n) === 1 ? 1 : Number(n) + 1);
  const stepSummary = document.getElementById('wizard-step-summary');
  if (stepSummary) stepSummary.textContent = `Etapa ${progresso} de 6`;
  for (let i = 1; i <= 6; i++) {
    const p = document.querySelector(`.wizard-passo[data-p="${i}"]`);
    if (!p) continue;
    if (i < progresso) p.classList.add('concluido');
    if (i === progresso) p.classList.add('ativo');
  }
  const modal = document.getElementById('modal-cad');
  if (modal) modal.scrollTop = 0;
  if (!wizardAtCurriculo && n === 5) {
    aplicarPrimeiroEmprego();
    if (typeof wizardRenderExps === 'function') wizardRenderExps();
  }
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
  if (wizardAtCurriculo) return wizardIrPara(1);
  if (wizardStep === 2) return wizardIrPara('curriculo');
  if (wizardStep > 1) wizardIrPara(wizardStep - 1);
}

function wizardEtapa1Validar() {
  // Se já tem token (caso "completar cadastro"), pula etapa 1
  if (tokenCandidato) {
    wizardEtapa1 = { email: emailLogado, jaLogado: true };
    wizardIrPara('curriculo');
    return;
  }

  const email = document.getElementById('w1-email')?.value.trim().toLowerCase();
  const senha = document.getElementById('w1-senha')?.value;
  const senhaConf = document.getElementById('w1-senha-conf')?.value;
  if (!email || !email.includes('@')) return showCandidateFeedback('Informe um e-mail válido.');
  if (!senha || senha.length < 8) return showCandidateFeedback('A senha deve ter no mínimo 8 caracteres.');
  if (senha !== senhaConf) return showCandidateFeedback('As senhas não coincidem.');

  wizardEtapa1 = { email, senha, jaLogado: false };
  wizardIrPara('curriculo');
}

function wizardPreencherManual() {
  wizardIrPara(2);
}

async function buscarCep(cepValue, prefix='w3-') {
  const raw = String(cepValue ?? (document.getElementById(prefix+'cep')?.value || '')).replace(/\D/g,'');
  if (raw.length !== 8) return false;
  const statusEl = document.getElementById(prefix+'cep-status');
  if (statusEl) statusEl.textContent = 'Consultando CEP…';
  try {
    const r = await fetch('https://viacep.com.br/ws/' + raw + '/json/', { cache:'no-store' });
    const d = await r.json();
    if (!r.ok || d.erro) throw new Error('CEP não encontrado');
    const set=(id,v)=>{const el=document.getElementById(prefix+id);if(el && v) el.value=v;};
    set('logradouro',d.logradouro); set('bairro',d.bairro); set('cidade',d.localidade); set('estado',d.uf);
    if (statusEl) statusEl.textContent = 'Endereço localizado. Confira o número e complemento.';
    return true;
  } catch(e) {
    if (statusEl) statusEl.textContent = 'Não foi possível localizar o CEP. Preencha o endereço manualmente.';
    return false;
  }
}
window.buscarCep = buscarCep;
function bindCepAutoPreenchimento(){
  const el=document.getElementById('w3-cep');
  if(!el || el.dataset.cepBound==='1') return;
  el.dataset.cepBound='1';
  el.addEventListener('input',()=>{ if(el.value.replace(/\D/g,'').length===8) buscarCep(el.value,'w3-'); });
  el.addEventListener('blur',()=>buscarCep(el.value,'w3-'));
}
window.addEventListener('DOMContentLoaded', bindCepAutoPreenchimento);

function wizardImportarCurriculo(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return showCandidateFeedback('Anexe um arquivo em PDF.', 'error', 'cad-feedback');
  }
  if (file.size > 7 * 1024 * 1024) {
    return showCandidateFeedback('O currículo deve ter no máximo 7 MB.', 'cad-feedback');
  }
  const status = document.getElementById('curriculo-status');
  if (status) status.textContent = 'Lendo seu currículo...';
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64 = String(reader.result).split(',')[1];
      const r = await fetch(API + '/api/candidato/analisar-curriculo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arquivo_base64: base64, arquivo_nome: file.name })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.erro || 'Não foi possível ler o currículo.');
      wizardCurriculoArquivo = { base64, nome: file.name, tipo: file.type || 'application/pdf', dados_importados: data.estrutura || data.dados || null, diagnostico: data.diagnostico || null };
      window.__curriculoDiagnostico = data.diagnostico || null;
      preencherFormularioComCurriculo(data.dados || {});
      if (status) status.textContent = 'Currículo lido. Confira os dados e complete o que estiver em branco.';
      wizardIrPara(2);
    } catch (e) {
      if (status) status.textContent = '';
      showCandidateFeedback(e.message || 'Não foi possível ler o currículo. Você pode preencher manualmente.', 'error', 'cad-feedback');
    } finally {
      input.value = '';
    }
  };
  reader.onerror = () => { if (status) status.textContent = ''; showCandidateFeedback('Não foi possível abrir o arquivo.', 'error', 'cad-feedback'); };
  reader.readAsDataURL(file);
}

function preencherFormularioComCurriculo(dados) {
  // O backend entrega o formato legado plano por compatibilidade e `estrutura` no schema novo.
  // Esta camada é o único ponto que traduz o resultado da importação para os IDs reais do wizard.
  const s = dados.estrutura || dados;
  const pessoal = s.dados_pessoais || dados;
  const endereco = s.endereco || dados;
  const perfil = s.perfil || dados;
  const form = Array.isArray(s.formacao) ? (s.formacao[0] || {}) : s.formacao || {};
  const toDate = value => { const v = String(value || ''); return /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v; };
  const valores = {
    'w1-email': pessoal.email, 'w2-nome': pessoal.nome, 'w2-cpf': pessoal.cpf, 'w2-nascimento': toDate(pessoal.data_nascimento),
    'w2-celular': pessoal.celular, 'w3-cep': endereco.cep, 'w3-cidade': endereco.cidade,
    'w3-estado': endereco.estado, 'w3-bairro': endereco.bairro, 'w3-logradouro': endereco.logradouro,
    'w3-numero': endereco.numero, 'w3-complemento': endereco.complemento,
    'w4-instituicao': form.instituicao, 'w4-curso': form.curso,
    'w4-conclusao': toDate(form.data_conclusao), 'w2-sobre-voce': perfil.sobre_voce
  };
  Object.entries(valores).forEach(([id, value]) => { const el = document.getElementById(id); if (el && value !== undefined && value !== null && String(value).trim() && (id !== 'w1-email' || !String(el.value || '').trim())) el.value = value; });
  const selects = { 'w2-sexo': pessoal.sexo, 'w4-formacao': form.nivel, 'w4-situacao': form.situacao };
  Object.entries(selects).forEach(([id, value]) => { const el = document.getElementById(id); if (el && value) { const opt = [...el.options].find(o => o.value === value || o.textContent.toLowerCase().includes(String(value).toLowerCase())); if (opt) el.value = opt.value; } });
  wizardCompetencias = Array.isArray(s.competencias) ? s.competencias.slice() : [];
  if (wizardCompetencias.length) {
    const sobre = document.getElementById('w2-sobre-voce');
    if (sobre && !document.getElementById('w2-competencias-importadas-wrap')) {
      const wrap = document.createElement('div'); wrap.id = 'w2-competencias-importadas-wrap'; wrap.className = 'form-group';
      wrap.innerHTML = '<label for="w2-competencias-importadas">Competências identificadas (revise)</label><textarea id="w2-competencias-importadas" rows="3" style="resize:vertical"></textarea>';
      sobre.closest('.form-group')?.after(wrap);
    }
    const compEl = document.getElementById('w2-competencias-importadas'); if (compEl) compEl.value = wizardCompetencias.join('\n');
  }
  const experiencias = Array.isArray(s.experiencias) ? s.experiencias : [];
  const normalizarDataExp = value => {
    const v = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v.slice(0, 7);
    if (/^(?:19|20)\d{2}-(?:0[1-9]|1[0-2])$/.test(v) || /^(?:19|20)\d{2}$/.test(v)) return v;
    return '';
  };
  // Contrato interno único: toda entrada parcialmente preenchida continua válida.
  wizardExps = experiencias.filter(e => e && (e.empresa || e.cargo || e.inicio || e.fim || e.descricao || e.emprego_atual)).map(e => ({
    empresa: String(e.empresa || ''), cargo: String(e.cargo || ''), inicio: normalizarDataExp(e.inicio),
    fim: e.emprego_atual ? '' : normalizarDataExp(e.fim), emprego_atual: Boolean(e.emprego_atual), descricao: String(e.descricao || '')
  }));
  wizardRenderExps();
}

function wizardEtapa2Validar() {
  const cpfRaw = document.getElementById('w2-cpf')?.value.trim() || '';
  const cpf = cpfRaw.replace(/\D/g, '');
  const nome = document.getElementById('w2-nome')?.value.trim();
  const dataNasc = document.getElementById('w2-nascimento')?.value;
  const sexo = document.getElementById('w2-sexo')?.value;
  const celular = document.getElementById('w2-celular')?.value.trim();
  const acessibilidade = document.getElementById('w2-acessibilidade')?.value || null;
  const termos = document.getElementById('w2-termos')?.checked !== false;
  const politica = document.getElementById('w2-politica')?.checked;
  const comunicacoes = document.getElementById('w2-comunicacoes')?.checked || false;
  const banco = document.getElementById('w2-banco')?.checked;
  const areas = areasSelecionadas.slice();

  if (!cpf || cpf.length !== 11) return showCandidateFeedback('CPF é obrigatório (11 dígitos).');
  if (!nome) return showCandidateFeedback('Informe seu nome completo.');
  if (!dataNasc) return showCandidateFeedback('Informe sua data de nascimento.');
  if (!sexo) return showCandidateFeedback('Selecione o sexo.');
  if (!celular || celular.replace(/\D/g, '').length < 10) return showCandidateFeedback('Informe um celular válido.');
  if (!termos) return showCandidateFeedback('Você precisa aceitar os Termos de Uso.');
  if (!politica) return showCandidateFeedback('Você precisa aceitar a Política de Privacidade.');

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

  if (cep.length !== 8) return showCandidateFeedback('CEP é obrigatório (8 dígitos).');
  if (!estado || estado.length !== 2) return showCandidateFeedback('UF é obrigatório (ex: SP).');
  if (!cidade) return showCandidateFeedback('Cidade é obrigatória.');
  if (!bairro) return showCandidateFeedback('Bairro é obrigatório.');
  if (!logradouro) return showCandidateFeedback('Logradouro é obrigatório.');
  if (!numero) return showCandidateFeedback('Número é obrigatório.');

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

  if (!formacao) return showCandidateFeedback('Selecione a formação.');

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

  if (!cargo) return showCandidateFeedback('Informe o cargo da experiência.');
  if (!empresa) return showCandidateFeedback('Informe o nome da empresa.');

  if (empregoAtual) {
    wizardExps.push({ cargo, empresa, inicio, fim: null, emprego_atual: true, descricao });
  } else {
    if (!inicio) return showCandidateFeedback('Informe a data de início.');
    if (!fim) return showCandidateFeedback('Informe a data de término ou marque “Emprego atual”.');
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

function wizardAtualizarExpCampo(index, campo, valor) {
  if (!wizardExps[index]) return;
  wizardExps[index][campo] = campo === 'emprego_atual' ? Boolean(valor) : String(valor ?? '');
  if (campo === 'emprego_atual' && wizardExps[index].emprego_atual) wizardExps[index].fim = '';
}

function wizardRenderExps() {
  const cont = document.getElementById('w5-lista');
  if (!cont) return;
  if (wizardExps.length === 0) {
    cont.innerHTML = '<p class="muted">Nenhuma experiência profissional identificada.</p>';
    return;
  }
  cont.innerHTML = wizardExps.map((e, i) => `
    <div class="exp-item" data-experiencia-index="${i}" style="display:block;padding:14px;margin-bottom:12px">
      <div class="form-row">
        <div class="form-group"><label for="experiencia-${i}-empresa">Empresa</label><input id="experiencia-${i}-empresa" type="text" value="${escapeHtml(e.empresa)}" oninput="wizardAtualizarExpCampo(${i}, 'empresa', this.value)"></div>
        <div class="form-group"><label for="experiencia-${i}-cargo">Cargo</label><input id="experiencia-${i}-cargo" type="text" value="${escapeHtml(e.cargo)}" oninput="wizardAtualizarExpCampo(${i}, 'cargo', this.value)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="experiencia-${i}-inicio">Início</label><input id="experiencia-${i}-inicio" type="text" inputmode="numeric" placeholder="YYYY-MM ou YYYY" value="${escapeHtml(e.inicio)}" oninput="wizardAtualizarExpCampo(${i}, 'inicio', this.value)"></div>
        <div class="form-group"><label for="experiencia-${i}-fim">Fim</label><input id="experiencia-${i}-fim" type="text" inputmode="numeric" placeholder="YYYY-MM ou YYYY" value="${escapeHtml(e.fim)}" ${e.emprego_atual ? 'disabled' : ''} oninput="wizardAtualizarExpCampo(${i}, 'fim', this.value)"></div>
      </div>
      <label class="check-label"><input id="experiencia-${i}-atual" type="checkbox" ${e.emprego_atual ? 'checked' : ''} onchange="wizardAtualizarExpCampo(${i}, 'emprego_atual', this.checked); wizardRenderExps()"> Emprego atual</label>
      <div class="form-group"><label for="experiencia-${i}-descricao">Descrição</label><textarea id="experiencia-${i}-descricao" rows="3" style="resize:vertical" oninput="wizardAtualizarExpCampo(${i}, 'descricao', this.value)">${escapeHtml(e.descricao)}</textarea></div>
      <button type="button" class="btn-x" onclick="wizardRemoverExp(${i})" title="Remover experiência">Remover experiência</button>
    </div>
  `).join('');
}

async function wizardFinalizar() {
  const compEl = document.getElementById('w2-competencias-importadas');
  const competencias = compEl ? compEl.value.split(/[\n,;]+/).map(v => v.trim()).filter(Boolean) : wizardCompetencias;
  const dados = {
    ...(wizardEtapa1.dados || {}),
    experiencias: wizardExps,
    competencias,
    // Keep the original PDF and parsed snapshot for the backend persistence flow.
    ...(wizardCurriculoArquivo ? { curriculo_arquivo: wizardCurriculoArquivo } : {})
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
        showCandidateFeedback(dc.erro || 'Não foi possível criar a conta.');
        if (btn) { btn.disabled = false; btn.textContent = 'Finalizar cadastro'; }
        return;
      }
      tokenCandidato = dc.token;
      emailLogado = dc.candidato.email;
      localStorage.setItem('candidato_token', tokenCandidato);
      avisarShellAuthCandidato();
      // ETAPA 2: salva refresh token para auto-refresh
      if (dc.refreshToken) {
        localStorage.setItem('candidato_refresh', dc.refreshToken);
      }
      localStorage.setItem('candidato_email', emailLogado);
      localStorage.setItem('candidato_nome', dados.nome);
      // A conta já existe mesmo que a gravação complementar do perfil falhe.
      // Permite repetir somente o perfil sem tentar criar o e-mail novamente.
      wizardEtapa1.jaLogado = true;
    }

    // 2) Salva o resto do perfil (endereço, escolaridade, experiências)
    const rp = await fetchAuth(API + '/api/candidato/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const dp = await rp.json();
    if (!rp.ok) {
      showCandidateFeedback(dp.erro || 'Não foi possível salvar o perfil.');
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
        btnCand.textContent = 'Candidatar-se a esta vaga';
        btnCand.disabled = false;
        btnCand.onclick = () => candidatar(vagaSelecionada.id);
      }
    } else {
      fecharModal('cad');
      atualizarHeaderUsuario();
    }
  } catch (e) {
    showCandidateFeedback('Não foi possível concluir agora. Verifique sua conexão e tente novamente.');
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
  if (!email || !email.includes('@')) return showCandidateFeedback('Informe um e-mail válido.', 'error', 'login-feedback');
  if (!senha) return showCandidateFeedback('Informe sua senha.', 'error', 'login-feedback');

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
      avisarShellAuthCandidato();
      // ETAPA 2: salva refresh token para auto-refresh
      if (data.refreshToken) {
        localStorage.setItem('candidato_refresh', data.refreshToken);
      }
      localStorage.setItem('candidato_email', emailLogado);
      window.dispatchEvent(new Event('candidate-auth-changed'));
      await checarPerfil();
      fecharModal('login');
      atualizarHeaderUsuario();
      if (!cadastroCompleto) {
        abrirModal('cad');
      }
    } else {
      showCandidateFeedback(data.erro || 'E-mail ou senha incorretos.', 'error', 'login-feedback');
    }
  } catch (e) {
    showCandidateFeedback('Não foi possível entrar agora. Verifique sua conexão e tente novamente.', 'error', 'login-feedback');
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

async function continuarSocial(provider, btn) {
  if (!['google', 'apple'].includes(provider)) return;
  const oldText = btn?.textContent || '';
  if (btn) { btn.disabled = true; btn.textContent = 'Conectando…'; }
  try {
    const r = await fetch(`${API}/api/auth/social/${provider}/start`, { headers: { Accept: 'application/json' } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.url) {
      showCandidateFeedback(data.erro || `Login com ${provider === 'google' ? 'Google' : 'Apple'} indisponível no momento.`, 'error', 'login-feedback');
      return;
    }
    window.location.assign(data.url);
  } catch (e) {
    showCandidateFeedback('Não foi possível iniciar o login social. Tente novamente.', 'error', 'login-feedback');
  } finally {
    if (btn && document.body.contains(btn)) { btn.disabled = false; btn.textContent = oldText; }
  }
}
window.continuarSocial = continuarSocial;

async function processarRetornoSocial() {
  const qs = new URLSearchParams(location.search);
  const socialCode = qs.get('social_code');
  const socialError = qs.get('social_error');
  if (!socialCode && !socialError) return;
  history.replaceState({}, document.title, location.pathname + (CANDIDATO_EMPRESA_SLUG ? `?slug=${encodeURIComponent(CANDIDATO_EMPRESA_SLUG)}` : ''));
  if (socialError) {
    abrirModal('login');
    setTimeout(() => showCandidateFeedback(socialError, 'error', 'login-feedback'), 80);
    return;
  }
  try {
    const r = await fetch(API + '/api/auth/social/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: socialCode })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.token || !data.candidato) throw new Error(data.erro || 'Código social inválido');
    tokenCandidato = data.token;
    emailLogado = data.candidato.email;
    localStorage.setItem('candidato_token', tokenCandidato);
    avisarShellAuthCandidato();
    localStorage.setItem('candidato_email', emailLogado);
    if (data.refreshToken) localStorage.setItem('candidato_refresh', data.refreshToken);
    window.dispatchEvent(new Event('candidate-auth-changed'));
    await checarPerfil();
    atualizarHeaderUsuario();
    if (!cadastroCompleto) abrirModal('cad');
  } catch (e) {
    abrirModal('login');
    setTimeout(() => showCandidateFeedback(e.message || 'Não foi possível concluir o login social.', 'error', 'login-feedback'), 80);
  }
}

async function checarPerfil() {
  if (!tokenCandidato) return;
  try {
    const r = await fetchAuth(API + '/api/candidato/perfil');
    // fetchAuth já desloga se 401
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
    const r = await fetchAuth(API + '/api/candidato/perfil');
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
  // O shell persistente controla o menu lateral; nunca o substitua por ações da página.
  if (document.getElementById('btn-menu-logo')) return;
  const headerActions = document.getElementById('header-actions');
  if (!headerActions) return;

  if (tokenCandidato && cadastroCompleto) {
    // Logado: deixa apenas o menu da conta no lado direito.
    headerActions.innerHTML = '';
  } else if (tokenCandidato) {
    headerActions.innerHTML = `<button class="btn-header-primary" type="button" onclick="abrirModal('cad')">Completar cadastro</button>`;
  } else {
    headerActions.innerHTML = `
      <button class="btn-outline" type="button" onclick="abrirModal('login')">Entrar</button>
      <button id="btn-cadastrar" class="btn-header-primary" type="button" onclick="abrirModal('cad')">Criar conta</button>
    `;
  }
  // SEMPRE garante que o botão ☰ no logo existe (logado ou deslogado)
}

// fetchAuth: wrapper sobre fetch() que adiciona Authorization automaticamente
// e desloga se o backend retornar 401 (token inválido/expirado).
// ETAPA 2 (2026-07-27): se window.authFetch está disponível (auth-helper.js),
// usa ele com auto-refresh automático antes de deslogar.
async function fetchAuth(url, options = {}) {
  // FIX Etapa 2: usa authFetch (com auto-refresh) se disponível
  if (typeof window.authFetch === 'function') {
    return window.authFetch(url, options);
  }
  // Fallback (sem auto-refresh)
  const headers = Object.assign(
    {},
    options.headers || {},
    tokenCandidato ? { 'Authorization': 'Bearer ' + tokenCandidato } : {}
  );
  const r = await fetch(url, Object.assign({}, options, { headers }));
  if (r.status === 401 && tokenCandidato) {
    logout();
    return r;
  }
  return r;
}
window.fetchAuth = fetchAuth;

async function abrirPainelCandidato() {
  if (!tokenCandidato) { abrirModal('login'); return; }
  if (!cadastroCompleto) {
    abrirModal('cad');
    return;
  }

  // Vai pra página dedicada do candidato (não mais modal)
  location.href = '/candidato/painel.html';
}

async function carregarPainel() {
  // 1) Perfil
  let perfil = null;
  try {
    const r = await fetchAuth(API + '/api/candidato/perfil');
    // fetchAuth já desloga se 401
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
        painelFoto.textContent = iniciais || '?';
      }
    }
    document.getElementById('painel-nome').textContent = nome;
    document.getElementById('painel-email').textContent = perfil.email || emailLogado || '';
    localStorage.setItem('candidato_nome', nome);
    if (perfil.foto_url) localStorage.setItem('candidato_foto', perfil.foto_url);
  }

  // Foto de perfil no editor
  if (typeof window.perfilFotoInit === 'function') window.perfilFotoInit(perfil);

  // 2) Progresso do perfil — usa função UNIFICADA
  const pFill = document.getElementById('painel-progresso-fill');
  const pPct = document.getElementById('painel-progresso-pct');
  const pDica = document.getElementById('painel-progresso-dica');
  if (perfil) {
    const r = window.calcularProgressoPerfil(perfil);
    if (pFill) pFill.style.width = r.pct + '%';
    if (pPct) pPct.textContent = r.pct + '%';
    if (pDica) pDica.textContent = r.pct === 100
      ? 'Seu perfil está completo.'
      : `Preencha mais ${r.faltam.length} campo(s) obrigatório(s): ${r.faltam.slice(0, 3).join(', ')}${r.faltam.length > 3 ? '…' : ''}.`;
    // Atualiza flag global também
    cadastroCompleto = r.cadastroCompleto;
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
    const r = await fetchAuth(API + '/api/candidato/candidaturas');
    // fetchAuth já desloga se 401
    const data = await r.json();
    const lista = data.candidaturas || [];

    if (lista.length === 0) {
      listaEl.innerHTML = `
        <div class="empty">
          <div class="empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></div>
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
      // etapa_atual do banco = 0-indexed da PRÓXIMA etapa a fazer.
      // etapaAtualBanco: índice 0-based para acessar c.etapas
      // etapaAtual: 1-based para exibir no texto "Etapa X de N"
      const etapaAtualBanco = Number(c.etapa_atual || 0);
      const etapaAtual = etapaAtualBanco + 1;
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
        if (i < etapaAtualBanco) {
          cls = 'concluida';
          bola = '✓';
        } else if (i === etapaAtualBanco) {
          if (isReprovado) { cls = 'reprovada'; bola = '✕'; }
          else if (isContratado) { cls = 'concluida'; bola = '✓'; }
          else { cls = 'andamento'; bola = '…'; }
        }
        const tooltip = descricao ? `${nome} — ${descricao}` : nome;
        return `<div class="cand-etapa ${cls}" title="${escapeHtml(tooltip)}">
          <div class="cand-etapa-bola">${bola}</div>
          <div class="cand-etapa-label">${escapeHtml(nome)}</div>
        </div>`;
      }).join('');
      // --- Barra de progresso (% concluído) ---
      // etapaAtualBanco = índice 0-based da etapa em andamento (0 = Inscrição, acabou de se candidatar)
      // Concluídas = etapaAtualBanco (etapas 0..etapaAtualBanco-1 já passaram)
      const etapasConcluidas = Math.min(etapaAtualBanco, totalEtapas);
      const pct = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
      // --- Descrição da etapa atual (destaque) ---
      const etapaAtualObj = c.etapas[etapaAtualBanco];
      const etapaAtualFmt = etapaObj(etapaAtualObj);
      const etapaNome = (() => {
        if (isContratado) return 'Contratação concluída';
        if (isReprovado) return 'Processo encerrado';
        if (!etapaAtualObj) return 'Inscrição recebida';
        return `Etapa ${etapaAtual} de ${totalEtapas} — ${etapaAtualFmt.nome}`;
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
        ? 'linear-gradient(90deg, var(--vinho) 0%, var(--vinho-claro) 100%)'
        : isReprovado
          ? 'var(--vermelho)'
          : 'linear-gradient(90deg, var(--vinho) 0%, var(--vinho-claro) 100%)';
      const localTxt = c.cidade ? `${c.cidade}${c.estado ? ' / ' + c.estado : ''}` : '';
      return `
        <div class="cand-card${cardExtras}" onclick="location.href='/candidato/inscricao.html?vaga=${c.vaga_id}'" title="Acompanhar processo seletivo">
          <div class="cand-card-top">
            <div class="cand-card-info">
              <h4>${c.titulo || 'Vaga'}</h4>
              <div class="cand-card-meta">
                <span>Empresa: ${c.empresa || 'Empresa'}</span>
                ${localTxt ? `<span class="sep">•</span><span>Local: ${localTxt}</span>` : ''}
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
            <span>Inscrito em ${formatarData(c.criada_em)}</span>
            <span class="ver-mais">Acompanhar processo →</span>
          </div>
          ${(['cancelado','rejeitado','contratado'].includes(c.status)) ? '' : `
            <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #e0e0e0;text-align:center">
              <button class="btn-desistir" onclick="event.stopPropagation();desistirVaga(${c.id}, '${(c.titulo || '').replace(/'/g, '&#39;')}')" style="background:#FEF2F2;border:1px solid #FCA5A5;color:#991B1B;padding:8px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">
                Desistir da vaga
              </button>
            </div>
          `}
        </div>
      `;
    }).join('');
  } catch (e) {
    listaEl.innerHTML = '<div class="empty">Erro ao carregar candidaturas.</div>';
  }
}

// Candidato desiste da vaga (qualquer momento, exceto cancelado/rejeitado/contratado)
async function desistirVaga(candidaturaId, tituloVaga) {
  if (!confirm('Tem certeza que deseja desistir da vaga "' + tituloVaga + '"?\n\nEssa acao nao pode ser desfeita.')) return;
  const motivo = prompt('Quer nos contar o motivo? (opcional)') || '';
  try {
    const r = await fetchAuth(API + '/api/candidatura/' + candidaturaId + '/desistir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    });
    const data = await r.json();
    if (!r.ok) { showCandidateFeedback(data.erro || 'Não foi possível desistir da vaga.'); return; }
    showCandidateFeedback('Você desistiu da vaga.', 'success');
    carregarMinhasCandidaturas();
  } catch (e) {
    showCandidateFeedback('Não foi possível concluir agora.');
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
    const r = await fetchAuth(API + '/api/candidato/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (r.ok) {
      cadastroCompleto = true;
      localStorage.setItem('candidato_nome', payload.nome);
      if (btn) { btn.textContent = 'Salvo'; btn.style.background = 'var(--vinho)'; }
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
      showCandidateFeedback(data.erro || 'Não foi possível salvar seu perfil.');
      if (btn) { btn.disabled = false; btn.textContent = btn._oldText || 'Salvar perfil'; }
    }
  } catch (e) {
    showCandidateFeedback('Não foi possível salvar seu perfil agora.');
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
    if (inicial) { inicial.style.display = ''; inicial.textContent = ini || '?'; }
    if (btnRemover) btnRemover.style.display = 'none';
  }
}

function perfilFotoEscolher(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
    showCandidateFeedback('Formato inválido. Use JPG, PNG ou WebP.');
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showCandidateFeedback('Imagem muito grande. Máximo 5 MB.');
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
      const r = await fetchAuth(API + '/api/candidato/foto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      showCandidateFeedback('Não foi possível enviar a foto agora.');
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
}

async function perfilFotoRemover() {
  if (!confirm('Remover sua foto de perfil?')) return;
  try {
    const r = await fetchAuth(API + '/api/candidato/foto', { method: 'DELETE' });
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
    showCandidateFeedback('Não foi possível remover a foto agora.');
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
  if (!atual || !nova || !conf) { showCandidateFeedback('Preencha todos os campos.'); return; }
  if (nova.length < 8) { showCandidateFeedback('A nova senha deve ter pelo menos 8 caracteres.'); return; }
  if (nova !== conf) { showCandidateFeedback('A confirmação não confere com a nova senha.'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Atualizando...'; }
  try {
    const r = await fetchAuth(API + '/api/candidato/trocar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual: atual, novaSenha: nova })
    });
    const data = await r.json();
    if (r.ok) {
      if (btn) { btn.textContent = '✓ Senha atualizada!'; btn.style.background = 'var(--verde)'; }
      setTimeout(() => { if (btn) { btn.textContent = 'Atualizar senha'; btn.style.background = ''; btn.disabled = false; } document.getElementById('senha-atual').value = ''; document.getElementById('senha-nova').value = ''; document.getElementById('senha-nova-conf').value = ''; }, 800);
    } else {
      showCandidateFeedback(data.erro || 'Não foi possível atualizar sua senha.');
      if (btn) { btn.disabled = false; btn.textContent = 'Atualizar senha'; }
    }
  } catch (e) {
    showCandidateFeedback('Não foi possível atualizar sua senha agora.');
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
  // ETAPA 2: usa helper (authLogout) se disponível — chama /api/auth/logout + limpa tokens
  if (typeof window.authLogout === 'function') {
    window.authLogout();
    return; // authLogout já faz reload
  }
  // Fallback (se helper não carregou): revoga refresh token no backend (best-effort)
  const refresh = localStorage.getItem('candidato_refresh');
  if (refresh) {
    fetch(API + '/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh })
    }).catch(() => {}); // ignora erro de rede
  }
  localStorage.removeItem('candidato_token');
  localStorage.removeItem('candidato_refresh');
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
    location.href = '/candidato/index.html';
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
window.wizardPreencherManual = wizardPreencherManual;
window.wizardImportarCurriculo = wizardImportarCurriculo;
window.wizardAddExperiencia = wizardAddExperiencia;
window.wizardRemoverExp = wizardRemoverExp;
window.wizardFinalizar = wizardFinalizar;
window.aplicarPrimeiroEmprego = aplicarPrimeiroEmprego;

// Expõe estado pro drawer/UI
Object.defineProperty(window, 'tokenCandidato', { get: () => tokenCandidato });
Object.defineProperty(window, 'emailLogado', { get: () => emailLogado });
Object.defineProperty(window, 'cadastroCompleto', { get: () => cadastroCompleto });

// FASE 11 — Favoritos, Match e Tags (candidato)
let _vagaFavoritaId = null;
let _isFavorito = false;

function renderTagsVaga(tags) {
  const blocoTags = document.getElementById('bloco-tags');
  const cont = document.getElementById('tags-container');
  if (!blocoTags || !cont) return;
  if (!Array.isArray(tags) || tags.length === 0) { blocoTags.style.display = 'none'; return; }
  blocoTags.style.display = '';
  cont.innerHTML = tags.map(t =>
    `<span style="background:#f3e8ff;color:#722F37;border:1px solid #d9b8f0;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;">${escapeHtml(String(t))}</span>`
  ).join('');
}

async function carregarFavoritoStatus(vagaId) {
  _vagaFavoritaId = vagaId;
  const btn = document.getElementById('btn-favoritar');
  if (!btn || !tokenCandidato) return;
  try {
    const r = await fetch(API + '/api/candidato/favoritos', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    const d = await r.json();
    const favs = d.favoritos || [];
    _isFavorito = favs.some(f => f.vaga_id === vagaId || f.id === vagaId);
    atualizarBtnFavoritar();
  } catch (e) {}
}

function atualizarBtnFavoritar() {
  const btn = document.getElementById('btn-favoritar');
  if (!btn) return;
  if (_isFavorito) {
    btn.innerHTML = '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg> Favoritado';
    btn.style.background = '#fffafb';
    btn.style.borderColor = '#c99eaa';
    btn.style.color = '#5f1527';
  } else {
    btn.innerHTML = '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg> Favoritar';
    btn.style.background = '#fff';
    btn.style.borderColor = '#ddd';
    btn.style.color = '#555';
  }
}

async function toggleFavoritar() {
  if (!tokenCandidato || !_vagaFavoritaId) { abrirModal('login'); return; }
  const method = _isFavorito ? 'DELETE' : 'POST';
  try {
    const r = await fetch(API + '/api/candidato/favoritos/' + _vagaFavoritaId, {
      method,
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (r.ok) {
      _isFavorito = !_isFavorito;
      atualizarBtnFavoritar();
      // Analytics: favoritar/desfavoritar
      if (window.vagiasTrack) window.vagiasTrack(_isFavorito ? 'vaga_favoritada' : 'vaga_desfavoritada', { vaga_id: _vagaFavoritaId });
    }
  } catch (e) {}
}

async function carregarMatchCandidato(vagaId) {
  const bloco = document.getElementById('bloco-match');
  const pct = document.getElementById('match-pct');
  const det = document.getElementById('match-detalhes');
  if (!bloco || !tokenCandidato) return;
  try {
    const r = await fetch(API + '/api/candidato/vagas/' + vagaId + '/match', {
      headers: { 'Authorization': 'Bearer ' + tokenCandidato }
    });
    if (!r.ok) { bloco.style.display = 'none'; return; }
    const d = await r.json();
    const score = d.score || 0;
    bloco.style.display = '';
    if (pct) pct.textContent = score + '%';
    if (det && d.detalhes) {
      const items = d.detalhes.filter(x => x.pontos > 0);
      det.innerHTML = items.length
        ? items.map(x => `<span>+${escapeHtml(x.criterio)}: ${x.pontos}pts</span>`).join(' &nbsp;|&nbsp; ')
        : d.perfil_completo
          ? '<span style="color:#777">Nenhum critério compatível encontrado para esta vaga.</span>'
          : `<span style="color:#999">Perfil incompleto para calcular${Array.isArray(d.campos_faltantes) && d.campos_faltantes.length ? ` — falta: ${escapeHtml(d.campos_faltantes.join(', '))}` : ''}</span>`;
    }
    const cor = score >= 70 ? 'var(--vinho)' : score >= 40 ? 'var(--vinho-claro)' : 'var(--vermelho)';
    bloco.style.borderLeftColor = cor;
    if (pct) pct.style.color = cor;
  } catch (e) { if (bloco) bloco.style.display = 'none'; }
}

async function compartilharVagaSelecionada() {
  if (!vagaSelecionada) return;
  if (window.compartilharVaga) return window.compartilharVaga(vagaSelecionada);
}
window.compartilharVagaSelecionada = compartilharVagaSelecionada;
window.toggleFavoritar = toggleFavoritar;
