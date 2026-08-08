// ============================================
// ADMIN — Painel de Recrutamento
// Conecta com backend: https://recrutamento-api-novo.onrender.com
// ============================================

const API = 'https://recrutamento-api-novo.onrender.com';
let token = null;
let vagaEmEdicao = null;
function empresaRoleAtual(){try{return window.authRBAC?.currentRole?.() || JSON.parse(localStorage.getItem('empresa_usuario')||'{}').role || (token ? JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role : null);}catch(_){return null;}}
function empresaEhAdmin(){return empresaRoleAtual()==='admin_empresa';}

window.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.authInit === 'function') {
    try { await window.authInit(); } catch (_) {}
  }
  const saved = localStorage.getItem('empresa_token');
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
    const r = await fetch(API + '/api/auth/login-empresa', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const data = await r.json();
    if (r.ok && data.requer_2fa) {
      window.location.href = 'login.html?next=index.html';
      return;
    }
    if (r.ok && data.token) {
      token = data.token;
      localStorage.setItem('empresa_token', token);
      mostrarApp();
    } else {
      document.getElementById('alert-login').innerHTML = `<div class="alert alert-erro">${data.erro || 'Erro ao entrar'}</div>`;
    }
  } catch (e) {
    document.getElementById('alert-login').innerHTML = `<div class="alert alert-erro">Erro de conexão</div>`;
  }
}

function sair() {
  localStorage.removeItem('empresa_token');
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
  const requested = new URLSearchParams(window.location.search).get('page');
  const allowed = ['dashboard', 'vagas', 'candidatos', 'candidaturas', 'propostas', 'contratacoes', 'talentos', 'relatorios', 'agenda', 'equipe', 'configuracoes', 'analisar'];
  irPara(allowed.includes(requested) ? requested : 'dashboard');
  carregarContadorNotificacoes();
}

async function carregarContadorNotificacoes() {
  try {
    const r = await fetch(API + '/api/empresa/notificacoes?limite=100', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) return;
    const data = await r.json();
    document.querySelectorAll('.notification-badge').forEach(el => { el.textContent = String(data.nao_lidas || 0); el.hidden = !(data.nao_lidas > 0); });
  } catch (_) { /* feed opcional: não bloqueia o portal */ }
}

// Feed real de notificacoes do tenant. Conteudo e URLs derivados sao validados/escapados.
function notificacaoReferenciaUrl(n) {
  const id=Number(n?.referencia_id); if(!Number.isInteger(id)||id<=0)return '';
  if(n.referencia_tipo==='candidatura')return 'index.html?page=analisar&candidatura_id='+encodeURIComponent(String(id));
  if(n.referencia_tipo==='vaga')return 'index.html?page=vagas';
  return '';
}
function fecharNotificacoes(){document.getElementById('empresa-notificacoes-popover')?.remove();}
async function abrirNotificacoes(){
  fecharNotificacoes();
  const wrap=document.createElement('div'); wrap.id='empresa-notificacoes-popover'; wrap.setAttribute('role','dialog'); wrap.setAttribute('aria-label','Notificacoes');
  wrap.style.cssText='position:fixed;z-index:3000;top:58px;right:18px;width:min(420px,calc(100vw - 24px));max-height:min(620px,calc(100vh - 76px));overflow:auto;padding:14px;border:1px solid #E8E1E5;border-radius:12px;background:#fff;box-shadow:0 14px 40px rgba(42,19,29,.18);font-size:12px;color:#44363F;';
  wrap.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px"><strong>Notificacoes</strong><span class="notif-count-label" style="color:#958990;font-size:10px">Carregando...</span></div><div class="notif-list"><div style="padding:18px;text-align:center;color:#958990">Carregando notificacoes...</div></div>';
  document.body.appendChild(wrap);
  try{
    const r=await fetch(API+'/api/empresa/notificacoes?limite=50',{headers:{'Authorization':'Bearer '+token}}),d=await r.json();
    if(!r.ok)throw new Error(d.erro||'Nao foi possivel carregar notificacoes');
    const rows=Array.isArray(d.notificacoes)?d.notificacoes:[], count=Number(d.nao_lidas||0);
    wrap.querySelector('.notif-count-label').textContent=count?`${count} nao lida${count===1?'':'s'}`:'Tudo lido';
    const list=wrap.querySelector('.notif-list');
    if(!rows.length){list.innerHTML='<div style="padding:18px;text-align:center;color:#958990">Nenhuma notificacao disponivel.</div>';}
    else list.innerHTML=rows.map(n=>{const href=notificacaoReferenciaUrl(n),id=Number(n.id),open=href?`<a href="${escapeHtml(href)}" data-notification-id="${id}" style="display:block;color:inherit;text-decoration:none">`:`<div data-notification-id="${id}">`;return `${open}<article style="padding:10px 4px;border-bottom:1px solid #F0EAED;${n.lida?'':'background:#FEF7F9;font-weight:600;'}"><div style="display:flex;justify-content:space-between;gap:8px"><strong>${escapeHtml(n.titulo||'Notificacao')}</strong><small style="color:#958990;font-weight:400;white-space:nowrap">${escapeHtml(formatarData(n.criada_em))}</small></div><p style="margin:4px 0 0;color:#756970;font-weight:400;line-height:1.4">${escapeHtml(n.mensagem||'')}</p></article>${href?'</a>':'</div>'}`;}).join('');
    const footer=document.createElement('div'); footer.style.cssText='display:flex;justify-content:flex-end;gap:8px;padding-top:10px;'; footer.innerHTML='<button type="button" data-notif-all style="border:1px solid #DCCBD2;border-radius:6px;padding:6px 8px;background:#fff;color:#722F37;font:inherit;font-size:10px;cursor:pointer">Marcar todas como lidas</button><button type="button" data-notif-close style="border:0;background:transparent;color:#958990;font:inherit;font-size:10px;cursor:pointer">Fechar</button>'; wrap.appendChild(footer);
  }catch(e){wrap.querySelector('.notif-list').innerHTML=`<div style="padding:18px;text-align:center;color:#B3265B">${escapeHtml(e.message||'Nao foi possivel carregar notificacoes')}</div>`;}
}
document.addEventListener('click',async e=>{
  const bell=e.target.closest('.dashboard-icon-button[aria-label="Notificações"]');
  if(bell){e.preventDefault();e.stopPropagation();await abrirNotificacoes();return;}
  const pop=document.getElementById('empresa-notificacoes-popover'); if(!pop)return;
  if(e.target.closest('[data-notif-close]')){fecharNotificacoes();return;}
  if(e.target.closest('[data-notif-all]')){try{await fetch(API+'/api/empresa/notificacoes/lidas',{method:'POST',headers:{'Authorization':'Bearer '+token}});await carregarContadorNotificacoes();await abrirNotificacoes();}catch(_){}return;}
  const target=e.target.closest('[data-notification-id]');
  if(target){const id=Number(target.dataset.notificationId);if(Number.isInteger(id)&&id>0)fetch(API+'/api/empresa/notificacoes/'+id+'/lida',{method:'PATCH',headers:{'Authorization':'Bearer '+token}}).finally(carregarContadorNotificacoes);}
  else if(!pop.contains(e.target))fecharNotificacoes();
});

// === Sidebar: avatar + nome do admin logado ===
function carregarUsuarioSidebar() {
  try {
    const t = token || localStorage.getItem('empresa_token');
    if (!t) return;
    const parts = t.split('.');
    if (parts.length < 2) return;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const nome = payload.nome || 'Admin';
    const iniciais = nome.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    const elAvatar = document.getElementById('aside-user-avatar');
    const elNome = document.getElementById('aside-user-nome');
    const elEmpresa = document.getElementById('aside-user-empresa');
    const elCompanyName = document.getElementById('aside-company-name');
    const elCompanyPlan = document.getElementById('aside-company-plan');
    if (elAvatar) elAvatar.textContent = iniciais || 'A';
    if (elNome) elNome.textContent = nome;
    if (elEmpresa) elEmpresa.textContent = payload.email || 'Admin da empresa';
    if (elCompanyName) elCompanyName.textContent = payload.empresa_nome || payload.empresa || 'Minha empresa';
    if (elCompanyPlan) elCompanyPlan.textContent = payload.plano_nome || 'Plano da empresa';
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
  if (page === 'propostas') carregarPropostas();
  if (page === 'contratacoes') carregarContratacoes();
  if (page === 'talentos') carregarBancoTalentos();
  if (page === 'relatorios') carregarRelatorios();
  if (page === 'configuracoes') carregarConfiguracoes();
  if (page === 'equipe') {
    carregarEquipe();
  }
  if (page === 'agenda') {
    carregarAgenda('hoje');
  }
}

// ===== EQUIPE =====
// Gestão consolidada implementada no módulo EQUIPE abaixo.

// ===== AGENDA =====
const agendaState = { view:'semana', currentDate:new Date(), events:[], selectedId:null, listPeriod:'hoje', search:'', status:'', etapa:'' };
let agendaDetailsCache = {};
const agendaHours = Array.from({length:11},(_,i)=>i+8);
function agendaDateKey(d){const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;}
function agendaSameDay(a,b){return agendaDateKey(a)===agendaDateKey(b);}
function agendaTime(d){return new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}
function agendaDateLong(d){return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});}
function agendaMonthShort(d){return new Date(d).toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase();}
function agendaEtapaNome(n){return ({3:'RH',4:'Gestor',5:'Proposta',6:'Coleta Docs',7:'Contratação'}[Number(n)]||'Entrevista');}
function agendaStatusText(s){return ({agendada:'Aguardando',confirmada:'Confirmada',realizada:'Concluída',cancelada:'Cancelada',faltou:'Não compareceu'}[s]||s||'Aguardando');}
function agendaStatusClass(s){return ({agendada:'agendada',confirmada:'confirmada',realizada:'realizada',cancelada:'cancelada',faltou:'faltou'}[s]||'agendada');}
function agendaMode(e){return e.local && !/online|meet|zoom|teams/i.test(e.local)?'Presencial':'Online';}
function agendaEventClass(e){if(agendaMode(e)==='Presencial')return 'presencial';if(Number(e.etapa)===3)return 'rh';if(Number(e.etapa)===4)return 'gestor';if(Number(e.etapa)>=5)return 'final';return 'tech';}
function agendaInitials(name){return String(name||'C').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function agendaFilteredEvents(){const q=agendaState.search.trim().toLocaleLowerCase('pt-BR');return agendaState.events.filter(e=>{const hay=[e.candidato_nome,e.vaga_titulo,e.email,e.local].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');return(!q||hay.includes(q))&&(!agendaState.status||e.status===agendaState.status)&&(!agendaState.etapa||String(e.etapa)===String(agendaState.etapa));});}
function agendaUpcomingForList(){const now=new Date();let rows=agendaFilteredEvents();if(agendaState.listPeriod==='hoje')rows=rows.filter(e=>agendaSameDay(e.data_hora,now));if(agendaState.listPeriod==='proximas')rows=rows.filter(e=>new Date(e.data_hora)>=now&&e.status!=='cancelada');return rows.sort((a,b)=>new Date(a.data_hora)-new Date(b.data_hora)).slice(0,10);}
async function carregarAgenda(periodo){if(periodo&&['hoje','proximas','passadas','todas'].includes(periodo))agendaState.listPeriod=periodo;const cal=document.getElementById('agenda-calendar');if(cal)cal.innerHTML='<div class="agenda-loading"><span class="spinner"></span> Carregando calendário...</div>';try{const r=await fetch(API+'/api/empresa/entrevistas?periodo=todas',{headers:{'Authorization':'Bearer '+token}});const data=await r.json();if(!r.ok)throw new Error(data.erro||'Erro ao carregar agenda');agendaState.events=data.entrevistas||[];if(agendaState.selectedId&&!agendaState.events.some(e=>Number(e.id)===Number(agendaState.selectedId)))agendaState.selectedId=null;renderAgenda();}catch(e){if(cal)cal.innerHTML=`<div class="agenda-empty-small">${escapeHtml(e.message||'Erro ao carregar agenda')}</div>`;}}
function renderAgenda(){renderAgendaSummary();renderAgendaUpcoming();renderAgendaCalendar();renderAgendaAttention();if(agendaState.selectedId)loadAgendaDetail(agendaState.selectedId);else renderAgendaDetailEmpty();}
function renderAgendaSummary(){const all=agendaState.events,now=new Date(),today=all.filter(e=>agendaSameDay(e.data_hora,now)),next=all.filter(e=>new Date(e.data_hora)>=now&&!['cancelada','realizada','faltou'].includes(e.status)).sort((a,b)=>new Date(a.data_hora)-new Date(b.data_hora))[0];const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};set('agenda-kpi-hoje',today.length);set('agenda-kpi-confirmadas',today.filter(e=>e.status==='confirmada').length);set('agenda-kpi-pendentes',today.filter(e=>e.status==='agendada').length);set('agenda-kpi-concluidas',today.filter(e=>e.status==='realizada').length);set('agenda-kpi-proxima-hora',next?agendaTime(next.data_hora):'—');set('agenda-kpi-proxima-nome',next?(next.candidato_nome||'Candidato'):'Nenhuma entrevista próxima');set('agenda-kpi-proxima-tempo',next?agendaTempoAte(next.data_hora):'—');const d=document.getElementById('agenda-kpi-confirmadas-delta');if(d)d.textContent='Dados da agenda da empresa';}
function agendaTempoAte(date){const diff=new Date(date)-new Date();if(diff<=0)return'agora';const m=Math.floor(diff/60000);if(m<60)return`em ${m} min`;const h=Math.floor(m/60);return`em ${h}h${m%60?String(m%60).padStart(2,'0'):''}`;}
function renderAgendaUpcoming(){const box=document.getElementById('agenda-upcoming-list');if(!box)return;const rows=agendaUpcomingForList();if(!rows.length){box.innerHTML='<div class="agenda-empty-small">Nenhuma entrevista neste período.</div>';return;}box.innerHTML=rows.map(e=>`<div class="agenda-upcoming-item ${Number(e.id)===Number(agendaState.selectedId)?'selecionado':''}" onclick="selecionarEntrevista(${e.id})"><span class="agenda-time">${agendaTime(e.data_hora)}</span><span class="agenda-upcoming-avatar">${escapeHtml(agendaInitials(e.candidato_nome))}</span><span class="agenda-upcoming-copy"><strong>${escapeHtml(e.candidato_nome||'Candidato')}</strong><small>${escapeHtml(e.vaga_titulo||'Vaga')} · ${escapeHtml(agendaEtapaNome(e.etapa))}</small><small class="agenda-mode">${agendaMode(e)} · ${agendaStatusText(e.status)}</small></span><span class="agenda-status-dot ${agendaStatusClass(e.status)}">${agendaStatusText(e.status)}</span></div>`).join('');}
function agendaWeekStart(date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return d;}
function agendaWeekDays(date){const start=agendaWeekStart(date);return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});}
function agendaPeriodLabel(){const d=agendaState.currentDate;if(agendaState.view==='dia')return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});if(agendaState.view==='mes')return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});const days=agendaWeekDays(d);return `${String(days[0].getDate()).padStart(2,'0')} — ${String(days[6].getDate()).padStart(2,'0')} de ${days[6].toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`;}
function renderAgendaCalendar(){const box=document.getElementById('agenda-calendar');if(!box)return;const label=document.getElementById('agenda-periodo-label');if(label)label.textContent=agendaPeriodLabel();if(agendaState.view==='mes'){box.className='agenda-calendar';box.innerHTML=renderAgendaMonth();return;}const days=agendaState.view==='dia'?[new Date(agendaState.currentDate)]:agendaWeekDays(agendaState.currentDate);box.className='agenda-calendar'+(agendaState.view==='dia'?' day-mode':'');box.innerHTML=renderAgendaTimeGrid(days);updateAgendaCurrentLine();}
function renderAgendaTimeGrid(days){const heads=days.map(d=>`<div class="agenda-day-head ${agendaSameDay(d,new Date())?'today':''}"><small>${d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</small><strong>${String(d.getDate()).padStart(2,'0')}</strong></div>`).join('');const cols=days.map(d=>{const ev=agendaFilteredEvents().filter(e=>agendaSameDay(e.data_hora,d));return renderAgendaDayColumn(d,ev);}).join('');const times=agendaHours.map(h=>`<div class="agenda-time-label">${String(h).padStart(2,'0')}:00</div>`).join('');return `<div class="agenda-week-grid ${days.length===1?'one-day':''}"><div class="agenda-time-head"></div>${heads}<div class="agenda-time-col">${times}</div>${cols}</div>`;}
function renderAgendaDayColumn(day,events){const overlaps={};events.forEach((e,i)=>{const a=new Date(e.data_hora).getTime(),b=a+Number(e.duracao_minutos||60)*60000;const hit=events.filter(x=>{const c=new Date(x.data_hora).getTime(),d=c+Number(x.duracao_minutos||60)*60000;return x.id!==e.id&&a<d&&b>c;});overlaps[e.id]=hit.length?hit.length+1:1;});const items=events.map((e,i)=>{const d=new Date(e.data_hora),mins=(d.getHours()-8)*60+d.getMinutes(),top=Math.max(0,mins/60*58),height=Math.max(28,(Number(e.duracao_minutos||60)/60*58)-3),conf=overlaps[e.id]>1?' conflict':'';const left=overlaps[e.id]>1?(i%2)*50:0;const width=overlaps[e.id]>1?48:100;return `<div class="agenda-calendar-event ${agendaEventClass(e)}${conf} ${Number(e.id)===Number(agendaState.selectedId)?'selecionado':''}" style="top:${top}px;height:${height}px;left:calc(${left}% + 3px);width:calc(${width}% - 6px)" onclick="selecionarEntrevista(${e.id})"><strong>${agendaTime(e.data_hora)} · ${escapeHtml(e.candidato_nome||'Candidato')}</strong><small>${escapeHtml(e.vaga_titulo||'Vaga')}</small><small>${escapeHtml(agendaEtapaNome(e.etapa))} · ${agendaMode(e)}</small></div>`;}).join('');return `<div class="agenda-day-col" data-date="${agendaDateKey(day)}">${items}</div>`;}
function renderAgendaMonth(){const d=new Date(agendaState.currentDate);const first=new Date(d.getFullYear(),d.getMonth(),1),start=new Date(first);start.setDate(1-first.getDay());const cells=Array.from({length:42},(_,i)=>{const day=new Date(start);day.setDate(start.getDate()+i);const events=agendaFilteredEvents().filter(e=>agendaSameDay(e.data_hora,day));const firstEvents=events.slice(0,2).map(e=>`<div class="agenda-month-event" onclick="event.stopPropagation();selecionarEntrevista(${e.id})">${agendaTime(e.data_hora)} ${escapeHtml(e.candidato_nome||'Candidato')}</div>`).join('');return `<div class="agenda-month-cell ${day.getMonth()!==d.getMonth()?'outside':''} ${agendaSameDay(day,new Date())?'today':''}" onclick="agendaSelecionarDia('${agendaDateKey(day)}')"><span class="agenda-month-day">${day.getDate()}</span><div class="agenda-month-events">${firstEvents}</div>${events.length>2?`<div class="agenda-month-count">+${events.length-2} entrevistas</div>`:''}</div>`;}).join('');return `<div class="agenda-month-grid">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<div class="agenda-day-head"><small>${x}</small></div>`).join('')}${cells}</div>`;}
function updateAgendaCurrentLine(){const now=new Date();if(agendaState.view==='mes'||now.getHours()<8||now.getHours()>18)return;const col=document.querySelector(`.agenda-day-col[data-date="${agendaDateKey(now)}"]`);if(!col)return;const line=document.createElement('div');line.className='agenda-current-line';line.dataset.time=agendaTime(now);line.style.top=`${((now.getHours()-8)*60+now.getMinutes())/60*58}px`;col.appendChild(line);}
function agendaMoverPeriodo(delta){const d=new Date(agendaState.currentDate);if(agendaState.view==='dia')d.setDate(d.getDate()+delta);else if(agendaState.view==='mes')d.setMonth(d.getMonth()+delta);else d.setDate(d.getDate()+delta*7);agendaState.currentDate=d;renderAgendaCalendar();}
function agendaIrHoje(){agendaState.currentDate=new Date();renderAgenda();}
function agendaSelecionarDia(key){const [y,m,d]=key.split('-').map(Number);agendaState.currentDate=new Date(y,m-1,d);agendaState.view='dia';document.querySelectorAll('.agenda-view-tabs button').forEach(b=>b.classList.toggle('ativo',b.dataset.view==='dia'));renderAgenda();}
function selecionarEntrevista(id){agendaState.selectedId=id;renderAgendaUpcoming();renderAgendaCalendar();loadAgendaDetail(id);}
function renderAgendaAttention(){const box=document.getElementById('agenda-attention-list'),all=agendaState.events,now=new Date(),items=[];all.filter(e=>e.status==='agendada'&&new Date(e.data_hora)>=now).slice(0,2).forEach(e=>items.push(`<div class="agenda-attention-item"><svg class="dash-svg"><use href="#icon-bell"></use></svg><span><strong>${escapeHtml(e.candidato_nome||'Candidato')} aguarda confirmação</strong>${agendaTime(e.data_hora)} · ${escapeHtml(e.vaga_titulo||'Vaga')}</span></div>`));const conflicts=all.filter((e,i)=>all.some((x,j)=>i<j&&agendaSameDay(e.data_hora,x.data_hora)&&new Date(e.data_hora)<new Date(x.data_hora)+(Number(x.duracao_minutos||60)*60000)&&new Date(x.data_hora)<new Date(e.data_hora)+(Number(e.duracao_minutos||60)*60000)));if(conflicts.length)items.push('<div class="agenda-attention-item"><svg class="dash-svg"><use href="#icon-filter"></use></svg><span><strong>Conflito de agenda detectado</strong>Há entrevistas sobrepostas.</span></div>');if(box)box.innerHTML=items.length?items.join(''):'<div class="agenda-empty-small">Nenhuma atenção pendente.</div>';const count=document.getElementById('agenda-attention-count');if(count)count.textContent=items.length;}
function renderAgendaDetailEmpty(){const panel=document.getElementById('agenda-detail-panel');if(panel)panel.innerHTML='<div class="agenda-detail-empty"><svg class="dash-svg"><use href="#icon-calendar"></use></svg><strong>Entrevista selecionada</strong><span>Selecione um compromisso para ver os detalhes.</span></div>';}
async function loadAgendaDetail(id){const e=agendaState.events.find(x=>Number(x.id)===Number(id));const panel=document.getElementById('agenda-detail-panel');if(!e||!panel)return;panel.classList.add('aberto');panel.innerHTML='<div class="agenda-detail-empty"><span class="spinner"></span><span>Carregando detalhes...</span></div>';try{const headers={'Authorization':'Bearer '+token};let cand={},candidatura=null;const reqs=[];if(e.candidato_id)reqs.push(fetch(API+'/api/empresa/candidatos/'+e.candidato_id,{headers}));if(e.candidatura_id)reqs.push(fetch(API+'/api/empresa/candidatura/'+e.candidatura_id,{headers}));const rs=await Promise.all(reqs);if(rs[0]){const d=await rs[0].json();cand=d.candidato||d;}if(rs[1])candidatura=await rs[1].json();agendaDetailsCache[id]={cand,candidatura};renderAgendaDetail(e,cand,candidatura);}catch(_){renderAgendaDetail(e,{},null);}}
function renderAgendaDetail(e,c,candidatura){const stage=Number(candidatura?.etapa_atual||e.etapa||1),progress=Math.round(stage/7*100),steps=['Inscrição','Triagem','RH','Gestor','Proposta','Coleta Docs','Contratação'].map((name,i)=>{const n=i+1,cl=n<stage?'done':n===stage?'current':'';return `<div class="agenda-step ${cl}"><span class="agenda-step-dot">${n<stage?'✓':n}</span><span>${name}${n===stage?' — Atual':''}</span><small>${n<stage?'Concluída':n===stage?'Em andamento':'Pendente'}</small></div>`;}).join('');const link=e.link_reuniao?`<a class="agenda-link" href="${safeExternalUrl(e.link_reuniao)}" target="_blank" rel="noopener">Abrir entrevista ↗</a>`:'Link não informado';const note=e.observacoes?`<div class="agenda-note">${escapeHtml(e.observacoes)}</div>`:'<div class="agenda-note">Nenhuma nota registrada para esta entrevista.</div>';const panel=document.getElementById('agenda-detail-panel');panel.innerHTML=`<div class="agenda-detail-content"><div class="agenda-detail-head"><span class="agenda-detail-avatar">${escapeHtml(agendaInitials(c.nome||e.candidato_nome))}</span><div class="agenda-detail-head-copy"><h3>${escapeHtml(c.nome||e.candidato_nome||'Candidato')}</h3><p>${escapeHtml(e.vaga_titulo||'Vaga')} · ${escapeHtml(agendaEtapaNome(e.etapa))}</p><span class="agenda-detail-status">${agendaStatusText(e.status)}</span></div><button class="agenda-detail-close" type="button" aria-label="Fechar detalhes" onclick="fecharAgendaDetalhe()">×</button></div><div class="agenda-detail-actions"><button class="primary" type="button" ${e.link_reuniao?'onclick="window.open(\''+safeExternalUrl(e.link_reuniao)+'\',\'_blank\',\'noopener\')"':'disabled'}>${e.link_reuniao?'Entrar na entrevista':'Sem link'}</button><button type="button" onclick="reagendarEntrevista(${e.id})">Reagendar</button><button type="button" onclick="agendaMaisAcoes(${e.id})">Mais ações</button></div><section class="agenda-detail-section"><h4>Detalhes da entrevista</h4><div class="agenda-detail-info"><div class="agenda-info-row">${candidatoSvg('calendar')}<span><strong>Data e hora</strong>${agendaDateLong(e.data_hora)} às ${agendaTime(e.data_hora)}</span></div><div class="agenda-info-row">${candidatoSvg('arrow-up')}<span><strong>Duração</strong>${Number(e.duracao_minutos||60)} minutos</span></div><div class="agenda-info-row">${candidatoSvg('user')}<span><strong>Entrevistador</strong>Não informado no registro</span></div><div class="agenda-info-row">${candidatoSvg('file')}<span><strong>Tipo</strong>Entrevista com ${escapeHtml(agendaEtapaNome(e.etapa))}</span></div><div class="agenda-info-row">${candidatoSvg('calendar')}<span><strong>Formato</strong>${escapeHtml(agendaMode(e))}${e.local?` · ${escapeHtml(e.local)}`:''}</span></div><div class="agenda-info-row">${candidatoSvg('message')}<span><strong>Link / local</strong>${link}</span></div></div></section><section class="agenda-detail-section"><h4>Etapas do processo <span style="float:right">${stage} de 7</span></h4><div class="agenda-detail-progress"><span>Progresso</span><strong>${stage} de 7</strong></div><div class="agenda-detail-progress-bar"><i style="width:${progress}%"></i></div><div class="agenda-detail-steps">${steps}</div></section><section class="agenda-detail-section"><h4>Notas da entrevista</h4>${note}</section></div>`;}
function fecharAgendaDetalhe(){agendaState.selectedId=null;document.getElementById('agenda-detail-panel')?.classList.remove('aberto');renderAgendaUpcoming();renderAgendaCalendar();renderAgendaDetailEmpty();}
async function reagendarEntrevista(id){const e=agendaState.events.find(x=>Number(x.id)===Number(id));if(!e)return;const next=prompt('Nova data e hora (AAAA-MM-DD HH:MM):',new Date(new Date(e.data_hora).getTime()+86400000).toISOString().slice(0,16).replace('T',' '));if(!next)return;const duration=prompt('Duração em minutos:',String(e.duracao_minutos||60));if(!confirm(`Confirmar reagendamento para ${next}?`))return;try{const r=await fetch(API+'/api/empresa/entrevista/'+id,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({data_hora:next,duracao_minutos:Number(duration)||60})});if(!r.ok)throw new Error('Não foi possível reagendar');await carregarAgenda('todas');selecionarEntrevista(id);}catch(err){alert(err.message);}}
function agendaMaisAcoes(id){const e=agendaState.events.find(x=>Number(x.id)===Number(id));if(!e)return;const action=prompt('Digite uma ação: confirmar, concluir ou cancelar','confirmar');if(action==='confirmar')atualizarEntrevista(id,'confirmada');else if(action==='concluir')atualizarEntrevista(id,'realizada');else if(action==='cancelar'&&confirm('Cancelar esta entrevista?'))atualizarEntrevista(id,'cancelada');}
function limparFiltrosAgenda(){agendaState.search='';agendaState.status='';agendaState.etapa='';const s=document.getElementById('agenda-filtro-status'),e=document.getElementById('agenda-filtro-etapa'),q=document.getElementById('entrevistas-busca');if(s)s.value='';if(e)e.value='';if(q)q.value='';renderAgenda();}
function bindAgendaControls(){if(window.__agendaControlsBound)return;window.__agendaControlsBound=true;if(window.innerWidth<=700){agendaState.view='dia';document.querySelectorAll('.agenda-view-tabs button').forEach(b=>b.classList.toggle('ativo',b.dataset.view==='dia'));}document.getElementById('entrevistas-busca')?.addEventListener('input',e=>{agendaState.search=e.target.value;renderAgenda();});document.getElementById('agenda-lista-periodo')?.addEventListener('change',e=>{agendaState.listPeriod=e.target.value;renderAgendaUpcoming();});document.getElementById('agenda-filtro-status')?.addEventListener('change',e=>{agendaState.status=e.target.value;renderAgenda();});document.getElementById('agenda-filtro-etapa')?.addEventListener('change',e=>{agendaState.etapa=e.target.value;renderAgenda();});document.getElementById('entrevistas-filtros-btn')?.addEventListener('click',e=>{const p=document.getElementById('entrevistas-filtros-advanced');const open=p.hasAttribute('hidden');if(open)p.removeAttribute('hidden');else p.setAttribute('hidden','');e.currentTarget.setAttribute('aria-expanded',String(open));});document.querySelectorAll('.agenda-view-tabs button').forEach(b=>b.addEventListener('click',()=>{agendaState.view=b.dataset.view;document.querySelectorAll('.agenda-view-tabs button').forEach(x=>x.classList.toggle('ativo',x===b));renderAgendaCalendar();}));}
bindAgendaControls();

async function atualizarEntrevista(id, status) {
  const token = localStorage.getItem('empresa_token') || localStorage.getItem('token');
  try {
    const r = await fetch(API + '/api/empresa/entrevista/' + id, {
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

  const token = localStorage.getItem('empresa_token') || localStorage.getItem('token');
  fetch(API + '/api/empresa/entrevista', {
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
async function carregarDashboardBase() {
  try {
    const r = await fetch(API + '/api/empresa/dashboard', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    window.__empresaDashboardData = data;
    if (!r.ok) {
      console.error('[DASHBOARD]', data);
      const grid = document.getElementById('kpis-grid') || document.getElementById('stats-grid');
      if (grid) grid.innerHTML = `<div class="alert alert-erro">Erro ao carregar o dashboard: ${escapeHtml(data.erro || 'desconhecido')} <button type="button" class="btn btn-sec" onclick="carregarDashboardV2()">Tentar novamente</button></div>`;
      return;
    }
    // === Saudação dinâmica (bom dia / boa tarde / boa noite) ===
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const primeiroNome = (data.admin?.nome || 'Recrutador').split(' ')[0];
    document.getElementById('dash-greeting').textContent = `${saudacao}, ${primeiroNome}! 👋`;
    
    // === KPIs principais: somente dados retornados para o tenant autenticado ===
    const k = data.kpis || {};
    const vagasEmpresa = Array.isArray(data.vagas) ? data.vagas : [];
    const limite30 = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const abertasMais30 = vagasEmpresa.filter(v => v.status === 'publicada' && v.criada_em && new Date(v.criada_em).getTime() < limite30).length;
    const contratacoesAtual = Number(k.contratacoes || 0);
    const contratacoesAnterior = Number(data.kpis_deltas?.contratacoes?.anterior_30d || 0);
    const contratacoesDelta = contratacoesAnterior > 0 ? Math.round(((contratacoesAtual - contratacoesAnterior) / contratacoesAnterior) * 100) : null;
    const dashSvg = (name) => `<svg class="dash-svg" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
    const spark = {
      briefcase: 'M1 15 L10 11 L18 13 L27 7 L36 10 L45 5 L55 7', users: 'M1 16 L10 13 L18 15 L27 9 L36 11 L45 4 L55 6',
      file: 'M1 14 L10 15 L18 10 L27 12 L36 6 L45 9 L55 4', calendar: 'M1 16 L10 12 L18 14 L27 6 L36 9 L45 5 L55 7',
      check: 'M1 17 L10 14 L18 15 L27 8 L36 10 L45 3 L55 5', talent: 'M1 14 L10 16 L18 11 L27 13 L36 7 L45 9 L55 4'
    };
    const kpis = [
      { label: 'Vagas ativas', valor: Number(k.vagas_ativas || 0), delta: k.deltas?.vagas, deltaLabel: 'novas nos últimos 7 dias', icon: 'briefcase', cor: 'vinho', action:'active-vagas' },
      { label: 'Candidatos', valor: Number(k.total_candidatos || 0), delta: k.deltas?.candidatos, deltaLabel: 'novos nos últimos 7 dias', icon: 'users', cor: 'roxo', action:'candidatos' },
      { label: 'Processos ativos', valor: Number(k.processos_ativos || 0), delta: k.deltas?.processos, deltaLabel: 'novos nos últimos 7 dias', icon: 'file', cor: 'azul', action:'processos' },
      { label: 'Entrevistas agendadas', valor: Number(k.entrevistas_agendadas || 0), delta: k.deltas?.entrevistas, deltaLabel: 'nos próximos 7 dias', icon: 'calendar', cor: 'verde', action:'entrevistas' },
      { label: 'Contratações (30d)', valor: contratacoesAtual, delta: contratacoesDelta, deltaLabel: 'vs. 30 dias anteriores', icon: 'check', cor: 'laranja', action:'contratacoes' },
      { label: 'Abertas +30d', valor: abertasMais30, delta: null, deltaLabel: 'vagas publicadas', icon: 'talent', cor: 'roxo', action:'antigas' }
    ];
    document.getElementById('kpis-grid').innerHTML = kpis.map(metric => {
      let delta = '';
      if (metric.delta != null) {
        const direction = metric.delta >= 0 ? 'up' : 'down';
        const sign = metric.delta > 0 ? '+' : '';
        delta = `<span class="kpi-delta ${direction}">${sign}${metric.delta}% ${metric.deltaLabel}</span>`;
      } else if (metric.deltaLabel) delta = `<span class="kpi-delta flat">${metric.deltaLabel}</span>`;
      return `<button type="button" class="kpi-card kpi-${metric.cor} dash-kpi-click" onclick="dashboardKpi('${metric.action}')" aria-label="Abrir ${escapeHtml(metric.label)}"><div class="kpi-top"><span class="kpi-icon">${dashSvg(metric.icon)}</span><svg class="kpi-spark" viewBox="0 0 56 20" aria-hidden="true"><path d="${spark[metric.icon]}"></path></svg></div><div class="kpi-label">${metric.label}</div><div class="kpi-valor">${metric.valor.toLocaleString('pt-BR')}</div>${delta}</button>`;
    }).join('');
    
    // === Gráfico: Candidatos por etapa ===
    const etapasObj = data.etapas || {};
    const configuredLabels = vagasEmpresa.flatMap(v => { try { const e=Array.isArray(v.etapas)?v.etapas:(typeof v.etapas==='string'?JSON.parse(v.etapas):[]); return e.map(x=>typeof x==='string'?x:x?.nome).filter(Boolean); } catch (_) { return []; } });
    const labels = dashboardUniqueStageLabels(configuredLabels.length ? configuredLabels : (data.etapas_labels || ['Inscrição', 'Triagem', 'RH', 'Gestor', 'Proposta', 'Coleta Docs', 'Contratação']));
    const cores = ['#722F37', '#8A3D5C', '#A86E83', '#C9A961', '#9B7E4E', '#5E3442', '#3B0A20'];
    const maxEtapa = Math.max(1, ...Object.values(etapasObj).map(v => parseInt(v) || 0));
    const observedStageMax = Math.max(0, ...Object.entries(etapasObj).filter(([,v]) => Number(v)>0).map(([n]) => Number(n)));
    const configuredStageMax = vagasEmpresa.reduce((max,v) => { try { const e=Array.isArray(v.etapas)?v.etapas:(typeof v.etapas==='string'?JSON.parse(v.etapas):[]); return Math.max(max,e.length); } catch (_) { return max; } }, 0);
    const visibleStageCount = Math.min(labels.length, Math.max(observedStageMax, configuredStageMax));
    document.getElementById('grafico-etapas').innerHTML = labels.slice(0,visibleStageCount).map((label, i) => {
      const etapaNum = i + 1;
      const val = parseInt(etapasObj[etapaNum] || 0);
      const pct = (val / maxEtapa) * 100;
      return `<button type="button" class="etapa-row" onclick="dashOpenStage(${etapaNum})" aria-label="Ver candidatos na etapa ${escapeHtml(label)}">
        <div class="etapa-label">${escapeHtml(label)}</div>
        <div class="etapa-bar-bg">
          <div class="etapa-bar" style="width:${pct}%;background:${cores[i]}">
            <span class="etapa-val">${val}</span>
          </div>
        </div>
      </button>`;
    }).join('');
    
    // === Taxa de conversão: calculada exclusivamente com os processos desta empresa ===
    const c = data.conversao || {};
    const convAprovados = Number(c.aprovados ?? k.processos_ativos ?? 0);
    const convContratados = Number(c.contratados ?? contratacoesAtual);
    const convAtual = Number(c.atual ?? (convAprovados > 0 ? Math.round((convContratados / convAprovados) * 100) : 0));
    const hist = Array.isArray(c.historico) ? c.historico : [];
    const maxConv = Math.max(1, ...hist, convAtual);
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
    const convValorEl = document.getElementById('conversao-valor');
    if (convValorEl) convValorEl.textContent = convAtual + '%';
    const convAprovadosEl = document.getElementById('conversao-contratados');
    const convTotalEl = document.getElementById('conversao-total');
    if (convAprovadosEl) convAprovadosEl.textContent = convAprovados;
    if (convTotalEl) convTotalEl.textContent = convContratados;
    
    // === Próximas Entrevistas ===
    const entrevistas = data.proximas_entrevistas || [];
    if (entrevistas.length > 0) {
      document.getElementById('proximas-entrevistas').innerHTML = entrevistas.map(e => {
        const dataE = new Date(e.data_hora);
        const dataStr = dataE.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
        const horaStr = dataE.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const statusNome = e.status === 'cancelada' ? 'Cancelada' : e.status === 'aguardando' ? 'Aguardando' : 'Agendada';
        const badgeClass = e.status === 'cancelada' ? 'cancelada' : e.status === 'aguardando' ? 'aguardando' : 'confirmada';
        const nome = e.candidato_nome || e.nome || 'Candidato';
        const vaga = e.vaga_titulo || e.vaga || '—';
        const etapaNome = statusNome;
        const iniciais = nome.split(' ').map(s => s.charAt(0)).slice(0, 2).join('').toUpperCase();
        return `<div class="entrevista-item">
          <div class="entrevista-avatar">${escapeHtml(iniciais)}</div>
          <div class="entrevista-info">
            <div class="entrevista-nome">${escapeHtml(nome)}</div>
            <div class="entrevista-vaga">${escapeHtml(vaga)}</div>
            <div class="entrevista-data">${dataStr} às ${horaStr}</div>
          </div>
          <div class="entrevista-badge entrevista-${badgeClass}">${etapaNome}</div>
        </div>`;
      }).join('');
    } else {
      document.getElementById('proximas-entrevistas').innerHTML = '<div class="empty-msg">Nenhuma entrevista agendada</div>';
    }
    
    // === Documentação (taxa de aprovação) ===
    const taxaDocRaw = data.kpis_secundarios?.taxa_documentacao;
    const taxaDoc = taxaDocRaw !== null && taxaDocRaw !== undefined && Number.isFinite(Number(taxaDocRaw)) ? Number(taxaDocRaw) : null;
    const totalDocs = 16;
    const aprovados = taxaDoc === null ? null : Math.round(totalDocs * taxaDoc / 100);
    const circ = 2 * Math.PI * 50; // raio=50 conforme o HTML
    const dashTotal = circ;
    const offset = taxaDoc === null ? circ : circ - (taxaDoc / 100) * circ;
    const docFill = document.getElementById('doc-rosca-fill');
    const docTexto = document.getElementById('doc-rosca-texto');
    const docPercent = document.getElementById('doc-percent');
    if (docFill) docFill.setAttribute('stroke-dasharray', `${dashTotal - offset} ${dashTotal}`);
    if (docTexto) docTexto.textContent = taxaDoc === null ? '—' : taxaDoc + '%';
    if (docPercent) docPercent.textContent = taxaDoc === null ? '—' : taxaDoc + '%';
    const docRecebidosLabel = document.getElementById('doc-recebidos-label');
    const docPendentesLabel = document.getElementById('doc-pendentes-label');
    if (docRecebidosLabel) docRecebidosLabel.textContent = taxaDoc === null ? '—' : taxaDoc + '%';
    if (docPendentesLabel) docPendentesLabel.textContent = taxaDoc === null ? '—' : Math.max(0, 100 - taxaDoc) + '%';
    const docProg = document.getElementById('doc-progresso-barra');
    if (docProg) {
      docProg.style.width = taxaDoc === null ? '0%' : taxaDoc + '%';
      docProg.textContent = taxaDoc !== null && taxaDoc > 10 ? `${aprovados}/${totalDocs} aprovados` : '';
    }
    
    // === Vagas com mais candidatos ===
    const vRanking = data.vagas_mais_candidatos || [];
    if (vRanking.length > 0) {
      const maxRanking = Math.max(1, ...vRanking.map(v => Number(v.total_candidatos || 0)));
      document.getElementById('ranking-table-body').innerHTML = vRanking.slice(0, 4).map(v => {
        const vagaReal = vagasEmpresa.find(item => Number(item.id) === Number(v.id));
        const total = Number(v.total_candidatos || 0);
        const id=Number(v.id); if(!Number.isInteger(id)||id<=0)return ''; return `<button type="button" class="ranking-item" onclick="dashOpenVaga(${id})" aria-label="Abrir vaga ${escapeHtml(v.titulo || '')}"><div class="ranking-item-top"><strong>${escapeHtml(v.titulo || '—')}</strong><span class="ranking-percent">${Math.round((total / maxRanking) * 100)}%</span></div><div class="ranking-company">${escapeHtml(v.empresa || vagaReal?.empresa || 'Minha empresa')}</div><div class="ranking-item-bottom"><b>${total}</b> candidatos <span class="ranking-bar"><i style="width:${Math.max(8, Math.round((total / maxRanking) * 100))}%"></i></span></div></button>`;
      }).join('');
    } else {
      document.getElementById('ranking-table-body').innerHTML = '<div class="empty">Nenhuma vaga com candidatos</div>';
    }
    
    // === Atividades recentes ===
    const ats = data.atividades_recentes || [];
    if (ats.length > 0) {
      const tipoMap = {
        'inscricao':        { icone: 'users', label: 'Nova inscrição',  tipo: 'inscricao' },
        'avancar':          { icone: 'arrow-up', label: 'Avançou etapa',   tipo: 'avancar' },
        'reprovar':         { icone: 'arrow-down', label: 'Reprovado',       tipo: 'reprovar' },
        'reabrir':          { icone: 'arrow-up', label: 'Reaberto',        tipo: 'reabrir' },
        'recusar_proposta': { icone: 'arrow-down', label: 'Proposta recusada', tipo: 'proposta' },
        'aceitar_proposta': { icone: 'check', label: 'Proposta aceita',  tipo: 'proposta' },
        'enviar_proposta':  { icone: 'file', label: 'Proposta enviada', tipo: 'proposta' },
        'entrevista':       { icone: 'calendar', label: 'Entrevista agendada', tipo: 'entrevista' }
      };
      document.getElementById('atividades-recentes').innerHTML = ats.slice(0, 8).map(a => {
        const t = tipoMap[a.texto] || { icone: '•', label: escapeHtml(a.texto), tipo: 'reabrir' };
        const quando = tempoRelativo(a.quando);
        return `<div class="atividade-item tipo-${t.tipo}">
          <div class="atividade-icone">${dashSvg(t.icone)}</div>
          <div class="atividade-corpo">
            <div class="atividade-topo">
              <span class="atividade-tipo">${t.label}</span>
              <span class="atividade-tempo">${quando}</span>
            </div>
            <div class="atividade-candidato">${escapeHtml(a.candidato || '—')}</div>
            <div class="atividade-vaga">${escapeHtml(a.vaga || '—')}</div>
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
    document.getElementById('ks-aprovacao').textContent = (ks.taxa_aprovacao_30d ?? ks.taxa_aprovacao ?? 0) + '%';
    document.getElementById('ks-desligamento').textContent = (ks.taxa_desistencia ?? ks.taxa_desligamento ?? 0) + '%';
    document.getElementById('ks-encerradas').textContent = ks.vagas_encerradas || 0;
    const semContratacao = ks.vagas_fechadas_sem_contratacao ?? vagasEmpresa.filter(v => v.status === 'fechada' && Number(v.contratados || 0) === 0).length;
    document.getElementById('ks-processos').textContent = k.processos_ativos || 0;
    document.getElementById('ks-sem-contratacao').textContent = semContratacao;
  } catch (e) {
    console.error('[DASHBOARD V2] ERRO:', e.message, e.stack);
    const grid = document.getElementById('kpis-grid') || document.getElementById('stats-grid');
    if (grid) grid.innerHTML = `<div class="alert alert-erro">Erro ao carregar o dashboard: ${escapeHtml(e.message || 'Erro de conexão')} <button type="button" class="btn btn-sec" onclick="carregarDashboardV2()">Tentar novamente</button></div>`;
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
let vagasEmpresaCache = [];
let vagasCandidatosCache = {};
const vagasState = { search: '', status: '', area: '', nivel: '', tipo: '', cidade: '', criacao: '', periodo: '30', sort: 'recentes', page: 1, perPage: 8, view: 'cards', vagaId: '' };

const statusVagaLabel = { publicada: 'Publicada', pausada: 'Pausada', rascunho: 'Rascunho', fechada: 'Encerrada' };
function statusVagaClass(v) {
  if (v.status === 'fechada') return 'fechada';
  if (v.status === 'rascunho') return 'rascunho';
  if (v.status === 'pausada') return 'pausada';
  return Number(v.total_candidatos || 0) > 0 ? 'processo' : 'publicada';
}
function statusVagaText(v) { if (v.status === 'publicada' && Number(v.total_candidatos || 0) > 0) return 'Em processo seletivo'; return statusVagaLabel[v.status] || v.status || '—'; }
function vagaLocal(v) { return [v.cidade, v.estado].filter(Boolean).join(', ') || 'Local não informado'; }
function vagaContrato(v) { return [v.tipo_contrato, v.nivel].filter(Boolean).join(' · ') || 'Detalhes não informados'; }
function vagaData(v) { return v.atualizada_em || v.criada_em; }
function vagaDate(v) { if (!vagaData(v)) return 'Sem atividade'; const d = new Date(vagaData(v)); return Number.isNaN(d.getTime()) ? 'Sem atividade' : tempoRelativo(vagaData(v)); }
function fillVagasSelect(id, values, placeholder, current) {
  const el = document.getElementById(id); if (!el) return;
  const unique = [...new Set(values.filter(Boolean).map(String))].sort((a,b) => a.localeCompare(b,'pt-BR'));
  el.innerHTML = `<option value="">${placeholder}</option>` + unique.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
  el.value = current || '';
}
function setVagasKpis(dash) {
  const k = dash?.kpis || {};
  const rows = Array.isArray(dash?.vagas) ? dash.vagas : vagasEmpresaCache;
  const old = rows.filter(v => v.status === 'publicada' && v.criada_em && new Date(v.criada_em).getTime() < Date.now() - 30*86400000).length;
  const vals = { 'vagas-kpi-ativas': k.vagas_ativas ?? rows.filter(v => v.status === 'publicada').length, 'vagas-kpi-candidatos': k.total_candidatos ?? 0, 'vagas-kpi-processos': k.processos_ativos ?? 0, 'vagas-kpi-entrevistas': k.entrevistas_agendadas ?? 0, 'vagas-kpi-contratacoes': k.contratacoes ?? 0, 'vagas-kpi-antigas': old };
  Object.entries(vals).forEach(([id,val]) => { const el=document.getElementById(id); if(el) el.textContent=Number(val || 0).toLocaleString('pt-BR'); });
}
async function carregarVagasAdmin() {
  const grid = document.getElementById('vagas-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="vagas-loading"><span class="spinner"></span> Carregando suas vagas...</div>';
  try {
    const headers = { 'Authorization': 'Bearer ' + token };
    const [listaR, totaisR, dashR] = await Promise.all([
      fetch(API + '/api/empresa/vagas', { headers }),
      fetch(API + '/api/empresa/vagas-todas', { headers }),
      fetch(API + '/api/empresa/dashboard', { headers })
    ]);
    const lista = await listaR.json(); const totais = await totaisR.json(); const dash = await dashR.json();
    if (!listaR.ok) throw new Error(lista.erro || 'Não foi possível carregar as vagas');
    const counts = new Map((totais.vagas || []).map(v => [Number(v.id), v]));
    vagasEmpresaCache = (lista.vagas || []).map(v => { const c = counts.get(Number(v.id)) || {}; return { ...v, total_candidatos: Number(v.total_candidatos ?? c.total_geral ?? 0), em_andamento: Number(v.em_andamento ?? c.em_andamento ?? 0), contratados: Number(v.contratados ?? c.contratados ?? 0) }; });
    setVagasKpis(dash);
    fillVagasSelect('vagas-filtro-status', vagasEmpresaCache.map(v => v.status), 'Todos os status', vagasState.status);
    document.querySelectorAll('#vagas-filtro-status option').forEach(o => { if (o.value) o.textContent = statusVagaLabel[o.value] || o.value; });
    fillVagasSelect('vagas-filtro-area', vagasEmpresaCache.map(v => v.area || v.categoria), 'Todas as áreas', vagasState.area);
    fillVagasSelect('vagas-filtro-nivel', vagasEmpresaCache.map(v => v.nivel), 'Todos os níveis', vagasState.nivel);
    fillVagasSelect('vagas-filtro-tipo', vagasEmpresaCache.map(v => v.tipo_contrato), 'Tipo de contrato', vagasState.tipo);
    fillVagasSelect('vagas-filtro-cidade', vagasEmpresaCache.map(v => vagaLocal(v)), 'Cidade', vagasState.cidade);
    renderVagas();
  } catch (e) { grid.innerHTML = `<div class="vagas-empty"><strong>Não foi possível carregar suas vagas</strong><p>${escapeHtml(e.message || 'Tente novamente em instantes.')}</p><button class="btn btn-primary" type="button" onclick="carregarVagasAdmin()">Tentar novamente</button></div>`; }
}
function getVagasFiltered() {
  const q = vagasState.search.trim().toLocaleLowerCase('pt-BR');
  const now = Date.now();
  let rows = vagasEmpresaCache.filter(v => {
    if (vagasState.vagaId && String(v.id) !== String(vagasState.vagaId)) return false;
    const hay = [v.titulo,v.empresa,v.area,v.categoria,v.cidade,v.estado,v.nivel,v.tipo_contrato].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
    const created = v.criada_em ? new Date(v.criada_em).getTime() : 0;
    const period = vagasState.criacao || vagasState.periodo;
    const inPeriod = !period || period === 'all' || !created || created >= now - Number(period)*86400000;
    return (!q || hay.includes(q)) && (!vagasState.status || v.status === vagasState.status) && (!vagasState.area || (v.area || v.categoria) === vagasState.area) && (!vagasState.nivel || v.nivel === vagasState.nivel) && (!vagasState.tipo || v.tipo_contrato === vagasState.tipo) && (!vagasState.cidade || vagaLocal(v) === vagasState.cidade) && inPeriod;
  });
  rows.sort((a,b) => { const ca=Number(a.total_candidatos||0), cb=Number(b.total_candidatos||0); const da=new Date(vagaData(a)||0).getTime(), db=new Date(vagaData(b)||0).getTime(); if(vagasState.sort==='antigas') return da-db; if(vagasState.sort==='candidatos') return cb-ca; if(vagasState.sort==='menos-candidatos') return ca-cb; if(vagasState.sort==='atividade') return db-da; return db-da; });
  return rows;
}
function pipelineFor(v) { return Array.isArray(v._pipeline) && v._pipeline.length === 7 ? v._pipeline : Array(7).fill(null); }
function renderVagaCard(v) {
  const cls = statusVagaClass(v); const status = statusVagaText(v); const total = Number(v.total_candidatos || 0); const pipe = pipelineFor(v); const max = Math.max(1, ...pipe.map(x => Number(x || 0)));
  const stageNames = ['Inscrição','Triagem','RH','Gestor','Proposta','Docs','Contratação'];
  const stages = stageNames.map((name,i) => `<div class="vaga-stage"><span class="vaga-stage-label">${name}</span><b class="vaga-stage-value">${pipe[i] == null ? '—' : pipe[i]}</b><span class="vaga-stage-bar"><i style="width:${pipe[i] == null ? 0 : Math.max(5, Math.round((Number(pipe[i]) / max) * 100))}%"></i></span></div>`).join('');
  const actionLabel = v.status === 'rascunho' ? 'Editar rascunho' : v.status === 'fechada' ? 'Ver detalhes' : 'Gerenciar vaga';
  const mainClick = v.status === 'rascunho' || v.status === 'fechada' ? `editarVaga(${v.id})` : `abrirVagaCands(${v.id})`;
  const closed = v.status === 'fechada' ? `<div class="vaga-card-meta">Encerrada em ${v.atualizada_em ? new Date(v.atualizada_em).toLocaleDateString('pt-BR') : '—'}</div>` : '';
  const alert = v.status !== 'fechada' && vagaData(v) && Date.now() - new Date(vagaData(v)).getTime() > 7*86400000 ? '<div class="vaga-alert">Atenção: sem movimentação há mais de 7 dias</div>' : '';
  return `<article class="vaga-card ${cls === 'fechada' ? 'closed' : ''} ${v.status === 'rascunho' ? 'draft' : ''}" data-vaga-id="${v.id}"><div class="vaga-card-head"><h3 class="vaga-card-title">${escapeHtml(v.titulo || 'Vaga sem título')}</h3><div class="vaga-card-menu"><button type="button" aria-label="Ações da vaga" onclick="toggleVagaCardMenu(${v.id})">•••</button><div class="vaga-card-menu-panel" id="vaga-menu-${v.id}"><button type="button" onclick="editarVaga(${v.id})">Editar</button><button type="button" class="danger" onclick="deletarVaga(${v.id})">Encerrar vaga</button></div></div></div><div class="vaga-card-meta">${escapeHtml(v.empresa || 'Minha empresa')} · ${escapeHtml(vagaLocal(v))}</div><div class="vaga-card-meta">${escapeHtml(vagaContrato(v))}</div>${closed}<div class="vaga-card-tags"><span class="vaga-status vaga-status-${cls}">${status}</span></div><div class="vaga-card-stats"><div class="vaga-candidate-count"><strong>${total.toLocaleString('pt-BR')}</strong><small>candidatos</small></div><div class="vaga-last-activity"><strong>${escapeHtml(vagaDate(v))}</strong><span>última atividade</span></div></div>${alert}<div class="vaga-pipeline" aria-label="Pipeline da vaga">${stages}</div><div class="vaga-card-footer"><button type="button" class="vaga-card-action" onclick="${mainClick}">${v.status === 'rascunho' ? 'Editar rascunho' : v.status === 'fechada' ? 'Ver detalhes' : 'Ver candidatos'}</button><button type="button" class="vaga-card-action primary" onclick="editarVaga(${v.id})">${actionLabel}</button><button type="button" class="vaga-card-action menu-action" aria-label="Abrir ações" onclick="toggleVagaCardMenu(${v.id})">•••</button></div></article>`;
}
function renderVagaList(v) { return renderVagaCard(v); }
function renderVagas() {
  const grid=document.getElementById('vagas-grid'); if(!grid) return; const rows=getVagasFiltered(); const total=rows.length; const pages=Math.max(1,Math.ceil(total/vagasState.perPage)); if(vagasState.page>pages) vagasState.page=pages; const start=(vagasState.page-1)*vagasState.perPage; const pageRows=rows.slice(start,start+vagasState.perPage);
  if (!total) { grid.className='vagas-grid'; grid.innerHTML='<div class="vagas-empty"><strong>Nenhuma vaga encontrada</strong><p>Crie sua primeira oportunidade ou ajuste os filtros para continuar.</p><button class="btn btn-primary" type="button" onclick="abrirModalVaga()">+ Criar primeira vaga</button></div>'; }
  else { grid.className='vagas-grid' + (vagasState.view==='lista' ? ' lista-view' : ''); grid.innerHTML=pageRows.map(renderVagasCardForState).join(''); hydrateVagaPipelines(pageRows); }
  const shownStart=total ? start+1 : 0, shownEnd=Math.min(start+vagasState.perPage,total); const label=document.getElementById('vagas-paginacao-label'); if(label) label.textContent=`Mostrando ${shownStart}–${shownEnd} de ${total} vaga${total===1?'':'s'}`; renderVagasPagination(pages);
}
function renderVagasCardForState(v) { return vagasState.view==='lista' ? renderVagaList(v) : renderVagaCard(v); }
function renderVagasPagination(pages) { const box=document.getElementById('vagas-paginacao-controles'); if(!box)return; let html=`<button type="button" ${vagasState.page<=1?'disabled':''} onclick="vagasGoPage(${vagasState.page-1})">‹</button>`; for(let i=1;i<=pages;i++){ if(pages>6 && i>2 && i<pages-1 && Math.abs(i-vagasState.page)>1){if(i===3)html+='<span>…</span>';continue;} html+=`<button type="button" class="${i===vagasState.page?'ativo':''}" onclick="vagasGoPage(${i})">${i}</button>`; } html+=`<button type="button" ${vagasState.page>=pages?'disabled':''} onclick="vagasGoPage(${vagasState.page+1})">›</button>`; box.innerHTML=html; }
function vagasGoPage(page) { vagasState.page=page; renderVagas(); window.scrollTo({top:0,behavior:'smooth'}); }
async function hydrateVagaPipelines(rows) { const missing=rows.filter(v=>v.id && !(v.id in vagasCandidatosCache)); await Promise.all(missing.map(async v=>{ try{const r=await fetch(API+'/api/empresa/vagas/'+v.id+'/candidatos',{headers:{'Authorization':'Bearer '+token}});const d=await r.json();const cs=(d.candidatos||[]).filter(c=>!['reprovado','rejeitado'].includes(c.status));const counts=Array(7).fill(0);cs.forEach(c=>{const i=Math.max(0,Math.min(6,Number(c.etapa_atual||1)-1));counts[i]++;});vagasCandidatosCache[v.id]=counts;v._pipeline=counts;}catch(_){vagasCandidatosCache[v.id]=null;} })); if(missing.length) renderVagas(); }
function toggleVagaCardMenu(id) { document.querySelectorAll('.vaga-card-menu-panel.aberto').forEach(x=>x.classList.remove('aberto')); document.getElementById('vaga-menu-'+id)?.classList.toggle('aberto'); }
function bindVagasControls() {
  if (window.__vagasControlsBound) return; window.__vagasControlsBound=true;
  const sync=(value)=>{vagasState.search=value; const a=document.getElementById('vagas-busca-top'),b=document.getElementById('vagas-busca'); if(a&&a.value!==value)a.value=value;if(b&&b.value!==value)b.value=value;vagasState.page=1;renderVagas();};
  ['vagas-busca-top','vagas-busca'].forEach(id=>document.getElementById(id)?.addEventListener('input',e=>sync(e.target.value)));
  [['vagas-filtro-status','status'],['vagas-filtro-area','area'],['vagas-filtro-nivel','nivel'],['vagas-filtro-tipo','tipo'],['vagas-filtro-cidade','cidade'],['vagas-filtro-criacao','criacao'],['vagas-periodo','periodo'],['vagas-ordenar','sort'],['vagas-itens-pagina','perPage']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('change',e=>{vagasState[key]=key==='perPage'?Number(e.target.value):e.target.value;if(key==='periodo')vagasState.criacao='';if(key==='sort'||key==='perPage'||key==='periodo'||key==='criacao')vagasState.page=1;renderVagas();}));
  document.getElementById('vagas-limpar')?.addEventListener('click',()=>{Object.assign(vagasState,{search:'',status:'',area:'',nivel:'',tipo:'',cidade:'',criacao:'',periodo:'all',vagaId:'',page:1});['vagas-busca-top','vagas-busca'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});['vagas-filtro-status','vagas-filtro-area','vagas-filtro-nivel','vagas-filtro-tipo','vagas-filtro-cidade','vagas-filtro-criacao','vagas-periodo'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const p=document.getElementById('vagas-periodo');if(p)p.value='all';renderVagas();});
  document.getElementById('vagas-mais-filtros')?.addEventListener('click',e=>{const p=document.getElementById('vagas-advanced');const open=p.hasAttribute('hidden');if(open)p.removeAttribute('hidden');else p.setAttribute('hidden','');e.currentTarget.setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('.vagas-view-switch button').forEach(btn=>btn.addEventListener('click',()=>{vagasState.view=btn.dataset.view;document.querySelectorAll('.vagas-view-switch button').forEach(b=>b.classList.toggle('ativo',b===btn));renderVagas();}));
}
bindVagasControls();

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
  carregarFiliaisVaga(Array.isArray(vaga?.filial_ids) ? vaga.filial_ids : []);
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
function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || ''), window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.href) : '';
  } catch (_) { return ''; }
}

async function carregarFiliaisVaga(selecionadas = []) {
  const select = document.getElementById('v-filiais');
  if (!select) return;
  select.innerHTML = '<option disabled>Carregando Filiais...</option>';
  try {
    const r = await fetch(API + '/api/empresa/usuarios', { headers: { 'Authorization': 'Bearer ' + token } });
    const d = await r.json();
    const filiais = (d.usuarios || []).filter(u => u.role === 'viewer' && u.ativo !== false);
    select.innerHTML = filiais.length ? filiais.map(u => `<option value="${Number(u.id)}" ${selecionadas.map(Number).includes(Number(u.id)) ? 'selected' : ''}>${escapeHtml(u.nome || u.email)}</option>`).join('') : '<option disabled>Nenhuma Filial cadastrada</option>';
  } catch (_) { select.innerHTML = '<option disabled>Não foi possível carregar as Filiais</option>'; }
}
function filiaisSelecionadasVaga() { return [...(document.getElementById('v-filiais')?.selectedOptions || [])].map(o => Number(o.value)).filter(Number.isInteger); }

async function editarVaga(id) {
  try {
    const r = await fetch(API + '/api/empresa/vagas/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
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
    beneficios: document.getElementById('v-beneficios').value,
    filial_ids: filiaisSelecionadasVaga()
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
    const url = id ? API + '/api/empresa/vagas/' + id : API + '/api/empresa/vagas';
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
    const r = await fetch(API + '/api/empresa/vagas/' + id, {
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
  'Atendimento ao Cliente','Caixa','Vendas','Comercial','Administrativo','Recepção','Estoque','Logística','Expedição','Compras','Financeiro','Recursos Humanos (RH)','Marketing','Telemarketing','Suporte Técnico','Tecnologia da Informação (TI)','Desenvolvimento de Software','Design Gráfico','E-commerce','Supervisão','Gerência','Liderança Comercial','Operações','Produção','Qualidade','Segurança Patrimonial','Portaria','Limpeza e Conservação','Serviços Gerais','Manutenção','Transporte','Motorista','Entregas','Alimentação e Restaurantes','Hotelaria e Turismo','Saúde','Educação','Farmácia','Construção Civil','Indústria','Estágio','Jovem Aprendiz','Primeiro Emprego'
];
const candidatosState = { search:'', etapa:'', vaga:'', status:'', cidade:'', estado:'', area:'', page:1, limite:10, ordenar:'recentes' };
let candidatosRows = [];
let candidatosTotal = 0;
let candidatosDashboard = null;
let candidatosVagas = [];
let candidatoSelecionadoId = null;

function candidatoEtapaNome(n) { return ['Inscrição','Triagem','RH','Gestor','Proposta','Coleta Docs','Contratação'][Math.max(0,Math.min(6,Number(n||1)-1))] || 'Inscrição'; }
function candidatoStatusText(s) { return ({ em_andamento:'Em processo', em_analise:'Aguardando', aprovado:'Avançou', contratado:'Contratado', reprovado:'Reprovado', rejeitado:'Desistiu' }[s] || s || 'Em processo'); }
function candidatoStatusClass(s) { return ({ contratado:'contratado', reprovado:'reprovado', rejeitado:'desistiu', aprovado:'avancou', em_analise:'aguardando' }[s] || 'processo'); }
function candidatoIniciais(nome) { return String(nome || 'C').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
function candidatoData(data) { if(!data) return '—'; const d=new Date(data); return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR'); }
function candidatoUltimaAtividade(c) { return c.atualizada_em || c.criada_em ? tempoRelativo(c.atualizada_em || c.criada_em) : 'Sem atividade'; }
function candidatoSvg(name) { return `<svg class="dash-svg" aria-hidden="true"><use href="#icon-${name}"></use></svg>`; }
function candidatoAvatar(c, large=false) { return c.foto_url ? `<span class="candidato-avatar"${large?' data-large="1"':''}><img src="${safeExternalUrl(c.foto_url)}" alt=""></span>` : `<span class="candidato-avatar"${large?' data-large="1"':''}>${escapeHtml(candidatoIniciais(c.nome))}</span>`; }
function popularSelectAreas() { const sel=document.getElementById('candidatos-filtro-area'); if(!sel || sel.options.length>1)return; AREAS_INTERESSE_ADMIN.forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;sel.appendChild(o);}); }
function popularSelectVagas() { const sel=document.getElementById('candidatos-filtro-vaga'); if(!sel || sel.options.length>1)return; candidatosVagas.forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=v.titulo || 'Vaga';sel.appendChild(o);}); }
function atualizarKpisCandidatos() {
  const d=candidatosDashboard||{}; const k=d.kpis||{}; const etapas=d.etapas||{}; const total=Number(k.total_candidatos||0); const avancaram=Object.entries(etapas).filter(([n])=>Number(n)>1).reduce((s,[,v])=>s+Number(v||0),0); const taxa=Number(d.kpis_secundarios?.taxa_desistencia||d.kpis_secundarios?.taxa_desligamento||0); const desistencias=Math.round(total*taxa/100);
  const vals={'cand-kpi-total':total,'cand-kpi-processo':Number(k.processos_ativos||0),'cand-kpi-avancaram':avancaram,'cand-kpi-contratados':Number(k.contratacoes||0),'cand-kpi-desistencias':desistencias}; Object.entries(vals).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v.toLocaleString('pt-BR');});
  const delta=document.getElementById('cand-kpi-total-delta');if(delta)delta.textContent=`+${Number(k.deltas?.candidatos||0)} novos nos últimos 7 dias`;
  document.getElementById('cand-stage-total')?.replaceChildren(document.createTextNode(total.toLocaleString('pt-BR')));
  document.querySelectorAll('#candidatos-stage-filters button[data-etapa]').forEach(btn=>{const n=btn.dataset.etapa;if(n) {const b=btn.querySelector('b');if(b)b.textContent=Number(etapas[n]||0).toLocaleString('pt-BR');}});
}
function candidatosQuery() { const p=new URLSearchParams({pagina:String(candidatosState.page),limite:String(candidatosState.limite)}); if(candidatosState.search)p.set('q',candidatosState.search); if(candidatosState.vaga)p.set('vaga_id',candidatosState.vaga); if(candidatosState.status)p.set('status',candidatosState.status); if(candidatosState.cidade)p.set('cidade',candidatosState.cidade); if(candidatosState.estado)p.set('estado',candidatosState.estado); if(candidatosState.area)p.set('area',candidatosState.area); if(candidatosState.etapa)p.set('etapa',candidatosState.etapa); return p.toString(); }
async function carregarCandidatos() {
  const table=document.querySelector('#candidatos-table tbody'); const mobile=document.getElementById('candidatos-mobile-list'); if(table)table.innerHTML='<tr><td colspan="7" class="empty"><div class="spinner"></div></td></tr>'; if(mobile)mobile.innerHTML='';
  popularSelectAreas();
  try {
    const headers={'Authorization':'Bearer '+token}; const jobs=[];
    jobs.push(fetch(API+'/api/empresa/candidatos?'+candidatosQuery(),{headers}));
    if(!candidatosDashboard) jobs.push(fetch(API+'/api/empresa/dashboard',{headers}));
    if(!candidatosVagas.length) jobs.push(fetch(API+'/api/empresa/vagas',{headers}));
    const responses=await Promise.all(jobs); const candResp=await responses[0].json(); if(!responses[0].ok)throw new Error(candResp.erro||'Erro ao carregar candidatos'); let idx=1;
    if(!candidatosDashboard){candidatosDashboard=await responses[idx].json();idx++;} if(!candidatosVagas.length){const v=await responses[idx].json();candidatosVagas=v.vagas||[];popularSelectVagas();}
    atualizarKpisCandidatos(); let rows=candResp.candidatos||[];
    if(candidatosState.ordenar==='nome')rows.sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR')); else if(candidatosState.ordenar==='etapa')rows.sort((a,b)=>Number(a.ultima_etapa||1)-Number(b.ultima_etapa||1)); else if(candidatosState.ordenar==='antigos')rows.sort((a,b)=>new Date(a.criado_em||0)-new Date(b.criado_em||0));
    candidatosTotal=Number(candResp.paginacao?.total||rows.length);
    candidatosRows=rows; renderCandidatos();
  } catch(e) { if(table)table.innerHTML=`<tr><td colspan="7" class="empty">${escapeHtml(e.message||'Erro ao carregar candidatos')}</td></tr>`; }
}
function renderCandidatos() {
  const table=document.querySelector('#candidatos-table tbody'), mobile=document.getElementById('candidatos-mobile-list'); const rows=candidatosRows; if(!rows.length){if(table)table.innerHTML='<tr><td colspan="7" class="empty">Nenhum candidato corresponde aos filtros selecionados.</td></tr>';if(mobile)mobile.innerHTML='<div class="candidatos-empty-mobile">Nenhum candidato corresponde aos filtros selecionados.</div>';}
  else {if(table)table.innerHTML=rows.map(renderCandidatoRow).join('');if(mobile)mobile.innerHTML=rows.map(renderCandidatoMobile).join('');}
  const totalPages=Math.max(1,Math.ceil(candidatosTotal/candidatosState.limite)); const start=candidatosTotal?((candidatosState.page-1)*candidatosState.limite+1):0; const end=candidatosState.etapa?Math.min(start+rows.length-1,candidatosTotal):Math.min(candidatosState.page*candidatosState.limite,candidatosTotal); const label=document.getElementById('candidatos-paginacao-label');if(label)label.textContent=`Mostrando ${start}–${end} de ${candidatosTotal} candidato${candidatosTotal===1?'':'s'}`; const count=document.getElementById('candidatos-list-count');if(count)count.textContent=`${candidatosTotal.toLocaleString('pt-BR')} candidato${candidatosTotal===1?'':'s'}`; renderCandidatosPagination(totalPages);
  document.querySelectorAll('#candidatos-table tbody tr[data-candidato-id]').forEach(row=>row.classList.toggle('selecionado',Number(row.dataset.candidatoId)===Number(candidatoSelecionadoId)));
}
function renderCandidatoRow(c) { const stage=Number(c.ultima_etapa||1); const candidaturaId=Number(c.ultima_candidatura_id)||0; return `<tr data-candidato-id="${c.id}" onclick="analisarCandidatura(${candidaturaId})"><td><input type="checkbox" class="candidato-check" data-id="${c.id}" aria-label="Selecionar ${escapeHtml(c.nome||'candidato')}" onclick="event.stopPropagation();atualizarSelecaoCandidatos()"></td><td><span class="candidato-row-main">${candidatoAvatar(c)}<span class="candidato-row-copy"><strong>${escapeHtml(c.nome||'Candidato')}</strong><small>${escapeHtml(c.email||'—')}</small></span></span></td><td><span class="candidato-vaga">${escapeHtml(c.ultima_vaga_titulo||'—')}<small>${escapeHtml([c.cidade,c.estado].filter(Boolean).join('/')||'')}</small></span></td><td><span class="candidato-stage-badge candidato-stage-${stage}">${candidatoEtapaNome(stage)}</span></td><td><span class="candidato-date"><strong>${candidatoData(c.criada_em)}</strong><small>${candidatoStatusText(c.ultimo_status)}</small></span></td><td><span class="candidato-date"><strong>${escapeHtml(candidatoUltimaAtividade(c))}</strong><small>${c.ultimo_status==='contratado'?'Contratação concluída':'Atualização do processo'}</small></span></td><td><span class="candidato-row-actions"><button type="button" aria-label="Ver análise do candidato" onclick="event.stopPropagation();analisarCandidatura(${candidaturaId})"><svg class="dash-svg"><use href="#icon-user"></use></svg></button><button type="button" aria-label="Mais ações" onclick="event.stopPropagation();analisarCandidatura(${candidaturaId})">•••</button></span></td></tr>`; }
function renderCandidatoMobile(c) { const stage=Number(c.ultima_etapa||1); const candidaturaId=Number(c.ultima_candidatura_id)||0; return `<article class="candidato-mobile-card" data-candidato-id="${c.id}" onclick="analisarCandidatura(${candidaturaId})">${candidatoAvatar(c)}<div class="candidato-mobile-copy"><strong>${escapeHtml(c.nome||'Candidato')}</strong><small>${escapeHtml(c.email||'—')}</small><div class="candidato-mobile-meta"><span>${escapeHtml(candidatoEtapaNome(stage))}</span><span>${escapeHtml(c.ultima_vaga_titulo||'Sem vaga')}</span></div></div><span class="candidato-mobile-action"><svg class="dash-svg"><use href="#icon-user"></use></svg></span></article>`; }
function renderCandidatosPagination(pages) { const box=document.getElementById('candidatos-paginacao-controles');if(!box)return;let html=`<button type="button" ${candidatosState.page<=1?'disabled':''} onclick="irPaginaCandidatos(${candidatosState.page-1})">‹</button>`;for(let i=1;i<=pages;i++){if(pages>7&&i>2&&i<pages-1&&Math.abs(i-candidatosState.page)>1){if(i===3)html+='<span>…</span>';continue;}html+=`<button type="button" class="${i===candidatosState.page?'ativo':''}" onclick="irPaginaCandidatos(${i})">${i}</button>`;}html+=`<button type="button" ${candidatosState.page>=pages?'disabled':''} onclick="irPaginaCandidatos(${candidatosState.page+1})">›</button>`;box.innerHTML=html; }
function irPaginaCandidatos(page){const pages=Math.max(1,Math.ceil(candidatosTotal/candidatosState.limite));if(page<1||page>pages)return;candidatosState.page=page;carregarCandidatos();}
function atualizarSelecaoCandidatos(){const checks=[...document.querySelectorAll('.candidato-check:checked')];const bar=document.getElementById('candidatos-selection-bar');const count=document.getElementById('candidatos-selecionados-count');if(count)count.textContent=checks.length;if(bar)bar.hidden=!checks.length;}
function limparSelecaoCandidatos(){document.querySelectorAll('.candidato-check').forEach(c=>c.checked=false);atualizarSelecaoCandidatos();const all=document.getElementById('candidatos-selecionar-todos');if(all)all.checked=false;}
function limparFiltrosCandidatos(){Object.assign(candidatosState,{search:'',etapa:'',vaga:'',status:'',cidade:'',estado:'',area:'',page:1});['candidatos-busca-top','candidatos-busca','candidatos-filtro-cidade','candidatos-filtro-estado'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});['candidatos-filtro-vaga','candidatos-filtro-status','candidatos-filtro-area'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});document.querySelectorAll('#candidatos-stage-filters button').forEach(b=>b.classList.toggle('ativo',b.dataset.etapa===''));carregarCandidatos();}
function abrirModalNovoCandidato(){alert('O cadastro de candidatos é realizado pelo portal do candidato. Esta tela não cria registros duplicados.');}
async function abrirPainelCandidato(id){const row=candidatosRows.find(c=>Number(c.id)===Number(id));if(!row)return;candidatoSelecionadoId=id;const panel=document.getElementById('candidato-detail-panel');if(!panel)return;panel.classList.add('aberto');panel.innerHTML='<div class="candidato-detail-empty"><span class="spinner"></span><span>Carregando dados permitidos para esta empresa...</span></div>';renderCandidatos();try{const headers={'Authorization':'Bearer '+token};const reqs=[fetch(API+'/api/empresa/candidatos/'+id,{headers})];if(row.ultima_candidatura_id)reqs.push(fetch(API+'/api/empresa/candidatura/'+row.ultima_candidatura_id,{headers}),fetch(API+'/api/empresa/candidatura/'+row.ultima_candidatura_id+'/documentos',{headers}));const rs=await Promise.all(reqs);const detalhe=await rs[0].json();const cand=detalhe.candidato||detalhe;let candidatura=null,docs=[];if(row.ultima_candidatura_id){candidatura=await rs[1].json();const docData=await rs[2].json();docs=docData.documentos||[];}renderCandidatoDetalhe(cand,row,candidatura,docs);}catch(e){panel.innerHTML=`<div class="candidato-detail-empty"><strong>Não foi possível carregar o candidato</strong><span>${escapeHtml(e.message||'Tente novamente.')}</span></div>`;}}
function renderCandidatoDetalhe(c,row,candidatura,docs){const stage=Number(row.ultima_etapa||candidatura?.etapa_atual||1);const progress=Math.round((stage/7)*100);const hist=Array.isArray(candidatura?.historico)?candidatura.historico:[];const lastNote=[...hist].reverse().find(h=>h.tipo==='comentario' || h.mensagem);const steps=['Inscrição','Triagem','RH','Gestor','Proposta','Coleta Docs','Contratação'].map((name,i)=>{const n=i+1;const cls=n<stage?'concluida':n===stage?'atual':'';return `<div class="candidato-step ${cls}"><span class="candidato-step-dot">${n<stage?'✓':n}</span><span>${name}${n===stage?' — atual':''}</span><small>${n<stage?'Concluída':n===stage?'Em andamento':'Pendente'}</small></div>`;}).join('');const docsHtml=docs.length?docs.slice(0,4).map(d=>`<div class="candidato-doc"><svg class="dash-svg"><use href="#icon-file"></use></svg><span>${escapeHtml(d.arquivo_nome||d.tipo||'Documento')}<small>${escapeHtml(d.arquivo_tipo||'Arquivo')} · ${d.arquivo_tamanho?Math.round(Number(d.arquivo_tamanho)/1024)+' KB':'—'}</small></span></div>`).join(''):'<div class="candidato-note">Nenhum anexo disponível para esta candidatura.</div>';const noteHtml=lastNote?`<div class="candidato-note">${escapeHtml(lastNote.mensagem||lastNote.texto||'Nota registrada')}<em>Adicionado por ${escapeHtml(lastNote.por||'usuário da empresa')} · ${candidatoData(lastNote.em||lastNote.data)}</em></div>`:'<div class="candidato-note">Nenhuma nota interna registrada.</div>';const panel=document.getElementById('candidato-detail-panel');panel.innerHTML=`<div class="candidato-detail-content"><div class="candidato-detail-head">${candidatoAvatar(c,true)}<div class="candidato-detail-head-copy"><h3>${escapeHtml(c.nome||row.nome||'Candidato')}</h3><p>${escapeHtml(row.ultima_vaga_titulo||'Processo seletivo')}</p><span class="candidato-detail-status">${candidatoStatusText(row.ultimo_status)}</span></div><button class="candidato-detail-close" type="button" aria-label="Fechar detalhes" onclick="fecharPainelCandidato()">×</button></div><div class="candidato-detail-actions"><button type="button" onclick="abrirCurriculo(${c.id})"><svg class="dash-svg"><use href="#icon-user"></use></svg>Ver perfil</button><button type="button" onclick="irPara('candidaturas')"><svg class="dash-svg"><use href="#icon-file"></use></svg>Candidatura</button><button type="button" onclick="abrirModalNovaEntrevista()"><svg class="dash-svg"><use href="#icon-calendar"></use></svg>Agendar</button><button type="button" onclick="fecharPainelCandidato()"><svg class="dash-svg"><use href="#icon-message"></use></svg>Fechar</button></div><div class="candidato-contact-grid"><div class="candidato-contact-item">${candidatoSvg('message')}<span>${escapeHtml(c.email||'E-mail não informado')}</span></div><div class="candidato-contact-item">${candidatoSvg('user')}<span>${escapeHtml(c.celular||'Telefone não informado')}</span></div><div class="candidato-contact-item">${candidatoSvg('talent')}<span>${escapeHtml([c.cidade,c.estado].filter(Boolean).join(' / ')||'Local não informado')}</span></div></div><section class="candidato-detail-section"><div class="candidato-detail-section-header"><h4>Etapas do processo</h4><strong class="candidato-detail-count">${stage} de 7</strong></div><div class="candidato-progress-copy"><span>Progresso</span><strong>${stage} de 7</strong></div><div class="candidato-progress-bar"><i style="width:${progress}%"></i></div><div class="candidato-steps">${steps}</div></section><section class="candidato-detail-section"><div class="candidato-detail-section-header"><h4>Notas internas</h4><button type="button">Ver todas</button></div>${noteHtml}</section><section class="candidato-detail-section"><div class="candidato-detail-section-header"><h4>Anexos</h4><button type="button">Ver todos</button></div><div class="candidato-docs">${docsHtml}</div></section></div>`;}
function fecharPainelCandidato(){document.getElementById('candidato-detail-panel')?.classList.remove('aberto');candidatoSelecionadoId=null;renderCandidatos();}
function bindCandidatosControls(){if(window.__candidatosControlsBound)return;window.__candidatosControlsBound=true;const sync=v=>{candidatosState.search=v;['candidatos-busca-top','candidatos-busca'].forEach(id=>{const e=document.getElementById(id);if(e&&e.value!==v)e.value=v;});candidatosState.page=1;carregarCandidatos();};['candidatos-busca-top','candidatos-busca'].forEach(id=>document.getElementById(id)?.addEventListener('input',e=>sync(e.target.value)));[['candidatos-filtro-vaga','vaga'],['candidatos-filtro-status','status'],['candidatos-filtro-cidade','cidade'],['candidatos-filtro-estado','estado'],['candidatos-filtro-area','area'],['candidatos-ordenar','ordenar'],['candidatos-itens-pagina','limite']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('change',e=>{candidatosState[key]=key==='limite'?Number(e.target.value):e.target.value;candidatosState.page=1;carregarCandidatos();}));document.querySelectorAll('#candidatos-stage-filters button').forEach(btn=>btn.addEventListener('click',()=>{candidatosState.etapa=btn.dataset.etapa;candidatosState.page=1;document.querySelectorAll('#candidatos-stage-filters button').forEach(b=>b.classList.toggle('ativo',b===btn));carregarCandidatos();}));document.getElementById('candidatos-mais-filtros-top')?.addEventListener('click',e=>{const p=document.getElementById('candidatos-advanced');const open=p.hasAttribute('hidden');if(open)p.removeAttribute('hidden');else p.setAttribute('hidden','');e.currentTarget.setAttribute('aria-expanded',String(open));});document.getElementById('candidatos-selecionar-todos')?.addEventListener('change',e=>{document.querySelectorAll('.candidato-check').forEach(c=>c.checked=e.target.checked);atualizarSelecaoCandidatos();});}
bindCandidatosControls();

// ===== EQUIPE — gestão real de acessos =====
let equipeRowsReal=[];const equipeState={filtro:'todos',busca:'',ordenar:'nome',selectedId:null};
function equipeRoleText(r){return({admin_empresa:'Administrador da empresa',recrutador:'Recrutador',viewer:'Filial'}[r]||r||'Função não informada');}
function equipeInitials(n){return String(n||'U').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function equipeStatus(u){return u.ativo===false?'inativo':'ativo';}
function equipeStatusText(u){return u.ativo===false?'Inativo':'Ativo';}
function equipeFiltered(){const q=equipeState.busca.trim().toLocaleLowerCase('pt-BR');let rows=equipeRowsReal.filter(u=>(!q||[u.nome,u.email,u.cargo,equipeRoleText(u.role)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q))&&(equipeState.filtro==='todos'||equipeState.filtro===u.role||(equipeState.filtro==='ativos'&&u.ativo!==false)||(equipeState.filtro==='inativos'&&u.ativo===false)));rows.sort((a,b)=>{if(equipeState.ordenar==='nomeza')return String(b.nome||'').localeCompare(String(a.nome||''),'pt-BR');if(equipeState.ordenar==='recentes')return new Date(b.criado_em||0)-new Date(a.criado_em||0);if(equipeState.ordenar==='status')return equipeStatusText(a).localeCompare(equipeStatusText(b),'pt-BR');return String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR');});return rows;}
let equipeConvites=[];
async function carregarEquipe(){const box=document.getElementById('equipe-content');if(box)box.innerHTML='<div class="equipe-loading"><span class="spinner"></span> Carregando equipe...</div>';try{const h={'Authorization':'Bearer '+token};const [ur,ir]=await Promise.all([fetch(API+'/api/empresa/usuarios',{headers:h}),fetch(API+'/api/empresa/convites',{headers:h})]);const d=await ur.json(),iv=await ir.json();if(!ur.ok)throw new Error(d.erro||'Não foi possível carregar a equipe');equipeRowsReal=d.usuarios||[];equipeConvites=ir.ok?(iv.convites||[]):[];const active=equipeRowsReal.filter(u=>u.ativo!==false);const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};set('equipe-kpi-ativos',active.length);set('equipe-kpi-admins',equipeRowsReal.filter(u=>u.role==='admin_empresa').length);set('equipe-kpi-recrutadores',equipeRowsReal.filter(u=>u.role==='recrutador').length);set('equipe-kpi-convites',equipeConvites.length);renderEquipe();renderEquipeConvites();}catch(e){if(box)box.innerHTML=`<div class="equipe-empty"><strong>Não foi possível carregar os dados da equipe.</strong><p>${escapeHtml(e.message||'Tente novamente.')}</p><button class="btn btn-sec" type="button" onclick="carregarEquipe()">Tentar novamente</button></div>`;}}
function renderEquipeConvites(){const box=document.getElementById('equipe-invites-list');if(!box)return;if(!equipeConvites.length){box.innerHTML='<div class="equipe-empty-inline">Nenhum convite pendente.</div>';return;}box.innerHTML=`<div class="equipe-invite-list">${equipeConvites.map(c=>`<div class="equipe-invite-row"><div class="equipe-invite-copy"><strong>${escapeHtml(c.nome)} · ${escapeHtml(equipeRoleText(c.role))}</strong><small>${escapeHtml(c.email)} · expira em ${formatarData(c.expira_em)}</small></div><div class="equipe-invite-actions"><button type="button" onclick="reenviarConviteEquipe(${c.id})">Reenviar</button><button class="danger" type="button" onclick="cancelarConviteEquipe(${c.id})">Cancelar</button></div></div>`).join('')}</div>`;}
async function reenviarConviteEquipe(id){try{const r=await fetch(API+'/api/empresa/convites/'+id+'/reenviar',{method:'POST',headers:{'Authorization':'Bearer '+token}}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível reenviar');alert('Convite reenviado com sucesso.');await carregarEquipe();}catch(e){alert(e.message);}}
async function cancelarConviteEquipe(id){if(!confirm('Cancelar este convite?'))return;try{const r=await fetch(API+'/api/empresa/convites/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+token}}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível cancelar');await carregarEquipe();}catch(e){alert(e.message);}}
function equipeCard(u){const st=equipeStatus(u);return`<article class="equipe-member-card ${Number(equipeState.selectedId)===Number(u.id)?'selecionado':''}" onclick="selecionarMembroEquipe(${u.id})"><div class="equipe-member-head"><span class="equipe-avatar">${escapeHtml(equipeInitials(u.nome))}</span><span class="equipe-member-copy"><strong>${escapeHtml(u.nome||'Usuário')}</strong><small>${escapeHtml(u.email||'E-mail não informado')}</small></span><button class="equipe-card-menu" type="button" onclick="event.stopPropagation();selecionarMembroEquipe(${u.id})">•••</button></div><span class="equipe-role-badge ${escapeHtml(u.role||'')}">${escapeHtml(equipeRoleText(u.role))}</span><span class="equipe-status ${st==='inativo'?'inativo':''}">${equipeStatusText(u)}</span><div class="equipe-member-meta"><span><span>Data de criação</span><strong>${u.criado_em?formatarData(u.criado_em):'Não informada'}</strong></span><span><span>Último acesso</span><strong>Não informado</strong></span><span><span>Atividade</span><strong>Não disponível</strong></span></div></article>`;}
function renderEquipe(){const rows=equipeFiltered(),count=document.getElementById('equipe-results-count');if(count)count.textContent=`${rows.length} membro${rows.length===1?'':'s'} encontrado${rows.length===1?'':'s'}`;const box=document.getElementById('equipe-content');if(!box)return;if(!rows.length){box.innerHTML=`<div class="equipe-empty"><strong>${equipeRowsReal.length?'Nenhum membro encontrado':'Sua equipe ainda está vazia'}</strong><p>${equipeRowsReal.length?'Não encontramos usuários com esses critérios.':'Adicione membros para começar a distribuir o trabalho e gerenciar acessos.'}</p>${equipeRowsReal.length?'<button class="btn btn-sec" type="button" onclick="limparFiltrosEquipe()">Limpar filtros</button>':'<button class="btn btn-primary" type="button" onclick="abrirModalNovoMembroEquipe()">+ Adicionar membro</button>'}</div>`;return;}if(equipeState.display==='lista')box.innerHTML=`<div class="equipe-lista"><table class="equipe-list-table"><thead><tr><th>Membro</th><th>Função</th><th>Status</th><th>Criação</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>${rows.map(u=>`<tr onclick="selecionarMembroEquipe(${u.id})"><td><span class="equipe-avatar">${escapeHtml(equipeInitials(u.nome))}</span>${escapeHtml(u.nome||'—')}<small style="display:block;margin-left:32px;color:#958990">${escapeHtml(u.email||'—')}</small></td><td>${escapeHtml(equipeRoleText(u.role))}</td><td><span class="equipe-status ${u.ativo===false?'inativo':''}">${equipeStatusText(u)}</span></td><td>${u.criado_em?formatarData(u.criado_em):'—'}</td><td>Não informado</td><td><button class="equipe-card-menu" onclick="event.stopPropagation();selecionarMembroEquipe(${u.id})">•••</button></td></tr>`).join('')}</tbody></table></div>`;else box.innerHTML=`<div class="equipe-grid">${rows.map(equipeCard).join('')}</div>`;}
function selecionarMembroEquipe(id){equipeState.selectedId=id;renderEquipe();renderEquipeDetalhe(equipeRowsReal.find(u=>Number(u.id)===Number(id)));}
function equipePermissions(role){const admin=role==='admin_empresa',rec=role==='recrutador';return[['Vagas',true,admin||rec],['Candidatos',true,admin||rec],['Entrevistas',true,admin||rec],['Propostas',true,admin||rec],['Contratações',true,admin||rec],['Relatórios',true,admin||rec],['Equipe',true,admin||rec]];}
function renderEquipeDetalhe(u){const panel=document.getElementById('equipe-detail-panel');if(!panel||!u)return;const perms=equipePermissions(u.role);panel.classList.add('aberto');panel.innerHTML=`<div class="equipe-detail-content"><div class="equipe-detail-head"><span class="equipe-detail-avatar">${escapeHtml(equipeInitials(u.nome))}</span><div class="equipe-detail-copy"><h3>${escapeHtml(u.nome||'Usuário')}</h3><p>${escapeHtml(u.email||'E-mail não informado')}</p><span class="equipe-detail-status ${u.ativo===false?'inativo':''}">${equipeStatusText(u)}</span></div><button class="equipe-detail-close" type="button" onclick="fecharMembroEquipe()">×</button></div>${empresaEhAdmin()?`<div class="equipe-detail-actions"><button class="primary" type="button" onclick="editarMembroEquipe(${u.id})">Editar acesso</button>${u.ativo===false?`<button type="button" onclick="reativarMembroEquipe(${u.id})">Reativar</button>`:`<button type="button" onclick="desativarMembroEquipe(${u.id})">Desativar</button>`}</div>`:''}<section class="equipe-detail-section"><h4>Perfil do membro</h4><div class="equipe-info-grid"><div class="equipe-info-item"><small>Nome</small><strong>${escapeHtml(u.nome||'—')}</strong></div><div class="equipe-info-item"><small>E-mail</small><strong>${escapeHtml(u.email||'—')}</strong></div><div class="equipe-info-item"><small>Cargo</small><strong>${escapeHtml(u.cargo||'Não informado')}</strong></div><div class="equipe-info-item"><small>Função</small><strong>${escapeHtml(equipeRoleText(u.role))}</strong></div><div class="equipe-info-item"><small>Data de criação</small><strong>${u.criado_em?formatarData(u.criado_em):'Não informada'}</strong></div><div class="equipe-info-item"><small>Último acesso</small><strong>Não informado pelo backend</strong></div></div></section><section class="equipe-detail-section"><h4>Permissões baseadas na função</h4><div class="equipe-permission-list">${perms.map(x=>`<div class="equipe-permission-item ${x[2]?'':'no'}"><strong>${x[0]}</strong><span>${x[2]?'Permitido':'Não permitido'}</span></div>`).join('')}</div><div class="equipe-note" style="margin-top:7px">O backend atual trabalha com funções RBAC (administrador da empresa, recrutador e Filial). Não há editor granular de permissões disponível nesta conta.</div></section><section class="equipe-detail-section"><h4>Atividade do membro</h4><div class="equipe-note">Não há endpoint de atividade individual ou último acesso disponível para exibir com segurança.</div></section></div>`;}
function fecharMembroEquipe(){equipeState.selectedId=null;document.getElementById('equipe-detail-panel')?.classList.remove('aberto');renderEquipe();}
async function editarMembroEquipe(id){const u=equipeRowsReal.find(x=>Number(x.id)===Number(id));if(!u)return;const cargo=prompt('Cargo:',u.cargo||'');if(cargo===null)return;const role=prompt('Função (admin_empresa, recrutador ou viewer = Filial):',u.role||'recrutador');if(role===null)return;if(!['admin_empresa','recrutador','viewer'].includes(role)){alert('Função inválida.');return;}try{const r=await fetch(API+'/api/empresa/usuarios/'+id,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({cargo,role})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível atualizar o usuário');alert('Usuário atualizado com sucesso.');await carregarEquipe();selecionarMembroEquipe(id);}catch(e){alert(e.message);}}
async function desativarMembroEquipe(id){const u=equipeRowsReal.find(x=>Number(x.id)===Number(id));if(!u||!confirm(`Desativar o acesso de ${u.nome}?\n\nO usuário perderá acesso ao portal da empresa.`))return;try{const r=await fetch(API+'/api/empresa/usuarios/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+token}}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível desativar o usuário');alert('Usuário desativado com sucesso.');await carregarEquipe();}catch(e){alert(e.message);}}
async function reativarMembroEquipe(id){try{const r=await fetch(API+'/api/empresa/usuarios/'+id,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({ativo:true})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível reativar o usuário');alert('Usuário reativado com sucesso.');await carregarEquipe();selecionarMembroEquipe(id);}catch(e){alert(e.message);}}
function abrirModalNovoMembroEquipe(){['equipe-novo-nome','equipe-novo-email','equipe-novo-cargo'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const role=document.getElementById('equipe-novo-role');if(role){role.innerHTML=empresaEhAdmin()?'<option value="viewer">Filial</option><option value="recrutador">Recrutador</option><option value="admin_empresa">Administrador da empresa</option>':'<option value="viewer">Filial</option>';role.value='viewer';}const a=document.getElementById('equipe-modal-alert');if(a)a.innerHTML='';abrirModal('equipe-novo');}
async function salvarNovoMembroEquipe(){const nome=document.getElementById('equipe-novo-nome').value.trim(),email=document.getElementById('equipe-novo-email').value.trim(),cargo=document.getElementById('equipe-novo-cargo').value.trim(),role=empresaEhAdmin()?document.getElementById('equipe-novo-role').value:'viewer',a=document.getElementById('equipe-modal-alert'),btn=document.getElementById('btn-enviar-convite-equipe');if(!nome||!email){a.innerHTML='<div class="alert alert-erro">Preencha nome e e-mail.</div>';return;}if(a)a.innerHTML='<div class="alert alert-info">Enviando convite...</div>';if(btn){btn.disabled=true;btn.textContent='Enviando...';}try{const r=await fetch(API+'/api/empresa/convites',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({nome,email,cargo,role})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível enviar o convite');fecharModal('equipe-novo');alert('Convite enviado com sucesso.');await carregarEquipe();}catch(e){if(a)a.innerHTML=`<div class="alert alert-erro">${escapeHtml(e.message||'Não foi possível enviar o convite')}</div>`;}finally{if(btn){btn.disabled=false;btn.textContent='Enviar convite';}}}
function limparFiltrosEquipe(){equipeState.filtro='todos';equipeState.busca='';const q=document.getElementById('equipe-busca');if(q)q.value='';document.querySelectorAll('.equipe-quick-filters button').forEach(b=>b.classList.toggle('ativo',b.dataset.filter==='todos'));renderEquipe();}
function bindEquipeControls(){if(window.__equipeControlsBound)return;window.__equipeControlsBound=true;document.getElementById('equipe-busca')?.addEventListener('input',e=>{equipeState.busca=e.target.value;renderEquipe();});document.getElementById('equipe-ordenar')?.addEventListener('change',e=>{equipeState.ordenar=e.target.value;renderEquipe();});document.querySelectorAll('.equipe-quick-filters button').forEach(b=>b.addEventListener('click',()=>{equipeState.filtro=b.dataset.filter;document.querySelectorAll('.equipe-quick-filters button').forEach(x=>x.classList.toggle('ativo',x===b));renderEquipe();}));}
bindEquipeControls();

// ===== CONFIGURAÇÕES — recursos reais da empresa =====
const configState={tab:'empresa',empresa:null,totp:null,prefs:null};
async function carregarConfiguracoes(){const box=document.getElementById('config-content');if(box)box.innerHTML='<div class="config-loading"><span class="spinner"></span> Carregando configurações...</div>';try{const h={'Authorization':'Bearer '+token};const [er,tr,pr]=await Promise.all([fetch(API+'/api/empresa/minha-empresa',{headers:h}),fetch(API+'/api/empresa/2fa/status',{headers:h}),fetch(API+'/api/email/preferencias',{headers:h})]);const ed=await er.json(),td=await tr.json(),pd=await pr.json();if(!er.ok)throw new Error(ed.erro||'Não foi possível carregar a empresa');configState.empresa=ed.empresa;configState.totp=tr.ok?td:null;configState.prefs=pr.ok?(pd.preferencias||[]):null;renderConfiguracoes();}catch(e){if(box)box.innerHTML=`<div class="config-empty"><strong>Não foi possível carregar esta configuração.</strong><p>${escapeHtml(e.message||'Tente novamente.')}</p><button class="config-btn" type="button" onclick="carregarConfiguracoes()">Tentar novamente</button></div>`;}}
function trocarConfigTab(tab){configState.tab=tab;document.querySelectorAll('.config-nav [data-config-tab]').forEach(b=>b.classList.toggle('ativo',b.dataset.configTab===tab));renderConfiguracoes();}
function renderConfiguracoes(){const box=document.getElementById('config-content');if(!box)return;const admin=empresaEhAdmin();if(!admin)configState.tab='seguranca';if(configState.tab==='seguranca')box.innerHTML=renderConfigSeguranca();else if(configState.tab==='conta')box.innerHTML=renderConfigConta();else box.innerHTML=renderConfigEmpresa(configState.empresa||{});document.querySelectorAll('.config-nav [data-config-tab]').forEach(b=>{b.style.display=(admin||b.dataset.configTab==='seguranca')?'':'none';b.onclick=()=>trocarConfigTab(b.dataset.configTab);});}
function renderConfigEmpresa(e){return`<div class="config-section-header"><div><h3>Perfil da empresa</h3><p>Atualize os dados institucionais que o backend disponibiliza.</p></div><svg class="dash-svg"><use href="#icon-briefcase"></use></svg></div><div id="config-empresa-alert"></div><form onsubmit="salvarPerfilEmpresa(event)"><div class="config-form-grid"><label class="config-field">Nome da empresa<input id="config-empresa-nome" value="${escapeHtml(e.nome||'')}" required></label><label class="config-field">CNPJ<input value="${escapeHtml(e.cnpj||'Não informado')}" readonly><span class="config-help">Campo somente leitura nesta API.</span></label><label class="config-field">E-mail principal<input id="config-empresa-email" type="email" value="${escapeHtml(e.email_principal||'')}"></label><label class="config-field">Telefone<input id="config-empresa-telefone" value="${escapeHtml(e.telefone||'')}"></label><label class="config-field">Site<input id="config-empresa-site" type="url" value="${escapeHtml(e.site||'')}"></label><label class="config-field">Setor<input id="config-empresa-setor" value="${escapeHtml(e.setor||'')}"></label><label class="config-field">Tamanho<input id="config-empresa-tamanho" value="${escapeHtml(e.tamanho||'')}"></label><label class="config-field">Logo (URL)<input id="config-empresa-logo" type="url" value="${escapeHtml(e.logo_url||'')}"></label><label class="config-field">Cidade<input id="config-empresa-cidade" value="${escapeHtml(e.cidade||'')}"></label><label class="config-field">Estado<input id="config-empresa-estado" value="${escapeHtml(e.estado||'')}"></label><label class="config-field full">Descrição<textarea id="config-empresa-descricao">${escapeHtml(e.descricao||'')}</textarea></label></div><div class="config-actions"><button class="config-btn primary" type="submit">Salvar dados da empresa</button></div></form><div class="config-card"><h4>Recursos disponíveis</h4><p>Configurações específicas do processo de recrutamento não possuem endpoints próprios nesta conta. Elas não foram simuladas nesta central.</p></div>`;}
async function salvarPerfilEmpresa(ev){ev.preventDefault();const alertBox=document.getElementById('config-empresa-alert'),body={nome:document.getElementById('config-empresa-nome').value.trim(),email_principal:document.getElementById('config-empresa-email').value.trim()||null,telefone:document.getElementById('config-empresa-telefone').value.trim()||null,site:document.getElementById('config-empresa-site').value.trim()||null,setor:document.getElementById('config-empresa-setor').value.trim()||null,tamanho:document.getElementById('config-empresa-tamanho').value.trim()||null,logo_url:document.getElementById('config-empresa-logo').value.trim()||null,cidade:document.getElementById('config-empresa-cidade').value.trim()||null,estado:document.getElementById('config-empresa-estado').value.trim()||null,descricao:document.getElementById('config-empresa-descricao').value.trim()||null};try{const r=await fetch(API+'/api/empresa/minha-empresa',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível salvar os dados');configState.empresa={...configState.empresa,...d.empresa};alertBox.innerHTML='<div class="config-alert success">Dados da empresa salvos com confirmação do backend.</div>';}catch(e){alertBox.innerHTML=`<div class="config-alert">${escapeHtml(e.message)}</div>`;}}
function renderConfigSeguranca(){const t=configState.totp||{};return`<div class="config-section-header"><div><h3>Segurança</h3><p>Proteja o acesso da sua conta empresarial.</p></div><svg class="dash-svg"><use href="#icon-settings"></use></svg></div><div id="config-seguranca-alert"></div><div class="config-security-grid"><section class="config-security-card"><h4>Alterar senha</h4><p>A senha atual será validada pelo backend. Após a alteração, as sessões de refresh serão revogadas.</p><form class="config-form-grid" onsubmit="alterarSenhaEmpresa(event)"><label class="config-field">Senha atual<input id="config-senha-atual" type="password" autocomplete="current-password" required></label><label class="config-field">Nova senha<input id="config-senha-nova" type="password" minlength="8" autocomplete="new-password" required></label><label class="config-field">Confirmar nova senha<input id="config-senha-confirma" type="password" minlength="8" autocomplete="new-password" required></label><div class="config-actions"><button class="config-btn primary" type="submit">Alterar senha</button></div></form></section>${empresaEhAdmin()?`<section class="config-security-card"><h4>Autenticação em dois fatores</h4><p>Use um aplicativo autenticador para proteger o login da empresa.</p><span class="config-status ${t.totp_ativo?'on':''}">${t.totp_ativo?'Ativada':'Desativada'}</span><div class="config-actions" style="justify-content:flex-start">${t.totp_ativo?'<button class="config-btn" type="button" onclick="desativar2faEmpresa()">Desativar 2FA</button>':'<button class="config-btn primary" type="button" onclick="iniciar2faEmpresa()">Ativar 2FA</button>'}</div><div id="config-2fa-setup" class="config-2fa-setup"></div></section>`:``}</div>${empresaEhAdmin()?renderConfigEmailPrefs():''}<div class="config-card"><h4>Recursos não disponíveis</h4><p>O backend atual não expõe sessões ou histórico de acessos para gerenciamento nesta tela.</p></div>`;}
function renderConfigEmailPrefs(){const labels={candidatura:'Confirmação de candidatura',etapa:'Mudanças de etapa',entrevista:'Entrevistas',proposta:'Propostas',chat:'Mensagens',marketing:'Novidades e marketing'};if(!Array.isArray(configState.prefs))return'<div class="config-card"><h4>Preferências de e-mail</h4><p>O backend não retornou preferências para esta conta. Nenhuma configuração foi simulada.</p></div>';return'<div class="config-card"><h4>Preferências de e-mail</h4><p>Controle os avisos transacionais disponíveis no backend. Mensagens de segurança e recuperação permanecem obrigatórias.</p><div class="config-pref-list">'+configState.prefs.map(p=>{const c=String(p.categoria||'');return'<label class="config-pref-row"><span><strong>'+escapeHtml(labels[c]||c)+'</strong><small>Categoria: '+escapeHtml(c)+'</small></span><input type="checkbox" data-email-pref="'+escapeHtml(c)+'" '+(p.ativo?'checked':'')+'></label>';}).join('')+'</div></div>';}
async function alterarPreferenciaEmail(categoria,ativo){try{const r=await fetch(API+'/api/email/preferencias',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({categoria,ativo})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível salvar a preferência');const p=configState.prefs.find(x=>x.categoria===categoria);if(p)p.ativo=!!ativo;}catch(e){alert(e.message);carregarConfiguracoes();}}
document.addEventListener('change',e=>{const input=e.target.closest('[data-email-pref]');if(input)alterarPreferenciaEmail(input.dataset.emailPref,input.checked);});
async function alterarSenhaEmpresa(ev){ev.preventDefault();const a=document.getElementById('config-seguranca-alert'),at=document.getElementById('config-senha-atual').value,n=document.getElementById('config-senha-nova').value,c=document.getElementById('config-senha-confirma').value;if(n!==c){a.innerHTML='<div class="config-alert">A confirmação da nova senha não coincide.</div>';return;}try{const r=await fetch(API+'/api/empresa/trocar-senha',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({senha_atual:at,senha_nova:n})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível alterar a senha');a.innerHTML=`<div class="config-alert success">${escapeHtml(d.msg||'Senha alterada com sucesso.')}</div>`;ev.target.reset();}catch(e){a.innerHTML=`<div class="config-alert">${escapeHtml(e.message)}</div>`;}}
async function iniciar2faEmpresa(){const box=document.getElementById('config-2fa-setup');if(!box)return;box.classList.add('aberto');box.innerHTML='<span class="config-help">Gerando configuração segura...</span>';try{const r=await fetch(API+'/api/empresa/2fa/iniciar',{method:'POST',headers:{'Authorization':'Bearer '+token}}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível iniciar o 2FA');box.innerHTML=`<div class="config-2fa-qr"><img src="${escapeHtml(d.qrCodeUrl)}" alt="QR Code para configurar 2FA"><span class="config-2fa-secret">Se necessário, use esta chave: <strong>${escapeHtml(d.secret)}</strong></span></div><label class="config-field">Código de 6 dígitos<input id="config-2fa-codigo" inputmode="numeric" maxlength="6" placeholder="000000"></label><div class="config-actions" style="justify-content:flex-start"><button class="config-btn primary" type="button" onclick="confirmar2faEmpresa()">Confirmar ativação</button></div>`;}catch(e){box.innerHTML=`<div class="config-alert">${escapeHtml(e.message)}</div>`;}}
async function confirmar2faEmpresa(){const codigo=document.getElementById('config-2fa-codigo')?.value.trim(),box=document.getElementById('config-2fa-setup');if(!/^\d{6}$/.test(codigo||'')){box.innerHTML+='<div class="config-alert">Informe o código de 6 dígitos.</div>';return;}try{const r=await fetch(API+'/api/empresa/2fa/confirmar',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({codigo})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Código incorreto');box.innerHTML=`<div class="config-alert success">${escapeHtml(d.msg||'2FA ativado com sucesso.')}</div><div class="config-backup-codes">${(d.backup_codes||[]).map(x=>`<code>${escapeHtml(x)}</code>`).join('')}</div>`;configState.totp={totp_ativo:true};}catch(e){box.innerHTML+=`<div class="config-alert">${escapeHtml(e.message)}</div>`;}}
async function desativar2faEmpresa(){const senha=prompt('Informe sua senha para desativar o 2FA:');if(!senha)return;try{const r=await fetch(API+'/api/empresa/2fa/desativar',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({senha})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível desativar o 2FA');alert(d.msg||'2FA desativado.');configState.totp={totp_ativo:false};renderConfiguracoes();}catch(e){alert(e.message);}}
function renderConfigConta(){const e=configState.empresa||{},payload=configTokenPayload();return`<div class="config-section-header"><div><h3>Dados da conta</h3><p>Identificação real da empresa, plano e usuário conectado.</p></div><svg class="dash-svg"><use href="#icon-user"></use></svg></div><div class="config-readonly-grid"><div class="config-readonly-item"><small>ID da empresa</small><strong>${escapeHtml(e.id||'Não informado')}</strong></div><div class="config-readonly-item"><small>Slug</small><strong>${escapeHtml(e.slug||'Não informado')}</strong></div><div class="config-readonly-item"><small>Status da conta</small><strong>${e.ativo===false?'Inativa':'Ativa'}</strong></div><div class="config-readonly-item"><small>Plano</small><strong>${escapeHtml(e.plano_nome||'Não informado')}</strong></div><div class="config-readonly-item"><small>Data de cadastro</small><strong>${e.criado_em?formatarData(e.criado_em):'Não informada'}</strong></div><div class="config-readonly-item"><small>Onboarding</small><strong>${escapeHtml(e.onboarding_step??'Não informado')}</strong></div><div class="config-readonly-item"><small>E-mail do usuário</small><strong>${escapeHtml(payload.email||'Não informado')}</strong></div><div class="config-readonly-item"><small>Função do usuário</small><strong>${escapeHtml(equipeRoleText(payload.role))}</strong></div><div class="config-readonly-item"><small>Limite de usuários</small><strong>${escapeHtml(e.limite_usuarios??'Não informado')}</strong></div></div><div class="config-card"><h4>Limites do plano</h4><p>Vagas: <strong>${escapeHtml(e.limite_vagas??'Não informado')}</strong> · Candidaturas/mês: <strong>${escapeHtml(e.limite_candidaturas_mes??'Não informado')}</strong> · Preço mensal: <strong>${e.preco_mensal!=null?'R$ '+Number(e.preco_mensal).toLocaleString('pt-BR',{minimumFractionDigits:2}):'Não informado'}</strong></p></div><div class="config-card"><h4>Gerenciamento de equipe</h4><p>Usuários e acessos possuem uma central própria.</p><a class="config-btn" href="index.html?page=equipe" style="display:inline-flex;align-items:center;margin-top:8px;text-decoration:none">Gerenciar equipe →</a></div>`;}
function configTokenPayload(){try{const t=token||localStorage.getItem('empresa_token'),p=t?.split('.')[1];return p?JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))):{};}catch(_){return{};}}

// ===== RELATÓRIOS =====
const relatoriosState={periodo:'30',inicio:null,fim:null,vaga:'',etapa:'',chart:'candidatos'};let relatoriosData={candidaturas:[],entrevistas:[],vagas:[]};
function relatorioDate(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
function relatorioDateText(v){const d=relatorioDate(v);return d?d.toLocaleDateString('pt-BR'):'—';}
function relatorioPeriod(){const now=new Date();let start=new Date(now);start.setHours(0,0,0,0);let end=new Date(now);end.setHours(23,59,59,999);if(relatoriosState.periodo==='ano'){start=new Date(now.getFullYear(),0,1);start.setHours(0,0,0,0);}else if(relatoriosState.periodo!=='hoje'&&relatoriosState.periodo!=='custom'){start.setDate(start.getDate()-Number(relatoriosState.periodo)+1);}else if(relatoriosState.periodo==='custom'){start=relatorioDate(relatoriosState.inicio)||start;end=relatorioDate(relatoriosState.fim)||end;start.setHours(0,0,0,0);end.setHours(23,59,59,999);}return{start,end};}
function relatorioInPeriod(v){const d=relatorioDate(v),p=relatorioPeriod();return d&&d>=p.start&&d<=p.end;}
function relatorioCands(){return relatoriosData.candidaturas.filter(c=>(!relatoriosState.vaga||String(c.vaga_id)===String(relatoriosState.vaga))&&(!relatoriosState.etapa||String(c.etapa_atual)===String(relatoriosState.etapa))&&(relatorioInPeriod(c.criada_em)||relatorioInPeriod(c.atualizada_em)));}
function relatorioInterviews(){return relatoriosData.entrevistas.filter(e=>(!relatoriosState.vaga||String(e.vaga_id)===String(relatoriosState.vaga))&&relatorioInPeriod(e.data_hora));}
function relatorioUnique(rows,key){return new Set(rows.map(x=>x[key]).filter(Boolean)).size;}
function relatorioFormatNum(n){return Number(n||0).toLocaleString('pt-BR');}
function relatorioPercent(a,b){return b?`${(a/b*100).toFixed(1).replace('.',',')}%`:'—';}
function relatorioAvgDays(rows,startKey,endKey){const vals=rows.map(x=>{const a=relatorioDate(x[startKey]),b=relatorioDate(x[endKey]);return a&&b&&b>=a?(b-a)/86400000:null;}).filter(v=>v!==null);return vals.length?`${(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1).replace('.',',')} dias`:null;}
function relatorioFiltroTexto(){const p=relatorioPeriod();const vaga=relatoriosState.vaga?((relatoriosData.vagas||[]).find(v=>String(v.id)===String(relatoriosState.vaga))?.titulo||('Vaga '+relatoriosState.vaga)):'Todas as vagas';const etapa=document.getElementById('relatorios-filtro-etapa')?.selectedOptions?.[0]?.textContent||'Todas as etapas';return `Período: ${relatorioDateText(p.start)} a ${relatorioDateText(p.end)} | Vaga: ${vaga} | Etapa: ${etapa}`;}
function relatorioCsvCell(value){const text=value==null?'':String(value);return /[;"\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;}
function baixarCsv(nome,rows){const csv='\ufeff'+rows.map(row=>row.map(relatorioCsvCell).join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${nome}-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
function pdfAscii(value){return String(value==null?'':value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?');}
function pdfEscape(value){return pdfAscii(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
function pdfWrap(value,max){const text=pdfAscii(value),words=text.split(/\s+/),out=[];let line='';words.forEach(word=>{if(!word)return;if((line+' '+word).trim().length>max&&line){out.push(line);line=word;}else line=(line+' '+word).trim();});if(line||!out.length)out.push(line);return out;}
function criarPdf(lines){const pages=[];let page=[];lines.forEach(line=>{if(page.length>=52){pages.push(page);page=[];}page.push(line);});if(page.length||!pages.length)pages.push(page);const objects=[null],add=body=>{objects.push(body);return objects.length-1;},catalogId=add(''),pagesId=add(''),fontId=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),pageRefs=[];pages.forEach(pageLines=>{const ops=[];let y=800;pageLines.forEach(line=>{const size=line.size||9;ops.push(`BT /F1 ${size} Tf 40 ${y} Td (${pdfEscape(line.text)}) Tj ET`);y-=line.leading||14;});const contentId=add(`<< /Length ${ops.join('\n').length} >>\nstream\n${ops.join('\n')}\nendstream`);pageRefs.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`));});objects[pagesId]=`<< /Type /Pages /Kids [${pageRefs.map(id=>id+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`;objects[catalogId]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;let pdf='%PDF-1.4\n',offsets=[0];for(let id=1;id<objects.length;id++){offsets[id]=pdf.length;pdf+=`${id} 0 obj\n${objects[id]}\nendobj\n`;}const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let id=1;id<objects.length;id++)pdf+=`${String(offsets[id]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;return new TextEncoder().encode(pdf);}
function relatorioPdfLinesFromRows(titulo,rows){const lines=[{text:'VagasIO — '+titulo,size:18,leading:24},{text:relatorioFiltroTexto(),size:9,leading:16},{text:'Gerado em '+new Date().toLocaleString('pt-BR'),size:8,leading:20}];rows.forEach((row,index)=>{const text=row.map(v=>String(v==null?'':v)).join(' | ');pdfWrap(text,108).forEach((part,i)=>lines.push({text:part,size:index===0?9:8,leading:index===0?16:13}));});return lines;}
function relatorioPdfLines(tipo){const titulos={'resumo-vagas':'Indicador — Vagas abertas','resumo-candidatos':'Indicador — Candidatos ativos','resumo-entrevistas':'Indicador — Entrevistas','resumo-propostas':'Indicador — Propostas enviadas','resumo-contratacoes':'Indicador — Contratacoes','resumo-tempo':'Indicador — Tempo medio',evolucao:'Evolucao do recrutamento',funil:'Funil de contratacao','entrevistas-resumo':'Desempenho das entrevistas','propostas-resumo':'Desempenho das propostas',vagas:'Desempenho das vagas',tempo:'Tempo medio do processo'};return relatorioPdfLinesFromRows(titulos[tipo]||'Relatorio',relatorioExportRows(tipo));}
function baixarPdf(nome,lines){const blob=new Blob([criarPdf(lines)],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${nome}-${new Date().toISOString().slice(0,10)}.pdf`;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
function baixarPdfIndicador(tipo){const nomes={'resumo-vagas':'vagas-abertas','resumo-candidatos':'candidatos-ativos','resumo-entrevistas':'entrevistas','resumo-propostas':'propostas','resumo-contratacoes':'contratacoes','resumo-tempo':'tempo-medio',evolucao:'evolucao-recrutamento',funil:'funil-contratacao','entrevistas-resumo':'desempenho-entrevistas','propostas-resumo':'desempenho-propostas',vagas:'desempenho-vagas',tempo:'tempo-processo'};baixarPdf(`relatorio-${nomes[tipo]||tipo}`,relatorioPdfLines(tipo));}
function relatorioVagasExportRows(cands,ints){const map=new Map(),ensure=(id,title)=>{const key=id??title??'sem-vaga';if(!map.has(key))map.set(key,{titulo:title||'Vaga',candidatos:new Set(),entrevistas:0,propostas:0,contratacoes:0});return map.get(key);};cands.forEach(c=>{const x=ensure(c.vaga_id,c.titulo||c.vaga_titulo);if(c.candidato_id)x.candidatos.add(c.candidato_id);if(c.proposta_enviada_em&&relatorioInPeriod(c.proposta_enviada_em))x.propostas++;if(c.status==='contratado'&&relatorioInPeriod(c.atualizada_em))x.contratacoes++;});ints.forEach(e=>ensure(e.vaga_id,e.vaga_titulo).entrevistas++);return [...map.values()].sort((a,b)=>b.candidatos.size-a.candidatos.size);}
function relatorioExportRows(tipo){const c=relatorioCands(),i=relatorioInterviews(),v=relatoriosData.vagas||[],proposal=c.filter(x=>x.proposta_enviada_em&&relatorioInPeriod(x.proposta_enviada_em)),hire=c.filter(x=>x.status==='contratado'&&relatorioInPeriod(x.atualizada_em)),active=c.filter(x=>!['contratado','reprovado','rejeitado','cancelado'].includes(x.status)),open=v.filter(x=>x.status==='publicada').length,filter=relatorioFiltroTexto();const propostasAceitas=proposal.filter(x=>x.proposta_aceita_em).length;
 if(tipo==='resumo-vagas')return[['Filtro',filter],['Indicador','Vagas abertas'],['Valor',open]];
 if(tipo==='resumo-candidatos')return[['Filtro',filter],['Indicador','Candidatos ativos'],['Valor',relatorioUnique(active,'candidato_id')]];
 if(tipo==='resumo-entrevistas')return[['Filtro',filter],['Indicador','Entrevistas'],['Valor',i.length]];
 if(tipo==='resumo-propostas')return[['Filtro',filter],['Indicador','Propostas enviadas'],['Valor',proposal.length]];
 if(tipo==='resumo-contratacoes')return[['Filtro',filter],['Indicador','Contratações'],['Valor',hire.length]];
 if(tipo==='resumo-tempo')return[['Filtro',filter],['Indicador','Tempo médio aceite até contratação'],['Valor',relatorioAvgDays(hire,'proposta_aceita_em','atualizada_em')||'Dados insuficientes']];
 if(tipo==='evolucao'){const label={candidatos:'Candidatos',entrevistas:'Entrevistas',propostas:'Propostas',contratacoes:'Contratações'}[relatoriosState.chart]||'Candidatos';return[['Filtro',filter],['Indicador','Data',label],...relatorioMetricRows(c,i,relatoriosState.chart).map(x=>['Evolução',relatorioDateText(x.date),1])];}
 if(tipo==='funil'){const rows=[['Candidatos',relatorioUnique(c,'candidato_id')],['Triagem',relatorioUnique(c.filter(x=>Number(x.etapa_atual)>=1),'candidato_id')],['Entrevistas',relatorioUnique(i,'candidato_id')],['Propostas',relatorioUnique(proposal,'candidato_id')],['Contratações',relatorioUnique(hire,'candidato_id')]];return[['Filtro',filter],['Etapa','Quantidade'],...rows];}
 if(tipo==='entrevistas')return[['Filtro',filter],['Data','Vaga','Status','Candidato'],...i.map(x=>[relatorioDateText(x.data_hora),x.vaga_titulo||x.titulo||'—',x.status||'—',x.candidato_nome||x.nome||'—'])];
 if(tipo==='propostas')return[['Filtro',filter],['Candidato','Vaga','Status','Enviada em','Aceita em','Recusada em'],...proposal.map(x=>[x.nome||x.candidato_nome||'—',x.titulo||x.vaga_titulo||'—',x.proposta_aceita_em?'Aceita':x.proposta_recusada_em?'Recusada':'Aguardando',relatorioDateText(x.proposta_enviada_em),relatorioDateText(x.proposta_aceita_em),relatorioDateText(x.proposta_recusada_em)])];
 if(tipo==='vagas')return[['Filtro',filter],['Vaga','Candidatos','Entrevistas','Propostas','Contratações','Conversão'],...relatorioVagasExportRows(c,i).map(x=>[x.titulo,x.candidatos.size,x.entrevistas,x.propostas,x.contratacoes,relatorioPercent(x.contratacoes,x.candidatos.size)])];
 if(tipo==='tempo'){const stages=[['Candidatura → Triagem','Dados insuficientes'],['Triagem → Entrevista','Dados insuficientes'],['Entrevista → Proposta','Dados insuficientes'],['Proposta → Aceite',relatorioAvgDays(c,'proposta_enviada_em','proposta_aceita_em')||'Dados insuficientes'],['Aceite → Contratação',relatorioAvgDays(hire,'proposta_aceita_em','atualizada_em')||'Dados insuficientes'],['Total até contratação',relatorioAvgDays(hire,'criada_em','atualizada_em')||'Dados insuficientes']];return[['Filtro',filter],['Etapa','Tempo médio'],...stages];}
 if(tipo==='entrevistas-resumo')return[['Filtro',filter],['Indicador','Agendadas','Realizadas','Comparecimento','Cancelamentos','No-show'],['Entrevistas',i.length,i.filter(x=>x.status==='realizada').length,relatorioPercent(i.filter(x=>x.status==='realizada').length,i.length),relatorioPercent(i.filter(x=>x.status==='cancelada').length,i.length),relatorioPercent(i.filter(x=>x.status==='faltou').length,i.length)]];
 if(tipo==='propostas-resumo')return[['Filtro',filter],['Indicador','Enviadas','Aceitas','Recusadas','Taxa de aceite'],['Propostas',proposal.length,propostasAceitas,proposal.filter(x=>x.proposta_recusada_em).length,relatorioPercent(propostasAceitas,proposal.length)]];
 return[['Filtro',filter],['Indicador','Valor'],['Dados','Não disponível']];}
function baixarRelatorioIndicador(tipo){const nomes={'resumo-vagas':'vagas-abertas','resumo-candidatos':'candidatos-ativos','resumo-entrevistas':'entrevistas','resumo-propostas':'propostas','resumo-contratacoes':'contratacoes','resumo-tempo':'tempo-medio',evolucao:'evolucao-recrutamento',funil:'funil-contratacao',entrevistas:'desempenho-entrevistas','entrevistas-resumo':'desempenho-entrevistas',propostas:'desempenho-propostas','propostas-resumo':'desempenho-propostas',vagas:'desempenho-vagas',tempo:'tempo-processo'};baixarCsv(`relatorio-${nomes[tipo]||tipo}`,relatorioExportRows(tipo));}
function relatorioTodosExportRows(){const tipos=['resumo-vagas','resumo-candidatos','resumo-entrevistas','resumo-propostas','resumo-contratacoes','resumo-tempo','evolucao','funil','entrevistas-resumo','propostas-resumo','vagas','tempo'],labels={'resumo-vagas':'Resumo — Vagas','resumo-candidatos':'Resumo — Candidatos','resumo-entrevistas':'Resumo — Entrevistas','resumo-propostas':'Resumo — Propostas','resumo-contratacoes':'Resumo — Contratações','resumo-tempo':'Resumo — Tempo médio',evolucao:'Evolução',funil:'Funil','entrevistas-resumo':'Desempenho das entrevistas','propostas-resumo':'Desempenho das propostas',vagas:'Desempenho das vagas',tempo:'Tempo do processo'},out=[['Relatório','Campo/Indicador','Valor ou detalhe 1','Valor ou detalhe 2','Valor ou detalhe 3','Valor ou detalhe 4','Valor ou detalhe 5']];tipos.forEach(tipo=>{const rows=relatorioExportRows(tipo);rows.slice(1).forEach(row=>{const line=[labels[tipo],...row];while(line.length<7)line.push('');out.push(line);});});return out;}
function baixarTodosRelatorios(){baixarCsv('relatorios-vagasio-completo',relatorioTodosExportRows());}
function baixarTodosPdf(){baixarPdf('relatorios-vagasio-completo',relatorioPdfLinesFromRows('Relatórios completos',relatorioTodosExportRows()));}
async function carregarRelatorios(){const box=document.getElementById('relatorios-content');if(box)box.innerHTML='<div class="relatorios-loading"><span class="spinner"></span> Carregando inteligência operacional...</div>';try{const headers={'Authorization':'Bearer '+token};const [cr,ir,vr]=await Promise.all([fetch(API+'/api/empresa/candidaturas',{headers}),fetch(API+'/api/empresa/entrevistas?periodo=todas',{headers}),fetch(API+'/api/empresa/vagas',{headers})]);const [c,i,v]=await Promise.all([cr.json(),ir.json(),vr.json()]);if(!cr.ok)throw new Error(c.erro||'Não foi possível carregar candidaturas');relatoriosData={candidaturas:c.candidaturas||[],entrevistas:i.entrevistas||[],vagas:v.vagas||[]};popularFiltrosRelatorios();renderRelatorios();}catch(e){if(box)box.innerHTML=`<div class="relatorio-empty"><strong>Não foi possível carregar este relatório.</strong>${escapeHtml(e.message||'Tente novamente.')}</div>`;}}
function popularFiltrosRelatorios(){const s=document.getElementById('relatorios-filtro-vaga');if(!s)return;const cur=s.value,vs=[...new Map(relatoriosData.vagas.map(v=>[v.id,v])).values()];s.innerHTML='<option value="">Todas as vagas</option>'+vs.map(v=>`<option value="${v.id}">${escapeHtml(v.titulo||'Vaga')}</option>`).join('');s.value=cur||'';}
function atualizarResumoRelatorios(cands,ints,vagas){const proposals=cands.filter(c=>c.proposta_enviada_em&&relatorioInPeriod(c.proposta_enviada_em)),hires=cands.filter(c=>c.status==='contratado'&&relatorioInPeriod(c.atualizada_em)),active=cands.filter(c=>!['contratado','reprovado','rejeitado','cancelado'].includes(c.status));const open=vagas.filter(v=>v.status==='publicada').length,avg=relatorioAvgDays(hires,'proposta_aceita_em','atualizada_em');const vals={vagas:open,candidatos:relatorioUnique(active,'candidato_id'),entrevistas:ints.length,propostas:proposals.length,contratacoes:hires.length,tempo:avg||'—'};document.querySelectorAll('[data-report]').forEach(e=>e.textContent=vals[e.dataset.report]??'—');}
function relatorioMetricRows(cands,ints,metric){if(metric==='entrevistas')return ints.map(x=>({date:x.data_hora}));if(metric==='propostas')return cands.filter(x=>x.proposta_enviada_em&&relatorioInPeriod(x.proposta_enviada_em)).map(x=>({date:x.proposta_enviada_em}));if(metric==='contratacoes')return cands.filter(x=>x.status==='contratado'&&relatorioInPeriod(x.atualizada_em)).map(x=>({date:x.atualizada_em}));return cands.filter(x=>relatorioInPeriod(x.criada_em)).map(x=>({date:x.criada_em}));}
function renderRelatorioChart(cands,ints){const metricLabels={candidatos:'Candidatos',entrevistas:'Entrevistas',propostas:'Propostas',contratacoes:'Contratações'},rows=relatorioMetricRows(cands,ints,relatoriosState.chart),boxId='relatorio-chart-svg';if(!rows.length)return`<div class="relatorio-chart-panel relatorio-panel"><div class="relatorio-panel-head"><div><h3>Evolução do recrutamento</h3><p>Não há dados suficientes para gerar este gráfico no período.</p></div></div><div class="relatorio-chart-wrap"><div class="relatorio-chart-empty">Dados insuficientes para gerar este indicador.</div></div><div class="relatorio-chart-legend">${Object.entries(metricLabels).map(([k,l])=>`<button class="${relatoriosState.chart===k?'ativo':''}" onclick="trocarRelatorioChart('${k}')">${l}</button>`).join('')}</div></div>`;const p=relatorioPeriod(),days=Math.max(1,Math.ceil((p.end-p.start)/86400000)),buckets=Math.min(12,days),step=buckets>1?(p.end-p.start)/(buckets-1):0,counts=Array.from({length:buckets},()=>0);rows.forEach(r=>{const d=relatorioDate(r.date),idx=Math.min(buckets-1,Math.max(0,Math.floor((d-p.start)/Math.max(1,step))));counts[idx]++;});const max=Math.max(...counts,1),pts=counts.map((v,i)=>{const x=8+i*(84/Math.max(1,buckets-1)),y=92-(v/max*75);return`${x.toFixed(1)},${y.toFixed(1)}`;}).join(' '),area=`8,92 ${pts} 92,92`;return`<div class="relatorio-chart-panel relatorio-panel"><div class="relatorio-panel-head"><div><h3>Evolução do recrutamento</h3><p>${metricLabels[relatoriosState.chart]} · ${relatorioDateText(p.start)} a ${relatorioDateText(p.end)}</p></div></div><div class="relatorio-chart-wrap"><svg id="${boxId}" class="relatorio-line-chart" viewBox="0 0 100 100" preserveAspectRatio="none"><line class="grid" x1="8" y1="17" x2="92" y2="17"></line><line class="grid" x1="8" y1="42" x2="92" y2="42"></line><line class="grid" x1="8" y1="67" x2="92" y2="67"></line><line class="grid" x1="8" y1="92" x2="92" y2="92"></line><polygon class="area" points="${area}"></polygon><polyline class="line" points="${pts}"></polyline>${counts.map((v,i)=>{const x=8+i*(84/Math.max(1,buckets-1)),y=92-(v/max*75);return`<circle class="dot" cx="${x}" cy="${y}" r="1.4"><title>${relatorioDateText(new Date(p.start.getTime()+i*step))}: ${v} ${metricLabels[relatoriosState.chart]}</title></circle>`;}).join('')}</svg></div><div class="relatorio-chart-legend">${Object.entries(metricLabels).map(([k,l])=>`<button class="${relatoriosState.chart===k?'ativo':''}" onclick="trocarRelatorioChart('${k}')">${l}</button>`).join('')}</div></div>`;}
function renderRelatorioFunnel(cands,ints){const candidates=relatorioUnique(cands,'candidato_id'),triagem=relatorioUnique(cands.filter(c=>Number(c.etapa_atual)>=1),'candidato_id'),interviews=relatorioUnique(ints,'candidato_id'),proposals=relatorioUnique(cands.filter(c=>c.proposta_enviada_em&&relatorioInPeriod(c.proposta_enviada_em)),'candidato_id'),hires=relatorioUnique(cands.filter(c=>c.status==='contratado'&&relatorioInPeriod(c.atualizada_em)),'candidato_id'),vals=[['Candidatos',candidates],['Triagem',triagem],['Entrevistas',interviews],['Propostas',proposals],['Contratações',hires]],max=Math.max(...vals.map(x=>x[1]),1);return`<section class="relatorio-funnel-panel relatorio-panel"><div class="relatorio-panel-head"><div><h3>Funil de contratação</h3><p>Conversão calculada no período selecionado.</p></div></div><div class="relatorio-funnel">${vals.map(([l,v],i)=>`<div class="relatorio-funnel-row" title="Abrir dados de ${l}"><span class="relatorio-funnel-label">${l}</span><span class="relatorio-funnel-track"><i style="width:${v?Math.max(3,v/max*100):0}%"></i></span><strong class="relatorio-funnel-value">${relatorioFormatNum(v)}</strong></div>`).join('')}<div class="relatorio-funnel-conv"><span>Candidatos → Entrevistas: ${relatorioPercent(interviews,candidates)}</span><span>Entrevistas → Propostas: ${relatorioPercent(proposals,interviews)}</span><span>Propostas → Contratações: ${relatorioPercent(hires,proposals)}</span></div></div></section>`;}
function renderRelatorioVagas(cands,ints){const map=new Map();const ensure=(id,title)=>{if(!map.has(id))map.set(id,{id,titulo:title||'Vaga',candidatos:new Set(),entrevistas:0,propostas:0,contratacoes:0});return map.get(id);};cands.forEach(c=>{const x=ensure(c.vaga_id,c.titulo);if(c.candidato_id)x.candidatos.add(c.candidato_id);if(c.proposta_enviada_em&&relatorioInPeriod(c.proposta_enviada_em))x.propostas++;if(c.status==='contratado'&&relatorioInPeriod(c.atualizada_em))x.contratacoes++;});ints.forEach(e=>ensure(e.vaga_id,e.vaga_titulo).entrevistas++);const rows=[...map.values()];if(!rows.length)return'<section class="relatorio-table-panel relatorio-panel"><div class="relatorio-panel-head"><div><h3>Desempenho das vagas</h3></div></div><div class="relatorio-empty"><strong>Dados insuficientes</strong>Não há movimentações de vagas no período selecionado.</div></section>';return`<section class="relatorio-table-panel relatorio-panel"><div class="relatorio-panel-head"><div><h3>Desempenho das vagas</h3><p>Compare o volume e a conversão por vaga.</p></div></div><div class="relatorio-table-wrap"><table class="relatorio-table"><thead><tr><th>Vaga</th><th>Candidatos</th><th>Entrevistas</th><th>Propostas</th><th>Contratações</th><th>Conversão</th></tr></thead><tbody>${rows.sort((a,b)=>b.candidatos.size-a.candidatos.size).map(x=>`<tr onclick="irPara('vagas')"><td class="relatorio-vaga-link">${escapeHtml(x.titulo)}</td><td>${x.candidatos.size}</td><td>${x.entrevistas}</td><td>${x.propostas}</td><td>${x.contratacoes}</td><td>${relatorioPercent(x.contratacoes,x.candidatos.size)}</td></tr>`).join('')}</tbody></table></div></section>`;}
function renderRelatorios(){const c=relatorioCands(),i=relatorioInterviews(),v=relatoriosData.vagas;atualizarResumoRelatorios(c,i,v);const proposal=c.filter(x=>x.proposta_enviada_em&&relatorioInPeriod(x.proposta_enviada_em)),hire=c.filter(x=>x.status==='contratado'&&relatorioInPeriod(x.atualizada_em)),done=i.filter(x=>x.status==='realizada'),cancel=i.filter(x=>x.status==='cancelada'),noShow=i.filter(x=>x.status==='faltou'),att=[];const pending=c.filter(x=>x.status&&!['contratado','reprovado','rejeitado','cancelado'].includes(x.status)&&Number(x.etapa_atual)<=1).length;if(pending)att.push(`<div class="relatorio-attention-item"><svg class="dash-svg"><use href="#icon-bell"></use></svg><span><strong>${pending} processo${pending>1?'s':''} nas etapas iniciais</strong>Isso pode indicar um ponto de atenção na triagem.</span></div>`);if(!att.length)att.push('<div class="relatorio-empty"><strong>Sem alertas calculáveis</strong>Não há dados suficientes para identificar gargalos no período.</div>');const attend=i.length?relatorioPercent(done,i.length):'—',cancelRate=i.length?relatorioPercent(cancel.length,i.length):'—',noRate=i.length?relatorioPercent(noShow.length,i.length):'—';const total=c.length,stageTimes=[['Candidatura → Triagem','Dados insuficientes'],['Triagem → Entrevista','Dados insuficientes'],['Entrevista → Proposta','Dados insuficientes'],['Proposta → Aceite',relatorioAvgDays(c,'proposta_enviada_em','proposta_aceita_em')||'Dados insuficientes'],['Aceite → Contratação',relatorioAvgDays(hire,'proposta_aceita_em','atualizada_em')||'Dados insuficientes']];document.getElementById('relatorios-content').innerHTML=`<div class="relatorios-grid">${renderRelatorioChart(c,i)}${renderRelatorioFunnel(c,i)}<div class="relatorios-grid-three"><section class="relatorio-panel"><div class="relatorio-panel-head"><div><h3>Pontos de atenção</h3><p>Gargalos identificáveis com os dados atuais.</p></div></div><div class="relatorio-attention">${att.join('')}</div></section><section class="relatorio-panel"><div class="relatorio-panel-head"><div><h3>Desempenho das entrevistas</h3><p>Indicadores do período.</p></div></div><div class="relatorio-stat-list"><div class="relatorio-stat-row"><span>Agendadas</span><strong>${i.length}</strong></div><div class="relatorio-stat-row"><span>Realizadas</span><strong>${done.length}</strong></div><div class="relatorio-stat-row"><span>Comparecimento</span><strong>${attend}</strong></div><div class="relatorio-stat-row"><span>Cancelamentos</span><strong>${cancelRate}</strong></div><div class="relatorio-stat-row"><span>No-show</span><strong>${noRate}</strong></div></div></section><section class="relatorio-panel"><div class="relatorio-panel-head"><div><h3>Desempenho das propostas</h3><p>Somente registros reais.</p></div></div><div class="relatorio-stat-list"><div class="relatorio-stat-row"><span>Enviadas</span><strong>${proposal.length}</strong></div><div class="relatorio-stat-row"><span>Aceitas</span><strong>${proposal.filter(x=>x.proposta_aceita_em).length}</strong></div><div class="relatorio-stat-row"><span>Recusadas</span><strong>${proposal.filter(x=>x.proposta_recusada_em).length}</strong></div><div class="relatorio-stat-row"><span>Taxa de aceite</span><strong>${relatorioPercent(proposal.filter(x=>x.proposta_aceita_em).length,proposal.length)}</strong></div></div></section></div>${renderRelatorioVagas(c,i)}<section class="relatorio-time-panel relatorio-panel"><div class="relatorio-panel-head"><div><h3>Tempo médio do processo</h3><p>Etapas calculadas somente quando existem datas compatíveis.</p></div></div><div class="relatorio-time-grid">${stageTimes.map(x=>`<div class="relatorio-time-item"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join('')}<div class="relatorio-time-item"><small>Total até contratação</small><strong>${relatorioAvgDays(hire,'criada_em','atualizada_em')||'Dados insuficientes'}</strong></div></div></section><section class="relatorio-panel"><div class="relatorio-panel-head"><div><h3>Origem dos candidatos</h3><p>O cadastro atual não informa origem de forma estruturada.</p></div></div><div class="relatorio-empty"><strong>Dados insuficientes</strong>Não há origem registrada para gerar este indicador.</div></section><section class="relatorio-panel"><div class="relatorio-panel-head"><div><h3>Performance da equipe</h3><p>Responsáveis não estão associados às movimentações disponíveis.</p></div></div><div class="relatorio-empty"><strong>Dados insuficientes</strong>Não há dados objetivos de recrutadores para comparar.</div></section></div>`;}
function trocarRelatorioChart(m){relatoriosState.chart=m;renderRelatorios();}
function aplicarPeriodoRelatorios(){const a=document.getElementById('relatorios-data-inicio'),b=document.getElementById('relatorios-data-fim');if(!a?.value||!b?.value)return;relatoriosState.inicio=a.value;relatoriosState.fim=b.value;relatoriosState.periodo='custom';renderRelatorios();}
function limparFiltrosRelatorios(){relatoriosState.vaga='';relatoriosState.etapa='';const v=document.getElementById('relatorios-filtro-vaga'),e=document.getElementById('relatorios-filtro-etapa');if(v)v.value='';if(e)e.value='';renderRelatorios();}
function bindRelatoriosControls(){if(window.__relatoriosControlsBound)return;window.__relatoriosControlsBound=true;document.getElementById('relatorios-periodo')?.addEventListener('change',e=>{relatoriosState.periodo=e.target.value;const custom=document.getElementById('relatorios-custom-period');if(e.target.value==='custom')custom.removeAttribute('hidden');else custom.setAttribute('hidden','');renderRelatorios();});document.getElementById('relatorios-filtros-btn')?.addEventListener('click',e=>{const p=document.getElementById('relatorios-filtros-advanced'),open=p.hasAttribute('hidden');if(open)p.removeAttribute('hidden');else p.setAttribute('hidden','');e.currentTarget.setAttribute('aria-expanded',String(open));});document.getElementById('relatorios-filtro-vaga')?.addEventListener('change',e=>{relatoriosState.vaga=e.target.value;renderRelatorios();});document.getElementById('relatorios-filtro-etapa')?.addEventListener('change',e=>{relatoriosState.etapa=e.target.value;renderRelatorios();});}
bindRelatoriosControls();

// ===== BANCO DE TALENTOS =====
const talentosState={display:'cards',search:'',quick:'todos',local:'',experiencia:'',area:'',ordenar:'relevantes',page:1,limit:20,selectedId:null};
let talentosAll=[];let talentosRows=[];let talentoDetailCache={};
function talentoArray(v){if(Array.isArray(v))return v;if(typeof v==='string'){try{const x=JSON.parse(v);return Array.isArray(x)?x:v.split(',').map(s=>s.trim()).filter(Boolean);}catch(_){return v.split(',').map(s=>s.trim()).filter(Boolean);}}return[];}
function talentoInitials(n){return String(n||'T').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function talentoDate(v){if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');}
function talentoStatus(c){if(c.ultimo_status==='contratado')return'contratado';if(c.ultimo_status&&!['reprovado','rejeitado','cancelado'].includes(c.ultimo_status))return'processo';if(c.banco_talentos===true)return'autorizado';return'nao-informado';}
function talentoStatusText(s){return({contratado:'Contratação concluída',processo:'Em processo',autorizado:'Autorizado no banco','nao-informado':'Disponibilidade não informada'}[s]||'Não informado');}
function talentoSearchHay(c){return[c.nome,c.email,c.cidade,c.estado,c.nivel_experiencia,c.experiencia,...talentoArray(c.areas_interesse),...talentoArray(c.competencias)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');}
function talentoIsRecent(c,days=30){return c.criado_em&&new Date(c.criado_em).getTime()>Date.now()-days*86400000;}
function talentosFiltered(){const q=talentosState.search.trim().toLocaleLowerCase('pt-BR');let rows=talentosAll.filter(c=>{const areas=talentoArray(c.areas_interesse),s=talentoStatus(c),level=String(c.nivel_experiencia||'').toLocaleLowerCase('pt-BR'),hay=talentoSearchHay(c);const matchQuick=talentosState.quick==='todos'||(talentosState.quick==='disponiveis'&&String(c.disponibilidade||'').toLocaleLowerCase()==='disponivel')||(talentosState.quick==='experientes'&&/sênior|senior|especialista|gerente|diretor/i.test(level))||(talentosState.quick==='recentes'&&talentoIsRecent(c))||(talentosState.quick==='atualizados'&&false);return(!q||hay.includes(q))&&matchQuick&&(!talentosState.local||`${c.cidade||''}, ${c.estado||''}`===talentosState.local)&&(!talentosState.experiencia||level===talentosState.experiencia)&&(!talentosState.area||areas.some(a=>String(a).toLowerCase()===talentosState.area.toLowerCase()));});rows.sort((a,b)=>{if(talentosState.ordenar==='az')return String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR');if(talentosState.ordenar==='za')return String(b.nome||'').localeCompare(String(a.nome||''),'pt-BR');if(talentosState.ordenar==='experiencia')return String(b.nivel_experiencia||'').localeCompare(String(a.nivel_experiencia||''),'pt-BR');return new Date(b.criado_em||0)-new Date(a.criado_em||0);});return rows;}
async function carregarBancoTalentos(){const box=document.getElementById('talentos-content');if(box)box.innerHTML='<div class="talentos-loading"><span class="spinner"></span> Carregando talentos...</div>';try{const r=await fetch(API+'/api/empresa/candidatos?limite=100',{headers:{'Authorization':'Bearer '+token}}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Erro ao carregar banco de talentos');talentosAll=d.candidatos||[];popularFiltrosTalentos();renderBancoTalentos();renderTalentosAttention();}catch(e){if(box)box.innerHTML=`<div class="talentos-empty"><strong>Não foi possível carregar o banco</strong><p>${escapeHtml(e.message||'Tente novamente.')}</p></div>`;}}
function popularFiltrosTalentos(){const locals=[...new Set(talentosAll.map(c=>[c.cidade,c.estado].filter(Boolean).join(', ')).filter(Boolean))].sort();const levels=[...new Set(talentosAll.map(c=>String(c.nivel_experiencia||'').toLowerCase()).filter(Boolean))].sort();const areas=[...new Set(talentosAll.flatMap(c=>talentoArray(c.areas_interesse).map(String)).filter(Boolean))].sort();[['talentos-filtro-local',locals],['talentos-filtro-experiencia',levels],['talentos-filtro-area',areas]].forEach(([id,items])=>{const s=document.getElementById(id);if(!s)return;const cur=s.value;s.innerHTML='<option value="">'+(id.endsWith('local')?'Todas as localizações':id.endsWith('experiencia')?'Todos os níveis':'Todas as áreas')+'</option>'+items.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');s.value=cur||'';});}
function talentoTags(c){return[...talentoArray(c.competencias),...talentoArray(c.areas_interesse)].filter((v,i,a)=>v&&a.findIndex(x=>String(x).toLowerCase()===String(v).toLowerCase())===i).slice(0,6);}
function talentoCard(c){const s=talentoStatus(c),tags=talentoTags(c),loc=[c.cidade,c.estado].filter(Boolean).join(', ')||'Localização não informada';return`<article class="talento-card ${Number(talentosState.selectedId)===Number(c.id)?'selecionado':''}" onclick="selecionarTalento(${c.id})"><div class="talento-card-head"><span class="talento-avatar">${escapeHtml(talentoInitials(c.nome))}</span><span class="talento-card-copy"><strong>${escapeHtml(c.nome||'Candidato')}</strong><small>${escapeHtml(talentoArray(c.areas_interesse)[0]||c.nivel_experiencia||'Cargo não informado')}</small></span><button class="talento-card-menu" type="button" onclick="event.stopPropagation();selecionarTalento(${c.id})">•••</button></div><div class="talento-location"><svg class="dash-svg"><use href="#icon-user"></use></svg>${escapeHtml(loc)}</div><div class="talento-experience">${c.nivel_experiencia?'Nível: '+escapeHtml(c.nivel_experiencia):'Experiência não informada'}</div><div class="talento-tags">${tags.length?tags.map(t=>`<span class="talento-tag">${escapeHtml(t)}</span>`).join(''):'<span class="talento-tag">Competências não informadas</span>'}</div><span class="talento-status ${s}">${talentoStatusText(s)}</span><div class="talento-card-footer"><span>Cadastro: ${talentoDate(c.criado_em)}</span><strong>Ver perfil →</strong></div></article>`;}
function renderBancoTalentos(){const rows=talentosFiltered();talentosRows=rows;const count=document.getElementById('talentos-results-count');if(count)count.textContent=`${rows.length} talento${rows.length===1?'':'s'} encontrado${rows.length===1?'':'s'}`;const context=document.getElementById('talentos-results-context');if(context)context.textContent=talentosState.search?`Busca estruturada por “${talentosState.search}”`:'Candidatos autorizados pela empresa';const box=document.getElementById('talentos-content');if(!box)return;if(!rows.length){box.innerHTML=`<div class="talentos-empty"><strong>${talentosAll.length?'Nenhum talento encontrado':'Seu Banco de Talentos está vazio'}</strong><p>${talentosAll.length?'Não encontramos candidatos com os critérios selecionados.':'Os candidatos vinculados às vagas da empresa aparecerão aqui.'}</p>${talentosAll.length?'<button class="btn btn-sec" type="button" onclick="limparFiltrosTalentos()">Limpar filtros</button>':' '}</div>`;}else if(talentosState.display==='cards'){const start=(talentosState.page-1)*talentosState.limit;box.innerHTML=`<div class="talentos-grid">${rows.slice(start,start+talentosState.limit).map(talentoCard).join('')}</div>`;}else{const start=(talentosState.page-1)*talentosState.limit;box.innerHTML=`<div class="talentos-lista"><table class="talentos-list-table"><thead><tr><th>Candidato</th><th>Cargo/nível</th><th>Localização</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>${rows.slice(start,start+talentosState.limit).map(c=>`<tr onclick="selecionarTalento(${c.id})"><td><span class="talento-avatar">${escapeHtml(talentoInitials(c.nome))}</span>${escapeHtml(c.nome||'—')}</td><td>${escapeHtml(talentoArray(c.areas_interesse)[0]||c.nivel_experiencia||'Não informado')}</td><td>${escapeHtml([c.cidade,c.estado].filter(Boolean).join(', ')||'Não informada')}</td><td><span class="talento-status ${talentoStatus(c)}">${talentoStatusText(talentoStatus(c))}</span></td><td>${talentoDate(c.criado_em)}</td><td><button class="talento-card-menu" onclick="event.stopPropagation();selecionarTalento(${c.id})">•••</button></td></tr>`).join('')}</tbody></table></div>`;}renderTalentosPagination(rows.length);}
function renderTalentosPagination(total){const box=document.getElementById('talentos-pagination');if(!box)return;const pages=Math.max(1,Math.ceil(total/talentosState.limit));if(talentosState.page>pages)talentosState.page=pages;if(pages<=1){box.innerHTML='';return;}box.innerHTML=Array.from({length:pages},(_,i)=>`<button type="button" class="${i+1===talentosState.page?'ativo':''}" onclick="talentosIrPagina(${i+1})">${i+1}</button>`).join('');}
function talentosIrPagina(p){talentosState.page=p;renderBancoTalentos();}
function buscarBancoTalentos(){talentosState.search=document.getElementById('talentos-busca')?.value||'';talentosState.page=1;renderBancoTalentos();}
function limparFiltrosTalentos(){Object.assign(talentosState,{search:'',quick:'todos',local:'',experiencia:'',area:'',page:1});['talentos-busca','talentos-filtro-local','talentos-filtro-experiencia','talentos-filtro-area'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});document.querySelectorAll('.talentos-quick-filters button').forEach(b=>b.classList.toggle('ativo',b.dataset.quick==='todos'));renderBancoTalentos();}
function renderTalentosAttention(){const box=document.getElementById('talentos-attention-list');if(!box)return;const old=talentosAll.filter(c=>c.criado_em&&new Date(c.criado_em).getTime()<Date.now()-180*86400000).length,items=[];if(old)items.push(`<div class="talento-attention-item"><svg class="dash-svg"><use href="#icon-bell"></use></svg><span><strong>${old} perfil${old>1?'is':''} com cadastro há mais de 6 meses</strong>A última atividade estruturada disponível é a data de cadastro.</span></div>`);const authorized=talentosAll.filter(c=>c.banco_talentos===true).length;if(authorized)items.push(`<div class="talento-attention-item"><svg class="dash-svg"><use href="#icon-check"></use></svg><span><strong>${authorized} talento${authorized>1?'s':''} autorizou o banco</strong>Consentimento registrado no cadastro.</span></div>`);box.innerHTML=items.length?items.join(''):'<div class="talentos-empty-inline">Nenhuma atenção disponível com os dados atuais.</div>';}
async function selecionarTalento(id){talentosState.selectedId=id;window.talentoTab='perfil';renderBancoTalentos();const panel=document.getElementById('talento-detail-panel');if(!panel)return;panel.classList.add('aberto');panel.innerHTML='<div class="talento-detail-empty"><span class="spinner"></span><span>Carregando perfil...</span></div>';try{const r=await fetch(API+'/api/empresa/candidatos/'+id,{headers:{'Authorization':'Bearer '+token}}),c=await r.json();if(!r.ok)throw new Error(c.erro||'Erro ao carregar perfil');let candidatura=null;const base=talentosAll.find(x=>Number(x.id)===Number(id));if(base?.ultima_candidatura_id){const cr=await fetch(API+'/api/empresa/candidatura/'+base.ultima_candidatura_id,{headers:{'Authorization':'Bearer '+token}});if(cr.ok)candidatura=await cr.json();}c._candidatura=candidatura||{};talentoDetailCache[id]=c;renderTalentoDetail(c,candidatura||{});}catch(e){panel.innerHTML=`<div class="talento-detail-empty"><strong>Não foi possível carregar o perfil</strong><span>${escapeHtml(e.message||'Tente novamente.')}</span></div>`;}}
async function abrirConviteTalento(candidatoId){
  window.__talentoConviteId=Number(candidatoId);
  const select=document.getElementById('convite-talento-vaga'),alerta=document.getElementById('convite-talento-alert');
  if(!select)return;
  alerta.innerHTML='';
  select.innerHTML='<option value="">Carregando vagas...</option>';
  document.getElementById('convite-talento-mensagem').value='';
  abrirModal('convite-talento');
  try{
    const r=await fetch(API+'/api/empresa/vagas',{headers:{'Authorization':'Bearer '+token}}),d=await r.json();
    if(!r.ok)throw new Error(d.erro||'Não foi possível carregar as vagas');
    const vagas=(d.vagas||[]).filter(v=>!['arquivada','encerrada','cancelada','fechada'].includes(String(v.status||'').toLowerCase()));
    select.innerHTML='<option value="">Selecione a vaga para o convite...</option>'+vagas.map(v=>`<option value="${v.id}">${escapeHtml(v.titulo||'Vaga')} · ${escapeHtml(v.cidade||'Local não informado')}</option>`).join('');
    if(!vagas.length)select.innerHTML='<option value="">Nenhuma vaga publicada disponível</option>';
  }catch(e){select.innerHTML='<option value="">Não foi possível carregar as vagas</option>';alerta.innerHTML=`<div class="alert alert-erro">${escapeHtml(e.message||'Tente novamente.')}</div>`;}
}
async function enviarConviteTalento(){
  const candidatoId=Number(window.__talentoConviteId),vagaId=Number(document.getElementById('convite-talento-vaga')?.value),mensagem=document.getElementById('convite-talento-mensagem')?.value.trim()||'',alerta=document.getElementById('convite-talento-alert');
  if(!candidatoId||!vagaId){alerta.innerHTML='<div class="alert alert-erro">Selecione uma vaga antes de enviar.</div>';return;}
  if(!confirm('Enviar por e-mail os detalhes da vaga e o convite para este candidato?'))return;
  const btn=document.querySelector('#modal-convite-talento .modal-footer .btn-primary');if(btn){btn.disabled=true;btn.textContent='Enviando...';}
  try{const r=await fetch(API+'/api/empresa/candidatos/'+candidatoId+'/convite',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({vaga_id:vagaId,mensagem})}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível enviar o convite');fecharModal('convite-talento');alert('Convite enviado para o e-mail do candidato.');}
  catch(e){alerta.innerHTML=`<div class="alert alert-erro">${escapeHtml(e.message||'Não foi possível enviar o convite.')}</div>`;}
  finally{if(btn){btn.disabled=false;btn.textContent='Enviar convite';}}
}
function renderTalentoDetail(c,cand){
  const panel=document.getElementById('talento-detail-panel');
  if(!panel||!c)return;
  const base=talentosAll.find(x=>Number(x.id)===Number(c.id))||c;
  const s=talentoStatus(base), areas=talentoArray(c.areas_interesse), skills=talentoTags(c);
  const exps=Array.isArray(c.experiencias)?c.experiencias:[];
  const esc=escapeHtml;
  const val=v=>esc(v===undefined||v===null||String(v).trim()===''?'—':v);
  const unique=[...skills,...areas].filter((v,i,a)=>a.findIndex(x=>String(x).toLowerCase()===String(v).toLowerCase())===i);
  const expHtml=exps.length?exps.map(e=>`<div class="talento-exp-item"><strong>${val(e.cargo||e.funcao||'Cargo não informado')}</strong><span>${val(e.empresa||e.organizacao||'Empresa não informada')}</span><small>${val(e.inicio||'—')} — ${val(e.fim||'Atual')}${e.descricao?' · '+esc(e.descricao):''}</small></div>`).join(''):`<div class="talento-note">${val(c.experiencia||'Nenhuma experiência profissional informada.')}</div>`;
  panel.innerHTML=`<div class="talento-detail-content">
    <div class="talento-detail-head"><span class="talento-detail-avatar">${escapeHtml(talentoInitials(c.nome))}</span><div class="talento-detail-copy"><h3>${val(c.nome||'Candidato')}</h3><p>${val(areas[0]||c.nivel_experiencia||'Cargo não informado')} · ${val([c.cidade,c.estado].filter(Boolean).join(', ')||'Localização não informada')}</p><span class="talento-detail-status">${talentoStatusText(s)}</span></div><button class="talento-detail-close" type="button" onclick="fecharTalentoDetalhe()">×</button></div>
    <div class="talento-detail-actions"><button class="primary" type="button" onclick="abrirConviteTalento(${c.id})">Convidar candidato</button>${base.ultima_candidatura_id?`<button type="button" onclick="abrirModalNovaEntrevista()">Agendar entrevista</button>`:''}<button type="button" onclick="adicionarNotaTalento(${base.ultima_candidatura_id||0})">Adicionar nota</button></div>
    <section class="talento-detail-section"><h4>Currículo completo</h4><div class="talento-info-grid">
      <div class="talento-info-item"><small>Nome</small><strong>${val(c.nome)}</strong></div><div class="talento-info-item"><small>E-mail</small><strong>${val(c.email)}</strong></div>
      <div class="talento-info-item"><small>Telefone</small><strong>${val(c.celular)}</strong></div><div class="talento-info-item"><small>CPF</small><strong>${val(c.cpf)}</strong></div>
      <div class="talento-info-item"><small>Nascimento</small><strong>${c.data_nascimento?formatarData(c.data_nascimento):'—'}</strong></div><div class="talento-info-item"><small>Sexo</small><strong>${val(c.sexo)}</strong></div>
      <div class="talento-info-item"><small>Acessibilidade</small><strong>${val(c.acessibilidade||'Nenhuma')}</strong></div><div class="talento-info-item"><small>Nível de experiência</small><strong>${val(c.nivel_experiencia)}</strong></div>
    </div></section>
    <section class="talento-detail-section"><h4>Endereço</h4><div class="talento-info-grid">
      <div class="talento-info-item"><small>CEP</small><strong>${val(c.cep)}</strong></div><div class="talento-info-item"><small>Logradouro</small><strong>${val([c.logradouro,c.numero].filter(Boolean).join(', '))}</strong></div>
      <div class="talento-info-item"><small>Bairro</small><strong>${val(c.bairro)}</strong></div><div class="talento-info-item"><small>Cidade/UF</small><strong>${val([c.cidade,c.estado].filter(Boolean).join('/'))}</strong></div>
    </div></section>
    <section class="talento-detail-section"><h4>Formação</h4><div class="talento-info-grid">
      <div class="talento-info-item"><small>Formação</small><strong>${val(c.formacao)}</strong></div><div class="talento-info-item"><small>Instituição</small><strong>${val(c.instituicao)}</strong></div>
      <div class="talento-info-item"><small>Curso</small><strong>${val(c.curso)}</strong></div><div class="talento-info-item"><small>Situação</small><strong>${val(c.situacao)}</strong></div>
      <div class="talento-info-item"><small>Conclusão</small><strong>${c.data_conclusao?formatarData(c.data_conclusao):'—'}</strong></div><div class="talento-info-item"><small>Primeiro emprego</small><strong>${c.primeiro_emprego?'Sim':'Não'}</strong></div>
    </div></section>
    <section class="talento-detail-section"><h4>Áreas e competências</h4><div class="talento-tag-list">${unique.length?unique.map(x=>`<span class="talento-tag">${esc(x)}</span>`).join(''):'<span class="talento-note">Nenhuma área ou competência informada.</span>'}</div></section>
    <section class="talento-detail-section"><h4>Experiência profissional</h4><div class="talento-exp-list">${expHtml}</div></section>
    <section class="talento-detail-section"><h4>Sobre você</h4><div class="talento-note" style="white-space:pre-wrap">${val(c.sobre_voce||'Nenhuma apresentação informada.')}</div></section>
    <section class="talento-detail-section"><h4>Banco de Talentos</h4><div class="talento-info-grid"><div class="talento-info-item"><small>Autorização</small><strong>${c.banco_talentos===true?'Autorizado':'Não informado'}</strong></div><div class="talento-info-item"><small>Cadastro</small><strong>${c.criado_em?formatarData(c.criado_em):'—'}</strong></div></div></section>
  </div>`;
}
function trocarAbaTalento(tab){window.talentoTab=tab;const c=talentoDetailCache[talentosState.selectedId];if(c)renderTalentoDetail(c,c._candidatura||{});}
function fecharTalentoDetalhe(){talentosState.selectedId=null;document.getElementById('talento-detail-panel')?.classList.remove('aberto');renderBancoTalentos();}
async function buscarVagasCompativeis(candidatoId){const box=document.getElementById('talento-matches-'+candidatoId);if(!box)return;box.innerHTML='<section class="talento-detail-section"><h4>Vagas compatíveis</h4><div class="talento-note">Calculando correspondências objetivas...</div></section>';try{const vr=await fetch(API+'/api/empresa/vagas?limite=50',{headers:{'Authorization':'Bearer '+token}}),vd=await vr.json(),vagas=(vd.vagas||[]).slice(0,20),out=[];for(const v of vagas){const r=await fetch(API+'/api/empresa/vagas/'+v.id+'/matches',{headers:{'Authorization':'Bearer '+token}});if(!r.ok)continue;const d=await r.json(),m=(d.matches||[]).find(x=>Number(x.candidato_id)===Number(candidatoId));if(m)out.push({v,m});}box.innerHTML=`<section class="talento-detail-section"><h4>Vagas compatíveis</h4>${out.length?out.sort((a,b)=>b.m.score-a.m.score).map(x=>`<div class="talento-exp-item"><strong>${escapeHtml(x.v.titulo||'Vaga')}</strong><span>${x.m.score}% de compatibilidade</span><small>${escapeHtml((x.m.detalhes||[]).filter(d=>d.ok).map(d=>d.criterio).join(' · ')||'Sem correspondências positivas detalhadas')}</small></div>`).join(''):'<div class="talento-note">Nenhuma vaga com correspondência calculável foi encontrada.</div>'}</section>`;}catch(_){box.innerHTML='<section class="talento-detail-section"><h4>Vagas compatíveis</h4><div class="talento-note">Não foi possível calcular as vagas compatíveis agora.</div></section>';}}
async function adicionarNotaTalento(candidaturaId){if(!candidaturaId)return alert('Este candidato não possui uma candidatura disponível para receber nota.');const texto=prompt('Escreva a nota interna:');if(!texto||!texto.trim())return;try{const r=await fetch(API+'/api/empresa/candidatura/'+candidaturaId+'/comentario',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({texto:texto.trim()})});if(!r.ok)throw new Error('Não foi possível salvar a nota');alert('Nota adicionada.');}catch(e){alert(e.message);}}
function bindTalentosControls(){if(window.__talentosControlsBound)return;window.__talentosControlsBound=true;document.getElementById('talentos-busca')?.addEventListener('keydown',e=>{if(e.key==='Enter')buscarBancoTalentos();});document.getElementById('talentos-filtros-btn')?.addEventListener('click',e=>{const p=document.getElementById('talentos-filtros-advanced'),open=p.hasAttribute('hidden');if(open)p.removeAttribute('hidden');else p.setAttribute('hidden','');e.currentTarget.setAttribute('aria-expanded',String(open));});[['talentos-filtro-local','local'],['talentos-filtro-experiencia','experiencia'],['talentos-filtro-area','area'],['talentos-ordenar','ordenar']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('change',e=>{talentosState[key]=e.target.value;talentosState.page=1;renderBancoTalentos();}));document.querySelectorAll('.talentos-quick-filters button').forEach(b=>b.addEventListener('click',()=>{talentosState.quick=b.dataset.quick;talentosState.page=1;document.querySelectorAll('.talentos-quick-filters button').forEach(x=>x.classList.toggle('ativo',x===b));renderBancoTalentos();}));document.querySelectorAll('.talentos-display-tabs button').forEach(b=>b.addEventListener('click',()=>{talentosState.display=b.dataset.display;talentosState.page=1;document.querySelectorAll('.talentos-display-tabs button').forEach(x=>x.classList.toggle('ativo',x===b));renderBancoTalentos();}));}
bindTalentosControls();

// ===== CONTRATAÇÕES =====
const contratacoesState={view:'pipeline',search:'',status:'',vaga:'',pendencias:'',ordenar:'recentes',page:1,limit:10,selectedId:null};
let contratacoesAll=[];let contratacoesRows=[];let contratacaoDocs={};let contratacaoDetailTab='detalhes';
function contratacaoInitials(n){return String(n||'C').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function contratacaoDate(v){if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');}
function contratacaoStatus(c){if(c.status==='contratado')return'concluido';const docs=contratacaoDocs[c.id];if(docs&&docs.total>0&&docs.enviados>=docs.total&&docs.pendentes===0)return'admissao';if(c.proposta_aceita_em||Number(c.etapa_atual)>=6)return'documentacao';return'aprovado';}
function contratacaoStatusText(s){return({aprovado:'Aprovado',documentacao:'Documentação pendente',admissao:'Admissão em andamento',aguardando:'Aguardando início',concluido:'Concluído',cancelado:'Cancelado'}[s]||s||'—');}
function contratacaoDocsInfo(c){return contratacaoDocs[c.id]||{enviados:0,total:0,pendentes:0,carregando:true,docs:[]};}
function contratacaoProgress(c){if(c.status==='contratado')return 100;const stage=Math.max(0,Number(c.etapa_atual||0));const base=Math.min(75,Math.round(stage/7*75));const info=contratacaoDocsInfo(c);const docPart=info.total?Math.round(info.enviados/info.total*25):0;return Math.min(99,base+docPart);}
function contratacoesFiltered(){const q=contratacoesState.search.trim().toLocaleLowerCase('pt-BR');let rows=contratacoesAll.filter(c=>{const s=contratacaoStatus(c),info=contratacaoDocsInfo(c),hay=[c.candidato_nome,c.nome,c.candidato_email,c.email,c.titulo,c.vaga_titulo,c.id].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');return(!q||hay.includes(q))&&(!contratacoesState.status||s===contratacoesState.status)&&(!contratacoesState.vaga||String(c.vaga_id)===String(contratacoesState.vaga))&&(!contratacoesState.pendencias||(contratacoesState.pendencias==='com'?info.pendentes>0:info.total>0&&info.pendentes===0));});rows.sort((a,b)=>{const da=new Date(a.atualizada_em||a.contratada_em||a.criada_em||0),db=new Date(b.atualizada_em||b.contratada_em||b.criada_em||0);if(contratacoesState.ordenar==='antigas')return da-db;if(contratacoesState.ordenar==='progresso')return contratacaoProgress(b)-contratacaoProgress(a);if(contratacoesState.ordenar==='pendencias')return contratacaoDocsInfo(b).pendentes-contratacaoDocsInfo(a).pendentes;if(contratacoesState.ordenar==='status')return contratacaoStatusText(contratacaoStatus(a)).localeCompare(contratacaoStatusText(contratacaoStatus(b)),'pt-BR');return db-da;});return rows;}
async function carregarContratacoes(){const box=document.getElementById('contratacoes-content');if(box)box.innerHTML='<div class="contratacoes-loading"><span class="spinner"></span> Carregando contratações...</div>';try{const r=await fetch(API+'/api/empresa/candidaturas',{headers:{'Authorization':'Bearer '+token}}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Erro ao carregar contratações');contratacoesAll=(d.candidaturas||[]).filter(c=>c.status==='contratado'||c.proposta_aceita_em||Number(c.etapa_atual)>=6);popularContratacoesVagas();await Promise.all(contratacoesAll.slice(0,50).map(c=>carregarDocsContratacao(c)));atualizarKpisContratacoes();renderContratacoes();renderContratacoesProximosInicios();}catch(e){if(box)box.innerHTML=`<div class="contratacoes-empty"><strong>Não foi possível carregar as contratações</strong><p>${escapeHtml(e.message||'Tente novamente.')}</p></div>`;}}
async function carregarDocsContratacao(c){try{const r=await fetch(API+'/api/empresa/candidatura/'+c.id+'/documentos',{headers:{'Authorization':'Bearer '+token}});const d=await r.json();const docs=d.documentos||[],required=d.obrigatorios||[];const requiredTypes=required.map(x=>typeof x==='string'?x:x.tipo).filter(Boolean),sentTypes=new Set(docs.map(x=>x.tipo));const total=requiredTypes.length||docs.length,enviados=requiredTypes.length?requiredTypes.filter(t=>sentTypes.has(t)).length:docs.filter(x=>x.arquivo_url||x.valor_texto).length,pendentes=requiredTypes.length?requiredTypes.filter(t=>{const doc=docs.find(x=>x.tipo===t);return !doc||['reprovado','retornado'].includes(doc.status);}).length:docs.filter(x=>['reprovado','retornado'].includes(x.status)).length;contratacaoDocs[c.id]={docs,total,enviados,pendentes,carregando:false,obrigatorios:requiredTypes};}catch(_){contratacaoDocs[c.id]={docs:[],total:0,enviados:0,pendentes:0,carregando:false,erro:true};}}
function popularContratacoesVagas(){const options=[...new Map(contratacoesAll.map(c=>[c.vaga_id,{id:c.vaga_id,titulo:c.titulo||c.vaga_titulo}])).values()];['contratacoes-filtro-vaga','contratacoes-filtro-vaga-top'].forEach(id=>{const s=document.getElementById(id);if(!s)return;const cur=s.value;s.innerHTML='<option value="">Todas as vagas</option>'+options.map(v=>`<option value="${v.id}">${escapeHtml(v.titulo||'Vaga')}</option>`).join('');s.value=cur||'';});}
function atualizarKpisContratacoes(){const rows=contratacoesAll,week=Date.now()+7*86400000,total=rows.length,admissao=rows.filter(c=>contratacaoStatus(c)==='admissao').length,pend=rows.filter(c=>contratacaoDocsInfo(c).pendentes>0).length,done=rows.filter(c=>c.status==='contratado').length;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};set('contr-kpi-total',total);set('contr-kpi-admissao',admissao);set('contr-kpi-pendencias',pend);set('contr-kpi-inicios',0);set('contr-kpi-inicios-info','não registrado');set('contr-kpi-concluidas',done);}
function contratacaoCard(c){const s=contratacaoStatus(c),info=contratacaoDocsInfo(c),p=contratacaoProgress(c),selected=Number(contratacoesState.selectedId)===Number(c.id),docs=info.total?`${info.enviados}/${info.total} documentos${info.pendentes?` · ${info.pendentes} pendência${info.pendentes>1?'s':''}`:' · completa'}`:'Documentação não informada';return`<article class="contratacao-card ${selected?'selecionada':''}" onclick="selecionarContratacao(${c.id})"><div class="contratacao-card-head"><span class="contratacao-avatar">${escapeHtml(contratacaoInitials(c.candidato_nome||c.nome))}</span><span class="contratacao-card-copy"><strong>${escapeHtml(c.candidato_nome||c.nome||'Candidato')}</strong><small>${escapeHtml(c.titulo||c.vaga_titulo||'Vaga')}</small></span><button class="contratacao-card-menu" type="button" onclick="event.stopPropagation();selecionarContratacao(${c.id})">•••</button></div><div class="contratacao-card-role">${escapeHtml(c.titulo||c.vaga_titulo||'Cargo não informado')}</div><div class="contratacao-card-meta"><span>${c.tipo_contrato?escapeHtml(c.tipo_contrato):'Tipo não informado'}</span><span>·</span><span>${c.contratada_em?contratacaoDate(c.contratada_em):'Data não informada'}</span></div><span class="contratacao-status ${s}">${contratacaoStatusText(s)}</span><div class="contratacao-docs ${info.pendentes?'pending':info.total&&info.pendentes===0?'ok':''}">${info.pendentes?'⚠ ':info.total?'✓ ':''}${escapeHtml(docs)}</div><div class="contratacao-progress"><div class="contratacao-progress-line"><span>Progresso</span><strong>${p}%</strong></div><div class="contratacao-progress-bar"><i style="width:${p}%"></i></div></div><div class="contratacao-card-footer"><span>${c.proposta_aceita_em?'Proposta aceita':'Processo final'}</span><strong>${c.status==='contratado'?'Finalizado':'Acompanhar'}</strong></div></article>`;}
function renderContratacoes(){const rows=contratacoesFiltered();contratacoesRows=rows;const box=document.getElementById('contratacoes-content');if(!box)return;if(contratacoesState.view==='pipeline')box.innerHTML=renderContratacoesPipeline(rows);else if(contratacoesState.view==='lista')box.innerHTML=renderContratacoesLista(rows);else box.innerHTML=renderContratacoesIndicadores(rows);renderContratacoesAttention(rows);const pages=Math.max(1,Math.ceil(rows.length/contratacoesState.limit));if(contratacoesState.page>pages)contratacoesState.page=pages;renderContratacoesPagination(rows.length,pages);if(contratacoesState.selectedId)renderContratacaoDetail(contratacoesAll.find(c=>Number(c.id)===Number(contratacoesState.selectedId)));}
function renderContratacoesPipeline(rows){const cols=[['aprovado','Aprovado','Candidato aprovado para contratação'],['documentacao','Documentação','Documentos em conferência'],['admissao','Admissão','Processo de admissão em andamento'],['aguardando','Aguardando início','Data de início registrada'],['concluido','Concluído','Contratações finalizadas']];return`<div class="contratacoes-pipeline">${cols.map(([key,title,desc])=>{const list=rows.filter(c=>contratacaoStatus(c)===key);return`<section class="contratacao-column"><header class="contratacao-column-head"><div><h3>${title}</h3><span class="contratacao-column-count">${list.length}</span></div><p>${desc}</p></header><div class="contratacao-column-body">${list.length?list.map(contratacaoCard).join(''):'<div class="contratacoes-empty"><p>Nenhuma contratação nesta etapa.</p></div>'}</div></section>`;}).join('')}</div>`;}
function renderContratacoesLista(rows){const start=(contratacoesState.page-1)*contratacoesState.limit,list=rows.slice(start,start+contratacoesState.limit);if(!rows.length)return'<div class="contratacoes-empty"><strong>Nenhuma contratação corresponde aos filtros</strong><p>Quando um candidato avançar para a etapa final, ele aparecerá aqui.</p><button class="btn btn-sec" type="button" onclick="limparFiltrosContratacoes()">Limpar filtros</button></div>';return`<div class="contratacoes-lista"><table class="contratacoes-list-table"><thead><tr><th>Candidato</th><th>Vaga</th><th>Etapa</th><th>Progresso</th><th>Documentação</th><th>Status</th><th>Ações</th></tr></thead><tbody>${list.map(c=>{const info=contratacaoDocsInfo(c),s=contratacaoStatus(c);return`<tr onclick="selecionarContratacao(${c.id})"><td><span class="contratacao-avatar">${escapeHtml(contratacaoInitials(c.candidato_nome||c.nome))}</span>${escapeHtml(c.candidato_nome||c.nome||'—')}</td><td>${escapeHtml(c.titulo||c.vaga_titulo||'—')}</td><td>${contratacaoStatusText(s)}</td><td>${contratacaoProgress(c)}%</td><td>${info.total?`${info.enviados}/${info.total}`:'Não informada'}</td><td><span class="contratacao-status ${s}">${contratacaoStatusText(s)}</span></td><td><button class="contratacao-card-menu" type="button" onclick="event.stopPropagation();selecionarContratacao(${c.id})">•••</button></td></tr>`;}).join('')}</tbody></table></div>`;}
function renderContratacoesIndicadores(rows){const total=rows.length,done=rows.filter(c=>c.status==='contratado').length,pending=rows.filter(c=>contratacaoDocsInfo(c).pendentes>0).length,rate=total?Math.round(done/total*100):0;return`<div class="contratacoes-indicadores"><div class="contratacao-indicador-card"><small>Total em contratação</small><strong>${total}</strong></div><div class="contratacao-indicador-card"><small>Concluídas</small><strong>${done}</strong></div><div class="contratacao-indicador-card"><small>Com pendências</small><strong>${pending}</strong></div><div class="contratacao-indicador-card"><small>Taxa de conclusão</small><strong>${rate}%</strong></div><div class="contratacao-chart"><strong>Contratações por status</strong><div class="contratacao-bars"><i class="contratacao-bar" style="height:${Math.max(3,total?Math.min(100,total*10):3)}px"></i><i class="contratacao-bar done" style="height:${Math.max(3,done?Math.min(100,done*10):3)}px"></i></div></div></div>`;}
function renderContratacoesAttention(rows){const box=document.getElementById('contratacoes-attention');if(!box)return;const pending=rows.filter(c=>contratacaoDocsInfo(c).pendentes>0).length,doneWeek=rows.filter(c=>c.status==='contratado'&&c.atualizada_em&&new Date(c.atualizada_em).getTime()>Date.now()-7*86400000).length,items=[];if(pending)items.push(`<div class="contratacao-attention-item"><svg class="dash-svg"><use href="#icon-bell"></use></svg><span><strong>${pending} contratação${pending>1?'ões':''} com documentação pendente</strong>Verifique os documentos.</span></div>`);if(doneWeek)items.push(`<div class="contratacao-attention-item success"><svg class="dash-svg"><use href="#icon-check"></use></svg><span><strong>${doneWeek} contratação${doneWeek>1?'ões':''} concluída${doneWeek>1?'s':''} nesta semana</strong>Processo finalizado.</span></div>`);if(!items.length)items.push('<div class="contratacao-attention-item success"><svg class="dash-svg"><use href="#icon-check"></use></svg><span><strong>Nenhuma pendência identificada</strong>Os dados disponíveis estão em dia.</span></div>');box.innerHTML=items.join('');}
function renderContratacoesProximosInicios(){const box=document.getElementById('contratacoes-proximos-inicios');if(box)box.innerHTML='<div class="contratacoes-empty-inline">Nenhuma data de início registrada nos dados disponíveis.</div>';}
function renderContratacoesPagination(total,pages){const box=document.getElementById('contratacoes-pagination');if(!box)return;if(contratacoesState.view!=='lista'||pages<=1){box.innerHTML='';return;}box.innerHTML=Array.from({length:pages},(_,i)=>`<button type="button" class="${i+1===contratacoesState.page?'ativo':''}" onclick="contratacoesIrPagina(${i+1})">${i+1}</button>`).join('');}
function contratacoesIrPagina(p){contratacoesState.page=p;renderContratacoes();}
function selecionarContratacao(id){contratacoesState.selectedId=id;contratacaoDetailTab='detalhes';renderContratacoes();loadContratacaoDetail(id);}
async function loadContratacaoDetail(id){const base=contratacoesAll.find(c=>Number(c.id)===Number(id)),panel=document.getElementById('contratacao-detail-panel');if(!base||!panel)return;panel.classList.add('aberto');panel.innerHTML='<div class="contratacao-detail-empty"><span class="spinner"></span><span>Carregando contratação...</span></div>';try{const r=await fetch(API+'/api/empresa/candidatura/'+id,{headers:{'Authorization':'Bearer '+token}}),d=await r.json();renderContratacaoDetail(d&&d.id?d:base);}catch(_){renderContratacaoDetail(base);}}
function renderContratacaoDetail(c){const panel=document.getElementById('contratacao-detail-panel');if(!panel||!c)return;const base=contratacoesAll.find(x=>Number(x.id)===Number(c.id))||c,info=contratacaoDocs[c.id]||{docs:[],total:0,enviados:0,pendentes:0},s=contratacaoStatus(base),progress=contratacaoProgress(base),history=Array.isArray(c.historico)?c.historico:[],required=info.total?`${info.enviados}/${info.total} documentos`:'Não informado';const tabs=['detalhes','documentos','historico','notas'].map(t=>`<button type="button" class="${contratacaoDetailTab===t?'ativo':''}" onclick="contratacaoTrocarAba('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join('');let body='';if(contratacaoDetailTab==='detalhes')body=`<section class="contratacao-detail-section"><h4>Informações principais</h4><div class="contratacao-info-grid"><div class="contratacao-info-item"><small>Data de aprovação</small><strong>Não informada</strong></div><div class="contratacao-info-item"><small>Data da proposta</small><strong>${contratacaoDate(c.proposta_enviada_em)}</strong></div><div class="contratacao-info-item"><small>Data de aceite</small><strong>${contratacaoDate(c.proposta_aceita_em)}</strong></div><div class="contratacao-info-item"><small>Data de início</small><strong>Não informada</strong></div><div class="contratacao-info-item"><small>Tipo de contratação</small><strong>Não informado</strong></div><div class="contratacao-info-item"><small>Remuneração</small><strong>Não informada</strong></div></div></section><section class="contratacao-detail-section"><h4>Progresso da contratação</h4><div class="contratacao-progress-large"><span>Etapa real ${Number(c.etapa_atual||0)+1}</span><strong>${progress}%</strong></div><div class="contratacao-progress-bar"><i style="width:${progress}%"></i></div></section><section class="contratacao-detail-section"><h4>Checklist de contratação</h4><div class="contratacao-checklist"><div class="contratacao-check-item done"><span class="contratacao-check-dot">✓</span><span>Candidato aprovado</span><small>${contratacaoDate(c.proposta_aceita_em)}</small></div><div class="contratacao-check-item ${c.proposta_aceita_em?'done':''}"><span class="contratacao-check-dot">${c.proposta_aceita_em?'✓':'○'}</span><span>Proposta aceita</span><small>${contratacaoDate(c.proposta_aceita_em)}</small></div><div class="contratacao-check-item ${info.enviados?'done':''}"><span class="contratacao-check-dot">${info.enviados?'✓':'○'}</span><span>Documentos enviados</span><small>${required}</small></div><div class="contratacao-check-item ${info.total&&info.pendentes===0?'done':''}"><span class="contratacao-check-dot">${info.total&&info.pendentes===0?'✓':'○'}</span><span>Documentos conferidos</span><small>${info.pendentes?`${info.pendentes} pendência(s)`:'Não informado'}</small></div><div class="contratacao-check-item ${c.status==='contratado'?'done':''}"><span class="contratacao-check-dot">${c.status==='contratado'?'✓':'○'}</span><span>Contratação concluída</span><small>${c.status==='contratado'?contratacaoDate(c.atualizada_em):'Pendente'}</small></div></div></section>`;else if(contratacaoDetailTab==='documentos')body=`<section class="contratacao-detail-section"><h4>Documentação real</h4><div class="contratacao-doc-list">${info.docs.length?info.docs.map(d=>`<div class="contratacao-doc-item ${d.status==='aprovado'?'done':['reprovado','retornado'].includes(d.status)?'pending':''}"><span class="contratacao-doc-dot">${d.status==='aprovado'?'✓':d.status==='reprovado'||d.status==='retornado'?'!':'○'}</span><span>${escapeHtml(d.tipo||d.arquivo_nome||'Documento')}<small>${escapeHtml(d.status||'Enviado')} · ${contratacaoDate(d.enviado_em)}</small></span>${d.arquivo_url?`<a href="${safeExternalUrl(d.arquivo_url)}" target="_blank" rel="noopener">Abrir</a>`:''}</div>`).join(''):'<div class="contratacao-note">Nenhum documento foi retornado para esta candidatura.</div>'}</div></section>`;else if(contratacaoDetailTab==='historico')body=`<section class="contratacao-detail-section"><h4>Histórico da contratação</h4><div class="contratacao-timeline">${history.length?history.map(h=>`<div class="contratacao-timeline-item done"><span class="contratacao-timeline-dot">✓</span><span>${escapeHtml(h.mensagem||h.detalhes||h.acao||h.tipo||'Atualização')}<small>${contratacaoDate(h.data||h.quando||h.criado_em)} · ${escapeHtml(h.por||'Sistema')}</small></span></div>`).join(''):'<div class="contratacao-note">Nenhum evento de histórico disponível.</div>'}</div></section>`;else body=`<section class="contratacao-detail-section"><h4>Notas internas</h4><div class="contratacao-note">As notas internas são registradas como comentários da candidatura.</div><button class="btn btn-sec" style="margin-top:9px" type="button" onclick="adicionarNotaContratacao(${c.id})">Adicionar nota</button></section>`;const canApprove=info.total>0&&info.pendentes===0&&c.status!=='contratado';panel.innerHTML=`<div class="contratacao-detail-content"><div class="contratacao-detail-head"><span class="contratacao-detail-avatar">${escapeHtml(contratacaoInitials(c.nome||c.candidato_nome))}</span><div class="contratacao-detail-copy"><h3>${escapeHtml(c.nome||c.candidato_nome||'Candidato')}</h3><p>${escapeHtml(c.vaga_titulo||c.titulo||'Vaga')} · ${escapeHtml(c.vaga_empresa||c.empresa||'Minha empresa')}</p><span class="contratacao-detail-status">${contratacaoStatusText(s)}</span></div><button class="contratacao-detail-close" type="button" onclick="fecharContratacaoDetalhe()">×</button></div><div class="contratacao-detail-actions"><button class="primary" type="button" onclick="abrirCurriculo(${c.candidato_id_full||c.candidato_id||0})">Ver candidato</button>${canApprove?`<button type="button" onclick="aprovarDocsContratacao(${c.id})">Aprovar docs</button>`:''}<button type="button" onclick="irPara('propostas')">Ver proposta</button></div><div class="contratacao-detail-tabs">${tabs}</div>${body}</div>`;}
function contratacaoTrocarAba(tab){contratacaoDetailTab=tab;const c=contratacoesAll.find(x=>Number(x.id)===Number(contratacoesState.selectedId));if(c)renderContratacaoDetail(c);}
function fecharContratacaoDetalhe(){contratacoesState.selectedId=null;document.getElementById('contratacao-detail-panel')?.classList.remove('aberto');renderContratacoes();}
async function aprovarDocsContratacao(id){if(!confirm('Aprovar os documentos e avançar este processo?'))return;try{const r=await fetch(API+'/api/empresa/candidatura/'+id+'/aprovar-documentos',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:'{}'}),d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível aprovar os documentos');await carregarContratacoes();selecionarContratacao(id);}catch(e){alert(e.message);}}
async function adicionarNotaContratacao(id){const texto=prompt('Escreva a nota interna:');if(!texto||!texto.trim())return;try{const r=await fetch(API+'/api/empresa/candidatura/'+id+'/comentario',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({texto:texto.trim()})});if(!r.ok)throw new Error('Não foi possível salvar a nota');alert('Nota adicionada.');const c=contratacoesAll.find(x=>Number(x.id)===Number(id));if(c){c.atualizada_em=new Date().toISOString();}contratacaoDetailTab='notas';loadContratacaoDetail(id);}catch(e){alert(e.message);}}
function limparFiltrosContratacoes(){Object.assign(contratacoesState,{search:'',status:'',vaga:'',pendencias:'',page:1});['contratacoes-busca','contratacoes-filtro-status','contratacoes-filtro-vaga','contratacoes-filtro-pendencias','contratacoes-filtro-vaga-top'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});renderContratacoes();}
function bindContratacoesControls(){if(window.__contratacoesControlsBound)return;window.__contratacoesControlsBound=true;document.getElementById('contratacoes-busca')?.addEventListener('input',e=>{contratacoesState.search=e.target.value;contratacoesState.page=1;renderContratacoes();});document.getElementById('contratacoes-filtros-btn')?.addEventListener('click',e=>{const p=document.getElementById('contratacoes-filtros-advanced'),open=p.hasAttribute('hidden');if(open)p.removeAttribute('hidden');else p.setAttribute('hidden','');e.currentTarget.setAttribute('aria-expanded',String(open));});[['contratacoes-filtro-status','status'],['contratacoes-filtro-vaga','vaga'],['contratacoes-filtro-pendencias','pendencias'],['contratacoes-filtro-vaga-top','vaga'],['contratacoes-ordenar','ordenar']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('change',e=>{contratacoesState[key]=e.target.value;contratacoesState.page=1;renderContratacoes();}));document.querySelectorAll('.contratacoes-view-tabs button').forEach(b=>b.addEventListener('click',()=>{contratacoesState.view=b.dataset.view;document.querySelectorAll('.contratacoes-view-tabs button').forEach(x=>x.classList.toggle('ativo',x===b));renderContratacoes();}));}
bindContratacoesControls();

// ===== PROPOSTAS =====
const propostasState={view:'pipeline',search:'',status:'',vaga:'',periodo:'',ordenar:'recentes',page:1,limit:10,selectedId:null};
let propostasRows=[];let propostasAll=[];let propostaDetailTab='detalhes';
function propostaEtapaIndex(c){let etapas=c&&c.etapas;if(typeof etapas==='string'){try{etapas=JSON.parse(etapas);}catch(_){etapas=[];}}if(Array.isArray(etapas)){const i=etapas.findIndex(e=>/proposta/i.test(String(typeof e==='string'?e:(e&&e.nome)||'')));if(i>=0)return i;}return 4;}
function propostaStatus(c){if(c.proposta_aceita_em)return'aceita';if(c.proposta_recusada_em||['rejeitado','reprovado'].includes(c.status))return'recusada';if(c.proposta_enviada_em)return'enviada';if(Number(c.etapa_atual)===propostaEtapaIndex(c))return'rascunho';return null;}
function propostaStatusText(s){return({rascunho:'Rascunho',enviada:'Enviada',negociacao:'Em negociação',aceita:'Aceita',recusada:'Recusada'}[s]||s||'—');}
function propostaInitials(n){return String(n||'C').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function propostaDate(v){if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');}
function propostaTime(v){return v?tempoRelativo(v):'—';}
function propostasFiltered(){const q=propostasState.search.trim().toLocaleLowerCase('pt-BR');const limit=propostasState.periodo?Date.now()-Number(propostasState.periodo)*86400000:0;let rows=propostasAll.filter(c=>{const s=propostaStatus(c),hay=[c.candidato_nome,c.candidato_email,c.titulo,c.empresa,c.id].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');return(!q||hay.includes(q))&&(!propostasState.status||s===propostasState.status)&&(!propostasState.vaga||String(c.vaga_id)===String(propostasState.vaga))&&(!limit||new Date(c.proposta_enviada_em||c.criada_em||0).getTime()>=limit);});rows.sort((a,b)=>{const da=new Date(a.proposta_enviada_em||a.criada_em||0),db=new Date(b.proposta_enviada_em||b.criada_em||0);if(propostasState.ordenar==='antigas')return da-db;if(propostasState.ordenar==='status')return propostaStatusText(propostaStatus(a)).localeCompare(propostaStatusText(propostaStatus(b)),'pt-BR');return db-da;});return rows;}
function atualizarKpisPropostas(){const rows=propostasAll;const count=s=>rows.filter(c=>propostaStatus(c)===s).length;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v);};set('prop-kpi-abertas',count('enviada'));set('prop-kpi-aguardando',count('enviada'));set('prop-kpi-aceitas',count('aceita'));set('prop-kpi-recusadas',count('recusada'));set('prop-kpi-expiram',0);}
async function carregarPropostas(){const box=document.getElementById('propostas-content');if(box)box.innerHTML='<div class="propostas-loading"><span class="spinner"></span> Carregando propostas...</div>';try{const r=await fetch(API+'/api/empresa/candidaturas',{headers:{'Authorization':'Bearer '+token}});const d=await r.json();if(!r.ok)throw new Error(d.erro||'Erro ao carregar propostas');propostasAll=(d.candidaturas||[]).filter(c=>propostaStatus(c));atualizarKpisPropostas();popularPropostasVagas();renderPropostas();}catch(e){if(box)box.innerHTML=`<div class="propostas-empty"><strong>Não foi possível carregar as propostas</strong><p>${escapeHtml(e.message||'Tente novamente.')}</p></div>`;}}
function popularPropostasVagas(){const options=[...new Map(propostasAll.map(c=>[c.vaga_id,{id:c.vaga_id,titulo:c.titulo}])).values()];['propostas-filtro-vaga','propostas-filtro-vaga-top'].forEach(id=>{const s=document.getElementById(id);if(!s)return;const current=s.value;s.innerHTML='<option value="">Todas as vagas</option>'+options.map(v=>`<option value="${v.id}">${escapeHtml(v.titulo||'Vaga')}</option>`).join('');s.value=current||'';});}
function propostaCard(c){const s=propostaStatus(c),selected=Number(propostasState.selectedId)===Number(c.id);const sent=c.proposta_enviada_em?`Enviada ${propostaTime(c.proposta_enviada_em)}`:'Ainda não enviada';const value=c.proposta_texto?c.proposta_texto.slice(0,90):'Detalhes da proposta não informados';return `<article class="proposta-card ${selected?'selecionada':''}" data-proposta-id="${c.id}" onclick="selecionarProposta(${c.id})"><div class="proposta-card-head"><span class="proposta-card-avatar">${escapeHtml(propostaInitials(c.candidato_nome))}</span><span class="proposta-card-copy"><strong>${escapeHtml(c.candidato_nome||'Candidato')}</strong><small>${escapeHtml(c.titulo||'Vaga')}</small></span><button class="proposta-card-menu" type="button" aria-label="Ver ações" onclick="event.stopPropagation();selecionarProposta(${c.id})">•••</button></div><div class="proposta-card-value">${escapeHtml(value)}</div><div class="proposta-card-meta"><span>${escapeHtml(c.empresa||'Minha empresa')}</span><span>·</span><span>${escapeHtml(agendaEtapaNome(c.etapa_atual))}</span></div><span class="proposta-card-status ${s}">${propostaStatusText(s)}</span><div class="proposta-card-footer"><span>${escapeHtml(sent)}</span><strong>${c.proposta_aceita_em?'Aceita':c.proposta_recusada_em?'Recusada':'Acompanhar'}</strong></div></article>`;}
function renderPropostas(){const rows=propostasFiltered();propostasRows=rows;const content=document.getElementById('propostas-content');if(!content)return;const total=rows.length;if(propostasState.view==='pipeline'){content.innerHTML=renderPropostasPipeline(rows);}else if(propostasState.view==='lista'){content.innerHTML=renderPropostasLista(rows);}else{content.innerHTML=renderPropostasAnalytics(rows);}renderPropostasAttention(rows);const page=Math.max(1,Math.ceil(total/propostasState.limit));if(propostasState.page>page)propostasState.page=page;renderPropostasPagination(total,page);if(propostasState.selectedId)renderPropostaDetail(propostasAll.find(c=>Number(c.id)===Number(propostasState.selectedId)));}
function renderPropostasPipeline(rows){const cols=[['rascunho','Rascunho','Ainda não enviada'],['enviada','Enviada','Aguardando resposta'],['negociacao','Em negociação','Discussão de condições'],['aceita','Aceita','Aguardando contratação'],['recusada','Recusada','Propostas não aceitas']];return `<div class="propostas-pipeline">${cols.map(([key,title,desc])=>{const list=rows.filter(c=>propostaStatus(c)===key);return `<section class="proposta-column"><header class="proposta-column-head"><div><h3>${title}</h3><span class="proposta-column-count">${list.length}</span></div><p>${desc}</p></header><div class="proposta-column-body">${list.length?list.map(propostaCard).join(''):'<div class="propostas-empty"><p>Nenhuma proposta nesta etapa.</p></div>'}</div></section>`;}).join('')}</div>`;}
function renderPropostasLista(rows){const start=(propostasState.page-1)*propostasState.limit,pageRows=rows.slice(start,start+propostasState.limit);if(!rows.length)return'<div class="propostas-empty"><strong>Nenhuma proposta encontrada</strong><p>Nenhuma proposta corresponde aos filtros selecionados.</p><button class="btn btn-primary" type="button" onclick="limparFiltrosPropostas()">Limpar filtros</button></div>';return`<div class="propostas-lista"><table class="propostas-list-table"><thead><tr><th>Candidato</th><th>Vaga</th><th>Status</th><th>Enviada em</th><th>Validade</th><th>Ações</th></tr></thead><tbody>${pageRows.map(c=>`<tr onclick="selecionarProposta(${c.id})"><td><span class="proposta-card-avatar">${escapeHtml(propostaInitials(c.candidato_nome))}</span>${escapeHtml(c.candidato_nome||'—')}</td><td>${escapeHtml(c.titulo||'—')}</td><td><span class="proposta-card-status ${propostaStatus(c)}">${propostaStatusText(propostaStatus(c))}</span></td><td>${propostaDate(c.proposta_enviada_em)}</td><td>Não informada</td><td><button class="proposta-card-menu" type="button" onclick="event.stopPropagation();selecionarProposta(${c.id})">•••</button></td></tr>`).join('')}</tbody></table></div>`;}
function renderPropostasAnalytics(rows){const sent=rows.filter(c=>c.proposta_enviada_em).length,accepted=rows.filter(c=>propostaStatus(c)==='aceita').length,refused=rows.filter(c=>propostaStatus(c)==='recusada').length,rate=sent?Math.round(accepted/sent*100):0;return`<div class="propostas-analytics"><div class="proposta-analytics-card"><small>Total de propostas</small><strong>${rows.length}</strong></div><div class="proposta-analytics-card"><small>Enviadas</small><strong>${sent}</strong></div><div class="proposta-analytics-card"><small>Aceitas</small><strong>${accepted}</strong></div><div class="proposta-analytics-card"><small>Taxa de aceitação</small><strong>${rate}%</strong></div><div class="proposta-chart"><strong>Performance das propostas</strong><div class="proposta-chart-bars"><div class="proposta-chart-group"><i class="proposta-chart-bar" style="height:${Math.max(3,Math.min(100,sent*10))}px"></i><i class="proposta-chart-bar accepted" style="height:${Math.max(3,Math.min(100,accepted*10))}px"></i><i class="proposta-chart-bar refused" style="height:${Math.max(3,Math.min(100,refused*10))}px"></i></div></div><div class="proposta-chart-label">Enviadas · Aceitas · Recusadas</div></div></div>`;}
function renderPropostasAttention(rows){const box=document.getElementById('propostas-attention');if(!box)return;const now=Date.now(),old=rows.filter(c=>propostaStatus(c)==='enviada'&&c.proposta_enviada_em&&(now-new Date(c.proposta_enviada_em).getTime())>5*86400000).length,accepted=rows.filter(c=>propostaStatus(c)==='aceita'&&c.proposta_aceita_em&&new Date(c.proposta_aceita_em).getTime()>now-7*86400000).length;const items=[];if(old)items.push(`<div class="proposta-attention-item"><svg class="dash-svg"><use href="#icon-bell"></use></svg><span><strong>${old} proposta${old>1?'s':''} aguardando resposta há mais de 5 dias</strong>Revisar no pipeline.</span></div>`);if(accepted)items.push(`<div class="proposta-attention-item success"><svg class="dash-svg"><use href="#icon-check"></use></svg><span><strong>${accepted} proposta${accepted>1?'s':''} aceita${accepted>1?'s':''} nesta semana</strong>Acompanhar contratação.</span></div>`);if(!items.length)items.push('<div class="proposta-attention-item success"><svg class="dash-svg"><use href="#icon-check"></use></svg><span><strong>Nenhuma atenção urgente</strong>Não há alertas calculáveis no momento.</span></div>');box.innerHTML=items.join('');}
function renderPropostasPagination(total,pages){const box=document.getElementById('propostas-pagination');if(!box)return;if(propostasState.view!=='lista'||pages<=1){box.innerHTML='';return;}box.innerHTML=Array.from({length:pages},(_,i)=>`<button type="button" class="${i+1===propostasState.page?'ativo':''}" onclick="propostasIrPagina(${i+1})">${i+1}</button>`).join('');}
function propostasIrPagina(page){propostasState.page=page;renderPropostas();}
function selecionarProposta(id){propostasState.selectedId=id;renderPropostas();loadPropostaDetail(id);}
async function loadPropostaDetail(id){const c=propostasAll.find(x=>Number(x.id)===Number(id));if(!c)return;const panel=document.getElementById('proposta-detail-panel');if(!panel)return;panel.classList.add('aberto');panel.innerHTML='<div class="proposta-detail-empty"><span class="spinner"></span><span>Carregando detalhes da proposta...</span></div>';try{const r=await fetch(API+'/api/empresa/candidatura/'+id,{headers:{'Authorization':'Bearer '+token}});const d=await r.json();renderPropostaDetail(d&&d.id?d:c);}catch(_){renderPropostaDetail(c);}}
function renderPropostaDetail(c){const panel=document.getElementById('proposta-detail-panel');if(!panel||!c)return;const s=propostaStatus(c),history=Array.isArray(c.historico)?c.historico:[],sent=c.proposta_enviada_em,accepted=c.proposta_aceita_em,refused=c.proposta_recusada_em;const timeline=[{label:'Candidatura aprovada',date:c.criada_em,done:true},{label:'Proposta enviada',date:sent,done:!!sent},{label:accepted?'Proposta aceita':refused?'Proposta recusada':'Aguardando candidato',date:accepted||refused||sent,current:!!sent&&!accepted&&!refused},{label:'Contratação',date:null,done:c.status==='contratado'}];const tabButtons=['detalhes','historico','documentos','notas'].map(t=>`<button type="button" class="${propostaDetailTab===t?'ativo':''}" onclick="propostaTrocarAba('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join('');let body='';if(propostaDetailTab==='detalhes')body=`<section class="proposta-detail-section"><h4>Detalhes da proposta</h4><div class="proposta-info-grid"><div class="proposta-info-item"><small>Remuneração</small><strong>Não informada</strong></div><div class="proposta-info-item"><small>Tipo de contratação</small><strong>Não informado</strong></div><div class="proposta-info-item"><small>Data de envio</small><strong>${propostaDate(sent)}</strong></div><div class="proposta-info-item"><small>Validade</small><strong>Não informada</strong></div><div class="proposta-info-item"><small>Vaga</small><strong>${escapeHtml(c.titulo||'—')}</strong></div><div class="proposta-info-item"><small>Responsável</small><strong>Não informado</strong></div></div><div class="proposta-card-value" style="margin-top:9px">${escapeHtml(c.proposta_texto||'Texto da proposta não informado.')}</div></section><section class="proposta-detail-section"><h4>Linha do tempo da proposta</h4><div class="proposta-timeline">${timeline.map(x=>`<div class="proposta-timeline-item ${x.done?'done':''} ${x.current?'current':''}"><span class="proposta-timeline-dot">${x.done?'✓':x.current?'•':'○'}</span><span>${x.label}<small>${x.date?propostaDate(x.date):x.current?'Atual':'Pendente'}</small></span></div>`).join('')}</div></section>`;else if(propostaDetailTab==='historico')body=`<section class="proposta-detail-section"><h4>Histórico real</h4><div class="proposta-timeline">${history.length?history.map(h=>`<div class="proposta-timeline-item done"><span class="proposta-timeline-dot">✓</span><span>${escapeHtml(h.mensagem||h.detalhes||h.acao||h.tipo||'Atualização')}<small>${propostaDate(h.data||h.quando||h.criado_em)} · ${escapeHtml(h.por||'Sistema')}</small></span></div>`).join(''):'<div class="proposta-note">Nenhum evento de histórico disponível.</div>'}</div></section>`;else if(propostaDetailTab==='documentos')body=`<section class="proposta-detail-section"><h4>Anexos da proposta</h4>${c.proposta_pdf_url?`<div class="proposta-document"><svg class="dash-svg"><use href="#icon-file"></use></svg><span>Documento da proposta</span><a href="${safeExternalUrl(c.proposta_pdf_url)}" target="_blank" rel="noopener">Visualizar</a></div>`:'<div class="proposta-note">Nenhum documento anexado à proposta.</div>'}</section>`;else body='<section class="proposta-detail-section"><h4>Notas internas</h4><div class="proposta-note">Nenhuma nota interna disponível para esta proposta.</div></section>';panel.innerHTML=`<div class="proposta-detail-content"><div class="proposta-detail-head"><span class="proposta-detail-avatar">${escapeHtml(propostaInitials(c.candidato_nome||c.nome))}</span><div class="proposta-detail-head-copy"><h3>${escapeHtml(c.candidato_nome||c.nome||'Candidato')}</h3><p>${escapeHtml(c.titulo||c.vaga_titulo||'Vaga')} · ${escapeHtml(c.empresa||c.vaga_empresa||'Minha empresa')}</p><span class="proposta-detail-status">${propostaStatusText(s)}</span></div><button class="proposta-detail-close" type="button" onclick="fecharPropostaDetalhe()">×</button></div><div class="proposta-detail-actions"><button class="primary" type="button" onclick="abrirCurriculo(${c.candidato_id||c.candidato_id_full||0})">Ver candidato</button><button type="button" onclick="irPara('candidaturas')">Ver candidatura</button><button type="button" onclick="fecharPropostaDetalhe()">Fechar</button></div><div class="proposta-detail-tabs">${tabButtons}</div>${body}</div>`;}
function propostaTrocarAba(tab){propostaDetailTab=tab;const c=propostasAll.find(x=>Number(x.id)===Number(propostasState.selectedId));if(c)renderPropostaDetail(c);}
function fecharPropostaDetalhe(){propostasState.selectedId=null;document.getElementById('proposta-detail-panel')?.classList.remove('aberto');renderPropostas();}
function limparFiltrosPropostas(){Object.assign(propostasState,{search:'',status:'',vaga:'',periodo:'',page:1});['propostas-busca','propostas-filtro-status','propostas-filtro-vaga','propostas-filtro-periodo','propostas-filtro-vaga-top'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});renderPropostas();}
function propostasMoverPeriodo(dir){const vals=['','7','30','90'],i=Math.max(0,vals.indexOf(propostasState.periodo)+dir);propostasState.periodo=vals[Math.min(vals.length-1,i)];const e=document.getElementById('propostas-filtro-periodo');if(e)e.value=propostasState.periodo;renderPropostas();}
function abrirModalNovaProposta(){const s=document.getElementById('proposta-candidatura');if(!s)return;const eligible=propostasAll.length?propostasAll.filter(c=>!c.proposta_enviada_em&&Number(c.etapa_atual)===propostaEtapaIndex(c)):[];s.innerHTML='<option value="">Selecione uma candidatura na etapa de proposta...</option>'+eligible.map(c=>`<option value="${c.id}">${escapeHtml(c.candidato_nome||'Candidato')} · ${escapeHtml(c.titulo||'Vaga')}</option>`).join('');document.getElementById('proposta-texto').value='';document.getElementById('proposta-pdf-url').value='';document.getElementById('alert-proposta').innerHTML=eligible.length?'':'<div class="alert alert-erro">Não há candidaturas elegíveis para uma nova proposta.</div>';abrirModal('proposta');}
async function enviarNovaProposta(){const id=document.getElementById('proposta-candidatura').value,texto=document.getElementById('proposta-texto').value.trim(),pdf=document.getElementById('proposta-pdf-url').value.trim();if(!id||(!texto&&!pdf)){document.getElementById('alert-proposta').innerHTML='<div class="alert alert-erro">Selecione uma candidatura e informe o texto ou o PDF da proposta.</div>';return;}try{const r=await fetch(API+'/api/empresa/candidatura/'+id+'/proposta',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({texto,pdf_url:pdf||null})});const d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível enviar a proposta');fecharModal('proposta');await carregarPropostas();}catch(e){document.getElementById('alert-proposta').innerHTML=`<div class="alert alert-erro">${escapeHtml(e.message)}</div>`;}}
function bindPropostasControls(){if(window.__propostasControlsBound)return;window.__propostasControlsBound=true;document.getElementById('propostas-busca')?.addEventListener('input',e=>{propostasState.search=e.target.value;propostasState.page=1;renderPropostas();});document.getElementById('propostas-filtros-btn')?.addEventListener('click',e=>{const p=document.getElementById('propostas-filtros-advanced'),open=p.hasAttribute('hidden');if(open)p.removeAttribute('hidden');else p.setAttribute('hidden','');e.currentTarget.setAttribute('aria-expanded',String(open));});[['propostas-filtro-status','status'],['propostas-filtro-vaga','vaga'],['propostas-filtro-periodo','periodo'],['propostas-ordenar','ordenar'],['propostas-filtro-vaga-top','vaga']].forEach(([id,key])=>document.getElementById(id)?.addEventListener('change',e=>{propostasState[key]=e.target.value;propostasState.page=1;renderPropostas();}));document.querySelectorAll('.propostas-view-tabs button').forEach(b=>b.addEventListener('click',()=>{propostasState.view=b.dataset.view;document.querySelectorAll('.propostas-view-tabs button').forEach(x=>x.classList.toggle('ativo',x===b));renderPropostas();}));}
bindPropostasControls();

async function abrirCurriculo(id) {
  abrirModal('curriculo');
  const body = document.getElementById('curriculo-body');
  const titulo = document.getElementById('curriculo-titulo');
  body.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  titulo.textContent = '📄 Currículo do Candidato';
  try {
    const r = await fetch(API + '/api/empresa/candidatos/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      body.innerHTML = '<div class="alert alert-erro">Erro: ' + escapeHtml(err.erro || String(r.status)) + '</div>';
      return;
    }
    const c = await r.json();
    const cand = c.candidato || c;
    const esc = escapeHtml;
    titulo.textContent = '📄 ' + (cand.nome || 'Candidato');

    const areas = Array.isArray(cand.areas_interesse) ? cand.areas_interesse : [];
    const areasHtml = areas.length
      ? areas.map(a => `<span class="badge-area">${esc(a)}</span>`).join(' ')
      : '<span style="color:var(--cinza-medio)">Nenhuma área selecionada</span>';

    body.innerHTML = `
      <div class="curriculo-grid">
        <div class="curriculo-card">
          <h4>👤 Dados pessoais</h4>
          <div class="kv"><span>Nome</span><strong>${esc(cand.nome || '—')}</strong></div>
          <div class="kv"><span>CPF</span><strong>${esc(cand.cpf || '—')}</strong></div>
          <div class="kv"><span>Nascimento</span><strong>${formatarData(cand.data_nascimento)}</strong></div>
          <div class="kv"><span>Sexo</span><strong>${esc(cand.sexo || '—')}</strong></div>
          <div class="kv"><span>Email</span><strong>${esc(cand.email || '—')}</strong></div>
          <div class="kv"><span>Celular</span><strong>${esc(cand.celular || '—')}</strong></div>
          <div class="kv"><span>Acessibilidade</span><strong>${esc(cand.acessibilidade || 'Nenhuma')}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>📍 Endereço</h4>
          <div class="kv"><span>CEP</span><strong>${esc(cand.cep || '—')}</strong></div>
          <div class="kv"><span>Logradouro</span><strong>${esc((cand.logradouro || '—') + (cand.numero ? ', ' + cand.numero : '') + (cand.complemento ? ' — ' + cand.complemento : ''))}</strong></div>
          <div class="kv"><span>Bairro</span><strong>${esc(cand.bairro || '—')}</strong></div>
          <div class="kv"><span>Cidade/UF</span><strong>${esc((cand.cidade || '—') + (cand.estado ? '/' + cand.estado : ''))}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>🎓 Escolaridade</h4>
          <div class="kv"><span>Formação</span><strong>${esc(cand.formacao || '—')}</strong></div>
          <div class="kv"><span>Instituição</span><strong>${esc(cand.instituicao || '—')}</strong></div>
          <div class="kv"><span>Curso</span><strong>${esc(cand.curso || '—')}</strong></div>
          <div class="kv"><span>Situação</span><strong>${esc(cand.situacao || '—')}</strong></div>
          <div class="kv"><span>Conclusão</span><strong>${formatarData(cand.data_conclusao)}</strong></div>
          <div class="kv"><span>Primeiro emprego?</span><strong>${cand.primeiro_emprego ? 'Sim' : 'Não'}</strong></div>
        </div>
        <div class="curriculo-card">
          <h4>🎯 Áreas de interesse</h4>
          <div class="areas-badges" style="margin-top:8px">${areasHtml}</div>
        </div>
        <div class="curriculo-card curriculo-full">
          <h4>💼 Experiências</h4>
          <pre style="white-space:pre-wrap;font-family:inherit;background:#fafafa;padding:10px;border-radius:6px;margin-top:6px">${esc(cand.experiencia || 'Não informado')}</pre>
        </div>
        <div class="curriculo-card curriculo-full">
          <h4>📝 Sobre você</h4>
          <pre style="white-space:pre-wrap;font-family:inherit;background:#fafafa;padding:10px;border-radius:6px;margin-top:6px">${esc(cand.sobre_voce || 'Não informado')}</pre>
        </div>
        <div class="curriculo-card curriculo-full">
          <h4>📊 Status no Banco de Talentos</h4>
          <div class="kv"><span>Cadastro criado em</span><strong>${formatarData(cand.criado_em)}</strong></div>
          <div class="kv"><span>Autoriza banco de talentos</span><strong>${cand.banco_talentos ? '✅ Sim' : '❌ Não'}</strong></div>
        </div>
      </div>`;
  } catch (e) {
    body.innerHTML = '<div class="alert alert-erro">Erro: ' + escapeHtml(e.message || 'Erro interno') + '</div>';
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
    const r = await fetch(API + '/api/empresa/vagas-com-candidaturas', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      grid.innerHTML = '<div class="empty">Erro: ' + escapeHtml(err.erro || String(r.status)) + '</div>';
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
            <h3 style="margin:0;font-size:16px;color:var(--vinho)">${escapeHtml(v.titulo || 'Vaga')}</h3>
            <span class="badge ${statusBadge}">${escapeHtml(v.status === 'publicada' ? 'Publicada' : v.status === 'pausada' ? 'Pausada' : v.status === 'fechada' ? 'Fechada' : v.status || '')}</span>
          </div>
          <div style="font-size:13px;color:var(--cinza-medio);margin-bottom:12px">${escapeHtml(v.empresa || '—')} • ${escapeHtml(v.cidade || '')}${v.estado ? '/' + escapeHtml(v.estado) : ''}</div>
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
    grid.innerHTML = '<div class="empty">Erro de conexão: ' + escapeHtml(e.message || 'Erro interno') + '</div>';
  }
}

function irParaPagina(page) {
  // Guarda a página interna para que a análise consiga voltar exatamente
  // para a lista de origem (inclusive a lista de candidatos de uma vaga).
  window.__empresaInternalPage = page;
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
    const r = await fetch(API + '/api/empresa/vagas/' + vagaId + '/candidatos', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      tb.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + escapeHtml(err.erro || String(r.status)) + '</td></tr>';
      return;
    }
    const data = await r.json();
    const vagaResp = await fetch(API + '/api/empresa/vagas/' + vagaId, { headers: { 'Authorization': 'Bearer ' + token } });
    const vagaData = await vagaResp.json().catch(() => ({}));
    data.vaga = vagaData.vaga || vagaData;
    data.candidaturas = data.candidatos || data.candidaturas || [];
    vagaAtualCands = data.vaga;
    candidaturasVagaCache = data.candidaturas;

    document.getElementById('cands-vaga-titulo').textContent = '👥 ' + (data.vaga.titulo || '') + ' — Candidatos';
    document.getElementById('cands-vaga-voltar').onclick = () => irParaPagina('candidaturas');
    const info = document.getElementById('cands-vaga-info');
    info.innerHTML = `
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div><strong>Empresa:</strong> ${escapeHtml(data.vaga.empresa || '—')}</div>
        <div><strong>Local:</strong> ${escapeHtml(data.vaga.cidade || '—')}${data.vaga.estado ? '/' + escapeHtml(data.vaga.estado) : ''}</div>
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
        <td><strong>${escapeHtml(c.nome || '—')}</strong></td>
        <td>${escapeHtml(c.email || '—')}</td>
        <td>${c.cidade ? (escapeHtml(c.cidade + (c.estado ? '/' + c.estado : ''))) : '<span style="color:var(--cinza-medio)">Não informada</span>'}</td>
        <td>${numEtapa}. ${escapeHtml(etapaNome)}</td>
        <td><span class="badge ${badge}">${c.status === 'em_analise' ? 'Em análise' : c.status === 'em_andamento' ? 'Em andamento' : c.status === 'contratado' ? 'Contratado' : c.status === 'reprovado' ? 'Reprovado' : c.status === 'rejeitado' ? 'Rejeitado' : c.status === 'aprovado' ? 'Aprovado' : escapeHtml(c.status || '')}</span></td>
        <td>${formatarData(c.criada_em)}</td>
        <td>
          <a class="btn-ver" href="javascript:void(0)" onclick="analisarCandidatura(${c.id})">👁 Ver</a>
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="7" class="empty">Erro: ' + escapeHtml(e.message || 'Erro interno') + '</td></tr>';
  }
}

// Abre a análise completa dentro do shell da SPA. O documento original
// continua sendo carregado sem alterações dentro do iframe.
function carregarAnalisarEmbed() {
  const frame = document.getElementById('analisar-iframe');
  if (!frame) return;
  const id = new URLSearchParams(window.location.search).get('candidatura_id');
  if (!id || !/^\d+$/.test(String(id))) {
    frame.removeAttribute('src');
    return;
  }
  const src = 'analisar.html?id=' + encodeURIComponent(id) + '&embed=1&v=empresa-analisar-8';
  if (frame.getAttribute('src') !== src) frame.src = src;
}
function analisarCandidatura(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return;
  const origem = window.__empresaInternalPage || new URLSearchParams(window.location.search).get('page') || 'candidatos';
  const params = { candidatura_id: n, voltar_para: origem };
  if (origem === 'candidatos-vaga' && vagaAtualCands?.id) params.voltar_vaga_id = vagaAtualCands.id;
  dashNavigate('analisar', params);
}

async function acaoCandidatura(id, acao) {
  const mensagens = {
    'avancar': 'Avançar o candidato para a próxima etapa do processo seletivo?',
    'reprovar': 'Marcar este candidato como NÃO SELECIONADO? Esta ação pode ser revertida.',
    'reabrir': 'Reabrir a candidatura? Voltará para análise inicial.'
  };
  if (!confirm(mensagens[acao])) return;
  try {
    const r = await fetch(API + '/api/empresa/candidatura/' + id + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ acao })
    });
    const data = await r.json();
    if (!r.ok) { alert('Erro: ' + (data.erro || 'Não foi possível atualizar')); return; }
    if (vagaAtualCands) {
      const r2 = await fetch(API + '/api/empresa/vagas/' + vagaAtualCands.id + '/candidatos', { headers: { 'Authorization': 'Bearer ' + token } });
      if (r2.ok) {
        const d2 = await r2.json();
        candidaturasVagaCache = d2.candidatos || d2.candidaturas || [];
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
    const r = await fetch(API + '/api/empresa/candidatura/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await r.json();
    if (!r.ok) {
      container.innerHTML = `<div class="alert alert-erro">${escapeHtml(data.erro || 'Erro')}</div>`;
      return;
    }
    const c0 = data.candidatura || data;
    const c = { ...c0, titulo: c0.titulo || c0.vaga_titulo, empresa: c0.empresa || c0.vaga_empresa };
    container.innerHTML = `
      <div class="det-grid">
        <div class="det-item"><div class="det-label">Candidato</div><div class="det-value">${escapeHtml(c.nome || '—')}</div></div>
        <div class="det-item"><div class="det-label">E-mail</div><div class="det-value">${escapeHtml(c.email || '—')}</div></div>
        <div class="det-item"><div class="det-label">Celular</div><div class="det-value">${escapeHtml(c.celular || '—')}</div></div>
        <div class="det-item"><div class="det-label">CPF</div><div class="det-value">${escapeHtml(c.cpf || '—')}</div></div>
        <div class="det-item"><div class="det-label">Vaga</div><div class="det-value">${escapeHtml(c.titulo || '—')}</div></div>
        <div class="det-item"><div class="det-label">Empresa</div><div class="det-value">${escapeHtml(c.empresa || '—')}</div></div>
        <div class="det-item"><div class="det-label">Status</div><div class="det-value"><span class="badge ${c.status === 'contratado' ? 'badge-ativa' : (c.status === 'reprovado' || c.status === 'rejeitado') ? 'badge-fechada' : c.status === 'aprovado' ? 'badge-ativa' : 'badge-pendente'}">${c.status === 'em_analise' ? 'Em análise' : c.status === 'em_andamento' ? 'Em andamento' : c.status === 'contratado' ? 'Contratado' : c.status === 'reprovado' ? 'Reprovado' : c.status === 'rejeitado' ? 'Rejeitado' : c.status === 'aprovado' ? 'Aprovado' : c.status}</span></div></div>
        <div class="det-item"><div class="det-label">Criada em</div><div class="det-value">${formatarData(c.criada_em)}</div></div>
      </div>
      <div class="det-section">
        <h3>Histórico</h3>
        ${(c.historico && c.historico.length > 0)
          ? '<ul style="list-style:none;padding:0;">' + c.historico.map(h => {
              const d = h.data ? new Date(h.data).toLocaleString('pt-BR') : '';
              const m = h.mensagem ? '<br><em style="color:var(--cinza-medio);">' + escapeHtml(h.mensagem) + '</em>' : '';
              const p = h.por ? '<br><small>por ' + escapeHtml(h.por) + '</small>' : '';
              return '<li style="padding:10px;border-left:3px solid var(--vinho);margin-bottom:8px;background:#f9f9f9;"><strong>' + escapeHtml(h.etapa || h.status || '') + '</strong> [' + escapeHtml(h.status || '') + '] — ' + escapeHtml(d) + p + m + '</li>';
            }).join('') + '</ul>'
          : '<p style="color:var(--cinza-medio);">Nenhuma movimentação ainda.</p>'}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="alert alert-erro">Erro: ${escapeHtml(e.message || 'Erro interno')}</div>`;
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
// ===== DASHBOARD — ações diretas e detalhes em modal =====
function dashValidId(value){const n=Number(value);return Number.isInteger(n)&&n>0?n:null;}
function dashQuery(page, params={}){const q=new URLSearchParams();q.set('page',page);Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&String(v)!=='')q.set(k,String(v));});return q;}
function dashNavigate(page, params={}){const q=dashQuery(page,params);history.replaceState(null,'','?'+q.toString());irPara(page,{keepQuery:true});}
function dashReadQuery(){const q=new URLSearchParams(location.search);return {page:q.get('page')||'dashboard',status:q.get('status')||'',vagaId:q.get('vaga_id')||'',etapa:q.get('etapa')||'',periodo:q.get('periodo')||''};}
function dashApplyQuery(){
  const q=dashReadQuery();
  if(typeof vagasState!=='undefined'){vagasState.status=q.status||'';vagasState.vagaId=dashValidId(q.vagaId)||'';if(q.periodo)vagasState.periodo=q.periodo;}
  if(typeof candidatosState!=='undefined'){candidatosState.vaga=q.vagaId||'';candidatosState.etapa=q.etapa||'';candidatosState.page=1;}
  if(typeof contratacoesState!=='undefined'){contratacoesState.status=q.status||'';contratacoesState.vaga=q.vagaId||'';contratacoesState.page=1;}
  return q;
}
function dashboardInsightText(value){return escapeHtml(value===undefined||value===null||value===''?'—':String(value));}
function dashboardUniqueStageLabels(values){const seen=new Set();return (Array.isArray(values)?values:[]).map(v=>String(v??'').replace(/\s+/g,' ').trim()).filter(label=>{if(!label)return false;const key=label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');if(seen.has(key))return false;seen.add(key);return true;}).slice(0,7);}
function dashboardDate(value){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
function dashboardActivityLabel(a){const map={inscricao:'Nova inscrição',avancar:'Avançou de etapa',reprovar:'Reprovado',reabrir:'Reaberto',recusar_proposta:'Proposta recusada',aceitar_proposta:'Proposta aceita',enviar_proposta:'Proposta enviada',entrevista:'Entrevista agendada',comentario:'Parecer adicionado'};return map[a.evento_tipo||a.texto]||a.mensagem||'Atualização do processo';}

// A única visão auxiliar do Dashboard é este modal. Ele nunca troca a página nem a URL.
let dashboardModalLastFocus=null;
let dashboardModalView='';
let dashboardModalPreviousBodyOverflow='';
function dashboardModalElements(){return {overlay:document.getElementById('modal-dashboard-insight'),dialog:document.querySelector('#modal-dashboard-insight .dashboard-modal'),title:document.getElementById('dashboard-modal-title'),subtitle:document.getElementById('dashboard-modal-subtitle'),content:document.getElementById('dashboard-modal-content')};}
function dashboardModalState(kind,message,detail=''){const text=kind==='loading'?'Carregando dados reais...':kind==='error'?'Não foi possível carregar estes dados.':'Nenhum registro corresponde a este resumo.';return `<div class="dashboard-modal-state ${kind}">${kind==='loading'?'<span class="spinner" aria-hidden="true"></span>':''}<strong>${escapeHtml(message||text)}</strong>${detail?`<span>${escapeHtml(detail)}</span>`:''}${kind==='error'?'<button type="button" class="btn btn-sec" data-dashboard-retry>Tentar novamente</button>':''}</div>`;}
function dashboardModalFocusables(dialog){return [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);}
function dashboardModalKeydown(e){const {overlay,dialog}=dashboardModalElements();if(!overlay?.classList.contains('aberto'))return;if(e.key==='Escape'){e.preventDefault();fecharDashboardInsight();return;}if(e.key!=='Tab')return;const items=dashboardModalFocusables(dialog);if(!items.length){e.preventDefault();dialog.focus();return;}const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
function openDashboardModal(view){
  const parts=dashboardModalElements();if(!parts.overlay||!parts.dialog||!parts.content)return;
  dashboardModalView=['processos','antigas','funil','history'].includes(view)?view:'history';
  dashboardModalLastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  parts.overlay.classList.add('aberto');parts.overlay.setAttribute('aria-hidden','false');
  dashboardModalPreviousBodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  parts.title.textContent='Detalhes do dashboard';parts.subtitle.textContent='';parts.content.innerHTML=dashboardModalState('loading');
  parts.dialog.focus();
  // Sempre passa pelo estado de carregamento; isso também cobre um dashboard ainda sem dados.
  requestAnimationFrame(async()=>{try{if(!window.__empresaDashboardData)await carregarDashboardBase();if(!window.__empresaDashboardData)throw new Error('Dashboard indisponível');renderDashboardModal(dashboardModalView);}catch(e){parts.content.innerHTML=dashboardModalState('error','Não foi possível carregar os detalhes.',e.message||'Tente novamente.');}});
}
function abrirDashboardModal(view){return openDashboardModal(view);}
function fecharDashboardInsight(){
  const parts=dashboardModalElements();if(!parts.overlay)return;
  parts.overlay.classList.remove('aberto');parts.overlay.setAttribute('aria-hidden','true');document.body.style.overflow=dashboardModalPreviousBodyOverflow||'';dashboardModalView='';
  if(dashboardModalLastFocus?.isConnected){dashboardModalLastFocus.focus();}dashboardModalLastFocus=null;
}
function dashboardModalRetry(){if(dashboardModalView)openDashboardModal(dashboardModalView);}
function renderDashboardModal(view){
  const {title,subtitle,content}=dashboardModalElements(),d=window.__empresaDashboardData||{},rows=Array.isArray(d.vagas)?d.vagas:[];if(!title||!subtitle||!content)return;
  let html='';
  if(view==='processos'){
    title.textContent='Processos ativos';subtitle.textContent='Candidaturas em andamento nas vagas vinculadas à sua empresa.';
    const data=Array.isArray(d.processos_por_vaga)?d.processos_por_vaga:[];
    html=data.length?`<div class="dashboard-modal-table-wrap"><table><thead><tr><th>Vaga</th><th>Status</th><th>Processos</th><th>Ação</th></tr></thead><tbody>${data.map(v=>{const id=dashValidId(v.vaga_id);return id?`<tr><td><strong>${dashboardInsightText(v.titulo)}</strong></td><td>${dashboardInsightText(v.vaga_status)}</td><td>${Number(v.processos_ativos||0).toLocaleString('pt-BR')}</td><td><button type="button" class="dashboard-modal-action" data-dashboard-nav="candidatos" data-vaga-id="${id}">Ver candidatos</button></td></tr>`:''}).join('')}</tbody></table></div>`:dashboardModalState('empty','Nenhum processo ativo','Não há candidaturas em andamento nas vagas disponíveis.');
  }else if(view==='antigas'){
    title.textContent='Vagas abertas há mais de 30 dias';subtitle.textContent='Vagas publicadas cuja data real de criação ultrapassa 30 dias.';
    const data=Array.isArray(d.vagas_abertas_mais_30)?d.vagas_abertas_mais_30:rows.filter(v=>v.status==='publicada'&&v.criada_em&&Date.now()-new Date(v.criada_em).getTime()>30*86400000);
    html=data.length?`<div class="dashboard-modal-table-wrap"><table><thead><tr><th>Vaga</th><th>Aberta em</th><th>Candidatos</th><th>Ação</th></tr></thead><tbody>${data.map(v=>{const id=dashValidId(v.id);return id?`<tr><td><strong>${dashboardInsightText(v.titulo)}</strong></td><td>${dashboardDate(v.criada_em)}</td><td>${Number(v.total_candidatos||0).toLocaleString('pt-BR')}</td><td><button type="button" class="dashboard-modal-action" data-dashboard-nav="vagas" data-vaga-id="${id}" data-status="publicada" data-periodo="all">Ver vaga</button></td></tr>`:''}).join('')}</tbody></table></div>`:dashboardModalState('empty','Nenhuma vaga nesta condição','Não há vaga publicada aberta há mais de 30 dias.');
  }else if(view==='funil'){
    title.textContent='Funil completo';subtitle.textContent='Selecione uma etapa para abrir Candidatos com o identificador real da etapa.';
    const configuredLabels=rows.flatMap(v=>{try{const e=Array.isArray(v.etapas)?v.etapas:(typeof v.etapas==='string'?JSON.parse(v.etapas):[]);return e.map(x=>typeof x==='string'?x:x?.nome).filter(Boolean);}catch(_){return [];}});const labels=dashboardUniqueStageLabels(configuredLabels.length?configuredLabels:(Array.isArray(d.etapas_labels)?d.etapas_labels:[]));const counts=d.etapas||{};const observed=Object.entries(counts).filter(([,value])=>Number(value)>0).map(([key])=>Number(key)).filter(Number.isFinite);const configured=rows.map(v=>{try{const e=Array.isArray(v.etapas)?v.etapas:(typeof v.etapas==='string'?JSON.parse(v.etapas):[]);return e.length;}catch(_){return 0;}}).reduce((m,n)=>Math.max(m,n),0);const n=Math.min(7,Math.max(observed.length?Math.max(...observed):0,configured));
    html=n?`<div class="dashboard-modal-list">${Array.from({length:n},(_,i)=>{const stage=i+1;return `<button type="button" class="dashboard-modal-stage" data-dashboard-nav="candidatos" data-etapa="${stage}"><b>${Number(counts[stage]||0).toLocaleString('pt-BR')}</b><span>${dashboardInsightText(labels[i]||`Etapa ${stage}`)}</span><small>Ver candidatos →</small></button>`;}).join('')}</div>`:dashboardModalState('empty','Funil indisponível','A empresa ainda não possui etapas configuradas ou candidaturas observadas.');
  }else{
    title.textContent='Histórico de atividades';subtitle.textContent='Eventos reais das candidaturas desta empresa nas últimas 48 horas, do mais novo ao mais antigo.';
    const data=Array.isArray(d.atividades_historico_48h)?d.atividades_historico_48h:[];
    html=data.length?`<div class="dashboard-modal-list">${data.map(a=>`<div class="dashboard-modal-event"><strong>${dashboardInsightText(dashboardActivityLabel(a))}</strong><span>${dashboardInsightText(a.candidato)} · ${dashboardInsightText(a.vaga)} · ${dashboardDate(a.quando)}${a.por?' · '+dashboardInsightText(a.por):''}</span></div>`).join('')}</div>`:dashboardModalState('empty','Nenhuma atividade encontrada','Não houve evento disponível nas últimas 48 horas.');
  }
  content.innerHTML=html;
  const first=dashboardModalFocusables(document.querySelector('#modal-dashboard-insight .dashboard-modal'))[0];if(first)first.focus();
}
function dashboardKpi(action){if(action==='active-vagas')return dashNavigate('vagas',{status:'publicada',periodo:'all'});if(action==='candidatos')return dashNavigate('candidatos');if(action==='entrevistas')return dashNavigate('agenda');if(action==='contratacoes')return dashNavigate('contratacoes',{status:'concluido'});if(action==='processos')return openDashboardModal('processos');if(action==='antigas')return openDashboardModal('antigas');}
function dashOpenVaga(id){const n=dashValidId(id);if(n)dashNavigate('vagas',{vaga_id:n,periodo:'all'});}
function dashOpenStage(stage){const n=dashValidId(stage);if(n)dashNavigate('candidatos',{etapa:n});}
function dashApplyOfficialState(){const q=dashApplyQuery();if(q.page==='vagas'){const st=document.getElementById('vagas-filtro-status');if(st)st.value=vagasState.status||'';}if(q.page==='candidatos'){const st=document.getElementById('candidatos-filtro-vaga');if(st)st.value=candidatosState.vaga||'';document.querySelectorAll('#candidatos-stage-filters button').forEach(b=>b.classList.toggle('ativo',String(b.dataset.etapa||'')===String(candidatosState.etapa||'')));}if(q.page==='contratacoes'){const st=document.getElementById('contratacoes-filtro-status');if(st)st.value=contratacoesState.status||'';}}
function irPara(page,opts={}){const el=document.getElementById('page-'+page);if(!el)return;window.__empresaInternalPage=page;if(!opts.keepQuery)history.replaceState(null,'','?'+dashQuery(page,opts.query||{}).toString());dashApplyQuery();dashApplyOfficialState();document.querySelectorAll('.page').forEach(p=>p.classList.remove('ativo'));document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('ativo'));el.classList.add('ativo');document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('ativo');document.getElementById('aside')?.classList.remove('aberto');document.getElementById('app')?.classList.remove('aside-aberto');if(page==='dashboard'){carregarDashboard();return;}if(page==='vagas'){carregarVagasAdmin();return;}if(page==='candidatos'){carregarCandidatos();return;}if(page==='candidaturas'){carregarCandidaturas();return;}if(page==='propostas'){carregarPropostas();return;}if(page==='contratacoes'){carregarContratacoes();return;}if(page==='talentos'){carregarBancoTalentos();return;}if(page==='relatorios'){carregarRelatorios();return;}if(page==='configuracoes'){carregarConfiguracoes();return;}if(page==='equipe'){carregarEquipe();return;}if(page==='agenda'){carregarAgenda('hoje');}if(page==='analisar'){carregarAnalisarEmbed();}}
function mostrarApp(){document.getElementById('login-page').style.display='none';document.getElementById('app').classList.add('logado');carregarUsuarioSidebar();dashApplyQuery();const q=dashReadQuery();const allowed=['dashboard','vagas','candidatos','candidaturas','propostas','contratacoes','talentos','relatorios','agenda','equipe','configuracoes','analisar'];irPara(allowed.includes(q.page)?q.page:'dashboard',{keepQuery:true});carregarContadorNotificacoes();}
async function carregarDashboardV2(){await carregarDashboardBase();}
document.addEventListener('keydown',dashboardModalKeydown);
document.addEventListener('click',e=>{
  const parts=dashboardModalElements();
  if(e.target===parts.overlay){fecharDashboardInsight();return;}
  if(e.target.closest('#dashboard-modal-close')){fecharDashboardInsight();return;}
  if(e.target.closest('[data-dashboard-retry]')){dashboardModalRetry();return;}
  const action=e.target.closest('[data-dashboard-nav]');if(!action)return;
  const page=action.dataset.dashboardNav,id=dashValidId(action.dataset.vagaId),stage=dashValidId(action.dataset.etapa);if(!page)return;
  e.preventDefault();fecharDashboardInsight();if(page==='candidatos')return dashNavigate('candidatos',stage?{etapa:stage}:id?{vaga_id:id}:{});if(page==='vagas'&&id)return dashNavigate('vagas',{vaga_id:id,status:action.dataset.status||'',periodo:action.dataset.periodo||'all'});
});

