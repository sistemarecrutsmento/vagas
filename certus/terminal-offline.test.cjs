'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('certus/terminal.js','utf8');
const page=fs.readFileSync('certus/terminal.html','utf8');
const sw=fs.readFileSync('certus/service-worker.js','utf8');

test('shared terminal preloads pinned face assets and its branch context automatically while connected',()=>{
 assert.match(ui,/async function prepareTerminalOffline\(\)[\s\S]*?serviceWorker\.ready[\s\S]*?api\/terminal\/offline-context/);
 assert.match(ui,/prepareTerminalOffline\(\)\.then\(ready/);
 assert.match(ui,/https:\/\/cdn\.jsdelivr\.net\/npm\/@vladmandic\/face-api@1\.7\.15\/model/);
 assert.match(page,/terminal\.js\?v=20261123-truthful-offline-status-v1/);
 assert.doesNotMatch(ui,/id="prepare-offline|Tentar enviar agora/);
});

test('shared-terminal queue encrypts the face descriptor and location at rest using a non-extractable key',()=>{
 assert.match(ui,/crypto\.subtle\.generateKey\(\{name:'AES-GCM',length:256\},false,\['encrypt','decrypt'\]\)/);
 assert.match(ui,/crypto\.subtle\.encrypt\(\{name:'AES-GCM',iv\},k,plain\)/);
 assert.match(ui,/crypto\.subtle\.decrypt\(\{name:'AES-GCM',iv:new Uint8Array\(row\.iv\)\},k,row\.cipher\)/);
 assert.match(ui,/queueTerminalOfflineMark\(mark\)/);
});

test('offline terminal can open from its last saved device context and queue marks without a session token',()=>{
 assert.match(ui,/showHome\(saved\.device,true\)/);
 assert.match(ui,/if\(!navigator\.onLine\)\{if\(!terminalOfflineContext\(\)\)throw Error/);
 assert.match(ui,/Marcação guardada neste terminal, mas ainda não confirmada pelo Certus/);
 assert.doesNotMatch(ui,/result\.textContent='Marcação registrada com sucesso\.'/);
 assert.match(ui,/client_captured_at:new Date\(\)\.toISOString\(\)/);
});

test('queued terminal punches sync automatically after connectivity returns or app resume, with stable idempotency',()=>{
 assert.match(ui,/addEventListener\('online',[\s\S]*?syncTerminalOfflineMarks/);
 assert.match(ui,/addEventListener\('visibilitychange',[\s\S]*?syncTerminalOfflineMarks/);
 assert.match(ui,/setInterval\(\(\)=>\{if\(view==='home'&&navigator\.onLine\)[\s\S]*?syncTerminalOfflineMarks/);
 assert.match(ui,/\/api\/terminal\/offline-clock-events/);
 assert.match(ui,/Idempotency-Key':mark\.id/);
 assert.match(ui,/data\.requires_review===true&&data\.official_time_confirmed===false/);
 assert.match(ui,/already_recorded===true/);
});

test('service worker caches terminal bundle and the same version-pinned face assets without caching API responses',()=>{
 assert.match(sw,/certus-static-v52-truthful-offline-status-20261123/);
 assert.match(sw,/terminal\.js\?v=20261123-truthful-offline-status-v1/);
 assert.match(sw,/face-api@1\.7\.15/);
 assert.match(sw,/url\.pathname\.includes\('\/api\/'\)/);
});

test('offline queue is never shown as successful before server confirmation',()=>{
 assert.match(ui,/id=\"offline-status\"/);
 assert.match(ui,/Marcação guardada neste terminal, mas ainda não confirmada pelo Certus/);
 assert.match(ui,/A marcação ainda não foi recebida pelo Certus/);
 assert.match(ui,/O Certus recebeu a marcação\. Aguarde a conferência da gestão\./);
 assert.doesNotMatch(ui,/result\.textContent='Marcação registrada com sucesso\.'/);
});
