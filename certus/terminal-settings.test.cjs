'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ui = fs.readFileSync('certus/terminal.js', 'utf8');
const page = fs.readFileSync('certus/terminal.html', 'utf8');
const sw = fs.readFileSync('certus/service-worker.js', 'utf8');
const setup = ui.slice(ui.indexOf('function showSetup'), ui.indexOf("root.querySelector('#setup-form')"));
const settings = ui.slice(ui.indexOf('function showSettings'), ui.indexOf('async function showFaceEnrollment'));

test('company identifier starts blank and only displays an existing configured value', () => {
  assert.match(setup, /name="company_slug" value="\$\{esc\(config\?\.company_slug\|\|''\)\}"/);
  assert.doesNotMatch(setup, /company_slug"[^>]*value="vagasio/i);
});

test('terminal settings explain admin-managed revocation without changing local config or credentials', () => {
  assert.match(settings, /Portal Gestão[\s\S]*Terminais e dispositivos/);
  assert.match(settings, /Esta tela não revoga o vínculo nem apaga a chave ou as configurações locais do terminal/);
  assert.match(settings, /id="disconnect-help"/);
  assert.match(settings, /querySelector\('#disconnect-help'\)\.onclick=\(\)=>\{d\.querySelector\('#disconnect-guidance'\)\.hidden=false\}/);
  assert.doesNotMatch(settings, /localStorage|forget\(|removeItem|fetch\(|disconnect-code|Confirmar desconexão/);
  assert.doesNotMatch(ui, /function forget\(|function confirmDisconnectWithCode\(/);
});

test('service worker precaches the bumped terminal script and HTML points to the same asset version', () => {
  const asset = 'terminal.js?v=20261128-terminal-settings-nondestructive-v1';
  assert.ok(page.includes(asset));
  assert.ok(sw.includes(`'./${asset}'`));
  assert.match(sw, /certus-static-v88-terminal-settings-nondestructive-20261128/);
});
