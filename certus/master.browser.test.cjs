'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const html=fs.readFileSync(process.env.CERTUS_MASTER_HTML||path.join(__dirname,'master.html'),'utf8');
const companyId='11111111-1111-4111-8111-111111111111';
const invoiceId='44444444-4444-4444-8444-444444444444';

test('Master creates an InfinitePay checkout only after confirmation and displays the provider URL',async()=>{
 let origin;const server=http.createServer((req,res)=>{
  const logo=req.url==='/certus/certus-logo-color.png'?'certus-logo-color.png':req.url==='/certus/certus-logo-white.png'?'certus-logo-white.png':null;
  if(req.url==='/certus/master.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(html.replace('<head>','<head><base href="'+origin+'/certus/">'))}
  if(logo){res.writeHead(200,{'content-type':'image/png'});return res.end(fs.readFileSync(path.join(__dirname,logo)))}
  res.writeHead(404);res.end('Not found');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true});const page=await browser.newPage();
 const calls=[];let laborVersion=1,laborRule={rule_code:'night.domestic',category:'night_work',regime:'domestic',conditions:{worker_regime:'domestic'},values:{start:'22:00',end:'05:00',reduced_hour_minutes:52.5,minimum_premium_percent:20,premium_percent:20,extension_after_night:true},company_configurable_fields:['premium_percent'],source:{title:'LC 150/2015, art. 19',url:'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm'},legal_review_status:'reviewed'},laborDrafts=[{id:'77777777-7777-4777-8777-777777777777',version:1,catalog:[laborRule],reason:'Seed fixture',created_at:'2026-11-27T12:00:00Z'}],laborPublications=[];
 const invoice={id:invoiceId,company_id:companyId,invoice_number:'INV-CI',status:'draft',amount:'15.00',currency:'BRL',due_at:'2026-12-01',created_at:'2026-11-18'};
 const company={id:companyId,name:'Empresa Fixture',slug:'empresa-fixture',status:'active',users:1,employees:1,branches:1,clock_events:0,pending_adjustments:0};
 await page.route('**/*',async route=>{
  const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();
  if(!url.startsWith('https://certus-api.onrender.com/'))return route.abort();
  const req=route.request(),u=new URL(url),body=req.postDataJSON?.()||{};const common={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:common});
  calls.push({method:req.method(),path:u.pathname,body});
  if(u.pathname==='/api/master/auth/login'&&req.method()==='POST')return route.fulfill({status:200,contentType:'application/json',headers:common,body:JSON.stringify({access_token:'fixture-token',user:{id:'master-fixture',name:'Master Fixture',email:'master@example.test',role:'master'}})});
  if(u.pathname==='/api/master/overview')return route.fulfill({status:200,contentType:'application/json',headers:common,body:JSON.stringify({items:[company],total:1,active:1,trial:0,suspended:0})});
  if(u.pathname==='/api/master/labor-catalog'&&req.method()==='GET')return route.fulfill({status:200,contentType:'application/json',headers:common,body:JSON.stringify({versions:laborDrafts,publications:laborPublications})});
  if(u.pathname==='/api/master/labor-catalog/versions'&&req.method()==='POST'){assert.ok(body.reason.length>=8);assert.equal(body.catalog[0].source.url,laborRule.source.url);const item={id:'88888888-8888-4888-8888-888888888888',version:++laborVersion,catalog:body.catalog,reason:body.reason,created_at:new Date().toISOString()};laborDrafts.unshift(item);return route.fulfill({status:201,contentType:'application/json',headers:common,body:JSON.stringify({item,published:false})})}
  const publishMatch=u.pathname.match(/^\/api\/master\/labor-catalog\/versions\/([0-9a-f-]+)\/publish$/i);if(publishMatch&&req.method()==='POST'){const item=laborDrafts.find(x=>x.id===publishMatch[1]);assert.ok(item);assert.ok(body.review_reference.includes('planalto.gov.br'));laborPublications.unshift({id:'99999999-9999-4999-8999-999999999999',version_id:item.id,version:item.version,effective_from:body.effective_from,review_reference:body.review_reference,review_note:body.review_note});return route.fulfill({status:201,contentType:'application/json',headers:common,body:JSON.stringify({item:{...item,publication:laborPublications[0]}})})}
  if(u.pathname===`/api/master/companies/${companyId}/invoices`){return route.fulfill({status:200,contentType:'application/json',headers:common,body:JSON.stringify({items:[invoice]})})}
  if(u.pathname===`/api/master/companies/${companyId}/invoices/${invoiceId}/infinitepay-link`&&req.method()==='POST'){
   assert.ok(body.audit_note.length>=8);invoice.status='open';invoice.provider='infinitepay';invoice.payment_reference='https://buy.infinitepay.io/ci-fixture';
   return route.fulfill({status:201,contentType:'application/json',headers:common,body:JSON.stringify({item:invoice,checkout_url:invoice.payment_reference,note:'Link fixture criado; nenhum pagamento realizado.'})});
  }
  return route.fulfill({status:404,contentType:'application/json',headers:common,body:JSON.stringify({error:`Unexpected fixture route ${req.method()} ${u.pathname}`})});
 });
 try{
  await page.goto(`${origin}/certus/master.html`,{waitUntil:'domcontentloaded'});
  await page.getByLabel('E-mail Master').fill('master@example.test');await page.getByLabel('Senha',{exact:true}).fill('fake-only-password');await page.getByRole('button',{name:'Entrar'}).click();
  await page.getByRole('heading',{name:'Visão geral da plataforma'}).waitFor();await page.getByRole('button',{name:'Financeiro e Cobranças',exact:true}).click();
  await page.locator('#company-select').waitFor();await page.locator('#company-select').selectOption(companyId);await page.getByRole('button',{name:'Gerar link InfinitePay'}).waitFor();assert.equal(calls.filter(c=>c.path.endsWith('/infinitepay-link')).length,0);
  page.on('dialog',async d=>{if(d.type()==='prompt')await d.accept('CI-only payment audit reason');else await d.accept()});
  await page.getByRole('button',{name:'Gerar link InfinitePay'}).click();
  assert.ok(calls.some(c=>c.method==='POST'&&c.path===`/api/master/companies/${companyId}/invoices/${invoiceId}/infinitepay-link`));
  const link=page.locator('a[href="https://buy.infinitepay.io/ci-fixture"]').first();await link.waitFor();assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
  await page.getByRole('button',{name:'Catálogo trabalhista',exact:true}).click();await page.getByRole('heading',{name:'Catálogo trabalhista'}).waitFor();assert.equal(calls.filter(c=>c.path==='/api/master/labor-catalog/versions'&&c.method==='POST').length,0);const catalogForm=page.locator('#labor-catalog-version-form');await catalogForm.locator('[name=reason]').fill('Versioned UI fixture draft, not a legal review');await catalogForm.getByRole('button',{name:'Salvar como rascunho'}).click();await page.getByText('Versioned UI fixture draft, not a legal review',{exact:true}).waitFor();assert.equal(calls.filter(c=>c.path==='/api/master/labor-catalog/versions'&&c.method==='POST').length,1);const publishForm=page.locator('#labor-catalog-publish-form');await publishForm.locator('[name=version_id]').selectOption('88888888-8888-4888-8888-888888888888');const future=new Date(Date.now()+2*86400000).toISOString().slice(0,10);await publishForm.locator('[name=effective_from]').fill(future);await publishForm.locator('[name=review_reference]').fill('https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm');await publishForm.locator('[name=review_note]').fill('Reviewed in the isolated UI fixture with an official source reference.');page.on('dialog',d=>d.accept());await publishForm.getByRole('button',{name:'Publicar com vigência'}).click();await page.getByText('Reviewed in the isolated UI fixture with an official source reference.',{exact:true}).waitFor();assert.equal(laborPublications.length,1);assert.equal(laborPublications[0].effective_from,future);assert.equal(calls.filter(c=>c.path.endsWith('/publish')&&c.method==='POST').length,1);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
