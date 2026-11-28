'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('certus/operacao.js','utf8');
const css=fs.readFileSync('certus/operacao.css','utf8');

test('offline marks show their validation state while preserving # and manual * markers',()=>{
 assert.match(ui,/function isOfflineMark\(m\)/);
 assert.match(ui,/function timesheetMarkSymbol\(m\)/);
 assert.match(ui,/function timesheetMarkStatus\(m\)/);
 assert.match(ui,/timesheetMarkSymbol\(m\)/);
 assert.match(ui,/Horário não confirmado — pendente de conferência/);
 assert.match(ui,/Offline validada — horário confirmado/);
 assert.match(ui,/# Marcação offline/);
 assert.doesNotMatch(ui,/Marcas reconhecidas no terminal bloqueado são confirmadas automaticamente/);
 assert.match(css,/timesheet-mark-symbol\{font-size:\.72em;[^}]*vertical-align:super/);
 assert.match(css,/timesheet-mark-status\.pending/);
 assert.match(css,/timesheet-mark-status\.validated/);
});

test('employee and management views identify pending offline marks; manager totals stay unknown for pending marks',()=>{
 const rows=ui.slice(ui.indexOf('function timesheetRows'),ui.indexOf('function timesheetDocument'));
 const at=ui.indexOf('const dayRows=visibleDays.map');
 const end=ui.indexOf('return `<section class="records-page">',at);
 const management=ui.slice(at,end);
 assert.match(rows,/timesheetMarkStatus\(m\)/);
 assert.match(management,/timesheetMarkStatus\(m\)/);
 assert.match(management,/hasPendingOfflineMark\?null:visibleDays\.reduce/);
});
