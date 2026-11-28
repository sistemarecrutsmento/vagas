'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
function serve(){return http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.join(root,pathname.replace(/^\//,''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404).end();return}const ext=path.extname(file);res.writeHead(200,{'Content-Type':ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript; charset=utf-8':'text/css; charset=utf-8'});res.end(bytes)})})}

test('legacy Order Master URL redirects into the native Journeys module',async t=>{
 const server=serve();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 t.after(async()=>{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))});
 browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.goto(`http://127.0.0.1:${server.address().port}/certus/order-master.html`);
 await page.waitForURL('**/certus/index.html?view=schedules');
 assert.match(page.url(),/index\.html\?view=schedules$/);
 assert.equal(await page.locator('#order-master-app').count(),0);
 assert.equal(await page.locator('.nav-order-master').count(),0);
 await browser.close();browser=null;
});
