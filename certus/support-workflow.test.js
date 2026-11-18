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
test('company tickets start minimized, expand on tap, and can be filtered by status with attachments',()=>{
 assert.match(company,/support-detail-\$\{esc\(t\.id\)\}.*hidden/);
 assert.match(company,/aria-expanded=\"false\"/);
 assert.match(company,/support-status-filter/);
 assert.match(company,/option value=\"waiting_customer\"/);
 assert.match(company,/uploadSupportAttachment/);
 assert.match(company,/type=\"file\"/);
 assert.match(company,/support-detail-inline/);
 assert.match(company,/other\.setAttribute\('aria-expanded','false'\)/);
});
test('support conversation layout remains responsive on the company portal', () => {
  assert.match(css, /\.support-ticket-list/);
  assert.match(css, /\.support-messages/);
  assert.match(css, /@media\(max-width:600px\).*\.support-ticket/s);
});

test('company support list starts collapsed and supports status filters and attachments',()=>{
 assert.match(company,/support-ticket-wrap/);
 assert.match(company,/id=\"support-detail-\$\{esc\(t\.id\)\}\" hidden/);
 assert.match(company,/support-status-filter/);
 assert.match(company,/option value=\"waiting_customer\"/);
 assert.match(company,/type=\"file\"/);
 assert.match(company,/uploadSupportAttachment/);
});

test('Master tickets stay collapsed by default and provide status filter and attachment controls',()=>{
 const script=inlineScript(masterHtml);
 assert.match(script,/supportStatusFilter='all'/);
 assert.match(script,/support-master-status-filter/);
 assert.match(script,/support-master-detail\" \$\{selectedSupportTicket\?'':'hidden'\}/);
 assert.match(script,/data-support-ticket/);
 assert.match(script,/type=\"file\"/);
 assert.match(script,/uploadMasterSupportAttachment/);
 assert.match(script,/data-master-support-download/);
});
