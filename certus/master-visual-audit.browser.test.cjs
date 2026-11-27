'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const html=fs.readFileSync(process.env.CERTUS_MASTER_HTML||path.join(__dirname,'master.html'),'utf8');
const managementUi=fs.readFileSync(path.join(__dirname,'operacao.js'),'utf8');
const managementMobileCss=fs.readFileSync(path.join(__dirname,'operacao-mobile.css'),'utf8');
const companies=[{id:'11111111-1111-4111-8111-111111111111',name:'Empresa de exemplo com nome extenso',slug:'empresa-exemplo',status:'active',users:2,employees:4,branches:1,clock_events:12,pending_adjustments:0}];
const auditItems=[
 {created_at:'2026-11-26T18:31:36.745Z',actor_name:'Fabio Júnior',action:'master.login',entity_type:'user',entity_id:'774e0f31-6213-446c-b5c5-9457cb808331',details:{email:'audit@example.test',note:'Texto de auditoria longo para exercitar a expansão de detalhes sem estourar a largura da tabela. '.repeat(4)}},
 {created_at:'2026-11-25T09:05:00.000Z',actor_name:'Suporte Certus',action:'company.status.updated',entity_type:'company',entity_id:'11111111-1111-4111-8111-111111111111',details:{status:'active'}}
];


test('management portal avoids word-by-word wrapping, uses readable status/date labels and styles its sidebar scrollbar',()=>{
 assert.match(managementUi,/Status: \$\{esc\(statusLabel\(x\.status\)\)\}/);
 assert.match(managementUi,/formatDateTime\(x\.password_changed_at\)/);
 assert.match(managementMobileCss,/\.side\{scrollbar-width:thin;scrollbar-color:#8d3a57 #50001f\}/);
 assert.match(managementMobileCss,/\.table-wrap th\{white-space:nowrap;overflow-wrap:normal;word-break:normal\}/);
 assert.match(managementMobileCss,/\.table-wrap td,.main \.records-calendar td\{overflow-wrap:break-word;word-break:normal\}/);
 assert.match(html,/\.app-side\{scrollbar-width:thin;scrollbar-color:#b77a8f #3d0018\}/,'Master sidebar scrollbar uses coordinated wine/plum colors');
 assert.match(html,/\.access-identity-stats\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/,'identity cards use all three desktop columns');
 assert.match(html,/\.access-identity-stats \.demo-stat strong\{font-size:16px;line-height:1.25;overflow-wrap:anywhere;word-break:normal\}/,'long identity values stay readable');
});

test('Master pages render without viewport overflow and keep long table data readable on desktop and mobile',async()=>{
 let origin;
 const server=http.createServer((req,res)=>{
  const asset=req.url==='/certus/certus-logo-color.png'?'certus-logo-color.png':req.url==='/certus/certus-logo-white.png'?'certus-logo-white.png':null;
  if(req.url==='/certus/master.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(html.replace('<head>','<head><base href="'+origin+'/certus/">'))}
  if(asset){res.writeHead(200,{'content-type':'image/png'});return res.end(fs.readFileSync(path.join(__dirname,asset)))}
  res.writeHead(404);res.end('Not found');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
   const page=await browser.newPage({viewport});
   await page.route('**/*',async route=>{
    const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();
    if(!url.startsWith('https://certus-api.onrender.com/'))return route.abort();
    const req=route.request(),u=new URL(url),common={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,PATCH,PUT,OPTIONS'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:common});
    let body={items:[]};
    if(u.pathname==='/api/master/auth/login')body={access_token:'fixture-token',user:{id:'master-fixture',name:'Fabio Júnior',email:'master@example.test',role:'master'}};
    else if(u.pathname==='/api/master/dashboard')body={companies:{total:1,active:1},employees:4,terminals:{online:1},finance:{collected_month:0,receivable:0},support:{open:0},pending_adjustments:0,as_of:'2026-11-26T18:00:00Z',period:'Hoje',subscriptions:{active:1},incidents:{critical:0}};
    else if(u.pathname==='/api/master/overview')body={items:companies,total:1,active:1,trial:0,suspended:0};
    else if(u.pathname==='/api/master/audit-log')body={items:auditItems};
    else if(u.pathname==='/api/master/security/incidents')body={items:[]};
    else if(u.pathname==='/api/master/me')body={id:'master-fixture',name:'Fabio Júnior',email:'master@example.test',role:'master'};
    else if(u.pathname==='/api/master/support/metrics')body={items:[{company_name:'Empresa de exemplo com nome extenso',total:12,open:3,in_progress:2,waiting_customer:1,resolved:4,closed:2,urgent:1,unassigned:0,first_response_minutes:18.6,resolution_minutes:225.8}],sla_configured:false};
    else if(u.pathname==='/api/master/monitoring')body={items:companies.map(c=>({...c,events:{events_24h:18,pending_24h:2,review_24h:1,rejected_24h:0},devices:{total:1,online:1,last_seen_at:'2026-11-26T18:00:00Z'}})),window:'24 horas',as_of:'2026-11-26T18:00:00Z',definitions:{events:'Eventos recebidos',online:'Terminais ativos'}};
    else if(u.pathname==='/api/master/devices')body={items:[{label:'Terminal de exemplo',branch_name:'Filial central',status:'active',online:true,last_seen_at:'2026-11-26T18:00:00Z',app_version:'1.2.3'}]};
    else if(u.pathname==='/api/master/support/tickets'||u.pathname==='/api/master/accounts'||u.pathname==='/api/master/support/categories'||u.pathname==='/api/master/plans'||u.pathname==='/api/master/announcements'||u.pathname==='/api/master/features'||u.pathname==='/api/master/onboarding'||u.pathname==='/api/master/settings')body={items:[],editable_keys:[],note:'Catálogo consultivo.'};
    else if(u.pathname==='/api/master/support/config')body={items:[]};
    else if(u.pathname.startsWith('/api/master/companies/'))body={items:[]};
    else return route.fulfill({status:404,contentType:'application/json',headers:common,body:JSON.stringify({error:`Unexpected route ${req.method()} ${u.pathname}`})});
    return route.fulfill({status:200,contentType:'application/json',headers:common,body:JSON.stringify(body)});
   });
   await page.goto(`${origin}/certus/master.html`,{waitUntil:'domcontentloaded'});
   await page.getByLabel('E-mail Master').fill('master@example.test');
   await page.getByLabel('Senha',{exact:true}).fill('fixture-password');
   await page.getByRole('button',{name:'Entrar'}).click();
   await page.getByRole('heading',{name:'Visão geral da plataforma'}).waitFor();
   const pages=['Dashboard Master','Empresas (Organizações)','Planos e assinaturas','Contratos e Testes','Financeiro e Cobranças','Central de Suporte','Monitoramento de Ponto','Terminais e Dispositivos','Implantação de Clientes','Configurações Globais','Recursos e Funcionalidades','Comunicados e Avisos','Acessos e Permissões','Auditoria e Logs'];
   const headings=['Visão geral da plataforma','Empresas','Planos e assinaturas','Contratos e testes','Financeiro e cobranças','Central de Suporte','Monitoramento de Ponto','Terminais e Dispositivos','Implantação de Clientes','Configurações Globais','Recursos e Funcionalidades','Comunicados e Avisos','Acessos e Permissões','Auditoria e Logs'];
   for(let i=1;i<pages.length;i++){
    if(viewport.width<700)await page.getByRole('button',{name:'Abrir menu'}).click();
    await page.getByRole('button',{name:pages[i],exact:true}).click();
    await page.getByRole('heading',{name:headings[i],exact:true}).waitFor({timeout:12000});
    const widths=await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,content:document.querySelector('#content')?.scrollWidth||0,client:document.querySelector('#content')?.clientWidth||0}));
    assert.ok(widths.doc<=widths.viewport+1,`${pages[i]} causes page-wide horizontal overflow at ${viewport.width}px: ${JSON.stringify(widths)}`);
    assert.ok(widths.content<=widths.client+1,`${pages[i]} content escapes its column at ${viewport.width}px: ${JSON.stringify(widths)}`);
    if(pages[i]==='Acessos e Permissões'){
     const layout=await page.locator('.access-identity-stats').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,emailWrap:getComputedStyle(el.querySelectorAll('.demo-stat strong')[1]).overflowWrap,scrollbar:getComputedStyle(document.querySelector('.app-side')).scrollbarColor}));
     const expectedColumns=viewport.width>1100?3:viewport.width>760?2:1;
     assert.equal(layout.columns,expectedColumns,`identity cards reflow at ${viewport.width}px`);
     assert.equal(layout.emailWrap,'anywhere','long email may wrap only when required by its card width');
     assert.match(layout.scrollbar,/183, 122, 143/i,'Master sidebar scrollbar thumb matches its custom theme');
    }
   }
   const table=page.locator('.demo-table-wrap').first();
   await table.waitFor();
   assert.equal(await page.locator('.demo-table th').first().evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');
   assert.equal(await page.locator('.table-json summary').first().innerText(),'Ver detalhes');
   const tableBox=await table.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
   assert.ok(tableBox.scroll>=tableBox.client,'wide table stays within a horizontally scrollable region');
   const date=await page.locator('.demo-table tbody tr').first().locator('td').first().innerText();
   assert.match(date,/\d{2}\/\d{2}\/\d{4}/,'timestamps display in a local date format');
   await page.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
