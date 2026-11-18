const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const http = require('node:http');

const html = fs.readFileSync(path.join(__dirname, 'master.html'), 'utf8');
const companyId = '11111111-1111-4111-8111-111111111111';
const ticketId = '22222222-2222-4222-8222-222222222222';
const plans = [{id:'33333333-3333-4333-8333-333333333333', code:'demo', name:'Plano fixture', description:'Dados de teste', billing_period:'monthly', price:'0.00', currency:'BRL', status:'inactive', version:1, trial_days:0}];
const companies = [{id:companyId,name:'Empresa Fixture',slug:'empresa-fixture',status:'active',users:2,employees:1,branches:1,clock_events:3,pending_adjustments:0}];
const payloads = {
  '/api/master/dashboard': {as_of:'2026-01-01T12:00:00Z',period:'current_calendar_month',companies:{total:1,active:1,trial:0,suspended:0},employees:1,terminals:{total:1,online:1},finance:{collected_month:0,receivable:0},support:{open:1},pending_adjustments:0,subscriptions:{active:0},incidents:{critical:0}},
  '/api/master/overview': {items:companies,total:1,active:1,trial:0,suspended:0},
  '/api/master/plans': {items:plans},
  [`/api/master/companies/${companyId}/subscriptions`]: {items:[]},
  [`/api/master/companies/${companyId}/contracts`]: {items:[]},
  [`/api/master/companies/${companyId}/invoices`]: {items:[{id:'44444444-4444-4444-8444-444444444444',invoice_number:'INV-FIXTURE',status:'draft',amount:0,currency:'BRL',due_at:'2026-01-15',created_at:'2026-01-01'}]},
  '/api/master/support/tickets': {items:[{id:ticketId,company_id:companyId,company_name:'Empresa Fixture',protocol:'CS-FIXTURE',subject:'Chamado fixture',description:'Somente dados simulados',category:'general',priority:'normal',status:'open',created_at:'2026-01-01'}]},
  [`/api/master/support/tickets/${ticketId}`]: {ticket:{id:ticketId,company_id:companyId,protocol:'CS-FIXTURE',subject:'Chamado fixture',description:'Somente dados simulados',category:'general',priority:'normal',status:'open',created_at:'2026-01-01'},messages:[]},
  '/api/master/monitoring': {as_of:'2026-01-01T12:00:00Z',window:'rolling_24h',items:[{...companies[0],events:{events_24h:0,pending_24h:0,review_24h:0,rejected_24h:0},devices:{total:1,online:1}}],definitions:{events:'Eventos fixture',online:'Dados fixture'}},
  [`/api/master/companies/${companyId}/monitoring`]: {company:companies[0],events:[],devices:[]},
  '/api/master/devices': {items:[{id:'55555555-5555-4555-8555-555555555555',company_id:companyId,company_name:'Empresa Fixture',label:'Terminal fixture',status:'active',online:true,app_version:'test',created_at:'2026-01-01'}],note:'Fixture somente leitura'},
  '/api/master/onboarding': {items:[{id:'66666666-6666-4666-8666-666666666666',company_id:companyId,company_name:'Empresa Fixture',id:'66666666-6666-4666-8666-666666666666',status:'in_progress',progress:0,task_count:1,completed_tasks:0,created_at:'2026-01-01'}]},
  [`/api/master/companies/${companyId}/onboarding/66666666-6666-4666-8666-666666666666/tasks`]: {project:{id:'66666666-6666-4666-8666-666666666666',status:'in_progress'},items:[{id:'77777777-7777-4777-8777-777777777777',sort_order:1,title:'Tarefa fixture',status:'pending'}]},
  '/api/master/settings': {items:[],editable_keys:[],note:'Fixture somente leitura'},
  '/api/master/features': {items:[],note:'Fixture somente leitura'},
  '/api/master/announcements': {items:[]},
  '/api/master/me': {user:{id:'master-fixture',name:'Master Fixture',email:'master@example.test',role:'master'}},
  '/api/master/accounts': {items:[{id:'master-fixture',display_name:'Master Fixture',email:'master@example.test',status:'active',must_change_password:false,created_at:'2026-01-01'}],note:'Fixture global'},
  '/api/master/support/categories': {items:[{id:'category-fixture',slug:'general',name:'Dúvidas gerais',status:'active'}]},
  [`/api/master/companies/${companyId}/admin-accounts`]: {company:companies[0],items:[{id:'admin-fixture',email:'admin@example.test',display_name:'Admin Fixture',role:'company_admin'}]},
  [`/api/master/companies/${companyId}/accounts`]: {company:companies[0],items:[{id:'employee-fixture',email:'employee@example.test',display_name:'Employee Fixture',role:'employee',status:'active',must_change_password:true,employee_name:'Fixture Employee',employee_number:'F-1',branch_name:'Fixture Branch'}],note:'Consulta autenticada sem segredos.'},
  '/api/master/audit-log?limit=20': {items:[]},
  '/api/master/audit-log?limit=100': {items:[]},
  '/api/master/security/incidents': {items:[]},
};

async function createPage() {
  let origin;
  const server = http.createServer((req, res) => {
    if (req.url === '/certus/master.html') {
      res.writeHead(200, {'content-type':'text/html; charset=utf-8'});
      return res.end(html.replace('<head>','<head><base href="'+origin+'/certus/">'));
    }
    const asset = req.url === '/certus/certus-logo-color.png' ? 'certus-logo-color.png' : req.url === '/certus/certus-logo-white.png' ? 'certus-logo-white.png' : null;
    if (asset) { res.writeHead(200, {'content-type':'image/png'}); return res.end(fs.readFileSync(path.join(__dirname, asset))); }
    res.writeHead(404); res.end('Not found');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const runtimeErrors=[];page.on('pageerror',err=>{runtimeErrors.push(err.stack||err.message);console.error('MASTER_BROWSER_RUNTIME',err.stack||err.message)});page.on('console',msg=>{if(msg.type()==='error')console.error('MASTER_BROWSER_CONSOLE',msg.text())});
  const requests=[]; const denied=[]; const invoiceRows=structuredClone(payloads[`/api/master/companies/${companyId}/invoices`].items);
  await page.route('**/*', async route => {
    const requestUrl=route.request().url();
    if(requestUrl.startsWith(origin+'/')) return route.continue();
    if(!requestUrl.startsWith('https://certus-api.onrender.com/')) { denied.push(requestUrl); return route.abort(); }
    const req=route.request(); const url=new URL(requestUrl);
    const path=url.pathname+url.search;
    if(req.method()==='OPTIONS') return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
    requests.push({method:req.method(),path,postData:req.postData()});
    let body,status=200;
    if(path==='/api/master/auth/login' && req.method()==='POST' && req.postDataJSON()?.email==='temp@example.test') body={access_token:'temporary-token',password_change_required:true,user:{email:'temp@example.test',must_change_password:true}};
    else if(url.pathname===`/api/master/companies/${companyId}/admin-accounts` && req.method()==='GET') body=payloads[`/api/master/companies/${companyId}/admin-accounts`];
    else if(url.pathname===`/api/master/companies/${companyId}/accounts` && req.method()==='GET') body=payloads[`/api/master/companies/${companyId}/accounts`];
    else if(url.pathname===`/api/master/companies/${companyId}/admin-accounts/admin-fixture/reset-password` && req.method()==='POST'){assert.ok(req.postDataJSON().note.length>=8);body={admin:{email:'admin@example.test'},temporary_password:'CI-only-one-time-password',must_change_password:true};}
    else if(url.pathname==='/api/master/companies/'+companyId+'/management-session' && req.method()==='POST') body={access_token:'company-support-token-fixture',token_type:'Bearer',expires_in:1800,support_session:true,company:companies[0],user:{id:'master-fixture',email:'master@example.test',name:'Master Fixture',role:'company_admin',company:companies[0],support_session:true},message:'Acesso temporário fixture'};
    else if(path==='/api/master/accounts' && req.method()==='POST'){const posted=req.postDataJSON()||{};assert.equal(posted.email,'suportecertusbyvagasio@gmail.com');assert.equal(posted.display_name,'Suporte Certus');assert.equal(posted.temporary_password,'CI-only-temporary-password');body={item:{email:posted.email,display_name:posted.display_name,status:'active',must_change_password:true},message:'Conta Master global fixture'}}
    else if(path==='/api/master/auth/login' && req.method()==='POST') body={access_token:'fixture-token',token_type:'Bearer',user:{id:'master-fixture',name:'Master Fixture',email:'master@example.test',role:'master'}};
    else if(url.pathname===`/api/master/companies/${companyId}/contracts` && req.method()==='POST'){assert.equal(req.postDataJSON().status,'draft');body={item:{id:'contract-fixture'},note:'Rascunho criado'}}
    else if(url.pathname===`/api/master/companies/${companyId}/invoices` && req.method()==='POST'){assert.equal(req.postDataJSON().amount,10);body={item:{id:'invoice-draft',status:'draft'},note:'Nenhuma cobrança enviada'}}
    else if(url.pathname===`/api/master/companies/${companyId}/invoices/44444444-4444-4444-8444-444444444444/infinitepay-link` && req.method()==='POST'){assert.ok(req.postDataJSON().audit_note.length>=8);invoiceRows[0]={...invoiceRows[0],status:'open',provider:'infinitepay',payment_reference:'https://buy.infinitepay.io/fixture'};body={item:invoiceRows[0],checkout_url:invoiceRows[0].payment_reference,note:'Fixture link'}}
    else if(url.pathname===`/api/master/companies/${companyId}/invoices/invoice-fixture` && req.method()==='PATCH'){assert.ok(req.postDataJSON().audit_note.length>=8);body={item:{id:'invoice-fixture',status:req.postDataJSON().status}}}
    else if(url.pathname==='/api/master/announcements' && req.method()==='POST'){assert.equal(req.postDataJSON().status,undefined);body={item:{id:'announcement-fixture',status:'draft'},note:'Rascunho'}}
    else if(url.pathname==='/api/master/features' && req.method()==='POST'){body={item:{feature_key:'fixture.only'},note:'Catálogo'}}
    else if(url.pathname===`/api/master/companies/${companyId}/onboarding` && req.method()==='POST'){body={item:{id:'onboarding-created'}}}
    else if(url.pathname==='/api/master/support/tickets/'+ticketId) body=payloads[`/api/master/support/tickets/${ticketId}`];
    else if(url.pathname==='/api/master/companies/'+companyId+'/subscriptions') body=payloads[`/api/master/companies/${companyId}/subscriptions`];
    else if(url.pathname==='/api/master/companies/'+companyId+'/contracts') body=payloads[`/api/master/companies/${companyId}/contracts`];
    else if(url.pathname==='/api/master/companies/'+companyId+'/invoices') body={items:invoiceRows};
    else if(url.pathname==='/api/master/companies/'+companyId+'/monitoring') body=payloads[`/api/master/companies/${companyId}/monitoring`];
    else if(payloads[path] || payloads[url.pathname]) body=payloads[path] || payloads[url.pathname];
    else { denied.push(requestUrl); return route.abort(); }
    await route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'},body:JSON.stringify(body)});
  });
  await page.goto(`${origin}/certus/master.html`,{waitUntil:'domcontentloaded'});
  const cleanup=async()=>{ await browser.close(); await new Promise(resolve=>server.close(resolve)); };
  return {browser,page,requests,denied,runtimeErrors,cleanup};
}

async function login(page,email='master@example.test') {
  try { await page.getByLabel('E-mail Master').fill(email); } catch (error) { throw new Error(`Master login form did not render; body=${(await page.locator('body').innerText().catch(()=>'' )).slice(0,1200)}; error=${error.message}`); }
  
  await page.getByLabel('Senha',{exact:true}).fill('fake-only-password');
  await page.getByRole('button',{name:'Entrar'}).click();
  await page.getByRole('heading',{name:'Visão geral da plataforma'}).waitFor();
}

test('all 14 Master screens render using mocked authenticated API data', async()=>{
  const {browser,page,requests,denied,cleanup}=await createPage();
  try {
    await login(page);
    const names=['Dashboard Master','Empresas (Organizações)','Planos e assinaturas','Contratos e Testes','Financeiro e Cobranças','Central de Suporte','Monitoramento de Ponto','Terminais e Dispositivos','Implantação de Clientes','Configurações Globais','Recursos e Funcionalidades','Comunicados e Avisos','Acessos e Permissões','Auditoria e Logs'];
    const headings=['Visão geral da plataforma','Empresas','Planos e assinaturas','Contratos e testes','Financeiro e cobranças','Central de Suporte','Monitoramento de Ponto','Terminais e Dispositivos','Implantação de Clientes','Configurações Globais','Recursos e Funcionalidades','Comunicados e Avisos','Acessos e Permissões','Auditoria e Logs'];
    for(let i=0;i<names.length;i++){
      await page.getByRole('button',{name:names[i],exact:true}).click();
      await page.getByRole('heading',{name:headings[i],exact:true}).waitFor();
      assert.doesNotMatch(await page.locator('#master-tabpanel').innerText(),/Somente leitura\. Nenhuma alteração, cobrança, marcação, mensagem ou comunicação foi executada/);
      assert.match(await page.locator('#master-footnote').innerText(),/ações disponíveis ficam nos controles de cada seção/i);
      if(i===1)assert.ok((await page.locator('#master-tabpanel').innerText()).includes('Atualizar estado'));
      if(i===8)await page.getByRole('heading',{name:/Tarefas · Empresa Fixture/}).waitFor();
    }
    assert.ok(requests.some(x=>x.path==='/api/master/dashboard'));
    assert.ok(requests.some(x=>x.path==='/api/master/plans'));
    assert.ok(requests.some(x=>x.path==='/api/master/monitoring'));
    await page.getByRole('heading',{name:'Incidentes de segurança'}).waitFor();
    assert.ok(requests.some(x=>x.path==='/api/master/security/incidents'));
    assert.ok(requests.some(x=>x.path===`/api/master/companies/${companyId}/onboarding/66666666-6666-4666-8666-666666666666/tasks`));
    assert.ok(requests.every(x=>x.method==='GET'||x.path==='/api/master/auth/login'||(x.method==='POST'&&x.path==='/api/master/accounts')));
    assert.deepEqual(denied,[],`unexpected non-fixture requests: ${denied.join(', ')}`);
  } finally { await cleanup(); }
});

test('company selector, tabs, refresh and page-local table filter work',async()=>{
  const {browser,page,cleanup}=await createPage();
  try {
    await login(page);
    await page.getByRole('button',{name:/Empresas \(Organizações\)/}).click();
    await page.getByRole('heading',{name:'Empresas',exact:true}).waitFor();
    await page.locator('#company-select').waitFor();
    await page.getByRole('tab',{name:'Visão em cartões'}).click();
    await page.getByText('Empresa Fixture').first().waitFor();
    await page.getByRole('tab',{name:'Lista de empresas'}).click();
    await page.getByRole('textbox',{name:'Filtrar registros desta tela'}).fill('sem-correspondência');
    await page.getByRole('button',{name:'↻ Atualizar'}).click();
  } finally { await cleanup(); }
});

test('temporary Master login exposes the required password-change link, with no token persisted',async()=>{
  const {browser,page,cleanup}=await createPage();
  try {
    await page.getByLabel('E-mail Master').fill('temp@example.test');
    await page.getByLabel('Senha',{exact:true}).fill('fake-only-password');
    await page.getByRole('button',{name:'Entrar'}).click();
    const link=page.getByRole('link',{name:'Trocar senha temporária'});
    await link.waitFor();
    assert.match(await link.getAttribute('href'),/\/master-password-change$/);
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  } finally { await cleanup(); }
});

test('mobile uses a vertical off-canvas sidebar drawer without page overflow',async()=>{
  const {browser,page,cleanup}=await createPage();
  try {
    await page.setViewportSize({width:390,height:844});
    await login(page);
    const before=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth,sidePosition:getComputedStyle(document.querySelector('.app-side')).position,navDisplay:getComputedStyle(document.querySelector('.nav-list')).display,sidebarX:document.querySelector('.app-side').getBoundingClientRect().x,menuWidth:document.querySelector('#open-nav').getBoundingClientRect().width}));
    assert.ok(before.sw<=before.vw+1,JSON.stringify(before));
    assert.equal(before.sidePosition,'fixed');
    assert.equal(before.navDisplay,'grid');
    assert.ok(before.sidebarX<0,JSON.stringify(before));
    assert.ok(before.menuWidth>=38,JSON.stringify(before));
    await page.getByRole('button',{name:'Abrir menu'}).click();
    assert.ok(await page.locator('.app-side').evaluate(el=>el.classList.contains('is-open')));
    await page.getByRole('button',{name:/Financeiro e Cobranças/}).click();
    await page.getByRole('heading',{name:'Financeiro e cobranças'}).waitFor();
    assert.ok(!(await page.locator('.app-side').evaluate(el=>el.classList.contains('is-open'))));
    const after=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
    assert.ok(after.sw<=after.vw+1,JSON.stringify(after));
  } finally { await cleanup(); }
});

test('desktop keeps a left sidebar and top-aligned workspace without centering the content',async()=>{
  const {browser,page,cleanup}=await createPage();
  try {
    await page.setViewportSize({width:1440,height:900});
    await login(page);
    const d=await page.evaluate(()=>{const s=document.querySelector('.app-side').getBoundingClientRect(),m=document.querySelector('.app-main').getBoundingClientRect(),c=document.querySelector('#content').getBoundingClientRect();return{vw:innerWidth,sw:document.documentElement.scrollWidth,sidebarX:s.x,sidebarW:s.width,mainX:m.x,contentY:c.y}});
    assert.ok(d.sw<=d.vw+1,JSON.stringify(d));
    assert.equal(d.sidebarX,0);
    assert.ok(d.sidebarW>=240&&d.sidebarW<=270,JSON.stringify(d));
    assert.ok(d.mainX>=d.sidebarW,JSON.stringify(d));
    assert.ok(d.contentY<140,JSON.stringify(d));
  } finally { await cleanup(); }
});

test('company detail uses the authenticated overview and never calls a nonexistent summary route',async()=>{
  const {browser,page,requests,cleanup}=await createPage();
  try {
    await login(page);
    await page.getByRole('button',{name:'Empresas (Organizações)',exact:true}).click();
    await page.getByRole('heading',{name:'Empresas',exact:true}).waitFor();
    await page.locator('#company-select').selectOption(companyId);
    await page.getByText('Contagens fornecidas pelo resumo autenticado de empresas.').waitFor();
    assert.ok(requests.some(x=>x.path==='/api/master/overview'));
    assert.ok(!requests.some(x=>x.path.includes('/summary')));
  } finally { await cleanup(); }
});


test('mobile sidebar opens as vertical drawer, closes on selection, with no overflow',async()=>{
 const {browser,page,cleanup}=await createPage();
 try{await page.setViewportSize({width:390,height:844});await login(page);const d=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth,position:getComputedStyle(document.querySelector('.app-side')).position,navDisplay:getComputedStyle(document.querySelector('.nav-list')).display,x:document.querySelector('.app-side').getBoundingClientRect().x,menu:document.querySelector('#open-nav').getBoundingClientRect().width}));assert.ok(d.sw<=d.vw+1,JSON.stringify(d));assert.equal(d.position,'fixed');assert.equal(d.navDisplay,'grid');assert.ok(d.x<0,JSON.stringify(d));assert.ok(d.menu>=38);await page.getByRole('button',{name:'Abrir menu'}).click();assert.ok(await page.locator('.app-side').evaluate(x=>x.classList.contains('is-open')));await page.getByRole('button',{name:/Financeiro e Cobranças/}).click();await page.getByRole('heading',{name:'Financeiro e cobranças'}).waitFor();assert.ok(!(await page.locator('.app-side').evaluate(x=>x.classList.contains('is-open'))));}finally{await cleanup()}
});

test('desktop sidebar is flush left and workspace is top aligned beside it',async()=>{
 const {browser,page,cleanup}=await createPage();
 try{await page.setViewportSize({width:1440,height:900});await login(page);const d=await page.evaluate(()=>{const s=document.querySelector('.app-side').getBoundingClientRect(),m=document.querySelector('.app-main').getBoundingClientRect(),c=document.querySelector('#content').getBoundingClientRect();return{vw:innerWidth,sw:document.documentElement.scrollWidth,sx:s.x,swid:s.width,mx:m.x,cy:c.y}});assert.ok(d.sw<=d.vw+1,JSON.stringify(d));assert.equal(d.sx,0);assert.ok(d.swid>=240&&d.swid<=270,JSON.stringify(d));assert.ok(d.mx>=d.swid,JSON.stringify(d));assert.ok(d.cy<140,JSON.stringify(d));}finally{await cleanup()}
});

test('Master creates a global account only after explicit submit',async()=>{
 const {browser,page,requests,cleanup}=await createPage();try{await login(page);await page.getByRole('button',{name:'Acessos e Permissões',exact:true}).click();await page.getByRole('heading',{name:'Contas Master globais'}).waitFor();await page.locator('#master-account-email').fill('suportecertusbyvagasio@gmail.com');await page.locator('#master-account-password').fill('CI-only-temporary-password');await page.locator('#master-account-password-confirm').fill('CI-only-temporary-password');await page.getByRole('button',{name:'Criar conta Master global'}).click();assert.ok(requests.some(x=>x.method==='POST'&&x.path==='/api/master/accounts'));assert.ok(!requests.some(x=>x.path.includes('/memberships')))}finally{await cleanup()}
});

test('Master accesses only company administrators for password reset, with explicit warning/audit reason',async()=>{
 const {browser,page,requests,cleanup}=await createPage();try{await login(page);await page.getByRole('button',{name:'Acessos e Permissões',exact:true}).click();await page.locator('#company-select').selectOption(companyId);await page.getByText('Admin Fixture').waitFor();await page.getByText('Employee Fixture').waitFor();assert.ok(requests.some(x=>x.path===`/api/master/companies/${companyId}/accounts`));page.on('dialog',async d=>{await d.accept('CI approved audit reason')});await page.getByRole('button',{name:'Redefinir senha',exact:false}).click();await page.getByText('CI-only-one-time-password').waitFor();assert.ok(requests.some(x=>x.method==='GET'&&x.path===`/api/master/companies/${companyId}/admin-accounts`));assert.ok(requests.some(x=>x.method==='POST'&&x.path===`/api/master/companies/${companyId}/admin-accounts/admin-fixture/reset-password`))}finally{await cleanup()}
});

test('InfinitePay checkout is created only after explicit confirmation and opens the returned checkout',async()=>{
 const {browser,page,requests,cleanup}=await createPage();try{
  await login(page);await page.getByRole('button',{name:'Financeiro e Cobranças',exact:true}).click();await page.locator('#company-select').selectOption(companyId);
  await page.getByRole('button',{name:'Gerar link InfinitePay'}).waitFor();
  page.on('dialog',async d=>{if(d.type()==='prompt')await d.accept('CI-only payment audit reason');else await d.accept()});
  await page.getByRole('button',{name:'Gerar link InfinitePay'}).click();
  assert.ok(requests.some(x=>x.method==='POST'&&x.path===`/api/master/companies/${companyId}/invoices/44444444-4444-4444-8444-444444444444/infinitepay-link`));
  const checkout=page.locator('a[href="https://buy.infinitepay.io/fixture"]').first();await checkout.waitFor();assert.equal(await checkout.getAttribute('rel'),'noopener noreferrer');
 }finally{await cleanup()}
});

test('Master draft workflows remain local and never trigger payment or outbound announcement sends',async()=>{
 const {browser,page,requests,denied,cleanup}=await createPage();try{await login(page);await page.getByRole('button',{name:'Contratos e Testes',exact:true}).click();await page.locator('#company-select').waitFor();await page.locator('summary').filter({hasText:'Novo contrato (rascunho)'}).click();await page.locator('#master-contract-form [name=title]').fill('Fixture draft');await page.locator('#master-contract-form [name=audit_note]').fill('CI-only audit reason');await page.locator('#master-contract-form button[type=submit]').click();assert.ok(requests.some(x=>x.method==='POST'&&x.path===`/api/master/companies/${companyId}/contracts`));await page.getByRole('button',{name:'Financeiro e Cobranças'}).click();await page.locator('#company-select').waitFor();await page.locator('summary').filter({hasText:'Novo rascunho de cobrança'}).click();await page.locator('#master-invoice-form [name=invoice_number]').fill('INV-CI');await page.locator('#master-invoice-form [name=amount]').fill('10');await page.locator('#master-invoice-form [name=due_at]').fill('2026-12-01');await page.locator('#master-invoice-form [name=audit_note]').fill('CI-only audit reason');await page.locator('#master-invoice-form button[type=submit]').click();assert.ok(requests.some(x=>x.method==='POST'&&x.path===`/api/master/companies/${companyId}/invoices`));assert.ok(!requests.some(x=>/payment|charge|asaas|mercadopago/i.test(x.path)));await page.getByRole('button',{name:'Comunicados e Avisos'}).click();await page.locator('summary').filter({hasText:'Novo comunicado (rascunho)'}).click();await page.locator('#master-announcement-form [name=title]').fill('Fixture message');await page.locator('#master-announcement-form [name=body]').fill('No outbound send');await page.locator('#master-announcement-form [name=audit_note]').fill('CI-only audit reason');await page.locator('#master-announcement-form button[type=submit]').click();assert.ok(requests.some(x=>x.method==='POST'&&x.path==='/api/master/announcements'));assert.ok(!requests.some(x=>/publish|broadcast|email|whatsapp/i.test(x.path)));assert.deepEqual(denied,[])}finally{await cleanup()}
});

test('company admin reset does not create company membership or expose credential hashes',async()=>{
 const {browser,page,requests,cleanup}=await createPage();try{
  await login(page);await page.getByRole('button',{name:'Acessos e Permissões',exact:true}).click();
  await page.locator('#company-select').selectOption(companyId);await page.getByText('Admin Fixture').waitFor();
  const before=await page.locator('#master-company-admins').innerText();assert.ok(before.includes('admin@example.test'));
  page.on('dialog',async d=>{await d.accept('Approved support password reset CI')});
  await page.getByRole('button',{name:'Redefinir senha',exact:false}).click();
  await page.getByText('CI-only-one-time-password').waitFor();
  const sent=requests.find(x=>x.method==='POST'&&x.path.endsWith('/admin-accounts/admin-fixture/reset-password'));
  assert.ok(sent);assert.deepEqual(JSON.parse(sent.postData),{note:'Approved support password reset CI'});
  assert.ok(!requests.some(x=>/membership|password_hash|credential/i.test(x.path)));
 }finally{await cleanup()}
});

test('Master retains the 30-minute audited company session and return-to-Master flow',async()=>{
 const {browser,page,requests,cleanup}=await createPage();try{
  await login(page);await page.getByRole('button',{name:'Acessos e Permissões',exact:true}).click();
  await page.locator('#company-select').selectOption(companyId);await page.getByText('Employee Fixture').waitFor();
  page.on('dialog',async d=>{await d.accept()});await page.getByRole('button',{name:'Abrir como gestão nesta empresa'}).click();
  await page.waitForURL('**/index.html?master-session=1');
  const call=requests.find(x=>x.method==='POST'&&x.path===`/api/master/companies/${companyId}/management-session`);assert.ok(call);
  assert.deepEqual(JSON.parse(call.postData||'{}'),{});
 }finally{await cleanup()}
});
