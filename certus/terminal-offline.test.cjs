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
 assert.match(page,/terminal\.js\?v=20261125-auto-reconnect-v1/);
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

test('queued marks sync automatically after browser online event and after detected network loss',()=>{
 assert.match(ui,/window\.addEventListener\('online',[^;]*reconnectTerminalAndSync\(\)/);
 assert.match(ui,/function reconnectTerminalAndSync\(\)[\s\S]*?syncTerminalOfflineMarks\(\)/);
 assert.match(ui,/if\(view==='home'&&navigator\.onLine&&config&&\(terminalWasOffline\|\|terminalNetworkLost\)\)reconnectTerminalAndSync\(\)/);
 assert.match(ui,/document\.addEventListener\('visibilitychange',[^;]*terminalWasOffline\|\|terminalNetworkLost[^;]*reconnectTerminalAndSync/);
 assert.match(ui,/Idempotency-Key':mark\.id/);
 assert.match(ui,/data\.requires_review===true&&data\.official_time_confirmed===false/);
 assert.match(ui,/already_recorded===true/);
});

test('offline history explains automatic retry and no manual upload is required',()=>{
 assert.match(ui,/O envio será tentado automaticamente quando a conexão com o Certus voltar; não é necessário solicitar o envio no terminal/);
 assert.doesNotMatch(ui,/textContent='Enviar pendências'/);
 assert.doesNotMatch(ui,/window\.confirm\(`Enviar \$\{pending\.length\} tentativa/);
});

test('service worker caches terminal bundle and the same version-pinned face assets without caching API responses',()=>{
 assert.match(sw,/certus-static-v56-auto-reconnect-20261125/);
 assert.match(sw,/terminal\.js\?v=20261125-auto-reconnect-v1/);
 assert.match(sw,/face-api@1\.7\.15/);
 assert.match(sw,/url\.pathname\.includes\('\/api\/'\)/);
});

test('offline queue is never shown as successful before server confirmation',()=>{
 assert.doesNotMatch(ui,/id=\"offline-status\"/);
 assert.match(ui,/Marcação guardada neste terminal, mas ainda não confirmada pelo Certus/);
 assert.match(ui,/A tentativa anterior de marcação ainda não foi recebida pelo Certus/);
 assert.match(ui,/O servidor confirmou todas as tentativas enviadas/);
 assert.doesNotMatch(ui,/result\.textContent='Marcação registrada com sucesso\.'/);
});




test('home screen does not ask for a manual queue send; automatic sync is connection-driven',()=>{
 const home=ui.slice(ui.indexOf('function showHome'),ui.indexOf('async function syncServerClock'));
 assert.doesNotMatch(home,/Enviar pendências|syncTerminalOfflineMarks/);
 assert.match(ui,/window\.addEventListener\('online',[^;]*reconnectTerminalAndSync\(\)/);
 assert.match(ui,/Há \$\{pending\.length\} tentativa\(s\) guardada\(s\)[\s\S]*?não é necessário solicitar o envio no terminal/);
});

test('offline handling keeps encrypted capture probes and does not add a local employee-template cache',()=>{
 assert.match(ui,/face_descriptor:descriptor/);
 assert.match(ui,/crypto\.subtle\.encrypt/);
 assert.doesNotMatch(ui,/offline-face-templates|faceTemplateCache|employee_face_templates/);
});
