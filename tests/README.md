# EarthScope test guide — Milestone 6

The suites exercise behavior at three levels. They do not claim full v1.0 release
acceptance or complete accessibility coverage. Practice and production suites are
separate from normal regression; see docs/BUG_MODE.md and docs/RELEASE_CHECKLIST.md.

| Suite | Command | Dependency | Scope |
| --- | --- | --- | --- |
| Node regression | `npm test` | Node.js | 34 checks for validation, conversion, timestamps, storage and preserved legacy behavior |
| UI via Vite | `npm run test:ui` | Vite + Chromium | 69 deterministic scenarios against the development server |
| UI without server | `npm run test:ui:memory` | Chromium | Same 69 scenarios, actual source files supplied through browser routing |
| All browsers via Vite | `npm run test:ui:all` | Matching Chromium, Firefox, WebKit binaries | 69 scenarios per browser, 207 executions |
| All browsers without server | `npm run test:ui:memory:all` | Same three browsers | Same scenarios using server-free source routing |
| Practice defects | `npm run test:bugs:memory` | Chromium | 7 checks for deliberate defects and storage isolation |
| Production assets | `npm run test:release` | Vite + Chromium | Build plus 3 actual-dist journeys, including disabled defect flags |
| Live APIs | `npm run test:api` | Public internet | 9 public endpoint contract checks, one worker, no retries |

## Install and run

```powershell
npm install
npx playwright install chromium
npm test
npm run test:ui
npm run test:api
npm run build
```

Optional cross-browser checks:

```powershell
npx playwright install chromium firefox webkit
npm run test:ui:all
```

The all-browser commands check installed binary paths first and fail with an
installation message if a matching browser is absent. They do not silently skip
unavailable browsers. Installing a browser for another Playwright version may not
satisfy the version used by this project's package-lock.json.

Vite uses 127.0.0.1:5173. Playwright reuses a reachable existing server outside CI.
If the port is occupied by an unreachable or unrelated process, stop that process
in its own terminal before running the normal suite. Do not change production code
or kill unknown processes just to make a test pass.

For restricted environments:

```powershell
npm run test:ui:memory
```

Memory mode verifies actual app HTML/CSS/JavaScript and browser behavior. It does
not verify Vite serving, bundling or live API connectivity. It is different from
the app's future offline mode: production weather still requires internet.

## Initial acceptance scenarios

| Required scenario | Coverage |
| --- | --- |
| App loads, input visible | search.spec.ts: initial load, no automatic API call |
| Valid search suggestions | search.spec.ts: country-labelled matches |
| Select a city | search.spec.ts: mouse and keyboard selection |
| Mocked current weather | weather.spec.ts: values, units, icon, timestamp |
| 24 hourly forecasts | forecastGeography.spec.ts: card count and values |
| Invalid/empty city | search.spec.ts, resilience.spec.ts: blank, short and no-match queries |
| Celsius/Fahrenheit | preferences.spec.ts: all temperatures, reload, no refetch |
| Add favorite | preferences.spec.ts: save and pressed state |
| Favorite survives reload | preferences.spec.ts: reopen without geocoding |
| Remove favorite | preferences.spec.ts: both controls, removal persists |
| API failure | weather.spec.ts, resilience.spec.ts: retry, HTTP/network errors |

## Additional risk coverage

- Search cancellation, Unicode encoding, explicit selection for a single match,
  invalid coordinates, timeout recovery and stale choices.
- Unreadable JSON, network loss and rate limits for both endpoints.
- Missing weather metrics, unknown condition codes, wrong temperature units,
  partial/short/missing hourly forecasts and duplicate forecast timestamps.
- Location clocks, fractional offsets, midnight and repeated DST hours.
- Geocoding elevation retained independently of weather-grid altitude; optional
  geography stays unavailable when absent and survives weather failures.
- Preference changes during pending requests, corrupt JSON/schema, denied storage,
  quota failures, validated/deduplicated favorites and same-name places.
- Markup-like saved names are rendered as text, never interpreted as elements.
- Keyboard search, dismissal, selection and mobile overflow/forecast scrolling.

## Fixture and isolation rules

UI specs import test/expect from support/uiTest.ts, not directly from Playwright.
Each test gets a fresh context/storage state. The automatic fixture blocks and
fails any unmocked external browser request and checks uncaught page errors.
Page-level endpoint mocks run before the context boundary. Service workers are
blocked during tests. The fixture serves only index.html and src/ in memory mode. Practice source emulates
the Vite DEV flag only for src/dev/bugMode.js. Production mode serves untouched
dist/index.html and dist/assets/ and never rewrites development gates.
It does not modify production files or introduce a backend.

Use tests/fixtures/currentWeather.js only for deterministic test responses. Never
expect a live temperature to match that sample. Use roles, accessible names,
stable data-testid attributes and assertions instead of fixed waits.

## Live API contracts

API checks are isolated by playwright.api.config.ts; they do not start Vite or use
UI mocks. The default Playwright config contains only browser projects, preventing
an accidental live API run during a UI regression command.

The nine checks cover city lookup/coordinates, international location names,
current/hourly response structure, Celsius and Fahrenheit unit labels, explicit
Asia/Kolkata and America/New_York timezones, Unix hourly ordering, invalid
coordinates and invalid variables. Values are checked for type/structure and
physical ranges where applicable, never against a fixed live temperature.
One worker and zero retries limit request volume. Avoid repeated live runs while
debugging UI behavior; use mocks instead. DNS/429/service outages are reported as
failures, not skipped or converted into success.

## Reports and debugging

```powershell
npm run report:ui
npm run report:api
```

UI HTML report: playwright-report/ui/. API HTML report: playwright-report/api/.
Failure artifacts are separated under test-results/ui/ and test-results/api/.
Practice and release reports/artifacts are under their respective bugs/ and release/
subdirectories. UI failures retain screenshots and traces; passing tests do not retain screenshots.
The HTML report links the failure details and trace. Open a trace directly with
`npx playwright show-trace PATH_TO_TRACE_ZIP`.

Run one scenario or file:

```powershell
npm run test:ui -- tests/ui/preferences.spec.ts
npm run test:ui:memory -- --grep "rate limiting"
```

Do not run two UI commands concurrently: they share report/artifact directories.
The separate API report can be generated independently. No fixed delays, automatic
test retries, or expected-failure product tests are configured.

## Validation in this workspace

- 34 Node checks passed; production build and all 3 built-asset checks passed.
- All 7 isolated practice checks passed, including safe normal-storage preservation.
- All 69 Chromium UI scenarios passed in server-free memory mode.
- The normal Vite UI command was blocked by occupied port 5173.
- Firefox/WebKit were attempted but matching binaries are missing. Cross-browser
  compatibility remains unverified; the preflight now reports this up front.
- All nine live API checks executed but failed with sandbox DNS ENOTFOUND.
  Run them locally before claiming live integration acceptance.

## Final feature catalogue

See docs/PLAYWRIGHT_COVERAGE.md for search, refresh, connection feedback, favorites
filter/sort/clear-all, dialog focus, units, timezones, storage, production and practice
coverage. All six implementation milestones are present; live/local acceptance
requirements remain explicit in docs/RELEASE_CHECKLIST.md.
