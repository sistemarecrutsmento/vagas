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
 assert.match(page,/terminal\.js\?v=20261123-explicit-offline-sync-v1/);
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

test('existing offline marks are not synced just because terminal opens; retry requires reconnection or explicit confirmation',()=>{
 const home=ui.slice(ui.indexOf('function showHome'),ui.indexOf('async function syncServerClock'));
 assert.doesNotMatch(home,/syncTerminalOfflineMarks|offline-status|tentativa anterior/);
 assert.match(ui,/addEventListener\('offline',\(\)=>\{terminalWasOffline=true/);
 assert.match(ui,/if\(regained\)syncTerminalOfflineMarks\(\)\.catch/);
 assert.doesNotMatch(ui,/visibilitychange[^;]*syncTerminalOfflineMarks/);
 assert.doesNotMatch(ui,/setInterval\(\(\)=>\{if\(view==='home'[^}]*syncTerminalOfflineMarks/);
 assert.match(ui,/textContent='Enviar pendências'/);
 assert.match(ui,/window\.confirm\(`Enviar \$\{pending\.length\} tentativa/);
 assert.match(ui,/Idempotency-Key':mark\.id/);
 assert.match(ui,/data\.requires_review===true&&data\.official_time_confirmed===false/);
 assert.match(ui,/already_recorded===true/);
});

test('service worker caches terminal bundle and the same version-pinned face assets without caching API responses',()=>{
 assert.match(sw,/certus-static-v55-explicit-offline-sync-20261123/);
 assert.match(sw,/terminal\.js\?v=20261123-explicit-offline-sync-v1/);
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




test('no pending-queue notice or retry appears on the home screen before facial identification; manual retry is behind history confirmation',()=>{
 const home=ui.slice(ui.indexOf('function showHome'),ui.indexOf('async function syncServerClock'));
 assert.doesNotMatch(home,/offline-status|renderOfflineQueueStatus|terminalPendingQueueStatus|Enviar pendências|syncTerminalOfflineMarks/);
 assert.match(ui,/root\.querySelector\('#register-mark'\)\.onclick=e=>punch/);
 assert.match(ui,/async function showHistory\(\)[\s\S]*?Enviar pendências[\s\S]*?window\.confirm/);
 assert.match(ui,/if\(regained\)syncTerminalOfflineMarks/);
});
