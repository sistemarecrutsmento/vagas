'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const management = fs.readFileSync('certus/operacao.js', 'utf8');
const terminal = fs.readFileSync('certus/terminal.js', 'utf8');
const terminalHtml = fs.readFileSync('certus/terminal.html', 'utf8');
const serviceWorker = fs.readFileSync('certus/service-worker.js', 'utf8');

function functionLine(source, name) {
  const line = source.split('\n').find(value => value.startsWith(`function ${name}(`));
  assert.ok(line, `expected function ${name} to exist`);
  return line;
}

test('pending offline marks remain visibly unconfirmed and validated marks remain distinct', () => {
  const context = {};
  vm.runInNewContext(`${functionLine(management, 'isOfflineMark')}\n${functionLine(management, 'timesheetMarkStatus')}\nglobalThis.renderStatus=timesheetMarkStatus;`, context);
  const pending = context.renderStatus({metadata: {capture: 'shared_terminal_offline'}, validationStatus: 'pending'});
  const validated = context.renderStatus({metadata: {capture: 'authenticated_employee_offline'}, validationStatus: 'validated'});
  assert.match(pending, /Horário não confirmado — pendente de conferência/);
  assert.match(pending, /timesheet-mark-status pending/);
  assert.match(validated, /Offline validada — horário confirmado/);
  assert.match(validated, /timesheet-mark-status validated/);
  assert.match(management, /timesheetMarkStatus\(m\)/, 'timesheet rows must render the status next to the mark');
  assert.match(management, /Marcas offline pendentes são horários não confirmados/);
});

test('shared-terminal settings are nondestructive and direct revocation to the Management portal', () => {
  const start = terminal.indexOf('function showSettings');
  const end = terminal.indexOf('function loadFaceApi', start);
  assert.ok(start >= 0 && end > start, 'settings function should be present');
  const settings = terminal.slice(start, end);
  assert.match(settings, /Portal Gestão[\s\S]*Terminais e dispositivos/);
  assert.match(settings, /Esta tela não revoga o vínculo nem apaga a chave ou as configurações locais do terminal/);
  assert.match(settings, /id="disconnect-help"/);
  assert.match(settings, /querySelector\('#disconnect-help'\)\.onclick/);
  assert.doesNotMatch(settings, /localStorage|forget\(|removeItem|fetch\(|disconnect-code|Confirmar desconexão/);
  assert.doesNotMatch(terminal, /function forget\(|function confirmDisconnectWithCode\(|localStorage\.removeItem/);
  const asset = 'terminal.js?v=20261128-terminal-settings-nondestructive-v1';
  assert.ok(terminalHtml.includes(asset), 'terminal page should load the nondestructive settings build');
  assert.ok(serviceWorker.includes(`'./${asset}'`), 'service worker should precache the same terminal build');
  assert.match(serviceWorker, /certus-static-v88-terminal-settings-nondestructive-20261128/);
});
