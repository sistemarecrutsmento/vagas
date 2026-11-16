'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('certus/terminal.js','utf8');
test('shared terminal script parses as JavaScript',()=>{assert.doesNotThrow(()=>new vm.Script(script))});
test('face models preload after the kiosk is ready and are reused',()=>{
 assert.match(script,/setTimeout\(\(\)=>\{if\(view==='home'\)loadFaceApi\(\)\.catch\(\(\)=>\{\}\)\},0\)/);
 assert.match(script,/if\(facePromise\)return facePromise/);
 assert.match(script,/faceModelsReady=true/);
});
test('camera startup and model loading overlap; location and session do not block camera startup',()=>{
 assert.match(script,/const cameraPromise=navigator\.mediaDevices\.getUserMedia/);
 assert.match(script,/const modelPromise=loadFaceApi\(\)/);
 assert.match(script,/const descriptorTask=camera\(\),locationTask=currentLocation\(\),sessionTask=ensureSession\(\)/);
 assert.match(script,/Promise\.all\(\[descriptorTask,locationTask,sessionTask\]\)/);
});
test('expired kiosk session renews safely and retry reuses the idempotency key',()=>{
 assert.match(script,/tokenExpiresAt=Date\.now\(\)\+\(Number\(d\.expires_in\)\|\|14400\)\*1000/);
 assert.match(script,/async function ensureSession\(\)/);
 assert.match(script,/if\(r\.status===401\)\{if\(!await connect\(true\)\)/);
 assert.match(script,/const payload=JSON\.stringify\(\{auto_sequence:true,face_descriptor:descriptor,location\}\),idempotencyKey=crypto\.randomUUID\(\)/);
 assert.match(script,/'Idempotency-Key':idempotencyKey/);
});
test('recognition threshold and server-authoritative shared clock flow are not changed by UI optimization',()=>{
 assert.match(script,/if\(x\.detection\.score<\.7\)/);
 assert.match(script,/API\+'\/api\/terminal\/clock-events'/);
 assert.match(script,/API\+'\/api\/terminal\/session'/);
});
