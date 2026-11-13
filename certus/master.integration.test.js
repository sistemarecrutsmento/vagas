'use strict';
// Static source-contract checks only; not a browser or authenticated API integration suite.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('certus/master.html', 'utf8');
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
  for (const suffix of ['/summary','/monitoring','contracts','invoices','subscriptions']) assert.ok(script.includes(suffix), suffix);
  assert.match(script,/Authorization:'Bearer '\+token/);
  assert.match(script,/cache:'no-store'/);
});

test('the UI never invokes operational writes; its only POST is login', () => {
  assert.equal((script.match(/method:'POST'/g) || []).length, 1);
  assert.match(script,/\/api\/master\/auth\/login/);
  assert.doesNotMatch(script,/method:'(?:PUT|PATCH|DELETE)'/);
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
  assert.doesNotMatch(script,/localStorage|sessionStorage|document\.cookie/);
});

test('loading, empty, error, retry, stale-response protection and no fake data', () => {
  for (const t of ['Carregando dados autenticados','Nenhum registro retornado pela API','Não foi possível carregar os dados','Tentar novamente']) assert.ok(script.includes(t), t);
  assert.match(script,/const requestId=\+\+viewRequest/);
  assert.match(script,/requestId!==viewRequest/);
  for (const fake of ['Empresa Aurora','Empresa Horizonte','Empresa Nuvem','12.846','R$ 8.640','1.248','sampleRows','chart-bars']) assert.ok(!script.includes(fake), fake);
});

test('unsupported endpoints and operational/financial guardrails are explicit', () => {
  for (const t of ['Não há rotas para listar usuários Master','Não existe rota de atualizações','Não oferece uma rota para listar as tarefas','relatórios agregados financeiros','Planos novos iniciam inativos','Comunicados permanecem em rascunho','nenhum pagamento é iniciado','mensagens não são entregues']) assert.ok(script.toLowerCase().includes(t.toLowerCase()), t);
});

test('tabs, company selector, search and refresh are wired and keyboard accessible', () => {
  for (const t of ['data-tab','tabFilter(lastItems)','select.onchange=','search.oninput=','id="refresh"','onclick=()=>loadData(i)','ArrowRight','ArrowLeft','aria-controls="master-tabpanel"','aria-labelledby="master-tab-${tabIndex}"']) assert.ok(script.includes(t), t);
});

test('responsive layout and table readability rules exist', () => {
  for (const t of ['@media(max-width:950px)','@media(max-width:700px)','overflow-x:auto','.nav-list{display:flex','min-width:680px','.demo-table{font-size:12px']) assert.ok(html.includes(t), t);
});
