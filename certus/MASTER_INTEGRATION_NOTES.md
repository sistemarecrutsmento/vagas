# Certus Portal Master draft integration notes

Status: implementation draft only, not approved for publication. This draft includes the 14-screen authenticated read-only UI, its static and mocked-browser tests, the draft-only workflow, and mobile layout corrections. The existing root operational `master.html` was not changed by this integration work.

## Screen coverage

1. Dashboard: authenticated `GET /api/master/dashboard`; no synthetic chart/time-series.
2. Companies: `GET /api/master/overview`; switch between real table/cards and load company counts using `GET /api/master/companies/:id/summary`.
3. Plans/subscriptions: `GET /api/master/plans`, company `GET /api/master/companies/:id/subscriptions`; display only. No activate/create/edit; plan defaults remain inactive; no paid subscription tests.
4. Contracts/tests: company `GET /api/master/companies/:id/contracts`, plus trial subscriptions read-only. No create/edit.
5. Finance: company `GET /api/master/companies/:id/invoices`; status tabs. Aggregate financial reports unavailable. No invoice drafting from UI, payment, settlement, or marking paid.
6. Support: `GET /api/master/support/tickets`, selected ticket `GET /api/master/support/tickets/:id?company_id=...`; messages read-only. No ticket mutations or message delivery.
7. Time monitoring: `GET /api/master/monitoring`, read-only.
8. Devices: `GET /api/master/devices`; activations filtered from available status; firmware/update tab explicitly unavailable. No remote device action or credentials.
9. Onboarding: `GET /api/master/onboarding`; project/task summaries are incomplete because there is no task-list route. Create/update disabled.
10. Global settings: `GET /api/master/settings`; editing disabled, and API states settings do not affect customer behavior.
11. Features: `GET /api/master/features`; catalog-only and customer behavior not wired; create disabled.
12. Announcements: `GET /api/master/announcements`; draft/archive tabs read-only; no sending or publishing.
13. Access/permissions: `GET /api/master/me` only for current identity. User directory, roles, permission matrix and invitations are unavailable.
14. Audit/security: `GET /api/master/audit-log?limit=100` and `GET /api/master/security/incidents`; read-only, no filters/export or incident status changes. Dashboard activity tab uses audit-log with limit 20.

## UI/test scope

Removed `data-inert`, demo-tab hooks, sample organizations/KPIs, fabricated chart data and dead confirmation modal. Added authenticated no-store GET wrapper (token stays in memory), 401/403 handling, logout, loading/error/retry/empty states, company selection, functional tab filtering and page-local search, plus narrow viewport navigation and horizontally scrollable tables. No data-changing endpoint is called by the UI.

`master.integration.test.js` provides source-contract checks. `master.browser.test.cjs` uses Playwright with a mocked API, blocks unexpected network, and exercises all 14 screens, company selection, tabs, refresh/search, password-change link and a 390px viewport. GitHub Actions run `43477491966` passed (install, Chromium setup, source tests and mocked browser tests). These are UI behavior tests against fixtures, not authenticated live API or deployed backend integration tests.

## Validation status after browser CI

The mobile width was fixed and the mobile-specific assertion passed in an earlier run. Browser CI has exercised the temporary-password link, mocked navigation, company selector and tabs. A later release-candidate run still reports a generic test-process exit code 1; GitHub does not expose per-test log lines for this public repository. The exact failing assertion must be diagnosed before release.

## Known blockers before publication

Release candidate branch `draft/master-release-candidate-20261113` is based directly on the current main commit and excludes the root operational portal file; it remains a draft. API PR #43 is still open/unmerged. Its draft head `8337efdabdd3a7dbe3e04439a4041baf39e12404` has a successful CI run (install + `npm test`), including fixes for duplicate operational-route registration and strict per-key settings validation. Audit-write behavior and the scope of backend runtime/integration tests must still be reviewed in the full merge/deploy validation. The UI tests use mocked responses; live authenticated API tests were not run.

The migration was previously tested only within a rolled-back transaction; it was not applied persistently. No production data, services, or deployment were changed. No customer communications or financial side effects were triggered. No PR was merged.
