# SkyAtlas test coverage map

| Journey | Unit/API | Browser / release | Remaining gate |
| --- | --- | --- | --- |
| City search, location, weather, hourly and daily forecast | `tests/weather.test.cjs`, `tests/unit/*`, `tests/api-local/api-contracts.spec.ts` | `tests/ui/explorer/search.spec.ts`, `tests/ui/explorer/current-weather.spec.ts`, `tests/ui/explorer/forecast-geography.spec.ts`, `tests/release/production.spec.ts` | Full Chromium, Firefox and WebKit regressions pass |
| Interactive atlas, countries, photographs, globe | `tests/unit/geography-data.test.js` | `tests/ui/pages/*`, `tests/ui/explorer/forecast-geography.spec.ts` | Automated map/globe coverage passes; manual keyboard/contrast review remains |
| GeoGuess | `tests/unit/geoguess.test.js` | `tests/ui/geoguess/gameplay.spec.ts`, `tests/bugs/geoguess.spec.ts` | Full Chromium, Firefox and WebKit regressions pass; two planted GeoGuess defects remain expected QA exercises |
| Accounts, lockout, reset, favorites and theme sync | `tests/api-local/accounts.spec.ts` | `tests/ui/pages/development-routes.spec.ts` (account UI reachability) | Browser-level multi-context session sync remains limited |
| Historical Time Machine | `tests/api-local/journeys-api.spec.ts` | `tests/ui/journeys/trips-alerts-reviews.spec.ts`, `tests/release/production.spec.ts` | The free archive is available without a key; the separate live check requires network access |
| Trip planner, alerts and landmark reviews | `tests/api-local/accounts.spec.ts` for ownership/validation | `tests/ui/journeys/trips-alerts-reviews.spec.ts` exercises signed-in CRUD, forecast availability, alert and review feedback | Photo upload is boundary-checked in API tests; browser-level file upload and alert scheduling remain unautomated |
| Isolated Test Lab | `tests/api-local/journeys-api.spec.ts` | `tests/ui/pages/test-lab.spec.ts`, `tests/ui/pages/development-routes.spec.ts`, `tests/release/production.spec.ts` | Production route and bundle exclusion pass |
| Accessibility, mobile no overflow | Existing responsive specs | `tests/ui/pages/development-routes.spec.ts` (@a11y); `tests/release/production.spec.ts` | Axe and keyboard checks pass in Chromium, Firefox and WebKit; Lighthouse targets pass; manual contrast review remains |

`npm run test:api:local` runs deterministic API tests; account tests require isolated `DATABASE_URL` and a test-only `AUTH_SECRET`. `npm run test:accounts:local` provisions a disposable local PostgreSQL 18 cluster and runs all local API tests. `npm run test:smoke` and `npm run test:a11y` use Chromium. CI installs Chromium, PostgreSQL and applies migrations. Nightly cross-browser uses Firefox/WebKit. `@live` tests remain separate from fixture-based default tests. Test artifacts are stored in GitHub Actions.
