# EarthScope v1.0 — Milestone 6 / release candidate

EarthScope is a personal geography and weather exploration project. This milestone
implements city search, current weather, a 24-hour forecast and geography details.
Milestone 4 adds persistent Celsius/Fahrenheit preferences and favorite locations.
All six implementation milestones are present. Milestone 6 adds accessible favorite
management, refresh/connection flows, isolated development Bug Mode and built-asset
verification. Final live/local acceptance is still pending; see docs/RELEASE_CHECKLIST.md.

## Implementation checklist

- [x] Inspect all original files: index.html, README.md and tests/weather.test.cjs.
- [x] Identify inline HTML/CSS/JavaScript with geocoding and weather requests.
- [x] Preserve the existing weather prototype and README in legacy/.
- [x] Add Vite configuration, npm scripts, ES modules and separate API/UI logic.
- [x] Build international city search and selectable country/region-labelled results.
- [x] Handle empty input, no matches, malformed data, HTTP failures and timeouts.
- [x] Cancel obsolete requests, support keyboard navigation and add stable test IDs.
- [x] Add deterministic service checks and mocked Playwright search scenarios.
- [x] Milestone 1 installation, UI/API tests, build and preview verified by the owner.

## Milestone 2 checklist

- [x] Add a separate current-weather service and view component.
- [x] Display temperature, feels-like, humidity, wind, precipitation and condition/icon.
- [x] Show a selected-timezone clock and a separate weather-valid-at timestamp.
- [x] Request and validate explicit Celsius, km/h and mm units.
- [x] Handle incomplete values, failures, retry, timeout and obsolete requests.
- [x] Add mocked UI regressions, service tests and live weather integration tests.
- [x] Pass deterministic Node checks, mocked Chromium checks and production build.
- [x] Milestone 2 UI tests, live API tests and production build verified locally by the owner.

## Milestone 3 checklist

- [x] Fetch current and hourly weather in one request; request 25 hourly slots.
- [x] Display the next 24 available timestamps inside a 24-hour window.
- [x] Show location dates/hours, weather icons, Celsius temperatures, rain chance and wind.
- [x] Use Unix timestamps and location timezones across midnight and DST transitions.
- [x] Handle unavailable, short and partial forecasts without inventing data.
- [x] Add desktop forecast grid and horizontal mobile scrolling.
- [x] Show selected coordinates, country, region, geocoding elevation, timezone and local date/time.
- [x] Keep geography available during weather failures.
- [x] Pass Node tests, mocked Chromium checks and production build.
- [ ] Confirm updated hourly API response via npm run test:api locally (sandbox DNS blocked).

## Milestone 4 checklist

- [x] Add accessible Celsius/Fahrenheit buttons with persisted selection.
- [x] Convert current, feels-like and all hourly temperatures consistently.
- [x] Reuse raw Celsius values; do not refetch weather or round before conversion.
- [x] Save, reopen and remove favorite locations using stable identifiers.
- [x] Prevent duplicates while distinguishing same-name cities.
- [x] Persist favorites and validate saved entries before rendering.
- [x] Handle corrupt JSON, denied storage and failed writes gracefully.
- [x] Preserve working search, weather, forecast and geography flows.
- [x] Pass 31 Node checks, 40 mocked Chromium checks and the production build.
- [ ] Confirm normal Vite UI test execution and live API checks locally.

## Milestone 5 checklist

- [x] Expand UI regression from 40 to 56 scenarios without changing product behavior.
- [x] Add shared fixture to block unmocked external browser requests and page errors.
- [x] Make server-free source verification reproducible with npm run test:ui:memory.
- [x] Keep browser-only default configuration separate from live API configuration.
- [x] Expand live API suite from 3 to 9 contract checks, including Fahrenheit and timezones.
- [x] Add HTML reports and failure screenshots/traces with separate UI/API directories.
- [x] Configure optional Chromium/Firefox/WebKit projects and missing-binary preflight.
- [x] Document commands, coverage matrix and debugging in tests/README.md.
- [x] Pass 31 Node checks, all 56 Chromium memory-mode checks and production build.
- [ ] Verify the Vite UI command locally (port 5173 occupied in this sandbox).
- [ ] Verify Firefox/WebKit after installing matching browser binaries.
- [ ] Verify all 9 live API contracts locally (sandbox DNS blocked).

## Milestone 6 checklist

- [x] Add skip link, labelled controls, visible focus and 44px buttons.
- [x] Add Clear search and Refresh weather with loading/cancellation/retry states.
- [x] Show offline/restored connection status without automatic refetching.
- [x] Add accent-insensitive favorite filter, sort, counts and empty-filter state.
- [x] Add clear-all confirmation with keyboard focus loop, Escape and cancel.
- [x] Keep forecast End/Home/arrow navigation inside its scroll container.
- [x] Add five named development-only defects using isolated practice storage.
- [x] Verify defect flags are ignored by built production code.
- [x] Pass 34 Node checks, 69 normal Chromium scenarios, 7 practice checks and 3 built-asset checks.
- [x] Document broad supported flows in docs/PLAYWRIGHT_COVERAGE.md.
- [ ] Confirm final candidate locally against Vite and all 9 live API contracts.
- [ ] Confirm Firefox/WebKit and manual screen-reader/real-device usability.

## Technology

HTML5, CSS3, JavaScript ES modules, Vite, Open-Meteo Geocoding API and Playwright
Test with TypeScript. No framework, database or backend. Node.js 22.12+ required.

## Install and run

Open PowerShell in the EarthScope folder:

```powershell
npm install
npx playwright install chromium
npm run dev
```

Visit http://127.0.0.1:5173. Use a web server instead of double-clicking index.html
because the application uses ES modules.

```powershell
npm run build
npm run preview
```

Build output goes to dist/. Preview serves it at http://127.0.0.1:4173.
Commit package-lock.json after the first successful install; later reproducible
installs can use npm ci. No Git repository is configured, so no commit was made.

## Use city search

1. Enter at least two characters, such as Nashik, Zürich, Paris or 東京.
2. Press Enter or click Search cities.
3. Choose a result using its city, region and country labels.
4. The selected destination, current weather, hourly forecast and geography appear below the search panel.
5. If weather fails, click Retry weather without repeating the city search.

Tab moves between controls. Arrow Down from the input focuses the first result;
Up/Down moves through results; Enter/Space selects; Escape dismisses results.
A single match still requires selection. Editing the input clears previous choices
and selection and cancels pending requests. No automatic search runs on page load.

## API integration

src/services/geocodingService.js calls
https://geocoding-api.open-meteo.com/v1/search with name, count=5, language=en
and format=json. Unicode input is URL encoded. Responses are validated, including
latitude/longitude ranges. Missing optional information is marked unavailable.
The shared HTTP helper enforces a 15-second timeout and cancellation with meaningful
errors. No automatic retries or API key. Search terms are sent to Open-Meteo.
Attribution appears in the footer; review provider terms before public release.
src/services/weatherService.js calls https://api.open-meteo.com/v1/forecast with
selected coordinates and current temperature_2m, apparent_temperature,
relative_humidity_2m, weather_code, wind_speed_10m, precipitation and is_day.
Requests explicitly set temperature_unit=celsius, wind_speed_unit=kmh,
precipitation_unit=mm, timezone=auto and timeformat=unixtime. The same request now
includes hourly temperature_2m, weather_code, precipitation_probability,
wind_speed_10m and is_day, with forecast_hours=25.
Reference: https://open-meteo.com/en/docs.

Temperature and time/timezone are required. Missing or invalid secondary metrics
show Not available with a partial-data note, rather than zero or NaN. Unknown WMO
codes show Weather conditions unavailable. Clear-sky icons distinguish day/night
when that information is available. No icon library or image downloads are required.

The local clock updates every minute in the API timezone, using Intl formatting;
weather data itself is fetched once per selection/retry. A separate valid-at label
shows the model timestamp so the local clock never implies fresher weather.
Precipitation shows millimetres accumulated over the preceding API reporting
interval (usually 15 minutes), not a rain probability or a daily total.

Changing the search input cancels weather requests, hides earlier data and stops
the previous clock. A sequence guard also rejects late responses even if a
transport ignores cancellation. Failures retain the selected city and offer retry.
Current conditions are modelled estimates, not direct weather-station observations.

## Hourly forecast and geography

The request includes 25 hourly slots starting from the provider's current hour.
The UI selects up to 24 timestamps at or after the current weather report's time,
inside the following 24-hour window. A partially elapsed hour is excluded; an
exact current-hour boundary is included. This avoids showing midnight's old data
or filling gaps with later days. Short forecasts explicitly show their available
count. Missing metric values show Not available; a missing/malformed hourly time
array shows an unavailable message while current conditions remain visible.

Each card shows its local date/time and UTC offset, condition icon/description,
Celsius temperature, rain probability and wind in km/h. Rain probability applies
to the preceding hour, as defined by the API. Unix timestamps are converted using
the resolved IANA timezone, so repeated autumn hours have distinct UTC offsets
and spring-forward hours skip naturally. The forecast is a snapshot of the API
report; it does not roll forward automatically while the page stays open.

Desktop uses a scrollable grid. Mobile uses horizontal cards. Tab to the forecast
list to scroll with the keyboard, or swipe/scroll horizontally on a phone.

Geography uses the selected geocoding record for coordinates, country, region
and elevation. Weather-grid coordinates/elevation never overwrite these values.
The elevation label explicitly identifies the geocoding source. Unknown optional
values show Not available. The geocoding timezone is used immediately when valid;
a successful weather response supplies the resolved timezone. The geography clock
updates every minute and stops when another city is searched. Geography remains
visible if weather fails. No new external API or dependency was added.

## Temperature units and favorites

Choose Celsius or Fahrenheit using the Temperature buttons below search. The
selected button exposes aria-pressed and remains selected after reload. Current,
feels-like and every hourly temperature update together; wind remains km/h and
precipitation remains mm. The API always returns Celsius. The UI converts raw
values with F = C * 9 / 5 + 32, then rounds once for display. Switching units makes
no API calls and does not reset forecast scrolling or clocks. A preference selected
while weather is loading also applies to the incoming response. Missing values
stay unavailable. Invalid saved preferences default to Celsius with a message.

Select a city, then choose Save favorite. The same button removes an existing
favorite. The Favorite locations section offers an Open button (the city name)
and a separately labelled Remove button for each saved place. Opening a favorite
cancels pending city search and requests fresh current/hourly weather directly
from its coordinates, without calling geocoding. Removing a favorite does not
clear the currently displayed weather. Saving a place requires no login/backend.

Identity uses the provider location ID when available, with coordinates as a
fallback. The same coordinate pair is also deduplicated. Same-name cities at
different coordinates remain separate. Only supported location fields are stored;
weather responses are not persisted. Saved data is validated, invalid entries are
skipped and duplicates are removed from the displayed list. Merely loading corrupt
storage does not overwrite it. Explicit save/remove actions write the current valid
list. Read/write failures show a message and leave session functionality available.

Storage keys:

- earthscope:temperature-unit:v1: JSON string celsius or fahrenheit.
- earthscope:favorites:v1: JSON array of normalized location records.

Saved data belongs to the browser and exact site origin (host and port). The dev
server at port 5173 and preview at port 4173 use separate saved preferences and
favorites. Clearing browser/site data removes them. There is no account sync,
cross-tab synchronization or offline weather in this milestone.

Manual check: search a city, switch to Fahrenheit, save it, reload, reopen the
favorite, confirm the unit selection remains, remove it, then reload again.

## Run tests

```powershell
npm test
npm run test:ui
npm run test:api
```

- npm test: deterministic Node.js service checks and preserved weather regressions.
- npm run test:ui: mocked Playwright browser checks; starts Vite automatically.
- npm run test:api: separate live geocoding check; requires internet and does not
  start the app. It covers live geocoding, current/hourly weather and invalid weather
  coordinates. It checks response structure/units, never a fixed live temperature.

If Vite cannot be downloaded but Playwright is installed, an optional Python
static-server fallback can verify browser behavior without verifying Vite:

```powershell
$env:EARTHSCOPE_STATIC_TEST_SERVER='1'
npm run test:ui
$env:EARTHSCOPE_STATIC_TEST_SERVER=$null
```

Python's py launcher is required for that fallback. For manual inspection run
`py -m http.server 8000 --bind 127.0.0.1` and open http://127.0.0.1:8000.

## Milestone 5 testing commands

See tests/README.md for the scenario matrix, fixture rules and failure debugging.

```powershell
npm run test:ui:memory
npm run report:ui
npm run report:api
```

The memory command uses the same browser specs and actual app source, without
starting Vite. It verifies UI behavior, not Vite serving or a production build.
UI tests must mock all external browser requests; an omitted mock fails instead
of reaching a live API. Every UI test also checks uncaught JavaScript errors.

Optional cross-browser verification:

```powershell
npx playwright install chromium firefox webkit
npm run test:ui:all
```

The all-browser runner checks matching executables before starting. It reports
missing browsers instead of silently skipping them. For a server-free equivalent,
use npm run test:ui:memory:all. There are 56 scenarios per browser (168 executions).
Chromium is the default npm run test:ui target; Firefox/WebKit remain optional.

Reports are in playwright-report/ui/ and playwright-report/api/. UI failure
screenshots/traces go under test-results/ui/. API artifacts are separated under
test-results/api/. Do not run two UI commands concurrently because they share
report directories. Reports do not open automatically; use the report commands.

## Final web interaction features

Clear search resets input, suggestions, selected weather and geography, cancels
obsolete requests and returns focus to the input. Saved favorites remain intact.
Refresh weather reuses the selected coordinates and requests a fresh current/hourly
snapshot without repeating city lookup. It is disabled while the request is pending;
failures expose Retry weather. Unit selection is preserved throughout.

The connection banner reflects browser offline/online events. It does not cache
weather, guarantee that an API is reachable or silently fetch data on reconnection.
Existing snapshots retain their model-valid-at timestamp until refreshed.

Filter favorites by city, region or country, including accent-insensitive searches.
Sort by saved order or name A-Z/Z-A. Filtering/sorting affects display only and is
not persisted. Clear all favorites opens a native confirmation dialog; Keep favorites
or Escape cancels. Confirmation removes all locations, including filtered ones,
while preserving the selected weather and temperature preference.

The skip link, labels, focus styles, modal Tab loop, forecast keyboard scrolling,
reduced-motion styles and tested responsive widths support keyboard/mobile use.
These checks do not amount to a full accessibility certification.

Useful verification commands:

```powershell
npm run test:ui:memory
npm run test:bugs:memory
npm run test:release
npm run report:bugs
npm run report:release
```

Normal tests, deliberate-defect exercises and production tests have separate configs
and report directories. test:release builds first and tests the actual dist files
with mocked external APIs, including an attempt to enable every defect URL flag.

## Source layout

- index.html: semantic shell and stable test IDs.
- src/main.js: initialization and selected-location rendering.
- src/components/citySearch.js: search lifecycle and keyboard interactions.
- src/components/currentWeather.js: weather states, retry, rendering and local clock.
- src/components/hourlyForecast.js: validated hourly-card rendering.
- src/components/geographyDetails.js: selected-location details and clock.
- src/components/temperatureUnits.js: unit controls and persisted preference.
- src/components/favorites.js: favorite controls, filtering/sorting, confirmation and persistence.
- src/components/connectionStatus.js: browser connectivity feedback.
- src/dev/bugMode.js: development gate, defect IDs, controls and practice namespace.
- src/services/http.js: fetch, timeout and cancellation.
- src/services/geocodingService.js: requests and location validation.
- src/services/weatherService.js: weather requests, units and data validation.
- src/utils/weatherCodes.js: WMO condition descriptions and icons.
- src/utils/time.js: timezone validation and local date/time formatting.
- src/utils/temperature.js: conversion and consistent display formatting.
- src/utils/storage.js: safe JSON storage and favorite validation/identity.
- src/utils/favoriteView.js: non-mutating filter/sort operations.
- tests/fixtures/currentWeather.js: deterministic mock, used only by tests.
- src/styles/main.css: responsive dark-blue theme.
- tests/unit: deterministic service checks.
- tests/ui: 56 mocked browser scenarios.
- tests/support/uiTest.ts: automatic network/error boundary and optional memory server.
- scripts/test-ui-memory.mjs: reproducible server-free runner.
- scripts/test-ui-all.mjs: cross-browser runner and binary preflight.
- tests/README.md: suite commands and debugging guide.
- tests/bugs and tests/release: isolated practice and built-asset verification.
- docs/PLAYWRIGHT_COVERAGE.md: feature-to-test matrix.
- docs/BUG_MODE.md: enabling/disabling each intentional defect.
- docs/RELEASE_CHECKLIST.md: final acceptance evidence and pending checks.
- tests/api: live geocoding, current/hourly weather and invalid-request checks.
- legacy: preserved pre-milestone weather prototype and documentation.

## Bug Mode

Disabled by default and in production builds. During npm run dev, visit
http://127.0.0.1:5173/?bugMode=1&bugs=TEMP-001 to open the practice panel. Its
checkboxes individually select TEMP-001, HUM-001, FAV-001, SEARCH-001 and TIME-001.
Changing a selection reloads; Exit practice mode returns to normal data.
All practice storage uses a separate earthscope:practice: namespace. See
 docs/BUG_MODE.md for intentional behaviors and isolation details.

## Known limitations and final validation

- 34 Node checks, 69 normal Chromium UI checks, 7 isolated practice checks and 3
  built-production checks passed. Browser source checks use reproducible memory routing.
- Production build passed and ignored all defect URL flags in the production tests.
- All 9 live API contracts were attempted but failed at sandbox DNS resolution.
  They must pass locally before claiming complete live integration acceptance.
- Final normal Vite/preview confirmation, Firefox/WebKit and manual accessibility
  review remain pending. Matching optional browser binaries are not installed here.
- No Git repository is configured, so no milestone commit was made.
- Refresh is manual; saved locations do not include offline weather data.
- Storage is local to each browser/origin; cross-tab/account sync is not implemented.
- Maps, news, 3D, native features, APKs and hosting/deployment are outside this v1.0 build.

## Roadmap

The six planned implementation milestones are finished. Final release sign-off is
pending the checks listed in docs/RELEASE_CHECKLIST.md; no extra v1.0 milestone is added.

Later planning only: maps/countries (v1.1), charts (v1.2), facts (v1.3), Three.js
(v2.0), Capacitor APK (v2.5), native/offline (v3.0), Appium Python (v3.5), news (v4.0).
