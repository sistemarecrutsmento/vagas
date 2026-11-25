'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('certus/terminal.js','utf8');
test('shared terminal script parses as JavaScript',()=>{assert.doesNotThrow(()=>new vm.Script(script))});
test('face models preload after the kiosk is ready and are reused',()=>{
 assert.match(script,/prepareTerminalOffline\(\)\.then\(ready/);
 assert.match(script,/loadFaceApi\(\)\.catch\(\(\)=>\{\}\)/);
 assert.match(script,/function reconnectTerminalAndSync\(\)[\s\S]*?syncTerminalOfflineMarks\(\)/);
 assert.match(script,/window\.addEventListener\('online',[\s\S]*?reconnectTerminalAndSync\(\)/);
 assert.match(script,/if\(facePromise\)return facePromise/);
 assert.match(script,/faceModelsReady=true/);
});
test('camera startup and model loading overlap, and offline capture can proceed without a live session',()=>{
 assert.match(script,/const cameraPromise=navigator\.mediaDevices\.getUserMedia/);
 assert.match(script,/const modelPromise=loadFaceApi\(\)/);
 assert.match(script,/Promise\.all\(\[camera\(\),currentLocation\(\)\]\)/);
 assert.match(script,/if\(!navigator\.onLine\)\{if\(!terminalOfflineContext\(\)\)throw Error/);
 assert.match(script,/if\(!matched\)throw Error\('Não foi possível identificar o colaborador com segurança/);
 assert.match(script,/expected_employee_id:matched\.employee_id/);
 assert.match(script,/if\(!templates\.length\)\{[\s\S]*?throw Error/);
 assert.match(script,/terminalOfflineReady=!!terminalFaceCache\?\.templates\?\.length/);
 assert.match(script,/OFFLINE_FACE_REFRESH_MS=300000/);
 assert.match(script,/Date\.now\(\)-terminalOfflineCacheSyncedAt>=OFFLINE_FACE_REFRESH_MS/);
 const prep=script.slice(script.indexOf('async function prepareTerminalOffline'),script.indexOf('function offlineSyncFailureMessage'));
 assert.ok(prep.indexOf('await saveTerminalOfflineFaceCache')<prep.indexOf('await loadFaceApi'));
 assert.match(script,/setOfflinePreparationStatus/);
 assert.match(script,/objectStore\(OFFLINE_TEMPLATES\)\.put\(\{id:config\.device_id,iv:\[\.\.\.iv\],cipher\},config\.device_id\)/);
 assert.ok(script.indexOf('if(!matched)throw Error')<script.indexOf('await queueTerminalOfflineMark(queued)'));
});
test('expired kiosk session renews safely and retry reuses the idempotency key',()=>{
 assert.match(script,/tokenExpiresAt=Date\.now\(\)\+\(Number\(d\.expires_in\)\|\|14400\)\*1000/);
 assert.match(script,/async function ensureSession\(\)/);
 assert.match(script,/if\(r\.status===401\)\{if\(!await connect\(true\)\)/);
 assert.match(script,/id:crypto\.randomUUID\(\),auto_sequence:true,face_descriptor:descriptor,location,client_captured_at:new Date\(\)\.toISOString\(\)/);
 assert.match(script,/'Idempotency-Key':mark\.id/);
});
test('recognition threshold and server-authoritative shared clock flow are not changed by UI optimization',()=>{
 assert.match(script,/if\(x\.detection\.score<\.7\)/);
 assert.match(script,/let previous=null,stableFrames=0;[\s\S]*?stableFrames<2[\s\S]*?finish\(resolve,descriptor\)/);
 assert.match(script,/video\.readyState<2\|\|!video\.videoWidth\|\|!video\.videoHeight/);
 assert.match(script,/let previous=null,stableFrames=0;[\s\S]*?stableFrames<2[\s\S]*?finish\(resolve,descriptor\)/);
 assert.match(script,/video\.readyState<2\|\|!video\.videoWidth\|\|!video\.videoHeight/);
 assert.match(script,/API\+'\/api\/terminal\/clock-events'/);
 assert.match(script,/API\+'\/api\/terminal\/session'/);
});

test('local offline storage is not reported as a successful server registration',()=>{
 assert.doesNotMatch(script,/id=\"offline-status\"/);
 assert.match(script,/Marcação registrada/);
 assert.match(script,/esc\(matched\.full_name\)/);
 assert.doesNotMatch(script,/esc\(matched\?\.full_name\|\|'Colaborador'\)/);
 assert.match(script,/data\.requires_review===true&&data\.official_time_confirmed===false/);
 assert.match(script,/if\(!pending&&!alreadyRecorded\)throw/);
 assert.match(script,/error\.httpStatus=response\.status/);
 assert.match(script,/function offlineSyncFailureMessage\(error\)/);
});

test('queued punches sync automatically after real reconnection without manual confirmation',()=>{
 const home=script.slice(script.indexOf('function showHome'),script.indexOf('async function syncServerClock'));
 assert.doesNotMatch(home,/syncTerminalOfflineMarks|Enviar pendências|offline-status/);
 assert.match(script,/window\.addEventListener\('online',[\s\S]*?reconnectTerminalAndSync\(\)/);
 assert.match(script,/terminalOfflineTimer=setInterval\([\s\S]*?terminalWasOffline\|\|terminalNetworkLost\)[\s\S]*?reconnectTerminalAndSync/);
 assert.match(script,/document\.addEventListener\('visibilitychange',[\s\S]*?terminalWasOffline\|\|terminalNetworkLost[\s\S]*?reconnectTerminalAndSync/);
 assert.doesNotMatch(script,/window\.confirm\(`Enviar \$\{pending\.length\} tentativa/);
});
