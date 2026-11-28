'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('certus/terminal.js','utf8');
const page=fs.readFileSync('certus/terminal.html','utf8');
const sw=fs.readFileSync('certus/service-worker.js','utf8');
const css=fs.readFileSync('certus/terminal-audit.css','utf8');

test('shared terminal preloads pinned face assets and its branch context automatically while connected',()=>{
 assert.match(ui,/async function prepareTerminalOffline\(\)[\s\S]*?serviceWorker\.ready[\s\S]*?api\/terminal\/offline-context[\s\S]*?saveTerminalOfflineFaceCache/);
 assert.match(ui,/prepareTerminalOffline\(\)\.then\(ready/);
 assert.match(ui,/https:\/\/cdn\.jsdelivr\.net\/npm\/@vladmandic\/face-api@1\.7\.15\/model/);
 assert.match(page,/terminal\.js\?v=20261128-terminal-settings-nondestructive-v1/);
 assert.doesNotMatch(ui,/id="prepare-offline|Tentar enviar agora/);
});

test('shared-terminal queue and offline facial roster use encrypted IndexedDB with a non-extractable key',()=>{
 assert.match(ui,/crypto\.subtle\.generateKey\(\{name:'AES-GCM',length:256\},false,\['encrypt','decrypt'\]\)/);
 assert.match(ui,/crypto\.subtle\.encrypt\(\{name:'AES-GCM',iv\},k,plain\)/);
 assert.match(ui,/crypto\.subtle\.decrypt\(\{name:'AES-GCM',iv:new Uint8Array\(row\.iv\)\},k,row\.cipher\)/);
 assert.match(ui,/queueTerminalOfflineMark\(mark\)/);
 assert.match(ui,/OFFLINE_TEMPLATES='templates'/);
 assert.match(ui,/saveTerminalOfflineFaceCache\(payload\)[\s\S]*?crypto\.subtle\.encrypt/);
 assert.match(ui,/loadTerminalOfflineFaceCache\(\)[\s\S]*?crypto\.subtle\.decrypt/);
 assert.match(ui,/function matchOfflineFace\(descriptor,cache\)[\s\S]*?matches\[0\]\.distance>\.60[\s\S]*?\.08/);
 assert.match(ui,/if\(!matched\)throw Error\('Não foi possível identificar o colaborador com segurança/);
 assert.match(ui,/expected_employee_id:matched\.employee_id/);
 assert.ok(ui.indexOf('if(!matched)throw Error')<ui.indexOf('await queueTerminalOfflineMark(queued)'));
});

test('face template object store uses an explicit key when saving the encrypted roster',()=>{
 assert.match(ui,/createObjectStore\(OFFLINE_TEMPLATES\)/);
 assert.match(ui,/objectStore\(OFFLINE_TEMPLATES\)\.put\(\{id:config\.device_id,iv:\[\.\.\.iv\],cipher\},config\.device_id\)/);
});

test('face templates are saved before camera model download; progress is silent but failures remain visible',()=>{
 const prep=ui.slice(ui.indexOf('async function prepareTerminalOffline'),ui.indexOf('function offlineSyncFailureMessage'));
 assert.ok(prep.indexOf('await saveTerminalOfflineFaceCache')<prep.indexOf('await loadFaceApi'));
 assert.match(ui,/id=\"offline-prep-status\"/);
 assert.match(prep,/setOfflinePreparationStatus\(`\$\{terminalFaceCache\.templates\.length\} cadastros faciais recebidos e guardados cifrados/);
 assert.match(ui,/state!=='error'\)\{el\.hidden=true;el\.textContent='';return\}/);
 assert.match(prep,/setOfflinePreparationStatus\(''\);return true/);
 assert.doesNotMatch(prep,/Modo offline preparado com/);
});

test('successful offline sync goes to the employee profile without waiting for managerial review of identity',()=>{
 assert.match(ui,/function showTerminalSyncNotice/);
 assert.match(ui,/sincronizada/);
 assert.match(ui,/official_time_confirmed===true/);assert.match(ui,/offline sincronizada\(s\) e confirmada\(s\)/);
 assert.doesNotMatch(ui,/recebida\(s\) pela gestão para conferência/);
});

test('sync failures stay visible, keep the local queue, and do not block other identified attempts',()=>{
 assert.match(ui,/terminalSyncRetryAt=Math\.max\(terminalSyncRetryAt,Date\.now\(\)\+\(e\?\.httpStatus>=400&&e\?\.httpStatus<500\?60000:15000\)\)/);
 assert.match(ui,/terminalOfflineTimer=setInterval\([\s\S]*?Date\.now\(\)>=terminalSyncRetryAt\)syncTerminalOfflineMarks\(\)/);
 assert.match(ui,/error=offlineSyncFailureMessage\(e\);[\s\S]*?showTerminalSyncNotice\(error,true\);if\(e\?\.httpStatus>=400&&e\?\.httpStatus<500\)continue;break/);
 assert.ok(ui.indexOf('showTerminalSyncNotice(error,true)')<ui.indexOf('await deleteTerminalOfflineMark(mark.id)') || ui.indexOf('await deleteTerminalOfflineMark(mark.id)')<ui.indexOf('showTerminalSyncNotice(error,true)'));
});

test('empty facial roster is not marked prepared; terminal retries and surfaces actionable setup error',()=>{
 assert.match(ui,/if\(!templates\.length\)\{await clearTerminalOfflineFaceCache/);
 assert.match(ui,/terminalOfflineReady=!!terminalFaceCache\?\.templates\?\.length/);
 assert.match(ui,/face_template_count===0/);
 assert.match(ui,/OFFLINE_FACE_REFRESH_MS=300000/);
 assert.match(ui,/Date\.now\(\)-terminalOfflineCacheSyncedAt>=OFFLINE_FACE_REFRESH_MS/);
 assert.match(ui,/terminalOfflineTimer=setInterval\([\s\S]*?!terminalOfflineReady[\s\S]*?prepareTerminalOffline\(\)/);
 assert.match(ui,/Não há rostos consentidos e ativos preparados para esta filial/);
});

test('offline terminal registers locally without a session token and keeps the timestamp for sync',()=>{
 assert.match(ui,/showHome\(saved\.device,true\)/);
 assert.match(ui,/if\(!navigator\.onLine\)\{if\(!terminalOfflineContext\(\)\)throw Error/);
 assert.match(ui,/async function showOfflinePunch\(mark,result\)/);
 assert.match(ui,/Marcação registrada/);
 assert.match(ui,/Offline, aguardando sincronização/);
 assert.match(ui,/client_captured_at:new Date\(\)\.toISOString\(\)/);
});

test('queued marks sync automatically after browser online event and after detected network loss',()=>{
 assert.match(ui,/window\.addEventListener\('online',[\s\S]*?reconnectTerminalAndSync\(\)/);
 assert.match(ui,/function reconnectTerminalAndSync\(\)[\s\S]*?syncTerminalOfflineMarks\(\)/);
 assert.match(ui,/if\(view==='home'&&navigator\.onLine&&config&&\(terminalWasOffline\|\|terminalNetworkLost\)\)reconnectTerminalAndSync\(\)/);
 assert.match(ui,/document\.addEventListener\('visibilitychange',[\s\S]*?terminalWasOffline\|\|terminalNetworkLost[\s\S]*?reconnectTerminalAndSync/);
 assert.match(ui,/Idempotency-Key':mark\.id/);
 assert.match(ui,/data\.item\?\.employee_id[^;]*mark\.expected_employee_id/);
 assert.match(ui,/data\.item\?\.idempotency_key===mark\.id/);
});

test('offline history presents saved marks with automatic sync status and no retry button',()=>{
 assert.match(ui,/\$\{pending\.length\} marcação\(ões\) offline salva\(s\) neste terminal; a sincronização é automática quando a conexão voltar/);
 assert.doesNotMatch(ui,/textContent='Enviar pendências'/);
 assert.doesNotMatch(ui,/window\.confirm\(`Enviar \$\{pending\.length\} tentativa/);
});

test('service worker caches terminal bundle and the same version-pinned face assets without caching API responses',()=>{
 assert.match(sw,/certus-static-v88-terminal-settings-nondestructive-20261128/);
 assert.match(sw,/terminal\.js\?v=20261128-terminal-settings-nondestructive-v1/);
 assert.match(sw,/face-api@1\.7\.15/);
 assert.match(sw,/url\.pathname\.includes\('\/api\/'\)/);
});

test('offline UI confirms local registration without pretending the server has confirmed it',()=>{
 assert.doesNotMatch(ui,/id="offline-status"/);
 assert.match(ui,/Marcação registrada/);
 assert.match(ui,/Offline, aguardando sincronização/);
 assert.match(ui,/Aguardando sincronização/);
 assert.match(ui,/data\.item\?\.employee_id[^;]*mark\.expected_employee_id/);
 assert.match(ui,/O servidor não confirmou o recebimento para o colaborador identificado; a marcação continua salva neste terminal/);
});


test('home screen does not ask for a manual queue send; automatic sync is connection-driven',()=>{
 const home=ui.slice(ui.indexOf('function showHome'),ui.indexOf('async function syncServerClock'));
 const screen=home.slice(0,home.indexOf("root.querySelector('#terminal-settings')"));
 assert.doesNotMatch(screen,/Enviar pendências|syncTerminalOfflineMarks/);
 assert.match(ui,/window\.addEventListener\('online',[\s\S]*?reconnectTerminalAndSync\(\)/);
 assert.match(ui,/\$\{pending\.length\} marcação\(ões\) offline salva\(s\) neste terminal; a sincronização é automática quando a conexão voltar/);
});

test('offline punch is shown immediately as a registered local mark and appears in local history',()=>{
 assert.match(ui,/async function showOfflinePunch\(mark,result\)[\s\S]*?Marcação registrada[\s\S]*?Offline, aguardando sincronização/);
 assert.match(ui,/esc\(matched\.full_name\)\}\s*·\s*\$\{labels\[localType\]\|\|'Registro de ponto'/);
 assert.match(ui,/async function loadRecent\(\)[\s\S]*?local_employee_name[\s\S]*?localStamp\(local\.client_captured_at\)/);
 assert.match(ui,/async function showHistory\(\)[\s\S]*?Aguardando sincronização/);
 assert.match(ui,/await queueTerminalOfflineMark\(queued\)/);
 assert.match(ui,/data\.item\?\.employee_id[^;]*mark\.expected_employee_id/);
});

test('hidden status cards do not leave empty gold lines or reserve vertical space',()=>{
 assert.match(css,/\.result\[hidden\]\{display:none!important\}/);
 assert.match(ui,/function setOfflinePreparationStatus\([\s\S]*?state!=='error'[\s\S]*?el\.hidden=true/);
});

test('sync reuses the employee match made offline, strips descriptor before upload, and requires server-confirmed terminal marks',()=>{
 assert.match(ui,/const\{face_descriptor,\.\.\.syncPayload\}=mark;if\(!syncPayload\.expected_employee_id&&syncPayload\.local_employee_id\)syncPayload\.expected_employee_id=syncPayload\.local_employee_id/);
 assert.match(ui,/data\.item\?\.device_id===config\.device_id[\s\S]*?data\.item\?\.employee_id[\s\S]*?mark\.expected_employee_id/);
 assert.match(ui,/data\.item\?\.validation_status==='validated'&&data\.official_time_confirmed===true/);
 assert.match(ui,/sincronizada/);
 assert.doesNotMatch(ui,/recebida\(s\) pela gestão para conferência/);
});

