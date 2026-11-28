'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ui = fs.readFileSync(path.join(__dirname, 'order-master.js'), 'utf8');
const master = fs.readFileSync(path.join(__dirname, 'master.html'), 'utf8');
const shell = fs.readFileSync(path.join(__dirname, 'operacao.js'), 'utf8');

test('Order Master uses the deployed tenant endpoints and authenticated company session', () => {
  for (const route of [
    '/api/schedules', '/api/schedules/cycle-preview', '/api/employees/',
    '/api/schedule-assignments/pending', '/api/management/calendar-events',
    '/api/company/labor-catalog', '/api/company/labor-catalog/overrides',
    '/api/management/employee-timesheet/', '/api/management/monthly-timesheets.csv',
    '/api/management/monthly-timesheets.xlsx', '/api/management/monthly-payroll.csv',
    '/api/bank-hours/cycles'
  ]) assert.ok(ui.includes(route), `missing supported endpoint ${route}`);
  assert.match(ui, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(ui, /cycle_schedule:cycle/);
  assert.match(shell, /order-master\.html/);
});

test('12x36 preview stays read-only and describes 12 work hours plus 36 rest hours', () => {
  assert.match(ui, /work_minutes:720,rest_minutes:2160/);
  assert.match(ui, /nenhuma alteração persistida/i);
  assert.match(ui, /horário de intervalo opcional/i);
  assert.doesNotMatch(ui, /fetch\([^)]*\/api\/schedules\/cycle-preview/);
});

test('monthly closure and exports call exact supported routes and send audit reasons', () => {
  assert.match(ui, /employee-timesheet\/\$\{encodeURIComponent\(employee\)\}\/\$\{action\}/);
  assert.match(ui, /body=\{year:Number\(f\.elements\.year\.value\),month:Number\(f\.elements\.month\.value\),reason:\s*f\.elements\.reason\.value\.trim\(\)\}/);
  assert.match(ui, /monthly-timesheets\.xlsx/);
  assert.match(ui, /monthly-payroll\.csv/);
  assert.match(ui, /Sem totais financeiros/);
});

test('global bank-hours close/reopen use Master-only endpoints with confirmation and audit notes', () => {
  assert.match(master, /\/api\/master\/bank-hours\/close-due/);
  assert.ok(master.includes("'/api/master/bank-hours/cycles/'+encodeURIComponent(form.dataset.cycle)+'/reopen'"));
  assert.match(master, /company_id:h\.company\.id,reason/);
  assert.match(master, /Executar o fechamento dos ciclos vencidos elegíveis em todas as empresas/);
  assert.match(master, /A decisão e o saldo anterior serão preservados na auditoria/);
});

test('Master catalog publishing requires explicit version, future-effective date, official reference and review note', () => {
  assert.match(master, /\/api\/master\/labor-catalog/);
  assert.ok(master.includes("'/api/master/labor-catalog/versions/'+encodeURIComponent(id)+'/publish'"));
  assert.match(master, /review_reference:f\.elements\.review_reference\.value\.trim\(\)/);
  assert.match(master, /review_note:f\.elements\.review_note\.value\.trim\(\)/);
  assert.match(master, /legal_review_status “reviewed”/);
});
