'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const ui = read('certus/operacao.js');
const sw = read('certus/service-worker.js');
const pwa = read('certus/pwa.js');
const html = read('certus/index.html');
const css = read('certus/operacao.css');

test('offline queue stores only AES-GCM ciphertext and uses a non-extractable per-origin key', () => {
  assert.match(ui, /const OFFLINE_DB='certus-offline-v1',OFFLINE_STORE='queue',OFFLINE_KEY='crypto-key'/);
  assert.match(ui, /generateKey\(\{name:'AES-GCM',length:256\},false,\['encrypt','decrypt'\]\)/);
  assert.match(ui, /crypto\.subtle\.encrypt\(\{name:'AES-GCM',iv\},key,plain\)/);
  assert.match(ui, /crypto\.subtle\.decrypt\(\{name:'AES-GCM',iv:new Uint8Array\(row\.iv\)\},key,row\.cipher\)/);
  assert.match(ui, /queueOfflineMark\(await captureMark\(\)\)/);
});

test('offline resources and branch location are prepared automatically after online face verification', () => {
  assert.match(ui, /face-api@1\.7\.15\/dist\/face-api\.js/);
  assert.match(ui, /async function faceStatus\(\)[\s\S]*?certus_face_profile:[\s\S]*?offline_cached:true/);
  assert.match(ui, /script\.crossOrigin='anonymous'/);
  assert.match(ui, /face-api@1\.7\.15\/model/);
  assert.match(ui, /async function prepareOfflineClock\(\)[\s\S]*?api\('\/api\/employee\/work-location'\)[\s\S]*?loadFaceApi\(\)/);
  assert.match(ui, /if\(profile\.registered\)prepareOfflineClock\(\)\.catch/);
  assert.doesNotMatch(ui, /prepare-offline-clock|Preparar marcação offline/);
  assert.doesNotMatch(ui, /O Certus prepara automaticamente este aparelho|13 MB de recursos/i);
  assert.match(ui, /workplace\.latitude==null\|\|workplace\.longitude==null\|\|!workplace\.branch_id/);
  assert.match(ui, /sessionStorage\.setItem\('certus_workplace'/);
  assert.match(ui, /catch\(e\)\{const cached=JSON\.parse\(sessionStorage\.getItem\('certus_workplace'/);
});

test('failed network during punch preserves a local mark instead of losing the user action', () => {
  assert.match(ui, /const captureMark=async\(\)=>\{if\(capturedMark\)return capturedMark/);
  assert.match(ui, /'Idempotency-Key':mark\.id/);
  assert.match(ui, /await queueOfflineMark\(await captureMark\(\)\)/);
  assert.match(ui, /const saveOffline=async\(\)=>\{await queueOfflineMark/);
  assert.match(ui, /e\?\.name==='TypeError'\|\|e\?\.name==='AbortError'\|\|!navigator\.onLine\)\{await saveOffline\(\);return\}/);
  assert.match(ui, /if\(offlineQueued\).*?message\('Marcação registrada com sucesso\.'/);
});

test('sync is ordered and idempotent, and local data is deleted only after explicit pending-review response', () => {
  const start = ui.indexOf('async function syncOfflineClocks');
  const end = ui.indexOf('\nfunction scheduleForPortal', start);
  assert.ok(start >= 0 && end > start, 'offline sync implementation exists');
  const sync = ui.slice(start, end);
  assert.match(sync, /sort\(\(a,b\)=>Date\.parse\(a\.client_captured_at\)-Date\.parse\(b\.client_captured_at\)\)/);
  assert.match(sync, /'Idempotency-Key':x\.id/);
  assert.match(sync, /alreadyRecorded=item\?\.validation_status==='validated'/);
  assert.match(sync, /if\(!pendingReview&&!alreadyRecorded\)throw/);
  assert.ok(sync.indexOf('response.requires_review!==true||response.official_time_confirmed!==false') < sync.indexOf('await deleteOfflineMark(x.id)'), 'delete only after server confirms pending review without claiming official time');
  assert.match(sync, /catch\(e\)\{error=String\(e\?\.message/);
  assert.match(sync, /Envio interrompido/);
});

test('employee UI does not expose offline preparation, local-queue or review implementation details', () => {
  assert.doesNotMatch(ui, /offlineQueueNotice|offline-clock-notice|marcação\(ões\) ainda neste aparelho/);
  assert.doesNotMatch(ui, /O Certus tentará enviar|Sem conexão: os registros estão salvos localmente|horário do aparelho não está confirmado|Aguardando conexão|Aguardando análise da gestão/);
  assert.doesNotMatch(ui, /O Certus prepara automaticamente este aparelho|13 MB de recursos/);
  assert.doesNotMatch(ui, /offline-sync-now|Tentar enviar agora/);
  assert.match(ui, /data-offline-decision="approved"/);
});

test('service worker registers on HTTPS and caches only the pinned public face assets, never API responses', () => {
  assert.match(pwa, /navigator\.serviceWorker\.register\('\.\/service-worker\.js'\)/);
  assert.match(sw, /const VERSION='certus-static-v50-private-offline-ui-20261123'/);
  assert.match(sw, /certus-face-assets-v1\.7\.15/);
  assert.match(sw, /if\(isFaceAsset\(url\)\)/);
  assert.match(sw, /url\.pathname\.includes\('\/api\/'\)/);
  assert.match(sw, /face-api@1\.7\.15/);
  assert.match(html, /operacao\.js\?v=offline-auto-v5-20261122/);
});

test('offline queue retries when connectivity returns and when the active app resumes', () => {
  assert.match(ui, /addEventListener\('online',[\s\S]*?syncOfflineClocks/);
  assert.match(ui, /addEventListener\('visibilitychange',[\s\S]*?syncOfflineClocks/);
  assert.match(ui, /setInterval\(\(\)=>\{if\(navigator\.onLine&&document\.visibilityState==='visible'\)syncOfflineClocks/);
});

test('employee interface contains no banner exposing offline queue mechanics', () => {
  assert.doesNotMatch(ui, /offline-clock-notice|offlineQueueNotice/);
  assert.match(ui, /role="status"/);
});
