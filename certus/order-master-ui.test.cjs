'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ui=fs.readFileSync(path.join(__dirname,'operacao.js'),'utf8');
const legacy=fs.readFileSync(path.join(__dirname,'order-master.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'operacao.css'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const serviceWorker=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');

test('former Order Master features now live in the authenticated native Certus modules',()=>{
 for(const feature of [
  'schedule-assignment-form','schedule-assignment-history','schedule-pending-list','native-cycle-preview',
  'native-calendar-form','native-calendar-history','labor-overrides-form',
  'native-timesheet-closure-form','official-monthly-export-form','bank-automation-form'
 ])assert.ok(ui.includes(feature),`native module missing ${feature}`);
 for(const route of [
  '/api/employees/${encodeURIComponent(employee)}/schedule-assignments','/api/schedule-assignments/pending',
  '/api/schedules/cycle-preview','/api/management/calendar-events','/api/management/calendar-events/${encodeURIComponent',
  '/api/company/labor-catalog','/api/company/labor-catalog/overrides',
  '/api/management/employee-timesheet/${encodeURIComponent(employee)}/closure',
  '/api/management/monthly-timesheets.csv','/api/management/monthly-timesheets.xlsx','/api/management/monthly-payroll.csv',
  '/api/bank-hours/automation-settings'
 ])assert.ok(ui.includes(route),`native UI no longer calls ${route}`);
 assert.ok(ui.includes("'monthly-timesheets.csv':'/api/management/monthly-timesheets.csv'"));
 assert.ok(ui.includes("'monthly-timesheets.xlsx':'/api/management/monthly-timesheets.xlsx'"));
 assert.ok(ui.includes("'monthly-payroll.csv':'/api/management/monthly-payroll.csv'"));
 assert.match(ui,/calendar:'Calendário e eventos'/);
 assert.match(ui,/name=\"schedule_valid_from\" type=\"date\"/);
 assert.match(ui,/name=\"schedule_audit_note\" minlength=\"8\"/);
 assert.ok(ui.includes("initialScheduleId&&(!body.schedule_valid_from||String(body.schedule_audit_note||'').trim().length<8)"));
 assert.ok(ui.includes("api('/api/employees',{method:'POST',body:JSON.stringify(body)})"));
 assert.match(ui,/created\.item\.initial_schedule_assignment\?\.status==='pending_review'/);
 assert.match(ui,/data-open-employee-schedules/);
 assert.match(ui,/data-open-employee-schedules/);
 assert.doesNotMatch(ui,/nav-order-master|href="\.\/order-master\.html"/);
 assert.doesNotMatch(legacy,/order-master\.(?:js|css)/);
 assert.match(legacy,/http-equiv="refresh"/i);
 assert.match(legacy,/location\.replace\('\.\/index\.html\?view=schedules'\)/);
});

test('12x36 preview remains read-only and delegates the cycle projection to the API',()=>{
 assert.match(ui,/cycle_schedule:cycle,from,to/);
 assert.match(ui,/r\.item\.notice/);
 assert.match(ui,/Nenhuma jornada ou marcação é alterada pela prévia/);
});

test('native closure and exports retain audit reasons and official API routes',()=>{
 assert.match(ui,/employee-timesheet\/\$\{encodeURIComponent\(employee\)\}\/\$\{action\}/);
 assert.match(ui,/body=\{year:Number\(closureForm\.elements\.year\.value\),month:Number\(closureForm\.elements\.month\.value\),reason\}/);
 assert.match(ui,/method:'POST',body:JSON\.stringify\(body\)/);
 assert.match(ui,/monthly-timesheets\.xlsx/);
 assert.match(ui,/monthly-payroll\.csv/);
});

test('employee actions stay readable in the responsive roster table',()=>{assert.match(ui,/employee-action-cell/);assert.match(ui,/employee-actions/);assert.match(css,/\.employee-actions\{display:flex;flex-wrap:wrap/);assert.match(css,/employee-action-cell \.small\{width:auto;min-width:max-content/)});

test('employee action style is cache-busted in the Portal and PWA shell',()=>{assert.match(index,/operacao\.css\?v=offline-mark-symbol-20261125&employee-actions=nowrap-v1/);assert.match(serviceWorker,/operacao\.css\?v=offline-mark-symbol-20261125&employee-actions=nowrap-v1/)});
