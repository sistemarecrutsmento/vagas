'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(__dirname, 'operacao.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'operacao.css'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

test('management timesheet renders every daily-balance column cell in the right place', () => {
  const table = ui.match(/<table class="records-calendar"><thead><tr>(.*?)<\/tr><\/thead>/s);
  assert.ok(table, 'records calendar header exists');
  const headers = [...table[1].matchAll(/<th>(.*?)<\/th>/g)].map(([, text]) => text);
  assert.equal(headers.length, 8, 'eight table headers');
  assert.ok(headers.indexOf('Saldo diário') > headers.indexOf('Jornada'));
  assert.ok(headers.indexOf('Saldo diário') < headers.indexOf('Marcações'));

  const row = ui.match(/const dayRows=visibleDays\.map\(d=>\{[\s\S]*?return `(\<tr class="records-day[\s\S]*?<\/tr>)`\}\)\.join\(''\);/);
  assert.ok(row, 'daily row template exists');
  const cells = [...row[1].matchAll(/<td>/g)].length;
  assert.equal(cells, headers.length, 'each daily row has one cell per header');
  assert.match(row[1], /d\.nightWork&&Number\.isInteger\(d\.nightWork\.actualNightMinutes\)/,
    'the work-night column has its own cell and does not shift the balance');
  assert.match(row[1], /reportSigned\(d\.dailyBalanceMinutes\)/,
    'the daily balance value is rendered in the row');
});

test('narrow management timesheet places day details below the horizontally scrollable table', () => {
  assert.match(ui, /tabindex="0" role="region" aria-label="Espelho diário;/,
    'table is keyboard-focusable and announces horizontal scrolling');
  assert.match(css, /@container records \(max-width:780px\)\{[\s\S]*?\.records-layout\{[^}]*grid-template-columns:minmax\(0,1fr\)/,
    'narrow content uses a single column');
  assert.match(css, /@container records \(max-width:780px\)\{[\s\S]*?\.records-day-panel\{position:relative;/,
    'narrow content keeps the detail panel in document flow');
  assert.match(css, /records-day-dsr\{background:#f8f0f3\}/, 'DSR pink styling is preserved');
  assert.match(css, /records-day\.selected:not\(\.records-day-abono\):not\(\.records-day-abono-hours\)[\s\S]*?background:#e7f3e9/,
    'selected non-abono day remains green');
  assert.match(css, /records-day-abono-hours\{background:#fff4c2\}/, 'abono yellow styling is preserved');
});


test('employee and management timesheets use a concise offline # marker',()=>{
  assert.match(ui,/timesheetMarkSymbol\(m\)/);
  assert.match(ui,/# Marcação offline/);
  const rows=ui.slice(ui.indexOf('function timesheetRows'),ui.indexOf('function timesheetDocument'));
  assert.doesNotMatch(rows,/Offline — horário não confirmado/);
  const at=ui.indexOf('const dayRows=visibleDays.map');
  const end=ui.indexOf('return `<section class=\"records-page\">',at);
  assert.doesNotMatch(ui.slice(at,end),/Offline; horário não confirmado/);
});


test('wide management timesheet preserves readable columns when the details panel reduces available width',()=>{
 assert.match(css,/\.records-calendar\{width:100%;min-width:900px;border-collapse:collapse;table-layout:fixed;background:#fff\}/);
 assert.match(css,/\.records-table-area \.table-wrap\{max-height:65vh;overflow:auto\}/);
 assert.match(ui,/Espelho diário; deslize horizontalmente para consultar todas as colunas/);
});


test('MaxClean missing snapshots fall back to assigned workday; full-day abonos credit full net hours',()=>{
  const start=ui.indexOf('function reportFallbackSchedule(');
  const end=ui.indexOf('function reportSchedule(',start);
  assert.ok(start>=0&&end>start,'fallback helpers are present before report schedule rendering');
  const context={};
  vm.runInNewContext(`${ui.slice(start,end)};globalThis.helpers={reportFallbackSchedule,reportEffectiveDay};`,context);
  const {reportFallbackSchedule,reportEffectiveDay}=context.helpers;
  const schedule={name:'MaxClean 6x1 — 44h semanais',rules:{daily_schedule:{mon:{start:'08:00',end:'17:30',break_minutes:90},tue:{start:'08:00',end:'17:30',break_minutes:90},wed:{start:'08:00',end:'17:30',break_minutes:90},thu:{start:'08:00',end:'17:30',break_minutes:90},fri:{start:'08:00',end:'17:30',break_minutes:90},sat:{start:'08:00',end:'12:00',break_minutes:0},sun:{rest:true}},days:['mon','tue','wed','thu','fri','sat'],rest_day:'sun'}};
  const report={companyName:'MaxClean soluções em limpeza e higiene Ltda',contractualSchedule:schedule};
  assert.equal(reportFallbackSchedule(report,'2026-11-03').plannedMinutes,480);
  const a=reportEffectiveDay(report,{date:'2026-11-02',schedule:{plannedMinutes:0,journeyUnknown:true},scheduleSource:'approved_day_abono',abonoType:'day',status:'aboned',marks:[]});
  const b=reportEffectiveDay(report,{date:'2026-11-20',schedule:{plannedMinutes:0,journeyUnknown:true},scheduleSource:'approved_day_abono',abonoType:'day',status:'aboned',marks:[]});
  assert.equal(a.approvedAbonoMinutes,480);assert.equal(b.approvedAbonoMinutes,480);assert.equal(a.creditedMinutes+b.creditedMinutes,960);
  const c=reportEffectiveDay(report,{date:'2026-11-03',schedule:null,scheduleSource:'missing',status:'unknown',occurrences:[],marks:[{type:'entry',timestamp:'2026-11-03T11:12:00Z'},{type:'break_start',timestamp:'2026-11-03T15:00:00Z'},{type:'break_end',timestamp:'2026-11-03T16:30:00Z'},{type:'exit',timestamp:'2026-11-03T20:30:00Z'}]});
  assert.equal(c.plannedMinutes,480);assert.equal(c.schedule.start,'08:00');assert.equal(c.workedMinutes,undefined);
  assert.equal(reportFallbackSchedule(report,'2026-11-08').restDay,true);
});

test('management and employee report UI contains no generic Conferir batidas label',()=>{
 assert.doesNotMatch(ui,/Conferir batidas/);
});


test('PWA refreshes the management script for the corrected MaxClean report',()=>{
 assert.match(sw,/certus-static-v85-maxclean-timesheet-abono-20261127/);
 assert.match(sw,/operacao\.js\?v=maxclean-timesheet-abono-20261127/);
 assert.match(html,/operacao\.js\?v=maxclean-timesheet-abono-20261127/);
});
