'use strict';
// Visual regression test for the support portal. All company and ticket data here is fictitious.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const { chromium }=require('playwright');
const root=__dirname;
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const fakeUser={id:'visual-user',email:'manager@example.test',name:'Fabio Exemplo',role:'company_admin',status:'active',must_change_password:false,company:{id:'visual-company',name:'Empresa de Demonstração',slug:'empresa-demo',timezone:'America/Sao_Paulo'}};
const tickets=[
 {id:'ticket-1',protocol:'CS-DEMO-001',subject:'Acesso de colaboradores',category:'login',status:'open',priority:'normal',created_at:'2026-11-18T09:00:00Z',updated_at:'2026-11-18T09:14:00Z',message_count:1,unread_count:0},
 {id:'ticket-2',protocol:'CS-DEMO-002',subject:'Erro no ponto',category:'timekeeping',status:'in_progress',priority:'high',created_at:'2026-11-18T08:30:00Z',updated_at:'2026-11-18T09:10:00Z',message_count:3,unread_count:1},
 {id:'ticket-3',protocol:'CS-DEMO-003',subject:'Ajuste de jornada',category:'schedules',status:'resolved',priority:'normal',created_at:'2026-11-17T16:00:00Z',updated_at:'2026-11-18T07:00:00Z',message_count:2,unread_count:0},
];
const categories=[['login','Acesso e login'],['timekeeping','Registro de ponto'],['schedules','Jornadas e escalas'],['bank','Banco de horas'],['devices','Terminais e dispositivos'],['adjustments','Ajustes e justificativas']].map(([slug,name])=>({slug,name}));
let server,origin;
function json(route,body,status=200){return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body),headers:{'access-control-allow-origin':'*'}})}
test('support center matches the supplied desktop/mobile composition and keeps key controls usable',async t=>{
 server=http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{pathname='/'}if(pathname==='/'||pathname==='/index.html')pathname='/index.html';if(pathname.startsWith('/api/')){let body={items:[]};if(pathname==='/api/me')body=fakeUser;else if(pathname==='/api/management/overview')body={item:{rate_percent:0,absent_minutes:0,scheduled_minutes:0}};else if(pathname==='/api/support/overview')body={counts:{open:3,in_progress:1,waiting_customer:0,resolved:12,total:16},unread_notifications:1};else if(pathname==='/api/support/tickets')body={items:tickets};else if(pathname==='/api/support/categories')body={items:categories};else if(pathname==='/api/support/knowledge')body={items:[],categories:[]};else if(pathname==='/api/support/notifications')body={items:[]};res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(body));return}const file=path.resolve(root,'.'+pathname);if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return}if(path.extname(file)==='.js')data=Buffer.from(data.toString().replaceAll('https://certus-api.onrender.com',origin));res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data)})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;t.after(()=>new Promise(resolve=>server.close(resolve)));
 const browser=await chromium.launch({headless:true}),contexts=[];t.after(async()=>{for(const context of contexts)await context.close();await browser.close()});
 async function openSupport(width,height){const context=await browser.newContext({viewport:{width,height}});contexts.push(context);context.addInitScript(({user})=>{sessionStorage.setItem('certus_token','visual-only-test-token');sessionStorage.setItem('certus_user',JSON.stringify(user))},{user:fakeUser});const page=await context.newPage();page.on('pageerror',err=>{throw err});await page.goto(`${origin}/index.html`);if(width<=920)await page.locator('#menu-toggle').click();await page.locator('.side-help').waitFor({state:'visible'});await page.locator('.side-help').click();await page.locator('.help-portal-topbar').waitFor({state:'visible'});await page.locator('#help-ticket-list .help-ticket-row').first().waitFor({state:'visible'});return{context,page}}
 const desktop=await openSupport(1440,1000);
 assert.equal(await desktop.page.locator('.side-academy').count(),0,'Certus Academy is no longer a sidebar shortcut');
 assert.equal(await desktop.page.locator('#help-open-academy').count(),1,'Academy remains accessible from the Help screen');
assert.ok(await desktop.page.locator('[data-help-article^="academy:"]').count()>=5,'empty backend knowledge base is filled by the first local Academy guides');
 const helpArticle=desktop.page.locator('[data-help-article="academy:jornadas"]');
 await helpArticle.click();
 await desktop.page.locator('#help-chat-dialog[open]').waitFor();
 assert.match(await desktop.page.locator('#help-chat-content h2').innerText(),/jornada/i,'the Help screen can open the built-in tutorial without an API article record');
 await desktop.page.locator('#help-close-chat').click();
 await desktop.page.locator('#help-open-academy').waitFor({state:'visible'});
 await desktop.page.locator('#help-open-academy').click();
 await desktop.page.locator('.academy-page').waitFor({state:'visible'});
 await desktop.page.waitForFunction(()=>document.querySelector('.main').scrollTop===0);
 fs.mkdirSync(path.join(process.cwd(),'artifacts'),{recursive:true});
 await desktop.page.locator('.academy-page').screenshot({path:path.join(process.cwd(),'artifacts','certus-academy-v1-desktop.png')});
 assert.equal(await desktop.page.locator('.academy-lesson-card').count(),10,'Academy lists the ten V1 step-by-step tutorials');
 assert.ok(await desktop.page.locator('.academy-track').count()>=7,'Academy provides topic filters');
 assert.ok(await desktop.page.locator('.academy-video-panel .academy-eyebrow').innerText().then(x=>/videoaulas e capturas/i.test(x)),'Academy clearly reserves a section for future video lessons and reviewed captures');
 assert.ok(await desktop.page.locator('.academy-video-status').innerText().then(x=>/em preparação/i.test(x)),'the page does not pretend unprovided videos are already published');
 await desktop.page.locator('#academy-search').fill('carga líquida');
 assert.equal(await desktop.page.locator('.academy-lesson-card').count(),1,'search finds matching tutorials');
 await desktop.page.locator('.academy-lesson-card').click();
 await desktop.page.locator('.academy-article').waitFor({state:'visible'});
 assert.match(await desktop.page.locator('.academy-article h2').innerText(),/jornada/i,'tutorial opens as a readable article');
 assert.ok(await desktop.page.locator('.academy-steps li').count()>=4,'tutorial renders numbered actionable steps');
 await desktop.page.locator('.academy-media img').evaluate(img=>img.decode());
 assert.ok(await desktop.page.locator('.academy-media img').evaluate(img=>img.complete&&img.naturalWidth>0),'the tutorial includes a real demonstrative Certus screen capture');
 await desktop.page.locator('#academy-back').click();
 assert.equal(await desktop.page.locator('#academy-library').isVisible(),true,'reader can return to the filtered library');
 assert.ok(await desktop.page.locator('.academy-lesson-card').count()===1,'return preserves the search filter');
 await desktop.page.locator('#academy-search').fill('');
 await desktop.page.locator('.side-help').click();
 await desktop.page.locator('.help-kb-panel').waitFor({state:'visible'});
 const layout=await desktop.page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};return{topbar:rect('.help-portal-topbar'),form:rect('#help-new-ticket-panel'),tickets:rect('.help-main-panel'),knowledge:rect('.help-kb-panel'),contact:rect('.help-contact'),topbarColor:getComputedStyle(document.querySelector('.help-portal-topbar')).backgroundColor,stats:[...document.querySelectorAll('.help-stat')].map(x=>({display:getComputedStyle(x).display,label:x.innerText}))}});
 assert.ok(await desktop.page.locator('.help-center svg.help-icon').count()>=25,'the help portal renders a coherent outline icon family');assert.equal(await desktop.page.locator('.help-center svg.help-icon:not([aria-hidden=\"true\"])').count(),0,'decorative icons are hidden from screen readers');assert.ok(layout.topbar.y>=0&&layout.topbar.height>=50,`top bar remains visible and unclipped: ${JSON.stringify(layout.topbar)}`);assert.ok(layout.form.x<layout.tickets.x,'new ticket form sits beside the company ticket list');assert.ok(layout.form.y<layout.tickets.y+40,'form and ticket list begin on the same horizontal band');assert.ok(layout.knowledge.y>layout.tickets.y,'knowledge base follows the ticket list');assert.ok(layout.contact.x<layout.tickets.x&&layout.contact.y>layout.form.y,'support contact sits below the form');assert.ok(layout.topbarColor.includes('80, 0, 31'),'top bar uses the Certus burgundy');assert.equal(layout.stats.filter(x=>x.display!=='none').length,4,'desktop shows four status summary cards');
 fs.mkdirSync(path.join(process.cwd(),'artifacts'),{recursive:true});await desktop.page.screenshot({path:path.join(process.cwd(),'artifacts','help-center-reference-desktop.png'),fullPage:true});
 const mobile=await openSupport(390,844);
assert.equal(await mobile.page.locator('.side-academy').count(),0,'mobile sidebar also omits the Academy shortcut');
 await mobile.page.locator('#help-open-academy').click();
 await mobile.page.locator('.academy-page').waitFor({state:'visible'});
 await mobile.page.waitForFunction(()=>document.querySelector('.main').scrollTop===0);
 await mobile.page.waitForFunction(()=>!document.querySelector('#company-sidebar').classList.contains('open'));
 await mobile.page.waitForTimeout(260);
 const academyMobile=await mobile.page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,hero:document.querySelector('.academy-hero').getBoundingClientRect().width,grid:getComputedStyle(document.querySelector('.academy-lesson-grid')).gridTemplateColumns}));
 assert.ok(academyMobile.width<=academyMobile.viewport,`Academy does not overflow on mobile: ${JSON.stringify(academyMobile)}`);
 assert.ok(academyMobile.hero<=academyMobile.viewport,'Academy hero fits the mobile viewport');
 await mobile.page.locator('.academy-page').screenshot({path:path.join(process.cwd(),'artifacts','certus-academy-v1-mobile.png')});
 await mobile.page.locator('#menu-toggle').click();
 await mobile.page.locator('.side-help').click();
 await mobile.page.locator('.help-portal-topbar').waitFor({state:'visible'});
 const mobileLayout=await mobile.page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,formCollapsed:document.querySelector('#help-new-ticket-panel').classList.contains('is-collapsed'),statsVisible:[...document.querySelectorAll('.help-stat')].filter(x=>getComputedStyle(x).display!=='none').length,knowledge:document.querySelector('.help-kb-panel').getBoundingClientRect().toJSON(),contact:document.querySelector('.help-contact').getBoundingClientRect().toJSON()}));
 assert.ok(await mobile.page.locator('.help-center svg.help-icon').count()>=25,'mobile also renders the consistent SVG icon family');assert.ok(mobileLayout.width<=mobileLayout.viewport,'mobile page does not overflow horizontally');assert.equal(mobileLayout.formCollapsed,true,'new-ticket form is compact/collapsed initially on mobile');assert.equal(mobileLayout.statsVisible,5,'mobile shows all five current status metrics');fs.mkdirSync(path.join(process.cwd(),'artifacts'),{recursive:true});await mobile.page.screenshot({path:path.join(process.cwd(),'artifacts','help-center-reference-mobile.png'),fullPage:true});assert.ok(mobileLayout.contact.x>=mobileLayout.knowledge.x+mobileLayout.knowledge.width-20,`on mobile the help contact occupies the right mobile column beside the knowledge base: ${JSON.stringify({knowledge:mobileLayout.knowledge,contact:mobileLayout.contact})}`);
 await mobile.page.locator('#help-new-ticket').click();assert.equal(await mobile.page.locator('#help-new-ticket-panel').evaluate(el=>el.classList.contains('is-collapsed')),false,'new-ticket button expands the compact mobile form');await mobile.page.waitForFunction(()=>document.activeElement===document.querySelector('#support-new-form [name=subject]'),null,{timeout:3000});assert.equal(await mobile.page.locator('#support-new-form [name=subject]').evaluate(el=>document.activeElement===el),true,'expanded form focuses the subject input');
});
