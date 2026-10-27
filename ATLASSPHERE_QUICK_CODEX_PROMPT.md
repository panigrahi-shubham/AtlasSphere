# AtlasSphere: 2–3 hour Codex upgrade

## Adaptation for this checkout

- Starting point: `eec5ff9`, preserving the existing Stage A implementation.
- Work on `atlassphere-quick-upgrade`; stop after Part 1 until the owner says continue.
- Free archive access, caching, display names, reviewer privacy and direct migration URLs already exist. Verify and reuse them. Do not remove existing privacy fields or reintroduce IDs that were already omitted.
- Keep the SkyAtlas product name during Part 1. AtlasSphere branding and NASA imagery begin only in Part 2.
- Replace the earlier slow-request fallback with the precise HTTP 502/503/504-only rules in Task 2. Keep existing API names and environment names compatible.
- Preserve earlier Cloudflare, CI and schema work, but make no new hosting, CI or schema changes in this quick upgrade.
- After `npm ci`, run the existing `npm run prisma:generate` prerequisite before importing the API or building. This generates code; it does not migrate a database.


> Save as `ATLASSPHERE_QUICK_CODEX_PROMPT.md` in the repo root and give it to Codex.
> **Time box: about 2–3 hours of total work.** Two stop gates. If a task runs over its time budget, stop, report, and move on; don't expand scope.

## 0. Context and rules (read first, 5 minutes)

- **Repo:** https://github.com/panigrahi-shubham/SkyAtlas · **Live:** https://skyatlas-9mae.onrender.com
- **Stack (verify, don't change):** Vite multi-page front end (`index.html`, `journeys.html`, `geoguess.html`…), Express 5 + TypeScript API (`api/`), PostgreSQL + Prisma, Playwright Test (TypeScript), Node test runner, GitHub Actions, Render.
- **Obey `AGENTS.md`.** Never remove or rename an existing `data-testid`, route, API contract or npm script. No secrets in the repo. Weather-value assertions use fixtures; live-network tests are tagged `@live` and excluded from default runs. Non-commercial: show Open-Meteo and NASA attribution.
- **Don't** rename the GitHub repo, change Render settings or secrets, migrate or delete databases, add paid services, or refactor unrelated code. List those as owner actions instead.
- **Report honestly:** for every check, give the exact command and result (passed / failed / skipped / blocked / not run). Never say a test passed unless you ran it.
- One branch: `atlassphere-quick-upgrade`. Small commits, one per task. No merge, no tag.

---

## Part 1: Audit + urgent fixes (about 75 minutes)

### Task 1. Quick audit (15 min, no code changes)
- Record the Node/npm versions, `git status`, and the npm scripts.
- Run the baseline: `npm ci`, `npm test`, `npm run typecheck:api`, `npm run build`. Run `npm run test:smoke` and `npm run test:api:local` only if their prerequisites are available; otherwise mark them blocked and say why.
- Confirm or refute each **known issue** below with the file and line. Don't fix anything yet:
  1. **P0, broken search:** live `/api/v1/geocode` returns 502. The Render server's shared outbound IP is rate-limited by Open-Meteo, while browsers can still reach Open-Meteo directly.
  2. **P0, data loss risk:** Render free Postgres expires 30 days after creation, then is deleted after a 14-day grace period.
  3. **P1:** `GET /api/v1/journeys/time-machine` returns 503 without a paid key, although Open-Meteo's free non-commercial plan includes the archive endpoint.
  4. **P1:** public `GET /api/v1/journeys/reviews/:landmarkId` returns reviewers' internal `userId`.

### Task 2. Fix the search and weather 502 (20 min)
- If `skyatlas-search-fallback.patch` is in the repo root, apply it with `git apply`. Otherwise implement the same behaviour:
  - `src/services/http.js`: errors carry `status`; add `fetchJSONWithFallback(primaryUrl, fallbackUrl, options)`. On **502/503/504 only**, it retries once against the public Open-Meteo URL from the browser. Never on 400/404/429, timeouts or aborts. If the fallback also fails, show the **original** error message.
  - Use it in `searchCities` (fallback `directGeocodeURL(term)`), the capital lookup in `src/components/worldAtlas.js`, `getCurrentWeather` (fallback `weatherURL(city)`) and `getAdvancedForecast` (fallback `advancedForecastURL(city)`).
  - `api/app.ts` `upstream()`: `console.error` the upstream hostname and status or error message (never secrets).
  - Tests: unit tests for the fallback rules; UI spec `tests/ui/providerFallback.spec.ts` (search and weather recover from 502/503; 429 is not retried). In existing tests that simulate 503s, add `mockOpenMeteoDown(page)` (a helper in `tests/support/uiTest.ts`) so they still assert the original error message.
- Run: `npm test` and the UI specs for search, weather, resilience and fallback.

### Task 3. Free Time Machine (15 min)
- In `api/journeys.ts`, when `OPEN_METEO_API_KEY` is unset, call `https://archive-api.open-meteo.com/v1/archive` **without** an `apikey`. When it's set, keep the current customer endpoint. The key must never appear in responses.
- Remove the "needs Professional key" 503 branch. Keep all validation (1940 → 7 days ago, coordinate ranges) and `reserveOpenMeteoCall()`.
- Add an in-memory cache (key `date:lat2dp:lon2dp`, max 2,000 entries) and `Cache-Control: public, max-age=86400`.
- Update `tests/api-local/phases.spec.ts`: no key → 200 via a stubbed fetcher, upstream host `archive-api…`, no `apikey`; with key → unchanged assertions; a cache hit makes one upstream call. Update the UI test in `tests/ui/journeys.spec.ts` that mocks the old 503 "Professional" message: mock a normal 200 instead, and keep one error-path test with a generic 502.
- Update any text in the README, docs or UI that says a paid key is required.

### Task 4. Hide reviewer IDs (10 min)
- The public reviews list returns `author: 'AtlasSphere explorer'` instead of `userId`. Keep `id`, `rating`, `body`, `createdAt` and `imageUrl`. Don't add a database migration.
- Update the front end if it reads `userId`. Add an API assertion that `userId` and `email` are absent.

### Task 5. Database expiry: prepare only (15 min)
- `prisma/schema.prisma`: add `directUrl = env("DIRECT_DATABASE_URL")`. Make local and CI scripts default `DIRECT_DATABASE_URL` to `DATABASE_URL` so nothing breaks. Document it in `.env.example`.
- Create `docs/DATABASE_MOVE_NEON.md` with the owner's steps:
  1. create a Neon free project
  2. copy the pooled and direct URLs
  3. set `DATABASE_URL` and `DIRECT_DATABASE_URL` in Render
  4. redeploy (migrations run in the build command)
  5. verify sign-up, trips, alerts and reviews on the live site
  6. delete the Render database only afterwards
  7. rollback: restore the old `DATABASE_URL`
- **Don't migrate anything yourself.**

### ⛔ STOP GATE 1
Report using the template in section 3, then wait for the owner to say "continue".

---

## Part 2: AtlasSphere rebrand + satellite view (about 75 minutes)

### Task 6. Rebrand to AtlasSphere (25 min)
- Change **user-facing** text only: page `<title>`s, visible headings, header and footer brand, the about page, README, the GeoGuess share text, and product-facing test titles or expectations.
- **Keep** env var names, the `skyatlas_refresh` cookie name, the `x-skyatlas-*` headers, database identifiers, migration names, routes, URLs and `data-testid`s.
- Search for `SkyAtlas|skyatlas|EarthScope|earthscope` and list every remaining match as **changed / kept for compatibility / owner action**.
- Run the UI tests that assert titles or brand text and update those expectations, listing each one.

### Task 7. Time Machine Earth: NASA satellite view (40 min)
Add a **"Satellite view"** panel to the existing Time Machine section on `journeys.html`, using the same latitude/longitude inputs (`#time-lat`, `#time-lon`).
- **Separate date control:** `<input type="date" data-testid="sat-date">`. The default is 7 days ago. The minimum is the first date of the chosen layer, which you must verify from the NASA GIBS docs or capabilities (MODIS Terra true colour is expected to start in February 2000). The maximum is today.
- **One image, no map library:** `<img data-testid="sat-image">` from the GIBS WMS `GetMap` endpoint:
  ```
  https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0
  &LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&CRS=EPSG:4326
  &BBOX={lat-3},{lon-4},{lat+3},{lon+4}&WIDTH=800&HEIGHT=600&FORMAT=image/jpeg&TIME={YYYY-MM-DD}
  ```
  - Verify the layer name, the WMS 1.3.0 BBOX axis order for EPSG:4326, and the date format against the current GIBS documentation before coding. If they differ, follow the docs and note it.
  - Clamp the BBOX to valid lat/lon ranges.
- Put the URL builder in its own module, `src/services/satelliteImagery.ts`, with an allowlisted layer catalogue (one layer: `{ id, name, start, attribution, limitations }`). The UI never builds URLs itself.
- **States:**
  - loading (`aria-live` "Loading satellite image…")
  - loaded: show the date, layer name and "Imagery: NASA GIBS / EOSDIS" attribution
  - error (`onerror` → "Satellite image unavailable for this date or place. Try another date.")
  - out of range ("Satellite imagery for this layer starts on …")
- **Honest labels:** "Daily satellite mosaic: clouds, gaps and swath lines are normal. Not street-level imagery." Keep it visually separate from the ERA5 weather result, since the two have different date coverage.
- The image `alt` text includes the place coordinates and date.
- **Tests:**
  - Unit: the URL has the right layer, `TIME`, clamped BBOX and size; dates before the start or in the future are rejected.
  - UI (mocked): route the GIBS URL to a small fixture JPEG, so the image and attribution show; route to 404, so the error message shows; an out-of-range date shows the range message.
  - One `@live` test that fetches a real GIBS image for a fixed past date and checks `content-type: image/jpeg`, excluded from default runs.

### Task 8. Final check (10 min)
- Run `npm test`, `npm run typecheck:api`, `npm run build`, plus the UI and API suites that can run in your environment.
- README: a short "What's new" section (search fallback, free Time Machine, satellite view, AtlasSphere name) and a "Known limitations" section.

### ⛔ STOP GATE 2
Report using the template, then stop.

---

## 3. Report template (at each stop gate)
```
## Gate N report
Branch / commits:
Baseline (Gate 1 only): command → result; blocked checks and why
Changes: file → what → why
Tests: new · changed (and why) · commands run → passed/failed/skipped/blocked
Known issues confirmed/refuted (Gate 1): #1–#4 with file:line evidence
Remaining legacy names (Gate 2): changed / kept / owner action
Owner actions: (e.g. Neon move, Render env vars, GitHub rename, keep-warm ping)
Not done / time-boxed out:
Ready for owner review: Yes / No, and why
```

## 4. Out of scope (don't do)
Copernicus CDS, climate charts, future projections, putting satellite tiles on the 3D globe, Cloudflare Pages, POM refactors, config consolidation, CI workflow changes, new database tables, Android.