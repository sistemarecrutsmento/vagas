'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const COMPANY = '00000000-0000-4000-8000-000000000401';
const EMPLOYEE = '00000000-0000-4000-8000-000000000201';
const BRANCH = '00000000-0000-4000-8000-000000000101';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

function staticServer() {
  return http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { res.writeHead(400).end(); return; }
    const filePath = path.resolve(ROOT, `.${pathname}`);
    if (!filePath.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    const file = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() ? path.join(filePath, 'index.html') : filePath;
    fs.readFile(file, (error, body) => {
      if (error) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
    });
  });
}

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

test('Management payroll quantities CSV preserves selected filters, auth, pending language and safe error handling', async t => {
  const web = staticServer();
  await new Promise(resolve => web.listen(0, '127.0.0.1', resolve));
  const port = web.address().port;
  let browser;
  let rejectExport = false;
  const calls = [];
  t.after(async () => {
    if (browser) await browser.close();
    await new Promise(resolve => web.close(resolve));
  });

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(company => {
    sessionStorage.setItem('certus_token', 'fixture-session-token');
    sessionStorage.setItem('certus_user', JSON.stringify({
      id: '00000000-0000-4000-8000-000000000301', name: 'Gestora de Fixture', role: 'manager',
      company: { id: company, slug: 'payroll-fixture', name: 'Empresa Fictícia', timezone: 'America/Sao_Paulo' }
    }));
  }, COMPANY);

  await page.route('https://certus-api.onrender.com/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    calls.push({ pathname, method: request.method(), query: Object.fromEntries(url.searchParams), authorization: request.headers().authorization || '' });
    if (pathname === '/api/subscription/access') return json(route, { unlocked: true, is_owner: false });
    if (pathname === '/api/me') return json(route, { id: '00000000-0000-4000-8000-000000000301', role: 'manager', employee_id: null, company: { id: COMPANY, slug: 'payroll-fixture', name: 'Empresa Fictícia', timezone: 'America/Sao_Paulo' } });
    if (pathname === '/api/employees') return json(route, { items: [{ id: EMPLOYEE, full_name: 'Colaboradora de Teste', employee_number: 'FIX-001', status: 'active', branch_id: BRANCH }] });
    if (pathname === '/api/branches') return json(route, { items: [{ id: BRANCH, name: 'Filial Fictícia', status: 'active' }] });
    if (pathname === '/api/schedules') return json(route, { items: [] });
    if (pathname === '/api/clock-events') return json(route, { items: [] });
    if (pathname === '/api/adjustment-requests') return json(route, { items: [] });
    if (pathname === '/api/management/overview') return json(route, { item: { rate_percent: 0, weekly_overtime_status: 'complete', absent_minutes: 0, scheduled_minutes: 0, weekly_overtime_additional_minutes: 0, weekly_overtime_pending_employees: 0 } });
    if (pathname === '/api/management/monthly-payroll.csv' && request.method() === 'GET') {
      if (rejectExport) return json(route, { error: 'Exportação indisponível na fixture.' }, 503);
      return route.fulfill({
        status: 200,
        contentType: 'text/csv; charset=utf-8',
        headers: { 'Content-Disposition': `attachment; filename="folha-quantidades-2026-10-colaborador-${EMPLOYEE}-filial-${BRANCH}.csv"` },
        body: '\uFEFFtipo_linha;codigo_rubrica;quantidade;destino;status\r\nEVENTO;EXTRA_SEMANAL_INCREMENTAL;120;payment;pendente_confirmacao_folha\r\n'
      });
    }
    return json(route, { error: `Unmocked fixture route ${request.method()} ${pathname}` }, 501);
  });

  await page.goto(`http://127.0.0.1:${port}/certus/`);
  await page.waitForSelector('#company-sidebar');
  await page.locator('button[data-view="reports"]').click();
  const form = page.locator('#team-timesheet-pdf-form');
  await form.waitFor();
  assert.equal(await form.locator('button[type="submit"]').innerText(), 'Baixar PDF de ponto', 'the existing official PDF action remains available');
  await page.getByText(/CSV contém quantidades e eventos.*pendentes.*não comprova pagamento nem quitação/i).waitFor();
  await form.locator('[name=employee_id]').selectOption(EMPLOYEE);
  await form.locator('[name=branch_id]').selectOption(BRANCH);
  await form.locator('[name=month]').selectOption('10');
  await form.locator('[name=year]').fill('2026');

  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/management/monthly-payroll.csv');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#team-payroll-csv').click();
  const [response, download] = await Promise.all([responsePromise, downloadPromise]);
  assert.equal(response.status(), 200);
  assert.match(response.headers()['content-type'], /text\/csv/i);
  assert.equal(download.suggestedFilename(), `folha-quantidades-2026-10-colaborador-${EMPLOYEE}-filial-${BRANCH}.csv`);
  const call = calls.find(entry => entry.pathname === '/api/management/monthly-payroll.csv');
  assert.ok(call);
  assert.equal(call.method, 'GET');
  assert.deepEqual(call.query, { month: '10', year: '2026', employee_id: EMPLOYEE, branch_id: BRANCH });
  assert.equal(call.authorization, 'Bearer fixture-session-token');
  await page.getByText('CSV de quantidades/eventos baixado. Itens pendentes seguem identificados; isso não comprova pagamento nem quitação.').waitFor();

  rejectExport = true;
  const errorResponsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/management/monthly-payroll.csv');
  await page.locator('#team-payroll-csv').click();
  const errorResponse = await errorResponsePromise;
  assert.equal(errorResponse.status(), 503);
  await page.locator('#team-timesheet-pdf-message.bad').getByText('Exportação indisponível na fixture.').waitFor();
  assert.deepEqual(pageErrors, []);
  await context.close();
});
