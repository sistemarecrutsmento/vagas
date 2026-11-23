'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

// Render the shipping Certus UI with an isolated, fully synthetic API fixture.
// No production API call, login, camera, location, or real-company record is used.
const root=path.resolve(__dirname,'..');
const company={id:'10000000-0000-4000-8000-000000000001',name:'Empresa Exemplo',slug:'empresa-exemplo',timezone:'America/Sao_Paulo'};
const employee={id:'20000000-0000-4000-8000-000000000001',employee_number:'DEMO-001',full_name:'Pessoa de Exemplo',employee_name:'Pessoa de Exemplo',job_title:'Assistente administrativa',branch_name:'Unidade Exemplo',department_name:'Operações',schedule_name:'Administrativo · 5×2',status:'active',has_portal_access:true,schedule_rules:{days:['mon','tue','wed','thu','fri'],rest_day:'sun',start:'08:00',end:'17:00',break_minutes:60}};
const samples=[
 {id:'fixture-event-01',employee_id:employee.id,full_name:'Pessoa de Exemplo',event_type:'entry',occurred_at:'2026-11-23T08:03:00-03:00',source:'web',validation_status:'validated',branch_name:'Unidade Exemplo'},
 {id:'fixture-event-02',employee_id:employee.id,full_name:'Pessoa de Exemplo',event_type:'break_start',occurred_at:'2026-11-23T12:01:00-03:00',source:'web',validation_status:'validated',branch_name:'Unidade Exemplo'}
];
const branches=[{id:'30000000-0000-4000-8000-000000000001',name:'Unidade Exemplo',status:'active'}];
const schedules=[{id:'40000000-0000-4000-8000-000000000001',name:'Administrativo · 5×2',status:'active'}];
const requests=[{id:'50000000-0000-4000-8000-000000000001',full_name:'Pessoa de Exemplo',requested_type:'entry',requested_at:'2026-11-20T08:00:00-03:00',status:'pending',reason:'Amostra demonstrativa.'}];

function fixture(pathname,role){
 if(pathname==='/api/me')return {id:role==='employee'?'employee-user-fixture':'admin-user-fixture',name:role==='employee'?'Pessoa de Exemplo':'Gestora de Demonstração',role,employee_id:role==='employee'?employee.id:undefined,employee_name:role==='employee'?employee.full_name:undefined,employee:role==='employee'?employee:undefined,company};
 if(pathname==='/api/subscription/access')return {is_owner:true,unlocked:true};
 if(pathname==='/api/employees'||pathname==='/api/management/employees')return {items:[{...employee,anomaly_days:0}]};
 if(pathname==='/api/branches')return {items:branches};
 if(pathname==='/api/departments')return {items:[{id:'dept-fixture',name:'Operações'}]};
 if(pathname==='/api/schedules')return {items:schedules};
 if(pathname==='/api/clock-events')return {items:samples};
 if(pathname==='/api/adjustment-requests')return {items:requests};
 if(pathname==='/api/management/overview')return {item:{rate_percent:1.2,absent_minutes:45,scheduled_minutes:3750}};
 if(pathname==='/api/employee/face-profile')return {registered:true,consented_at:'2026-11-01T12:00:00-03:00'};
 if(pathname==='/api/employee/work-location')return {branch_id:branches[0].id,branch_name:branches[0].name,latitude:-10.0,longitude:-38.0,geofence_radius_m:250};
 return {items:[]};
}

test('capture genuine Certus management and employee screens using only fictitious fixtures',async()=>{
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname;const normalized=pathname==='/'?'/certus/':pathname;let file=normalized==='/certus/'?path.join(root,'certus/index.html'):path.join(root,normalized);if(!file.startsWith(root)){res.writeHead(403).end();return}fs.readFile(file,(error,body)=>{if(error){res.writeHead(404).end();return}const ext=path.extname(file);const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(body)})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const url=route.request().url();
   if(!url.startsWith('https://certus-api.onrender.com/'))return route.continue();
   const u=new URL(url),req=route.request(),role=req.headers()['x-fixture-role']||'company_admin';
   const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,Accept,X-Fixture-Role','Access-Control-Max-Age':'600'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   const currentRole=globalThis.__fixtureRole||'company_admin';
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(fixture(u.pathname,currentRole))});
  });
  await context.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const page=await context.newPage();
  globalThis.__fixtureRole='company_admin';
  await page.addInitScript(({role})=>{sessionStorage.setItem('certus_token','synthetic-fixture-token');sessionStorage.setItem('certus_user',JSON.stringify({id:'admin-user-fixture',name:'Gestora de Demonstração',role,company:{id:'10000000-0000-4000-8000-000000000001',name:'Empresa Exemplo',slug:'empresa-exemplo',timezone:'America/Sao_Paulo'}}))},{role:'company_admin'});
  await page.goto(`${origin}/certus/`,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Empresa Exemplo',exact:true}).waitFor({timeout:20000});
  await page.screenshot({path:'landing-captures/gestao-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Registros de ponto',exact:true}).click();
  await page.getByRole('heading',{name:'Registros de Ponto',exact:true}).waitFor({timeout:10000});
  await page.screenshot({path:'landing-captures/registros-desktop.png',fullPage:true});
  await context.close();

  const employeeContext=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await employeeContext.route('**/*',async route=>{
   const url=route.request().url();
   if(!url.startsWith('https://certus-api.onrender.com/'))return route.continue();
   const u=new URL(url),req=route.request(),headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,Accept','Access-Control-Max-Age':'600'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(fixture(u.pathname,'employee'))});
  });
  await employeeContext.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const employeePage=await employeeContext.newPage();
  await employeePage.addInitScript(()=>{sessionStorage.setItem('certus_token','synthetic-fixture-token');sessionStorage.setItem('certus_user',JSON.stringify({id:'employee-user-fixture',name:'Pessoa de Exemplo',employee_name:'Pessoa de Exemplo',role:'employee',employee_id:'20000000-0000-4000-8000-000000000001',employee:{...{schedule_name:'Administrativo · 5×2',schedule_rules:{days:['mon','tue','wed','thu','fri'],rest_day:'sun',start:'08:00',end:'17:00',break_minutes:60}}},company:{id:'10000000-0000-4000-8000-000000000001',name:'Empresa Exemplo',slug:'empresa-exemplo',timezone:'America/Sao_Paulo'}}))});
  await employeePage.goto(`${origin}/certus/`,{waitUntil:'domcontentloaded'});
  await employeePage.getByRole('heading',{name:'Olá, Pessoa de Exemplo!'}).waitFor({timeout:20000});
  await employeePage.getByText('Rosto cadastrado.',{exact:true}).waitFor({timeout:10000}).catch(()=>{});
  await employeePage.screenshot({path:'landing-captures/colaborador-mobile.png',fullPage:false});
  await employeeContext.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
