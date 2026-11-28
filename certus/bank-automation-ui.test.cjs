'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'operacao.js'),'utf8');
const shell=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
test('Gestão exposes per-company opt-in automation settings and protected authorized recipients',()=>{
 assert.match(source,/api\('\/api\/bank-hours\/automation-settings'\)/);
 assert.match(source,/automatic_cycle_closure_enabled/);
 assert.match(source,/alerts_enabled/);
 assert.match(source,/automation\.can_manage\?'':'disabled'/);
 assert.match(source,/company_admin/);
 assert.match(source,/recipient_roles/);
 assert.match(source,/Cada colaborador, somente o próprio ciclo/);
 assert.match(source,/Endereços repetidos são deduplicados/);
 assert.match(source,/bank-hours\/automation-settings/);
 assert.match(source,/prazos únicos entre 1 e 90 dias/);
});
test('settings form includes an audit reason and does not enable alerts or closure by default',()=>{
 assert.match(source,/name="audit_note" minlength="8" maxlength="500" required/);
 assert.match(source,/alertas não poderão ser entregues/);
 assert.match(source,/As opções começam desligadas para cada empresa/);
 assert.match(shell,/operacao\.js\?v=bank-hours-automation-settings-20261128-v1/);
 assert.match(sw,/certus-static-v89-bank-automation-settings-20261128/);
 assert.match(sw,/operacao\.js\?v=bank-hours-automation-settings-20261128-v1/);
});
