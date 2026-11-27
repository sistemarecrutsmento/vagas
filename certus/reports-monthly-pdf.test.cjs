const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'operacao.js'), 'utf8');

test('date-range report can filter clock events to a selected employee', () => {
  assert.match(source, /<form id="report-filter"[\s\S]*?<label>Colaborador<select name="employee_id">/);
  assert.match(source, /employeeId=f\.elements\.employee_id\.value/);
  assert.match(source, /!employeeId\|\|x\.employee_id===employeeId/);
  assert.match(source, /employeeName:selectedEmployee\?\.full_name/);
});

test('monthly PDF selector includes all staff or one employee and defaults to current month', () => {
  assert.match(source, /id="team-timesheet-pdf-form"[\s\S]*?<label>Colaborador<select name="employee_id">/);
  assert.match(source, /defaultReportYear=currentReportYear,defaultReportMonth=currentReportMonth/);
  assert.match(source, /mês atual é parcial/i);
  assert.match(source, /started=selected<cy\|\|selected===cy&&n<=cm/);
});

test('monthly PDF request passes employee filter and reports open month as partial', () => {
  assert.match(source, /employee_id:employeeId/);
  assert.match(source, /monthly-timesheets\.pdf\?\$\{params\}/);
  assert.match(source, /PDF mensal do colaborador gerado/);
  assert.match(source, /PDF mensal da equipe gerado; se o mês estiver em andamento/);
});
