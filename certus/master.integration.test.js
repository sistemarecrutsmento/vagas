'use strict';
// Static source-contract checks only; not a browser or authenticated API integration suite.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(process.env.CERTUS_MASTER_HTML || 'certus/master.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'embedded Master script exists');
const script = match[1];

test('all 14 navigation screens route to a data view', () => {
  const start = script.indexOf('const nav=[');
  const end = script.indexOf('];', start);
  const nav = script.slice(start, end);
  assert.equal((nav.match(/\['/g) || []).length, 14);
  assert.match(script, /b\.onclick=\(\)=>\{active=Number\(b\.dataset\.page\)/);
  assert.match(script, /loadData\(active\)/);
});

test('read routes match the Master API surface and requests carry auth/no-store', () => {
  for (const route of ['/api/master/dashboard','/api/master/overview','/api/master/plans','/api/master/support/tickets','/api/master/monitoring','/api/master/devices','/api/master/onboarding','/api/master/settings','/api/master/features','/api/master/announcements','/api/master/me','/api/master/audit-log','/api/master/security/incidents']) assert.ok(script.includes(route), route);
  for (const suffix of ['/monitoring','contracts','invoices','subscriptions']) assert.ok(script.includes(suffix), suffix);
  assert.doesNotMatch(script,/apiGet\([^)]*\/api\/master\/companies\/[^)]*\/summary/,'must not call the nonexistent company summary endpoint');
  assert.match(script,/Authorization:'Bearer '\+token/);
  assert.match(script,/cache:'no-store'/);
});

test('Master writes are explicit, restricted to accounts and the audited support workflow', () => {
  assert.match(script,/\/api\/master\/auth\/login/);
  assert.match(script,/apiWrite\('\/api\/master\/accounts','POST'/);
  assert.match(script,/apiWrite\('\/api\/master\/support\/tickets','POST'/);
  assert.match(script,/apiWrite\(`\/api\/master\/support\/tickets\/\$\{encodeURIComponent\(id\)\}\/messages`,'POST'/);
  assert.match(script,/apiWrite\(`\/api\/master\/support\/tickets\/\$\{encodeURIComponent\(id\)\}`,'PATCH'/);
  assert.match(script,/Sem vínculo com empresas/);
  assert.doesNotMatch(script,/method:'DELETE'/);
  assert.doesNotMatch(script,/data-inert|data-demo-tab/);
});

test('API host is fixed, token remains in memory, temporary-password link is available', () => {
  assert.match(script,/const API='https:\/\/certus-api\.onrender\.com'/);
  assert.doesNotMatch(script,/URLSearchParams\(location\.search\).*get\(['"]api/);
  assert.match(script,/let token=null/);
  assert.match(script,/password_change_required/);
  assert.match(script,/API\+'\/master-password-change'/);
  assert.match(script,/token=d\.access_token/);
  assert.match(script,/r\.status===401\|\|r\.status===403\)\{token=null/);
  assert.match(script,/showLogin\('Sessão encerrada\.'/);
  assert.doesNotMatch(script,/localStorage|document\.cookie/);
});

test('loading, empty, error, retry, stale-response protection and no fake data', () => {
  for (const t of ['Carregando dados autenticados','Nenhum endpoint conectado','Não foi possível carregar os dados','Tentar novamente']) assert.ok(script.includes(t), t);
  assert.match(script,/const requestId=\+\+viewRequest/);
  assert.match(script,/requestId!==viewRequest/);
  for (const fake of ['Empresa Aurora','Empresa Horizonte','Empresa Nuvem','12.846','R$ 8.640','1.248','sampleRows','chart-bars']) assert.ok(!script.includes(fake), fake);
});

test('unsupported endpoints and operational/financial guardrails are explicit', () => {
  for (const t of ['Contas Master globais','Não existe rota de atualizações','Resumo das faturas cadastradas','Novos planos iniciam inativos','Publicação/envio não estão integrados.','A ação altera apenas este rascunho e não envia cobrança.','notas internas só aparecem à equipe Master','e-mail/WhatsApp não são integrados']) assert.ok(script.toLowerCase().includes(t.toLowerCase()), t);
});

test('tabs, company selector, search and refresh are wired and keyboard accessible', () => {
  for (const t of ['data-tab','tabFilter(lastItems)','select.onchange=','search.oninput=','id="refresh"','onclick=()=>loadData(i)','ArrowRight','ArrowLeft','aria-controls="master-tabpanel"','aria-labelledby="master-tab-${tabIndex}"']) assert.ok(script.includes(t), t);
});

test('responsive layout and table readability rules exist', () => {
  for (const t of ['@media(max-width:1100px)','@media(max-width:760px)','overflow:auto','position:sticky;top:0;height:100dvh','position:fixed;inset:0 auto 0 0','transform:translateX(-105%)','.nav-list{display:grid','min-width:720px','.demo-table{']) assert.ok(html.includes(t), t);
});

test('mobile sidebar is a vertical drawer and desktop keeps the workspace beside it',()=>{
  assert.match(html,/id=\"open-nav\"/);
  assert.match(html,/id=\"master-sidebar\"/);
  assert.match(script,/setDrawer\(true\)/);
  assert.match(script,/e\.key==='Escape'/);
  assert.match(script,/classList\.toggle\('is-open',value\)/);
  assert.doesNotMatch(html,/\.nav-list\{display:flex[^}]*overflow-x:auto/);
  assert.match(html,/grid-template-columns:252px minmax\(0,1fr\)/);
});

test('global settings expose only backend-allowlisted typed configuration and audited save',()=>{
 assert.match(html,/globalSettingsEditor\(lastItems,editKeys\)/);
 assert.match(html,/apiWrite\('\/api\/master\/settings\/'\+encodeURIComponent\(key\),'PUT'/);
 for(const key of ['platform.name','platform.contact_email','platform.default_locale','platform.default_timezone','security.session_idle_minutes','notifications.master_email_enabled'])assert.ok(html.includes(key),key);
 assert.match(html,/audit_note,expected_version/);
 assert.match(html,/operational_effect|não são aplicados automaticamente/);
});
test('onboarding reads project tasks through authenticated company/project-scoped API and records audited updates',()=>{
 assert.match(script,/apiGet\('\/api\/master\/companies\/'.*onboarding/);
 assert.match(script,/\/onboarding\/['"]\+encodeURIComponent\(project\.id\)\+['"]\/tasks/);
 assert.match(script,/\.master-task-form/);
 assert.match(script,/onboarding\/'.*tasks\/'.*'PATCH'/);
});

test('Master account form creates a global account only after submit and lists existing Master users',()=>{
 assert.match(script,/apiGet\('\/api\/master\/accounts'\)/);
 assert.match(script,/id=\"master-account-form\"/);
 assert.ok(script.includes("apiWrite('/api/master/accounts','POST',{display_name,email,temporary_password:password})"));
 assert.match(script,/Sem vínculo com empresas/);
 assert.match(script,/Troca de senha pendente/);
 assert.match(script,/master-account-password-confirm/);
 assert.match(script,/As senhas iniciais não coincidem/);
});

test('Master operational screens do not claim all modules are read-only',()=>{
 assert.doesNotMatch(script,/Somente leitura\. Nenhuma alteração, cobrança, marcação, mensagem ou comunicação foi executada/);
 assert.doesNotMatch(script,/Operações de escrita permanecem desabilitadas/);
 assert.match(script,/Ações disponíveis neste módulo seguem as permissões da API/);
 assert.match(script,/data-master-infinitepay/);
 assert.match(script,/INFINITEPAY_API_KEY|InfinitePay/i);
 assert.match(script,/master-company-status-save/);
});

test('Master access view uses published company-admin reset routes, not missing directory APIs',()=>{
 assert.match(script,/admin-accounts/);
 assert.match(script,/reset-password/);
 assert.match(script,/Acessos da empresa/);
 assert.match(script,/apiGet\('\/api\/master\/companies\/'\+encodeURIComponent\(selectedCompany\)\+'\/accounts'\)/);
 assert.match(script,/apiWrite\('\/api\/master\/companies\/'\+encodeURIComponent\(selectedCompany\)\+'\/management-session','POST'/);
 assert.match(script,/certus_master_return/);
 assert.match(script,/temporary_password/);
 assert.match(script,/revoga sessões/);
 assert.match(script,/apiGet\('\/api\/master\/companies\/'.*\/accounts/);
});

const companyPortalScript=fs.readFileSync('certus/operacao.js','utf8');
test('Master support entry restores session before asynchronous persistence and skips employee refresh storage',()=>{
  assert.match(companyPortalScript,/certus_master_return/);
  assert.match(companyPortalScript,/persistent=token&&user\?null:await Promise\.race\(\[loadPersistentSession\(\),new Promise\(resolve=>setTimeout\(\(\)=>resolve\(null\),3000\)\)\]\)/);
});

test('support session opens shell from its signed company profile without blocking on /api/me hydration',()=>{
  assert.match(companyPortalScript,/if\(user\.support_session\)\{shell\(\);return\}/);
});

test('company portal preserves temporary Master support controls after /api/me profile hydration',()=>{
 assert.match(companyPortalScript,/support_session:user\?\.support_session===true/);
 assert.match(companyPortalScript,/company_portal_master:user\?\.company_portal_master===true/);
});

test('company-portal Master logout returns to the Master login even without a saved prior Master browser session',()=>{
 assert.match(companyPortalScript,/const returnToMaster=user\?\.company_portal_master===true/);
 assert.match(companyPortalScript,/location\.replace\('master\.html\?returned-from-support=1&login=1'\)/);
});

test('company portal JavaScript parses and Master support banner is interpolated safely',()=>{
 const vm=require('node:vm');
 assert.doesNotThrow(()=>new vm.Script(companyPortalScript), 'company portal script must parse before publishing');
 assert.match(companyPortalScript,/const supportBanner=user\.support_session\?/);
 assert.match(companyPortalScript,/\$\{supportBanner\}/);
 assert.doesNotMatch(companyPortalScript,/\$\{user\.support_session\?'<div class=/);
});

test('Master UI exposes audited manual monthly subscription and PIX entry without creating a checkout',()=>{
 const html=fs.readFileSync('certus/master.html','utf8');
 assert.match(html,/Lançar assinatura e pagamento manual/);
 assert.match(html,/name="first_payment_date" type="date" value="2026-11-10"/);
 assert.match(html,/name="due_day" type="number" min="1" max="28" value="10"/);
 assert.match(html,/payment_method:'pix_manual'/);
 assert.match(html,/subscriptions\/manual-payment/);
 assert.match(html,/não há consulta nem confirmação bancária automática/);
});

test('Master page script parses with the manual payment form template',()=>{
 const vm=require('node:vm');
 assert.doesNotThrow(()=>new vm.Script(script),'Master page script must parse before publishing');
});

test('Master company registration form creates a new organization with trade/legal names and initial setup',()=>{
 assert.match(script,/function companyRegistrationCard\(\)/);
 assert.match(script,/master-company-create-form/);
 assert.match(script,/name="trade_name"/);
 assert.match(script,/name="legal_name"/);
 assert.match(script,/name="cnpj"/);
 assert.match(script,/name="admin_name"/);
 assert.match(script,/name="representative_name"/);
 assert.match(script,/master-add-initial-employee/);
 assert.match(script,/schedule_name_\$\{g\}/);
 assert.match(script,/name="leave_start_date"/);
 assert.match(script,/name="leave_end_date"/);
 assert.match(script,/apiWrite\('\/api\/master\/companies','POST',payload\)/);
 assert.match(script,/const temporary_password=saved\.temporary_password/);
 assert.doesNotMatch(script,/crypto\.getRandomValues\(bytes\)/);
 assert.match(script,/companyRegistrationCard\(\)\+statCards/);
});
test('company creation UI is explicit about default trial, no invoice and no employee password/email',()=>{
 assert.match(script,/teste padrão de 15 dias; não cria fatura nem plano pago/);
 assert.match(script,/Colaboradores cadastrados aqui não recebem acesso individual/);
 assert.match(script,/nenhum e-mail será enviado/);
 assert.match(script,/must_change_password/);
});
test('Master page script parses with new company registration form and handlers',()=>{
 const vm=require('node:vm');
 assert.doesNotThrow(()=>new vm.Script(script),'Master page script must parse after adding company registration UI');
});
test('Master company onboarding lets the operator identify the physical branch separately',()=>{
 assert.match(script,/name="branch_name" maxlength="120"/);
 assert.match(script,/branch_name:d\.branch_name\.trim\(\)/);
});

test('company timesheet displays recorded vacation dates as Férias and keeps them out of DSR labels',()=>{
 const operational=fs.readFileSync('certus/operacao.js','utf8');
 assert.match(operational,/function reportSchedule\(d\)\{if\(d\.schedule\?\.leave===true\)return 'Férias'/);
 assert.match(operational,/d\.status==='leave'\|\|d\.schedule\?\.leave===true\)out\.push\('Férias'\)/);
});

test('company onboarding proceeds to the authenticated API after prior superadministrator authorization',()=>{
 assert.match(script,/O superadministrador já autorizou esta criação/);
 assert.match(script,/button\.disabled=true;button\.textContent='Criando…'/);
 assert.match(script,/apiWrite\('\/api\/master\/companies','POST',payload\)/);
 assert.doesNotMatch(script,/confirm\(`Criar \${d\.trade_name}/);
});

test('company onboarding takes the one-time administrator password from the server response',()=>{
 assert.doesNotMatch(script,/crypto\.getRandomValues\(bytes\)/);
 assert.match(script,/const temporary_password=saved\.temporary_password/);
});

test('Master onboarding uses server-generated one-time administrator password',()=>{
 assert.doesNotMatch(script,/crypto\.getRandomValues\(bytes\)/);
 assert.match(script,/const temporary_password=saved\.temporary_password/);
});

test('company onboarding reports preparation errors instead of leaving an indefinite validating state',()=>{
 const start=script.indexOf('companyForm.onsubmit=async e=>');
 const end=script.indexOf('const accountForm=',start);
 const handler=script.slice(start,end);
 assert.ok(handler.indexOf('textContent=\'Validando os dados')<handler.indexOf('try{'));
 assert.ok(handler.indexOf('try{')<handler.indexOf('const employees='));
 assert.match(handler,/catch\(err\)\{result\.className='notice';result\.textContent=`O cadastro não foi confirmado/);
});

test('Master onboarding reads collaborator fields from fieldsets without constructing FormData from a fieldset',()=>{
 assert.match(script,/querySelectorAll\('input,select'\)\]\.filter\(el=>el\.name\)\.map\(el=>\[el\.name,el\.value\]\)/);
 assert.doesNotMatch(script,/new FormData\(row\)/);
});

test('Master tables use accessible horizontal scrolling, stable columns, and Portuguese display formatting',()=>{
 assert.ok(script.includes("function fmt(v,key='')"));
 assert.ok(script.includes("key==='must_change_password'?(v?'Pendente':'Não pendente')"));
 assert.match(script,/labels=\{active:'Ativo'.*in_progress:'Em andamento'/);
 assert.match(script,/function tableCellClass\(key\)/);
 assert.ok(script.includes('role="region" tabindex="0" aria-label="Tabela rolável:'));
 assert.ok(script.includes("function cell(v,key='')"));
 assert.match(script,/table-json/);
 assert.doesNotMatch(script,/Dados retornados pela API autenticada/);
 assert.ok(html.includes('.demo-table th{white-space:nowrap;word-break:normal;overflow-wrap:normal'));
 assert.ok(html.includes('.demo-table{width:max-content;min-width:100%;table-layout:auto}'));
});

test('Master forms share responsive controls without changing transactional handlers',()=>{
 assert.ok(html.includes('.demo-card form:not(.master-task-form),.demo-dialog form{display:grid'));
 assert.ok(html.includes('min-width:0;max-width:100%;min-height:42px'));
 assert.ok(html.includes('form input[type=checkbox]'));
 assert.match(script,/apiWrite\(/);
});
