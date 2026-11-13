const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const html = fs.readFileSync(path.join(__dirname, 'master.html'), 'utf8');
const fixtureOrigin = 'https://vagasio.test';
const apiOrigin = 'https://certus-api.onrender.com';
const companyId = '11111111-1111-4111-8111-111111111111';
const ticketId = '22222222-2222-4222-8222-222222222222';
const plans = [{id:'33333333-3333-4333-8333-333333333333', code:'demo', name:'Plano fixture', description:'Dados de teste', billing_period:'monthly', price:'0.00', currency:'BRL', status:'inactive', version:1, trial_days:0}];
const companies = [{id:companyId,name:'Empresa Fixture',slug:'empresa-fixture',status:'active',users:2,employees:1,branches:1,clock_events:3,pending_adjustments:0}];
const payloads = {
  '/api/master/dashboard': {as_of:'2026-01-01T12:00:00Z',period:'current_calendar_month',companies:{total:1,active:1,trial:0,suspended:0},employees:1,terminals:{total:1,online:1},finance:{collected_month:0,receivable:0},support:{open:1},pending_adjustments:0,subscriptions:{active:0},incidents:{critical:0}},
  '/api/master/overview': {items:companies,total:1,active:1,trial:0,suspended:0},
  '/api/master/plans': {items:plans},
  [`/api/master/companies/${companyId}/summary`]: {company:companies[0],branches:{total:1},employees:{total:1},users:{total:2},devices:{total:1},clock_events:{total:3}},
  [`/api/master/companies/${companyId}/subscriptions`]: {items:[]},
  [`/api/master/companies/${companyId}/contracts`]: {items:[]},
  [`/api/master/companies/${companyId}/invoices`]: {items:[{id:'44444444-4444-4444-8444-444444444444',invoice_number:'INV-FIXTURE',status:'draft',amount:0,currency:'BRL',due_at:'2026-01-15',created_at:'2026-01-01'}]},
  '/api/master/support/tickets': {items:[{id:ticketId,company_id:companyId,company_name:'Empresa Fixture',protocol:'CS-FIXTURE',subject:'Chamado fixture',description:'Somente dados simulados',category:'general',priority:'normal',status:'open',created_at:'2026-01-01'}]},
  [`/api/master/support/tickets/${ticketId}`]: {ticket:{id:ticketId,company_id:companyId,protocol:'CS-FIXTURE',subject:'Chamado fixture',description:'Somente dados simulados',category:'general',priority:'normal',status:'open',created_at:'2026-01-01'},messages:[]},
  '/api/master/monitoring': {as_of:'2026-01-01T12:00:00Z',window:'rolling_24h',items:[{...companies[0],events:{events_24h:0,pending_24h:0,review_24h:0,rejected_24h:0},devices:{total:1,online:1}}],definitions:{events:'Eventos fixture',online:'Dados fixture'}},
  [`/api/master/companies/${companyId}/monitoring`]: {company:companies[0],events:[],devices:[]},
  '/api/master/devices': {items:[{id:'55555555-5555-4555-8555-555555555555',company_id:companyId,company_name:'Empresa Fixture',label:'Terminal fixture',status:'active',online:true,app_version:'test',created_at:'2026-01-01'}],note:'Fixture somente leitura'},
  '/api/master/onboarding': {items:[{company_id:companyId,company_name:'Empresa Fixture',status:'in_progress',progress:0,task_count:0,completed_tasks:0,created_at:'2026-01-01'}]},
  '/api/master/settings': {items:[],editable_keys:[],note:'Fixture somente leitura'},
  '/api/master/features': {items:[],note:'Fixture somente leitura'},
  '/api/master/announcements': {items:[]},
  '/api/master/me': {user:{id:'master-fixture',name:'Master Fixture',email:'master@example.test',role:'master'}},
  '/api/master/audit-log?limit=20': {items:[]},
  '/api/master/audit-log?limit=100': {items:[]},
  '/api/master/security/incidents': {items:[]},
};

async function createPage() {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  const requests=[]; const unexpected=[];
  // Absolute network deny by default; only the explicit fixture origin and mocked API are allowed.
  await context.route('**/*', async route => {
    const url=new URL(route.request().url());
    if(url.origin!==fixtureOrigin && url.origin!==apiOrigin){unexpected.push(url.href);return route.abort('blockedbyclient');}
    if(url.origin===fixtureOrigin && url.pathname==='/master.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html.replace(\"const API='https://certus-api.onrender.com';\",`const API='${apiOrigin}';`)});
    if(url.origin===fixtureOrigin)return route.fulfill({status:204,body:''});
    const req=route.request();requests.push({method:req.method(),path:url.pathname+url.search});
    let body;
    if(url.pathname==='/api/master/auth/login' && req.method()==='POST' && req.postDataJSON()?.email==='temp@example.test')body={access_token:'temporary-token',password_change_required:true,user:{email:'temp@example.test',must_change_password:true}};
    else if(url.pathname==='/api/master/auth/login' && req.method()==='POST')body={access_token:'fixture-token',token_type:'Bearer',user:{id:'master-fixture',name:'Master Fixture',email:'master@example.test',role:'master'}};
    else body=payloads[url.pathname+url.search]||payloads[url.pathname]||{items:[]};
    return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':fixtureOrigin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'},body:JSON.stringify(body)});
  });
  // The fixture origin uses the same host as the fixed app API so the app can be tested with mock responses.
  await page.goto(`${fixtureOrigin}/master.html`,{waitUntil:'domcontentloaded'});
  return {browser,page,requests,unexpected};
}

async function login(page,email='master@example.test') {
  await page.getByLabel('E-mail Master').fill(email);
  await page.getByLabel('Senha',{exact:true}).fill('fake-only-password');
  await page.getByRole('button',{name:'Entrar'}).click();
  await page.locator('.app-shell').waitFor();
  await page.locator('#content h1').filter({hasText:'Visão geral da plataforma'}).waitFor();
}

function assertRequestsAreMocked(requests,unexpected) {
  assert.deepEqual(unexpected,[],`unexpected network destinations: ${unexpected.join(', ')}`);
  assert.ok(requests.length>0,'expected mocked API requests');
  assert.ok(requests.every(x=>x.method==='GET'||x.method==='OPTIONS'||(x.method==='POST'&&x.path==='/api/master/auth/login')),JSON.stringify(requests));
}

test('all 14 Master screens render using mocked authenticated API data', async()=>{
  const {browser,page,requests,unexpected}=await createPage();
  try {
    await login(page);
    const headings=['Visão geral da plataforma','Empresas','Planos e assinaturas','Contratos e testes','Financeiro e cobranças','Central de Suporte','Monitoramento de Ponto','Terminais e Dispositivos','Implantação de Clientes','Configurações Globais','Recursos e Funcionalidades','Comunicados e Avisos','Acessos e Permissões','Auditoria e Logs'];
    for(let i=0;i<headings.length;i++){
      await page.locator(`[data-page="${i}"]`).click();
      await page.locator('#content h1').filter({hasText:headings[i]}).waitFor();
    }
    for(const expected of ['/api/master/dashboard','/api/master/plans','/api/master/monitoring','/api/master/audit-log?limit=100'])assert.ok(requests.some(x=>x.path===expected),`missing mocked request ${expected}`);
    assertRequestsAreMocked(requests,unexpected);
  } finally { await browser.close(); }
});

test('company selector, tabs, refresh and page-local table filter work',async()=>{
  const {browser,page,requests,unexpected}=await createPage();
  try {
    await login(page);
    await page.locator('[data-page="1"]').click();
    await page.locator('#content h1').filter({hasText:'Empresas'}).waitFor();
    await page.locator('#company-select').waitFor();
    await page.getByRole('tab',{name:'Visão em cartões'}).click();
    await page.getByText('Empresa Fixture').first().waitFor();
    await page.getByRole('tab',{name:'Lista de empresas'}).click();
    await page.getByRole('textbox',{name:'Filtrar registros desta tela'}).fill('sem-correspondência');
    await page.getByRole('button',{name:'↻ Atualizar'}).click();
    await page.getByRole('tab',{name:'Lista de empresas'}).waitFor();
    assertRequestsAreMocked(requests,unexpected);
  } finally { await browser.close(); }
});

test('temporary Master login exposes required password-change link without persisting tokens',async()=>{
  const {browser,page,requests,unexpected}=await createPage();
  try {
    await page.getByLabel('E-mail Master').fill('temp@example.test');
    await page.getByLabel('Senha',{exact:true}).fill('fake-only-password');
    await page.getByRole('button',{name:'Entrar'}).click();
    const link=page.getByRole('link',{name:'Trocar senha temporária'});await link.waitFor();
    assert.equal(await link.getAttribute('href'),`${apiOrigin}/master-password-change`);
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
    assertRequestsAreMocked(requests,unexpected);
  } finally { await browser.close(); }
});

test('390px viewport fits width, nav scroll stays local, and tabs remain usable',async()=>{
  const {browser,page,requests,unexpected}=await createPage();
  try {
    await page.setViewportSize({width:390,height:844});await login(page);
    await page.locator('[data-page="13"]').waitFor();
    const d=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth,navScroll:document.querySelector('.nav-list').scrollWidth,navClient:document.querySelector('.nav-list').clientWidth}));
    assert.ok(d.sw<=d.vw+1,JSON.stringify(d));assert.ok(d.navScroll>=d.navClient);
    await page.locator('[data-page="4"]').click();await page.locator('#content h1').filter({hasText:'Financeiro e cobranças'}).waitFor();
    for(const label of ['Cobranças','Pagamentos','Relatórios'])await page.getByRole('tab',{name:label}).waitFor();
    await page.getByRole('tab',{name:'Pagamentos'}).click();await page.getByRole('tabpanel').waitFor();
    assertRequestsAreMocked(requests,unexpected);
  } finally { await browser.close(); }
});
EOF