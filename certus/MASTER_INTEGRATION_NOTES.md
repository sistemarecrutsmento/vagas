# Certus Portal Master draft integration notes

Status: implementation draft only, not approved for publication. This change is scoped to `certus/master.html` and its integration checks; it does not edit the root operational `master.html`.

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

`master.integration.test.js` is a set of source-contract checks (not browser behavior tests). `run_ui_tests.py` runs 10 independent source/endpoint/guardrail/responsive checks; JavaScript parsing used tree-sitter. The sandbox has no Node/browser runtime, so no DOM interaction, endpoint behavior, authenticated API, desktop/mobile screenshot, or end-to-end checks are claimed.

## Known blockers before publication

Separate backend audit findings remain unresolved in PR #43 (being handled separately): duplicate `registerMasterOperationalRoutes` registration in `src/server.js`; audit writes outside tenant mutation transactions can report failure after a committed mutation; no per-key value validation in settings PUT; existing backend tests are primarily static source-pattern assertions without behavior/integration. No API code was changed here.

No migrations were run, no database/data was changed, no production service/deploy was touched, no communications or financial side effects occurred, and no PR was merged.
