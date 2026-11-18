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
 const calls=[];const invoice={id:invoiceId,company_id:companyId,invoice_number:'INV-CI',status:'draft',amount:'15.00',currency:'BRL',due_at:'2026-12-01',created_at:'2026-11-18'};
 const company={id:companyId,name:'Empresa Fixture',slug:'empresa-fixture',status:'active',users:1,employees:1,branches:1,clock_events:0,pending_adjustments:0};
 await page.route('**/*',async route=>{
  const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();
  if(!url.startsWith('https://certus-api.onrender.com/'))return route.abort();
  const req=route.request(),u=new URL(url),body=req.postDataJSON?.()||{};const common={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:common});
  calls.push({method:req.method(),path:u.pathname,body});
  if(u.pathname==='/api/master/auth/login'&&req.method()==='POST')return route.fulfill({status:200,contentType:'application/json',headers:common,body:JSON.stringify({access_token:'fixture-token',user:{id:'master-fixture',name:'Master Fixture',email:'master@example.test',role:'master'}})});
  if(u.pathname==='/api/master/overview')return route.fulfill({status:200,contentType:'application/json',headers:common,body:JSON.stringify({items:[company],total:1,active:1,trial:0,suspended:0})});
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
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
