'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('certus/operacao.js','utf8');
const css=fs.readFileSync('certus/operacao.css','utf8');

test('offline marks use a concise superscript # and manual marks keep the * marker',()=>{
 assert.match(ui,/function isOfflineMark\(m\)/);
 assert.match(ui,/function timesheetMarkSymbol\(m\)/);
 assert.match(ui,/timesheetMarkSymbol\(m\)/);
 assert.match(ui,/# Marcação offline/);
 assert.match(ui,/Marcas reconhecidas no terminal bloqueado são confirmadas automaticamente/);
 assert.match(css,/timesheet-mark-symbol\{font-size:\.72em;[^}]*vertical-align:super/);
});

test('timesheet rows and selected-day details do not add verbose text per offline mark',()=>{
 const rows=ui.slice(ui.indexOf('function timesheetRows'),ui.indexOf('function timesheetDocument'));
 const at=ui.indexOf('const dayRows=visibleDays.map');
 const end=ui.indexOf('return `<section class=\"records-page\">',at);
 const management=ui.slice(at,end);
 assert.match(rows,/timesheetMarkSymbol\(m\)/);
 assert.doesNotMatch(rows,/Offline — horário não confirmado/);
 assert.match(management,/timesheetMarkSymbol\(m\)/);
 assert.doesNotMatch(management,/Offline; horário não confirmado/);
});
