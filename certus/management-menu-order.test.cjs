const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'operacao.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');

test('Gestão mantém a ordem solicitada no menu principal em todas as empresas', () => {
  const match = source.match(/\(user\.role==='employee'\?Object\.entries\(views\):\[(.*?)\]\.map\(k=>\[k,views\[k\]\]\)\)/s);
  assert.ok(match, 'não foi possível localizar a lista única do menu da Gestão');
  const keys = [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
  assert.deepEqual(keys, [
    'dashboard', 'employees', 'records', 'requests', 'anomalies', 'users',
    'bank', 'schedules', 'calendar', 'branches', 'terminals', 'reports', 'password',
    'settings', 'subscription',
  ]);
});

test('desktop e mobile usam a mesma navegação lateral renderizada', () => {
  assert.equal((source.match(/<nav aria-label="Menu principal">/g) || []).length, 1);
  assert.match(source, /<button data-view="\$\{k\}">\$\{v\}<\/button>/);
});

test('PWA atualiza o cache para a versão nova do menu', () => {
  assert.match(index, /operacao\.js\?v=maxclean-partial-calculation-20261127/);
  assert.match(serviceWorker, /VERSION='certus-static-v88-terminal-settings-nondestructive-20261128'/);
  assert.match(serviceWorker, /\.\/operacao\.js\?v=maxclean-partial-calculation-20261127/);
});
