'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const kiosk=fs.readFileSync('certus/terminal.js','utf8');
const employee=fs.readFileSync('certus/operacao.js','utf8');
const workerStart=employee.indexOf('const name=user.employee_name');
const workerEnd=employee.indexOf("if(v==='password')",workerStart);
const worker=employee.slice(workerStart,workerEnd);

test('shared terminal keeps offline implementation out of the visible portal',()=>{
 assert.doesNotMatch(kiosk,/id=\"offline-status\"|Terminal preparado automaticamente|13 MB|pendente de análise da gestão|horário do aparelho[^\n]{0,30}confirmado|Este terminal ainda não terminou o preparo offline/);
 assert.doesNotMatch(kiosk,/result\.textContent='[^']*(?:offline|fila|sincron|conexão voltou|análise da gestão)/i);
 assert.match(kiosk,/async function prepareTerminalOffline\(\)/);
 assert.match(kiosk,/async function syncTerminalOfflineMarks\(\)/);
});

test('employee portal keeps offline capture internal and does not expose preparation, queue, or timestamp details',()=>{
 assert.doesNotMatch(worker,/offlineQueueNotice|offline-clock-notice|O Certus prepara automaticamente|13 MB de recursos|Marcação salva neste aparelho|O Certus tentará enviar|Sem conexão: os registros estão salvos localmente|Aguardando conexão|Aguardando análise da gestão|horário do aparelho não está confirmado/);
 assert.doesNotMatch(employee,/O Certus prepara automaticamente este aparelho|13 MB de recursos do reconhecimento facial/);
 assert.doesNotMatch(employee,/if\(offlineQueued\)\{await load\('worker'\);message\('Marcação salva neste aparelho/);
 assert.match(employee,/async function prepareOfflineClock\(\)/);
 assert.match(employee,/async function syncOfflineClocks/);
 assert.match(employee,/queueOfflineMark\(await captureMark\(\)\)/);
 assert.match(employee,/if\(offlineQueued\).*?message\('Marcação registrada com sucesso\.'/);
});
