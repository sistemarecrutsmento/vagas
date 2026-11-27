'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const BRANCH='00000000-0000-4000-8000-000000000101';
const EMPLOYEE='00000000-0000-4000-8000-000000000201';
function server(){return http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400).end();return}const safe=path.resolve(ROOT,`.${pathname}`);if(!safe.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}let file=safe;if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end('not found');return}res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data)})})}
function json(route,body,status=200){return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)})}
test('Gestão calendar CRUD, jurisdiction, annual recurrence, history and mobile layout',async t=>{
 const web=server();await new Promise(r=>web.listen(0,'127.0.0.1',r));const port=web.address().port;
 let browser;const events=[];const history=[];const calls=[];
 t.after(async()=>{if(browser)await browser.close();await new Promise(r=>web.close(r))});
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1365,height:900,name:'desktop'},{width:390,height:844,name:'mobile'}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await context.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.addInitScript(({branch,employee})=>{sessionStorage.setItem('certus_token','fixture-session-token');sessionStorage.setItem('certus_user',JSON.stringify({id:'00000000-0000-4000-8000-000000000301',name:'Gestora Fictícia',role:'manager',company:{id:'00000000-0000-4000-8000-000000000401',slug:'calendar-fixture',name:'Empresa Fictícia',timezone:'America/Sao_Paulo'}}));}, {branch:BRANCH,employee:EMPLOYEE});
  await page.route('https://certus-api.onrender.com/**',async route=>{
   const request=route.request(),url=new URL(request.url()),p=url.pathname,method=request.method();calls.push({path:p,method,body:request.postDataJSON?.()||null});
   if(p==='/api/subscription/access')return json(route,{unlocked:true,is_owner:false});
   if(p==='/api/me')return json(route,{id:'00000000-0000-4000-8000-000000000301',role:'manager',employee_id:null,company:{id:'00000000-0000-4000-8000-000000000401',slug:'calendar-fixture',name:'Empresa Fictícia',timezone:'America/Sao_Paulo'}});
   if(p==='/api/employees')return json(route,{items:[{id:EMPLOYEE,full_name:'Colaboradora Fictícia',employee_number:'F-001',status:'active',branch_id:BRANCH,department_id:null,branch_name:'Filial Fictícia'}]});
   if(p==='/api/branches')return json(route,{items:[{id:BRANCH,name:'Filial Fictícia',city:'Aracaju',state:'SE',calendar_municipality_code:'2800308',status:'active'}]});
   if(p==='/api/schedules')return json(route,{items:[]});
   if(p==='/api/clock-events')return json(route,{items:[]});
   if(p==='/api/adjustment-requests')return json(route,{items:[]});
   if(p==='/api/management/overview')return json(route,{item:{rate_percent:0,weekly_overtime_status:'complete',absent_minutes:0,scheduled_minutes:0,weekly_overtime_additional_minutes:0,weekly_overtime_pending_employees:0}});
   if(p==='/api/departments')return json(route,{items:[]});
   if(p==='/api/management/calendar-events'&&method==='GET')return json(route,{items:events.slice(),from:url.searchParams.get('from'),to:url.searchParams.get('to')});
   if(p==='/api/management/calendar-events'&&method==='POST'){const body=request.postDataJSON(),item={...body,id:`00000000-0000-4000-8000-${String(events.length+501).padStart(12,'0')}`,status:'active',version:1,created_at:new Date().toISOString()};events.push(item);history.push({id:item.id,action:'created',after_values:item,created_at:item.created_at});return json(route,{item},201)}
   const match=p.match(/^\/api\/management\/calendar-events\/([0-9a-f-]+)(?:\/(cancel|history))?$/i);
   if(match){const item=events.find(x=>x.id===match[1]);if(!item)return json(route,{error:'Evento não encontrado.'},404);if(match[2]==='history')return json(route,{items:history.filter(x=>x.after_values?.id===item.id||x.before_values?.id===item.id)});if(match[2]==='cancel'&&method==='POST'){const before={...item};item.status='cancelled';item.version++;history.push({id:item.id,action:'cancelled',before_values:before,after_values:{...item,cancellation_reason:request.postDataJSON().reason},created_at:new Date().toISOString()});return json(route,{item})}if(method==='PATCH'){const before={...item};Object.assign(item,request.postDataJSON(),{version:item.version+1});history.push({id:item.id,action:'updated',before_values:before,after_values:{...item},created_at:new Date().toISOString()});return json(route,{item})}}
   return json(route,{error:`Unmocked fixture route ${method} ${p}`},501);
  });
  await page.goto(`http://127.0.0.1:${port}/certus/`);await page.waitForFunction(()=>document.querySelector('#company-sidebar')||document.querySelector('.login')||document.querySelector('#app .error'),null,{timeout:15000});const initialText=await page.locator('body').innerText(),sidebarCount=await page.locator('#company-sidebar').count();assert.equal(sidebarCount,1,`Authenticated management shell missing; body=${initialText.slice(0,700)}; API calls=${JSON.stringify(calls.slice(0,8))}`);const calendarNav=page.locator('button[data-view="calendar"]');assert.equal(await calendarNav.count(),1,`Calendar navigation missing; identity=${await page.locator('#identity').innerText().catch(()=>'?')}; title=${await page.locator('#title').innerText().catch(()=>'?')}; nav=${await page.locator('#company-sidebar nav').innerText().catch(()=>'?')}; body=${(await page.locator('body').innerText()).slice(0,800)}; pageErrors=${JSON.stringify(pageErrors)}; API calls=${JSON.stringify(calls.slice(0,20))}`);if(viewport.width<=920)await page.locator('#menu-toggle').click();await calendarNav.click();await page.getByRole('heading',{name:/Calendário central|Calendário/i}).waitFor({timeout:10000});
  const form=page.locator('#calendar-event-form');await form.locator('[name=title]').fill(`Feriado municipal ${viewport.name}`);await form.locator('[name=category]').selectOption('holiday');await form.locator('[name=scope]').selectOption('branch');await form.locator('[name=jurisdiction]').selectOption('municipal');await form.locator('[name=region_code]').fill('SE');await form.locator('[name=municipality_code]').fill('2800308');await form.locator('[name=branch_id]').selectOption(BRANCH);await form.locator('[name=starts_on]').fill('2026-11-02');await form.locator('[name=ends_on]').fill('2026-11-02');await form.getByRole('button',{name:'Salvar evento'}).click();await page.getByText(`Feriado municipal ${viewport.name}`).waitFor();
  let saved=events.find(x=>x.title===`Feriado municipal ${viewport.name}`);assert.ok(saved);assert.equal(saved.jurisdiction,'municipal');assert.equal(saved.region_code,'SE');assert.equal(saved.municipality_code,'2800308');assert.ok(calls.some(x=>x.path==='/api/management/calendar-events'&&x.method==='POST'));
  const row=page.locator('tr').filter({hasText:saved.title});await row.getByRole('button',{name:'Editar'}).click();await form.locator('[name=title]').fill(`Feriado alterado ${viewport.name}`);await form.getByRole('button',{name:'Salvar alterações'}).click();await page.getByText(`Feriado alterado ${viewport.name}`).waitFor();saved=events.find(x=>x.id===saved.id);assert.equal(saved.version,2);assert.ok(history.some(x=>x.action==='updated'));
  page.once('dialog',dialog=>dialog.accept());await page.locator('tr').filter({hasText:saved.title}).getByRole('button',{name:'Histórico'}).click();
  const second=page.locator('#calendar-event-form');await second.locator('[name=title]').fill(`Feriado anual ${viewport.name}`);await second.locator('[name=category]').selectOption('holiday');await second.locator('[name=scope]').selectOption('company');await second.locator('[name=jurisdiction]').selectOption('national');await second.locator('[name=starts_on]').fill('2026-12-25');await second.locator('[name=ends_on]').fill('2026-12-25');await second.locator('[name=recurring]').check();await second.getByRole('button',{name:'Salvar evento'}).click();const annual=events.find(x=>x.title===`Feriado anual ${viewport.name}`);assert.deepEqual(annual.recurrence_rule,{frequency:'yearly'});
  page.once('dialog',dialog=>dialog.accept('Cancelamento de fixture'));await page.locator('tr').filter({hasText:saved.title}).getByRole('button',{name:'Cancelar'}).click();assert.equal(saved.status,'cancelled');assert.ok(history.some(x=>x.action==='cancelled'));
  await page.getByRole('button',{name:'Ano'}).click();await page.locator('body').getByText('Calendário anual').waitFor();assert.ok(await page.getByText(`Feriado anual ${viewport.name}`).count());
  if(viewport.name==='mobile'){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert.equal(overflow,false,'calendar screen should fit phone viewport without horizontal page overflow')}
  await context.close();
 }
});
