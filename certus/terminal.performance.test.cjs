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
 assert.match(script,/syncTerminalOfflineMarks\(\)\.catch/);
 assert.match(script,/if\(facePromise\)return facePromise/);
 assert.match(script,/faceModelsReady=true/);
});
test('camera startup and model loading overlap, and offline capture can proceed without a live session',()=>{
 assert.match(script,/const cameraPromise=navigator\.mediaDevices\.getUserMedia/);
 assert.match(script,/const modelPromise=loadFaceApi\(\)/);
 assert.match(script,/Promise\.all\(\[camera\(\),currentLocation\(\)\]\)/);
 assert.match(script,/if\(!navigator\.onLine\)\{if\(!terminalOfflineContext\(\)\)throw Error/);
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
 assert.match(script,/API\+'\/api\/terminal\/clock-events'/);
 assert.match(script,/API\+'\/api\/terminal\/session'/);
});
