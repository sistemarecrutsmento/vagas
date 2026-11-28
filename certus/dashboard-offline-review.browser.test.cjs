'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const certusDir = path.resolve(__dirname, 'certus');
const manager = {
  id: 'manager-fixture',
  name: 'Gestor Fictício',
  role: 'manager',
  company: { slug: 'empresa-ficticia', name: 'Empresa Fictícia', timezone: 'America/Sao_Paulo' }
};
const pendingItems = [
  { id: 'offline-fixture-1', full_name: 'Pessoa Fictícia A', event_type: 'entry', occurred_at: '2026-11-27T11:00:00Z', received_at: '2026-11-27T11:01:00Z' },
  { id: 'offline-fixture-2', full_name: 'Pessoa Fictícia B', event_type: 'exit', occurred_at: '2026-11-27T20:00:00Z', received_at: '2026-11-27T20:01:00Z' }
];

function fixtureServer() {
  return http.createServer((req, res) => {
    const filePath = path.resolve(certusDir, `.${decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)}`);
    if (!filePath.startsWith(certusDir + path.sep)) {
      res.writeHead(404).end();
      return;
    }
    fs.readFile(filePath, (error, body) => {
      if (error) { res.writeHead(404).end(); return; }
      const ext = path.extname(filePath);
      const type = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.css' ? 'text/css; charset=utf-8' : 'application/octet-stream';
      res.writeHead(200, { 'content-type': type });
      res.end(body);
    });
  });
}

function mockApi(context, pendingMode) {
  const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, accept'
  };
  return context.route('https://certus-api.onrender.com/**', async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    const url = new URL(route.request().url());
    const routePath = url.pathname;
    if (routePath === '/api/offline/clock-events/pending' && pendingMode === 'error') {
      await route.fulfill({ status: 503, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify({ error: 'fixture unavailable' }) });
      return;
    }
    const responses = {
      '/api/me': manager,
      '/api/subscription/access': { is_owner: false, unlocked: true },
      '/api/employees': { items: [{ id: 'employee-fixture', full_name: 'Pessoa Fictícia', status: 'active' }] },
      '/api/branches': { items: [{ id: 'branch-fixture', name: 'Filial Fictícia', status: 'active' }] },
      '/api/schedules': { items: [{ id: 'schedule-fixture', name: 'Jornada Fictícia', status: 'active' }] },
      '/api/clock-events': { items: [] },
      '/api/adjustment-requests': { items: [] },
      '/api/clock-anomalies': { items: [] },
      '/api/offline/clock-events/pending': { items: pendingMode === 'two' ? pendingItems : [] },
      '/api/management/overview': { item: { rate_percent: 0, absent_minutes: 0, scheduled_minutes: 0 } }
    };
    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify(responses[routePath] || { items: [] }) });
  });
}

async function openDashboard(browser, baseUrl, pendingMode) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await mockApi(context, pendingMode);
  const page = await context.newPage();
  await page.addInitScript(user => {
    sessionStorage.setItem('certus_token', 'fixture-token');
    sessionStorage.setItem('certus_user', JSON.stringify(user));
  }, manager);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/index.html`);
  await page.getByRole('heading', { name: 'Empresa Fictícia' }).waitFor();
  await page.getByRole('heading', { name: 'Marcações recentes' }).waitFor();
  return { context, page, pageErrors };
}

test('dashboard exposes pending offline review and remains usable when the pending queue fails', async () => {
  const server = fixtureServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const success = await openDashboard(browser, baseUrl, 'two');
    try {
      const alert = success.page.locator('.offline-review-alert');
      await alert.waitFor({ state: 'visible' });
      assert.match(await alert.innerText(), /2\s+marcações offline/i);
      assert.match(await alert.innerText(), /não contam como tempo oficial até serem revisadas/i);
      assert.doesNotMatch(await alert.innerText(), /Pessoa Fictícia/);
      await alert.getByRole('button', { name: 'Revisar marcações' }).click();
      await success.page.getByRole('heading', { name: 'Marcações offline para análise' }).waitFor();
      await success.page.getByRole('heading', { name: 'Inconsistências diárias' }).waitFor();
      assert.equal(success.pageErrors.length, 0, `browser page errors: ${success.pageErrors.join('; ')}`);
    } finally {
      await success.context.close();
    }

    const failed = await openDashboard(browser, baseUrl, 'error');
    try {
      assert.equal(await failed.page.locator('.offline-review-alert').count(), 0, 'a failed request must not invent a zero or show a pending count');
      await failed.page.getByRole('heading', { name: 'Marcações recentes' }).waitFor();
      assert.doesNotMatch(await failed.page.locator('#content').innerText(), /Não foi possível abrir esta área/);
      assert.doesNotMatch(await failed.page.locator('#content').innerText(), /0 marcações offline|tempo oficial/i);
      assert.equal(failed.pageErrors.length, 0, `browser page errors: ${failed.pageErrors.join('; ')}`);
    } finally {
      await failed.context.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
