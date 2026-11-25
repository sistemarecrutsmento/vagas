'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(__dirname, 'operacao.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'operacao.css'), 'utf8');

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

