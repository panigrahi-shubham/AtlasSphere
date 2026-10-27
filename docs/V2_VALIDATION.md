# EarthScope v2.0 validation — 26 October 2026

## Scope delivered

| Planned version | Implemented behavior | Main browser evidence |
| --- | --- | --- |
| v1.1 | Interactive SVG world map, zoom/reset/pan, selectable country shapes, searchable/filterable 250-record country directory, country facts, capital weather lookup | tests/v2/exploration.spec.ts |
| v1.2 | Seven-day model forecast, highs/lows, precipitation probability/total, max wind, UV, sunrise/sunset, three switchable charts, accessible data table | tests/v2/exploration.spec.ts; tests/api/advanced.spec.ts |
| v1.3 | Country geographic position/coastline facts, 16 sourced curated landmarks, country/worldwide filtering, approximate landmark weather and favorites | tests/v2/exploration.spec.ts; tests/unit/v2.test.js |
| v2.0 | Three.js globe, bundled vector-derived texture, rotation/zoom/reset, selected-location marker/cloud/rain/snow, text equivalent and WebGL fallback | tests/v2/exploration.spec.ts |

## Executed checks

- Node regression: **41 passed** (`npm test`).
- Existing Chromium UI: **69 passed through the normal Vite server** (`npm run test:ui`, three workers).
- New v2 Chromium checks: **17 passed against actual built assets**, including real
  Three.js rendering using software WebGL and a forced WebGL-unavailable test
  (`npm run test:v2`). No live external network is allowed in UI tests.
- Live Open-Meteo API: **11 passed**, including seven-day daily data and capital
  country restriction (`npm run test:api`). This environment's ordinary shell DNS
  is restricted; live checks ran through the available host execution route.
- Development Bug Mode: **7 passed** using the existing raw-source routing runner.
- Production protections: **3 passed** against built assets (`npm run test:release`).
- Vite production build: **passed**. Globe code is a lazy-loaded ~132 KB gzip chunk;
  Vite emits its standard >500 KB uncompressed chunk advisory.
- Visual review: map, narrow layout, and an actual Three.js globe centered on India
  with localized rain/cloud effects were inspected. Screenshots are internal QA
  artifacts, not part of the source deliverable.

148 automated checks passed across the listed suites. Final counts describe the
final passing runs; a transient Windows API worker crash during a concurrent run
was followed by a clean serial 11/11 API run.

## Defects found and corrected during implementation

- Exact country selection in tests: searching India also correctly returns British
  Indian Ocean Territory; tests now choose the exact accessible country name.
- Country coordinates are reference coordinates. Capitals are geocoded within the
  selected country before opening their weather.
- Selected-location state and pending extended requests are invalidated on search
  clear/change, so old data cannot repopulate a new selection.
- The old 25-hour request returned only 23 future hourly slots in a live fractional
  timezone response. A 48-hour buffer now feeds the same next-24-hour validator;
  no display window or missing-data fallback is broadened to later days.
- The upstream Japanese-script Tokyo query returned no matches. The live
  international-name test now uses the supported accented city name Zürich. No
  native-script results are fabricated.
- Accessibility checks now evaluate visible controls. Hidden deferred sections are
  additionally checked after expansion in the v2 suite.

## Limits / remaining review

- Firefox/WebKit matching binaries were not installed or tested in this turn;
  Chromium success does not establish cross-browser or hardware-GPU parity.
- No full WCAG audit, real screen-reader audit, real touch-device test or graphics
  driver matrix was performed.
- Dataset snapshots and 1:110m boundaries are generalized reference information;
  the directory includes some small territories absent from the map.
- Landmark collection is limited to 16 entries. Country reference data is bundled
  and dated, not a live government/census feed.
- Weather visuals are illustrative and localized, not a global live weather overlay.
- No Git repository is configured in this folder, so no commit was created.
- Android, news and backend accounts remain outside this website release.

## Useful test IDs

`atlas-load`, `world-map`, `map-country`, `map-zoom-in`, `map-zoom-out`, `map-reset`,
`map-zoom-level`, `map-location`, `country-filter`, `country-region`, `country-count`,
`country-directory`, `country-option`, `country-details`, `country-title`,
`country-facts`, `country-weather`, `country-status`, `landmarks-worldwide`,
`landmark-count`, `landmark-list`, `landmark-card`, `advanced-section`,
`advanced-load`, `advanced-status`, `chart-metric`, `chart-caption`, `weather-chart`,
`daily-table`, `daily-forecast`, `daily-row`, `globe-load`, `globe-status`,
`globe-canvas`, `globe-renderer`, `globe-controls`, `globe-rotate`, `globe-zoom-in`,
`globe-zoom-out`, `globe-reset`, `globe-weather`.

Use accessible country names to disambiguate repeated `country-option` and
`map-country` elements. All earlier v1 test IDs remain available.
