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
  assert.match(company, /help-close-ticket/);
});
test('Master support inbox offers public response, private note and audited updates', () => {
  assert.match(masterHtml, /Fila de chamados/);
  assert.match(masterHtml, /Nota interna \(não aparece para a empresa\)/);
  assert.match(masterHtml, /\/api\/master\/support\/tickets/);
  assert.match(masterHtml, /Justificativa para auditoria/);
  assert.match(masterHtml, /Respostas públicas ficam disponíveis no portal da empresa/);
});
test('company support shortcut is removed from primary navigation and placed in sidebar footer', () => {
  assert.match(company, /\['dashboard','employees','records','requests','anomalies','users'/);
  assert.doesNotMatch(company, /\['dashboard','support','employees'/);
  assert.match(company, /data-view=\"support\" class=\"side-help\"/);
  assert.match(company, /<strong>Ajuda<\/strong><span>Abertura de chamados<\/span>/);
  assert.match(company, /\['company_admin','manager'\]\.includes\(user\.role\)/);
  assert.match(css, /side-bottom \.side-help\{display:block;width:100%/);
  assert.match(css, /@media\(max-width:760px\)\{\.side-bottom\{display:flex;flex-direction:column/);
});
test('company help center separates home/dashboard, ticket creation, knowledge articles, and live ticket search',()=>{
 assert.match(company,/help-center/);
 assert.match(company,/id=\"support-new-form\"/);
 assert.match(company,/help-stats/);
 assert.match(company,/help-ticket-search/);
 assert.match(company,/help-ticket-status/);
 assert.match(company,/help-ticket-category/);
 assert.match(company,/help-new-ticket/);
 assert.match(company,/help-article-list/);
 assert.match(company,/help-notification-dialog/);
 assert.match(company,/idempotency_key/);
 assert.match(company,/client_message_id/);
 assert.match(company,/help-reply-form/);
 assert.match(company,/helpStatus/);
 assert.match(company,/supportTicketFrom/);
 assert.match(company,/supportTicketSort/);
});
test('support conversation layout remains responsive on the company portal', () => {
  assert.match(css, /\.support-ticket-list/);
  assert.match(css, /\.support-messages/);
  assert.match(css, /@media\(max-width:600px\).*\.support-ticket/s);
});


test('company help center follows the supplied desktop and mobile reference layout',()=>{
 assert.match(company,/help-portal-topbar/);
 assert.match(company,/id=\"help-global-search\"/);
 assert.match(company,/id=\"help-new-ticket-panel\"/);
 assert.match(company,/id=\"help-ticket-list\"/);
 assert.match(company,/id=\"help-kb-panel\"/);
 assert.match(company,/help-dropzone/);
 assert.match(company,/dragover/);
 assert.match(css,/grid-template-columns:minmax\(0,\.92fr\) minmax\(0,1\.08fr\)/);
 assert.match(css,/help-grid>\.help-contact\{grid-column:1;grid-row:2;[^}]*\}/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:760px\)[\s\S]*help-grid>\.help-main-panel\{grid-column:1\/-1;grid-row:2\}/);
 assert.match(css,/help-center \.help-dropzone/);assert.match(company,/dropzone\.classList\.add\('is-dragging'\)/);
});

test('support center uses semantically named consistent SVG icons, not ambiguous glyphs',()=>{
 assert.match(company,/function helpIcon\(name,size=20\)/);
 for(const name of ['search','bell','help','headset','file','clock','message','check','layers','users','calendar','wallet','monitor','sliders','upload','send','alert','paperclip'])assert.match(company,new RegExp(name+":"));
 assert.match(company,/helpIcon\(helpCategoryIcon\(c\.slug\),18\)/);
 assert.match(company,/helpIcon\(\(\{open:'file',progress:'clock',waiting:'message',resolved:'check',total:'layers'\}\)\[kind\],21\)/);
 assert.doesNotMatch(company,/helpCategoryIcon\(slug\)\{return \(\{login:'♙'/);
});
