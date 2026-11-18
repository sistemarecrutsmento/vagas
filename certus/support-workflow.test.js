// Lightweight regression coverage for the company and Master support portals.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const dir = __dirname;
const company = fs.readFileSync(path.join(dir, 'operacao.js'), 'utf8');
const masterHtml = fs.readFileSync(path.join(dir, 'master.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'operacao.css'), 'utf8');
function inlineScript(html) {
  const match = html.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match, 'Master portal should have an inline application script');
  return match[1];
}
test('company and Master support portal scripts parse', () => {
  assert.doesNotThrow(() => new vm.Script(company));
  assert.doesNotThrow(() => new vm.Script(inlineScript(masterHtml)));
});
test('company support menu and form are limited to management roles', () => {
  assert.match(company, /support:'Chamados de suporte'/);
  assert.match(company, /k!=='support'\|\|\['company_admin','manager'\]\.includes\(user\.role\)/);
  assert.match(company, /Somente administrador titular ou gerente/);
  assert.match(company, /\/api\/support\/tickets/);
  assert.match(company, /support-close-ticket/);
});
test('Master support inbox offers public response, private note and audited updates', () => {
  assert.match(masterHtml, /Fila de chamados/);
  assert.match(masterHtml, /Nota interna \(não aparece para a empresa\)/);
  assert.match(masterHtml, /\/api\/master\/support\/tickets/);
  assert.match(masterHtml, /Justificativa para auditoria/);
  assert.match(masterHtml, /Respostas públicas ficam disponíveis no portal da empresa/);
});
test('company support shortcut is removed from primary navigation and placed in sidebar footer', () => {
  assert.match(company, /\['dashboard','employees','records','requests','users'/);
  assert.doesNotMatch(company, /\['dashboard','support','employees'/);
  assert.match(company, /data-view=\"support\" class=\"side-help\"/);
  assert.match(company, /<strong>Ajuda<\/strong><span>Abertura de chamados<\/span>/);
  assert.match(company, /\['company_admin','manager'\]\.includes\(user\.role\)/);
  assert.match(css, /side-bottom \.side-help\{display:block;width:100%/);
  assert.match(css, /@media\(max-width:760px\)\{\.side-bottom\{display:flex;flex-direction:column/);
});
test('support conversation layout remains responsive on the company portal', () => {
  assert.match(css, /\.support-ticket-list/);
  assert.match(css, /\.support-messages/);
  assert.match(css, /@media\(max-width:600px\).*\.support-ticket/s);
});
