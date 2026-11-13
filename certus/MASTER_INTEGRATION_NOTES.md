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

`master.integration.test.js` provides source-contract checks. `master.browser.test.cjs` uses Playwright with a mocked API, blocks unexpected network, and exercises all 14 screens, company selection, tabs, refresh/search, password-change link and a 390px viewport. GitHub Actions run `43480214469` passed on the release-candidate head: install, Chromium setup, source contracts and Playwright mocked-browser tests (12 total, 0 failures), including 390px mobile overflow. These are UI behavior tests against fixtures, not authenticated live API or deployed backend integration tests.

## Database/migration validation

API CI run `43492658744` passed on API release-candidate head `a21d31cdc6458cdbdeba59e3ff62766f87c26679`: `npm run check`, Node tests, mocked portal tests, authenticated portal/API integration, and a disposable PostgreSQL service created for that workflow run. The integration test applied migration 001 and migration 031 twice in a unique temporary schema, checked the expected new tables and RLS policies, verified cross-company subscription reads/writes are blocked, then dropped the schema and test role. No Render DB was contacted and no persistent production data/schema was changed.


## Authenticated portal/API integration

API CI runs `43492658744` and `43492664496` passed on API candidate `a21d31cdc6458cdbdeba59e3ff62766f87c26679`. In addition to disposable PostgreSQL migration/RLS validation, the workflow starts the candidate API against that ephemeral DB, provisions a fake Master account using the one-time setup route, authenticates, and runs the release-candidate portal in Chromium against the actual local API. The test visits all 14 screens, checks the authenticated Master identity, ensures the audit endpoint is fetched, asserts no API 5xx/browser runtime errors, and checks the 390px viewport. PostgreSQL and all fixture data are confined to the ephemeral CI job.

This exposed and fixed a real same-second Master authentication defect: PostgreSQL preserves sub-second `password_changed_at`, while JWT `iat` is integer seconds, so comparing full-precision milliseconds rejected a token issued in the same second. The candidate now compares at JWT-second precision. The end-to-end test also revealed and corrected test-harness issues; the final candidate CI is green.

## Known blockers before publication

The Portal UI PR #21 and API PR #44 are still draft/open and unmerged. The API release-candidate route surface is covered by CI and disposable-DB migration/RLS tests, and the browser suite covers both fixture-mode UI checks and authenticated integration against the candidate API. This is not a deployment against production or a permanent staging environment. Several menu sub-functions have no backend routes and are deliberately shown as unavailable (Master user/permission administration, aggregate financial reports, firmware updates, and onboarding task list). These gaps must be accepted as explicit scope limits or implemented before claiming every original screen function is complete.

The migration was not applied persistently to the active Certus database. The only current Render Certus database is Free and has no Render backup/restore capability; it is not used as a test database. No production service/deploy was changed, no customer communication/payment was made, and no PR was merged.

