// banco-talentos.js — Base de Talentos
const API = 'https://recrutamento-api-novo.onrender.com';
const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('recrutador_token') || localStorage.getItem('token') || '';

let talentosCache = [];

const STATUS_LABELS = {
  em_analise: 'Em análise',
  em_andamento: 'Em andamento',
  aprovado: 'Aprovado',
  contratado: 'Contratado',
  rejeitado: 'Rejeitado',
  reprovado: 'Reprovado',
  em_processo: 'Em processo'
};

const ETAPAS_LABELS = ['Inscrição', 'Triagem', 'RH', 'Gestor', 'Proposta', 'Coleta Docs', 'Contratação'];

async function carregarTalentos() {
  const tb = document.getElementById('talentos-tbody');
  const badge = document.getElementById('badge-total');
  try {
    const r = await fetch(API + '/api/admin/candidatos', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('Falha ao carregar');
    const data = await r.json();
    talentosCache = data.candidatos || [];

    // Popular select de áreas
    const areasSet = new Set();
    talentosCache.forEach(c => {
      const areas = c.areas_interesse;
      if (Array.isArray(areas)) areas.forEach(a => areasSet.add(a));
      else if (typeof areas === 'string') {
        try { JSON.parse(areas).forEach(a => areasSet.add(a)); } catch {}
      }
    });
    const selArea = document.getElementById('filtro-area');
    selArea.innerHTML = '<option value="">Todas as áreas</option>' +
      Array.from(areasSet).sort().map(a => `<option>${a}</option>`).join('');

    // Sidebar user info
    if (document.getElementById('aside-user-nome')) {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}');
      document.getElementById('aside-user-nome').textContent = u.nome || 'Admin';
      document.getElementById('aside-user-empresa').textContent = u.empresa || u.role || 'Admin';
      const inicial = (u.nome || 'A').trim().split(' ')[0].charAt(0).toUpperCase();
      document.getElementById('aside-user-avatar').textContent = inicial;
    }

    badge.textContent = `${talentosCache.length} candidato${talentosCache.length !== 1 ? 's' : ''}`;
    renderTalentos();
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="5" class="empty">Erro ao carregar: ${e.message}</td></tr>`;
    badge.textContent = '— erro';
  }
}

function renderTalentos() {
  const tb = document.getElementById('talentos-tbody');
  const busca = document.getElementById('busca').value.toLowerCase().trim();
  const area = document.getElementById('filtro-area').value;

  let lista = talentosCache.slice();
  if (busca) {
    lista = lista.filter(c =>
      (c.nome || '').toLowerCase().includes(busca) ||
      (c.email || '').toLowerCase().includes(busca) ||
      (c.cpf || '').toLowerCase().includes(busca)
    );
  }
  if (area) {
    lista = lista.filter(c => {
      const a = c.areas_interesse;
      if (Array.isArray(a)) return a.includes(area);
      if (typeof a === 'string') { try { return JSON.parse(a).includes(area); } catch { return false; } }
      return false;
    });
  }

  if (lista.length === 0) {
    tb.innerHTML = `<tr><td colspan="5" class="empty">Nenhum candidato encontrado.</td></tr>`;
    return;
  }

  tb.innerHTML = lista.map(c => {
    const status = STATUS_LABELS[c.ultimo_status] || c.ultimo_status || 'Sem candidatura';
    const statusClass = c.ultimo_status || 'empty';
    const etapa = c.ultima_etapa != null && c.ultima_etapa != undefined ? ETAPAS_LABELS[c.ultima_etapa] || `Etapa ${c.ultima_etapa}` : null;
    const vagaTit = c.ultima_vaga_titulo || '';
    const criadoEm = c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—';
    const areas = (() => {
      const a = c.areas_interesse;
      if (Array.isArray(a)) return a;
      if (typeof a === 'string') { try { return JSON.parse(a); } catch { return []; } }
      return [];
    })();
    return `<tr>
      <td>
        <div class="talent-nome">${escapeHtml(c.nome)}</div>
        <div class="talent-email">${escapeHtml(c.email || '')}</div>
        <div class="talent-areas">${areas.slice(0, 3).map(a => `<span class="talent-area-tag">${escapeHtml(a)}</span>`).join('')}${areas.length > 3 ? `<span class="talent-area-tag">+${areas.length - 3}</span>` : ''}</div>
      </td>
      <td>${escapeHtml((c.cidade || '—') + (c.estado ? '/' + c.estado : ''))}</td>
      <td>
        ${c.ultimo_status ? `<span class="status status-${statusClass}">${status}</span>` : '<span style="color:#aaa;font-size:12px;">Sem candidatura</span>'}
        ${vagaTit ? `<div style="font-size:11px;color:#888;margin-top:3px;">📌 ${escapeHtml(vagaTit)}</div>` : ''}
        ${etapa && c.ultima_etapa > 0 ? `<div class="etapa-tag">${escapeHtml(etapa)}</div>` : ''}
      </td>
      <td>${criadoEm}</td>
      <td>
        ${c.ultima_candidatura_id ? `<a href="analisar.html?id=${c.ultima_candidatura_id}" class="btn" style="font-size:12px;padding:6px 12px;">👁 Ver</a>` : ''}
        ${!c.ultima_candidatura_id ? `<span style="color:#aaa;font-size:12px;">—</span>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

carregarTalentos();
