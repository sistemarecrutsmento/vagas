'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('certus/terminal.js','utf8');
test('shared terminal script parses as JavaScript',()=>{assert.doesNotThrow(()=>new vm.Script(script))});
test('shared terminal captures a bounded burst and asks the API server to verify PAD and identity',()=>{
 assert.match(script,/async function captureFrames\(/);
 assert.match(script,/for\(let i=0;i<3;i\+\+\)/);
 assert.match(script,/toDataURL\('image\/jpeg',0\.82\)/);
 assert.match(script,/api\/terminal\/face-verification\/challenge/);
 assert.match(script,/api\/terminal\/face-verification'/);
 assert.match(script,/verification_id:verification\.verification_id/);
 assert.doesNotMatch(script,/loadFaceApi|faceapi|withFaceDescriptor|face_descriptor/);
});
test('camera frames are sent for enrollment; descriptors are no longer created in the browser',()=>{
 assert.match(script,/consent:true,frames/);
 assert.match(script,/async function verifyFaceForClock/);
 assert.match(script,/cache:'no-store'/);
});
test('expired kiosk session renews safely and retry reuses the idempotency key',()=>{
 assert.match(script,/tokenExpiresAt=Date\.now\(\)\+\(Number\(d\.expires_in\)\|\|14400\)\*1000/);
 assert.match(script,/async function ensureSession\(\)/);
 assert.match(script,/if\(r\.status===401\)\{if\(!await connect\(true\)\)/);
 assert.match(script,/const payload=JSON\.stringify\(\{auto_sequence:true,verification_id:verification\.verification_id,location\}\),idempotencyKey=crypto\.randomUUID\(\)/);
 assert.match(script,/'Idempotency-Key':idempotencyKey/);
});
test('server-authoritative terminal flow and authenticated session are preserved',()=>{
 assert.match(script,/API\+'\/api\/terminal\/clock-events'/);
 assert.match(script,/API\+'\/api\/terminal\/session'/);
});
