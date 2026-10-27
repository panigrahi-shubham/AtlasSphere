# AtlasSphere — Weather and wonders of the world

AtlasSphere combines live weather, a country atlas, landmark stories, an interactive globe and GeoGuess. The homepage adapts the supplied design with bundled photos and working feature links. The concept's Explorer Lab missions are not implemented.

[Live website](https://atlassphere.vercel.app) · [GitHub repository](https://github.com/panigrahi-shubham/SkyAtlas)

## What's new

- AtlasSphere is the visible product name across pages and GeoGuess sharing.
- City search and weather retry once directly with Open-Meteo after a server HTTP 502, 503 or 504.
- Historical Time Machine uses Open-Meteo's free non-commercial archive, with validation and an in-memory cache.
- Journeys now includes a separate NASA satellite view with a UTC date picker, daily MODIS Terra imagery and linked NASA attribution. See [imagery verification and coverage](docs/SATELLITE_IMAGERY.md).

## Known limitations

NASA daily mosaics can contain clouds, gaps or swath lines; recent dates may have incomplete imagery. They are not street-level images. Satellite coverage starts on 2000-02-24 and differs from historical weather coverage. Weather and satellite requests need internet access; provider failures can still prevent loading.

The GitHub repository, environment names and stored-data identifiers retain their existing names for compatibility. Production now uses Vercel and a newly initialized Neon database. Automatic alert checks need the owner's scheduled job; password-reset email delivery requires an email provider. Provider quotas and caches are per process, so a shared quota/cache design is needed before traffic grows. Existing dependency audit findings and the large globe bundle are recorded in the gate reports.

## Run locally

Requires Node.js 24 and npm. Run `npm ci`, `npm run prisma:generate`, then `npm run dev`; Vite serves the website and Express API together at http://127.0.0.1:5173. For a production-style run, use `npm run build`, then `npm start` and open http://127.0.0.1:3000. The server serves the built pages, `/api/v1/*`, `/docs` and `/openapi.json` from one origin. Browser location needs HTTPS or localhost.

Set `APP_ENV=test` and `FIXTURES=1` to return fixed weather and city data from `tests/fixtures`. Both settings are required. Do not enable fixture mode publicly. Anonymous favorites and GeoGuess scores stay in browser storage. Signed-in favorites and theme use PostgreSQL when configured.

## Website-first roadmap

Phases 3–6 are in progress: accounts/PostgreSQL, Journeys, an isolated Test Lab, web automation and hosting preparation. The current verification gates are listed in `docs/PHASES3-6_STATUS.md`. Android remains deferred until the owner explicitly authorizes it.

## GitHub and hosting

The live site uses **Vercel + Neon**, with no Render dependency. See the [launch report](docs/VERCEL_PUBLISH_STATUS.md) and [deployment guide](docs/DEPLOY_VERCEL_NEON.md). The Vercel build packages the existing API and Vite pages together; database migrations are applied separately. The Render instructions below are retained for the earlier deployment.

Upload the source files from the ZIP to a GitHub repository. Connect that repository to a **Node web service** on Render. Use `npm ci && npm run prisma:generate && npm run prisma:migrate && npm run build` as the build command, `npm start` as the start command, and `/api/v1/health` as the health check. The included `render.yaml` supplies these settings and requires you to configure a PostgreSQL `DATABASE_URL` secret before deployment; it generates `AUTH_SECRET` and runs migrations before deployment. It does not create a database or a paid resource. `DIRECT_DATABASE_URL` is optional for local migrations and falls back to `DATABASE_URL`; use the direct connection when the application URL is pooled. `npm start` defaults to production. A static-only host cannot serve the Phase 2 API. The site uses root-relative asset paths.

The server proxies weather and geocoding to Open-Meteo. The browser retries once against the public provider after HTTP 502, 503 or 504. It never falls back on 400, 404, 429, cancellation or a client timeout, and preserves the original error if both sources fail. It enforces per-process hourly, minutely and daily call budgets below the free service limits; run one API instance unless you add a shared quota store. Historical Time Machine uses the free non-commercial Open-Meteo archive by default. An optional server-only `OPEN_METEO_API_KEY` selects the customer archive. Do not expose that key in frontend variables. The bundled news file initially contains clearly labeled sample entries. A GitHub Action runs every three hours to fetch the Met Office RSS feed and commit relevant headlines to `api/news.json`. If the feed fails, the previous snapshot remains. See `docs/PHASE2.md` for behavior and testing.

The owner-operated [Neon move and rollback guide](docs/DATABASE_MOVE_NEON.md) covers preserving existing data before changing database connections.

## Verify

Run `npm test`, `npm run typecheck:api`, `npm run test:accounts:local`, `npm run test:api:local`, `npm run test:smoke`, `npm run test:a11y`, `npm run test:ui`, `npm run test:bugs` and `npm run test:release`. Browser suites require Playwright browsers. `npm run test:api` contains separate `@live` checks and requires access to Open-Meteo and NASA GIBS.

## Earlier phases
## GeoGuess — Phase 1.5

Open **Play GeoGuess** in the main navigation or visit `/geoguess`. Pick Landmark
Pin to place a guess on a world map, or Country Outline to identify a silhouette.
Each game has five 30-second rounds, feedback, a score breakdown, replay, a share
link and a local top-10 leaderboard per mode. It reuses bundled country shapes and
the 16 existing landmarks; it makes no network requests for game data. The pin
game treats guesses within 50 km as exact because one map pixel covers tens of km.

Reproduce a game with `/geoguess?mode=landmark&seed=42&start=1`, or set `mode=outline`.
Without a seed, the app creates one and puts it in the URL. Arrow keys move the
map crosshair, Enter places it, and 1–4 answer an outline round. Celsius shows
distances in km and Fahrenheit in miles. Scoreboards are local to this browser;
storage denial leaves the game playable but disables saving.

`window.__geoguess` is available only in Vite development: `getState()`,
`getRounds()` and `toScreen(lat, lon)` support stable Playwright automation.
Development-only Bug Mode accepts `bugs=GG-BUG-1` (incorrect miles-based score)
and `bugs=GG-BUG-2` (timer continues briefly after answering) with `bugMode=1`.
Both are off by default and absent from production. Run `npm test`,
`npm run test:ui` and `npm run test:bugs` to check the game and existing app.

Phase 1.5 implements the prompt's MVP. Daily challenge, hint and streak are
stretch ideas left for a later phase. There is no online leaderboard or account.

The current roadmap's first phase adds a sticky responsive header with units,
theme and mobile menu, and a city search in the hero; a weather dashboard with current, hourly and on-demand
seven-day data; browser location lookup; loading and error states; and a clearly
labeled local sample-news panel. It also adds About and 404 pages, a favicon and
visible Open-Meteo attribution. The theme is selected before the stylesheet paints.
The existing atlas, photos, landmarks, Three.js globe, favorites and Bug Mode remain.

Run `npm run dev` and open http://127.0.0.1:5173/. Search for a city or use the
location button (browser permission required). Seven-day highs, lows, UV and sun
times appear after **Load seven-day forecast**. News is fixture content for layout
and QA, not a live feed. Weather and city lookup require network access.

The new roadmap and baseline inventory are in `docs/ROADMAP.md` and
`docs/INVENTORY.md`. Phase 1 results and acceptance limits are in
`docs/ROADMAP_PHASE1.md`. The earlier visual refresh retains its historical
record in `docs/PHASE1.md` below this new phase's work.

---

# Earlier visual refresh

Phase 1 adds a photographic hero, three featured-place cards, locally bundled
photos for all 16 landmarks, a shared light/dark design system, persistent browser
theme preferences, responsive navigation and current-weather appearance/story.

Run `npm run dev`, then open http://127.0.0.1:5173/. Switch themes in the header.
On mobile, use Menu to open navigation. Open the world atlas for landmark photos.
All imagery is bundled: no API key, image CDN or external font request is needed
at runtime. The hero is landscape inspiration, not a photograph of the searched
city. Landmark credits and license links appear on their cards.

Validation: 41 Node checks, 69 original UI checks, 25 design/exploration browser
checks, 11 live API checks, seven Bug Mode checks and three production checks
passed (156 total). Production build passed. See `docs/PHASE1.md` for evidence,
photo attribution and scope. Run `npm run test:v2` for design/exploration tests.

This paragraph records the earlier Phase 1 release. Phase 2 added the backend described above; account and Journeys work is tracked in `docs/PHASES3-6_STATUS.md`, and Android is deferred. The v2 functionality and test IDs remain available.

---

# AtlasSphere v2.0 — release candidate

A geography and weather explorer built with HTML, CSS, JavaScript modules and Vite.
This version includes the planned v1.1, v1.2, v1.3 and v2.0 features. Existing city
search, current weather, hourly forecasts, units, favorites and practice Bug Mode remain.

## Start on Windows

Use Node.js 24. From `C:\Projects2\SkyAtlas`:

```powershell
npm install
npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:5173/ and keep the terminal running. Search and select a city.
For a production preview, run `npm run build`, then `npm run preview` and open
http://127.0.0.1:4173/. Opening index.html directly is unsupported.

## Explore v2

1. **Open world atlas** loads a bundled map with 177 simplified country shapes.
   Click or keyboard-select a country. Zoom in/out and reset with the map controls;
   drag the ocean background to pan. Focus the map for arrow keys and +/− zoom.
2. **Country directory** includes 250 country/territory records. Search by country
   or capital, filter by region, and select a record for area, languages, regional
   information, coastline/landlocked status and hemisphere facts. Reference
   coordinates describe the country, not its capital.
3. **Find capital weather** performs a fresh country-restricted geocoding lookup
   before selecting the capital. It never treats country-center coordinates as
   capital coordinates. Multiple capitals use the first listed capital for lookup.
4. **Facts & landmarks** includes 16 curated landmarks with source links to UNESCO.
   Country selection filters the collection. Show worldwide collection restores
   every entry. Explore a landmark to load model weather at approximate coordinates;
   save it as a favorite using the existing control.
5. Select a city/landmark, then **Load seven-day forecast**. View highs/lows, maximum
   rain probability, rain totals, maximum wind, UV and sunrise/sunset. The SVG chart
   switches between temperature, rain probability and wind; the accessible table
   contains all values. Celsius/Fahrenheit updates charts and tables without requests.
6. **Launch 3D globe** loads Three.js only when requested. Drag/arrow keys rotate;
   +/− and buttons zoom. Auto rotate is optional and respects reduced motion.
   Selected locations have a marker and localized clouds/rain/snow effects based on
   fetched conditions. The status gives the condition in text. This is illustrative,
   not a satellite image or a global live-weather layer. Reset restores the default
   orientation and stops rotation.

The atlas/country snapshot and globe textures are bundled; runtime map/CDN/API keys
are unnecessary. A running local server is required. City lookup and weather need
internet. No service worker, offline weather cache or Android APK is included.

## Test commands

```powershell
npm test                  # service, data and utility regression tests
npm run test:ui           # existing mocked UI scenarios through a real Vite server
npm run test:v2           # build + v2 Chromium checks against actual built assets
npm run test:api          # separate live Open-Meteo contracts; needs internet
npm run test:bugs         # isolated development-only injected defects
npm run test:release      # build + production protection checks
npm run report:v2         # open v2 HTML report
```

UI tests mock all external requests and reject unmocked requests and uncaught errors.
`test:v2` supplies the actual production files through Playwright routing without a
server, including dynamic JavaScript chunks; it is not a substitute for `test:ui`.
Its GPU test uses Chromium software WebGL, and a separate test verifies WebGL loss
of availability. Hardware/browser visual behavior can differ.

For all existing UI scenarios across browsers:

```powershell
npx playwright install chromium firefox webkit
npm run test:ui:all
```

`npm run test:ui:memory` is a raw-source fallback for the existing v1 UI suite.
It does not transform the npm imports used by atlas/globe modules; use `test:v2`
for v2. Reports, screenshots and traces are written to their own test directories.

## Data, units and missing measurements

- Open-Meteo current/hourly and daily forecasts use separate cancellable requests,
  explicit metric API units and Unix timestamps. Daily forecasts load on demand.
  Current/hourly request 48 hours as a timezone buffer, while displaying only the
  next 24 hours. This fixes short live results observed with fractional UTC offsets.
- Celsius is the canonical temperature; conversion happens only for display.
  Daily dates and sunrise/sunset are formatted in the response timezone.
- Missing measurements show **Not available**. Chart lines break at missing points.
  A failed daily request does not hide valid current conditions. A failed daily
  refresh explicitly labels the retained older forecast.
- Country reference data is a compact snapshot of mledoze/countries retrieved on
  26 October 2026, not a current census or political authority. No population data
  is invented. Small territories may appear only in the directory. Some names or
  boundaries may differ across the country and Natural Earth datasets.
- Search accepts international input, but the upstream catalog may not match some
  native-script names. Try a Latin-script name when there are no results.
- Approximate landmark coordinates represent a point, not a site boundary or a
  nearest weather station. The 16-entry collection is deliberately limited.
- Seven-day estimates are model forecasts, not emergency/severe-weather alerts.
  Sunrise/sunset can be unavailable during polar day/night.
- Three.js is a larger optional download (~133 KB gzip). It is lazy-loaded after
  Launch 3D globe. Devices without WebGL 2 retain the map and directory.

## Sources and licenses

- Weather/geocoding: [Open-Meteo](https://open-meteo.com/), with geocoding based on
  [GeoNames](https://www.geonames.org/).
- Map shapes: Natural Earth through [world-atlas](https://github.com/topojson/world-atlas).
  These are generalized reference boundaries, not navigation data or an endorsement
  of territorial claims.
- Country dataset: [mledoze/countries](https://github.com/mledoze/countries), ODbL.
  The derived country snapshot in `src/data/countries.json` is shared under ODbL;
  see `docs/licenses/countries-LICENSE.txt` and `docs/ATTRIBUTION.md`.
- Landmark facts: concise editorial summaries with links to individual UNESCO records
  in `src/data/landmarks.js`. Follow those links for authoritative descriptions.
- Three.js (MIT), d3-geo (ISC), topojson-client (ISC), world-atlas (ISC).
  Package licenses remain in their npm distributions.

## Structure

`src/components/` owns UI behavior; `src/services/` handles and validates API data;
`src/utils/` provides pure helpers; `src/data/` holds country/landmark references.
`tests/v2/` covers exploration and globe behavior; `tests/api/advanced.spec.ts` adds
live daily-forecast and capital-geocoding contracts.

## Bug Mode and earlier guides

Development-only practice defects stay disabled by default and in production:

```text
http://127.0.0.1:5173/?bugMode=1&bugs=TEMP-001
```

See `docs/BUG_MODE.md` for individual defect IDs and isolated practice storage.
See `docs/V2_VALIDATION.md` for the current validation record and feature matrix.
Earlier milestone notes are retained in `docs/V1_IMPLEMENTATION_HISTORY.md`.

## Current scope and Android

The website includes account and PostgreSQL journeys, Time Machine, trip planning,
alerts, reviews and the isolated development Test Lab. Review actual gates and
known limits in `docs/PHASES3-6_STATUS.md`. Android remains deferred until the
owner explicitly authorizes that phase.

