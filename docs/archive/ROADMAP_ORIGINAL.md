# Weather QA Portfolio App: Build Prompt

Oct 26, 2026 · @Shubham P

## Role and goal

You are the lead engineer on a weather website and Android app whose purpose is to be tested, not to make money. The owner is a QA engineer building an SDET portfolio, so every feature must be easy to automate and every phase must ship with tests.

The project is non-commercial: no ads, no payments, and a visible "Weather data by Open-Meteo.com" credit wherever its data appears.

Work on one phase at a time. Do not start the next phase until the current phase's acceptance checks and tests pass and the owner says go.

## Permanent rules

These rules apply in every phase. Copy them into AGENTS.md at the repository root, and keep this roadmap separately in docs/archive/ROADMAP.md.

- **Existing work first.** Inventory and run the existing tests before changing anything. Regression tests must pass at the end of every phase. If a test has to change, say why.
- **Stable test IDs.** Every interactive element and every displayed data value has a kebab-case `data-testid` (for example `search-input`, `temp-value`, `news-list`). Never rename or remove one without approval.
- **Test controls never reach production.** Database reset, fake mailbox, chaos controls, bug mode and seeded accounts are registered only when `APP_ENV` is `development` or `test`. Production does not register those routes, even behind an admin key. A public practice site is a separate deployment labelled "Test deployment".
- **No secrets in the browser or the repo.** Keys and passwords live in git-ignored `.env` files, with a committed `.env.example`. Third-party keys sit behind the backend proxy.
- **One database engine.** Use PostgreSQL in development, CI and production.
- **Parallel-safe tests.** Each Playwright worker gets its own users and data. Never reset global state during a parallel run. Chaos tests that need exclusive state run in a separate job.
- **Deterministic tests.** Tests that check weather values use fixtures or mocked responses. A few separate live tests call the real API, carry the `@live` tag and stay out of the default run.
- **Git discipline.** Create the repository if it is missing. One branch per phase, small commits, and a tag such as `phase-1-done` at the end.
- **Licence compliance.** Open-Meteo's free API is for non-commercial use, under 10,000 calls a day. Show the credit link.
- **Accessibility basics.** Labelled inputs, logical focus order, full keyboard use, WCAG AA colour contrast.

## Tech stack and layout

Keep the existing website and add to it. Do not rewrite it in a framework.

| Area | Choice |
| --- | --- |
| Website | Existing HTML, CSS and JavaScript; new modules in TypeScript |
| Backend (Phase 2) | Node.js with Express and TypeScript, OpenAPI and Swagger UI |
| Database (Phase 4) | PostgreSQL with Prisma migrations, Docker Compose for local and CI |
| Android | Capacitor wrapping the same website (hybrid WebView) |
| Web and API automation | Playwright with TypeScript |
| Android automation | Appium with Python and pytest |
| CI | GitHub Actions |
| Data sources | Open-Meteo for forecast, geocoding, air quality and history; RSS feeds for news |

```text
weather-app/
  AGENTS.md
  docs/archive/ROADMAP.md, INVENTORY.md, KNOWN_DEFECTS.md
  web/          website (HTML, CSS, JS, TS modules)
  api/          backend (from Phase 2)
  mobile/       Capacitor project (from Phase 3)
  tests/
    web/        Playwright UI tests
    api/        Playwright API tests
    mobile/     Appium Python tests
    fixtures/   weather, geocoding and news fixtures
  .github/workflows/
```

## Step 0: baseline before any phase

Do this once, before Phase 1, so nothing already working gets broken.

1. If the folder is not a Git repository, run `git init`, add a `.gitignore` (including `node_modules`, `.env`, build output) and make a first commit named "baseline".
2. Write `docs/archive/INVENTORY.md` listing every existing feature, page, `data-testid` and external API call.
3. Run the existing Playwright suite and record passed, failed and skipped counts plus run time. Fix nothing yet. Report any test that already fails.
4. Tag the commit `baseline`.
5. Create `AGENTS.md` from the permanent rules and move this roadmap to `docs/archive/ROADMAP.md`.

**Acceptance:** the inventory is committed, baseline results are recorded, and the tag exists.

## Phase 1: Web polish

Goal: make the existing site look like a production weather product while keeping every current feature and test working.

**Build**

- **Design system:** CSS variables for colour, spacing scale, type scale (Inter), radius and shadows. Reusable styles for card, button, input, chip and loading skeleton.
- **Themes:** light and dark, defaulting to the system setting, switched from the header, saved in browser storage so the choice persists before login. Keep AA contrast in both.
- **Navigation:** sticky header with logo, city search, °C/°F toggle and theme toggle. On phones it collapses into a menu that works by keyboard and touch.
- **Dashboard:** hero card (city, large temperature, condition icon, feels like, high and low), scrollable hourly strip, 7-day forecast, detail cards (wind, humidity, UV, sunrise and sunset), and a saved-cities area.
- **States:** loading skeletons, offline, API error, city not found, location permission denied (fall back to search), and empty states.
- **News section, UI only:** a list read from a fixture file, each item with headline, snippet, source, time and link. Include loading, empty and error states.
- **Page basics:** footer with the Open-Meteo credit, an about page, a 404 page, favicon and page titles.
- **Layout rule:** no horizontal page scroll from 320 px wide. Scrolling is allowed only inside the hourly strip and tables.

**Not in this phase:** air quality, photo backgrounds, command palette, 3D, accounts, new feature pages.

**Tests to add**

- Theme choice persists after reload and applies on first paint.
- Header, menu and search work by keyboard alone.
- Menu collapses at 375 px width; no horizontal overflow at 320 px.
- °C/°F toggle changes every displayed temperature.
- Each error and empty state, using mocked network responses.

**Acceptance**

- All Step 0 tests still pass and no existing `data-testid` changed.
- Lighthouse accessibility score is 90 or higher on desktop and mobile.
- Every state can be reached in tests through fixtures or route mocking.

## Phase 2: Own API foundation

Goal: put a small backend between the website and Open-Meteo, so the app has its own API to test and the weather news has a home.

**Build** (Express and TypeScript, routes under `/api/v1`)

- `GET /weather?lat&lon&units` proxies the Open-Meteo forecast.
- `GET /geocode?q=` proxies city search.
- `GET /news` serves the saved news file with a `lastUpdated` time.
- `GET /health` returns service status.
- **Validation:** latitude -90 to 90, longitude -180 to 180, query length 2 to 80. Bad input returns 400 with a shared error shape: `{ error: { code, message, field } }`.
- **Caching:** in memory, 10 minutes for weather and 24 hours for geocoding, with an `X-Cache: HIT` or `MISS` header.
- **Rate limit:** 60 requests a minute per IP; over the limit returns 429 with `Retry-After`.
- **Upstream failures:** a 5-second timeout returns 504; any other upstream error returns 502.
- **Fixture mode:** when `APP_ENV=test` and `FIXTURES=1`, return fixed data from `tests/fixtures` so tests are repeatable.
- **Docs:** an OpenAPI spec with Swagger UI at `/docs`.
- **News pipeline:** `scripts/fetch-news.ts` reads RSS feeds, keeps items matching weather keywords (monsoon, cyclone, heatwave, IMD, forecast), and stores headline, snippet of at most 200 characters, source, link and publish time in `news.json`. A GitHub Action runs it every 3 hours.
- The website now calls this API instead of Open-Meteo directly.

**Not in this phase:** login, database, user data.

**Tests to add**

- Postman collection first, then Playwright API tests for the same cases.
- Status codes 200, 400, 404, 429, 502 and 504.
- Response schema, field types, and equal array lengths for hourly data.
- Cache header behaviour, response time limit, and negative inputs.
- A contract test that checks real responses against the OpenAPI spec.
- News: empty file, stale file, feed down, and each item's link format.

**Acceptance**

- Swagger docs match actual behaviour.
- All Phase 1 web tests pass against the new API in fixture mode.

## Phase 3: First Android APK

Goal: package the website as an Android app early, so there is a real device target for Appium while the project keeps growing.

**Build**

- Capacitor project in `mobile/` that wraps the website build. Use an app id such as `com.example.weatherqa`.
- A debug APK built with one command (`npm run android:debug`), plus a short guide to install it on a connected device with `adb`.
- Native geolocation with the real Android permission dialog, a "Use my location" button, and a fallback to city search when permission is denied.
- WebView debugging enabled for debug builds only, so Appium can switch into the WebView context.
- App features at this stage: city search, current weather, forecast, favourites (saved locally for now), GPS and news.
- Basic app icon and splash screen. Back button and offline behaviour handled.

**Not in this phase:** login, push notifications, release signing.

**Tests to add** (Appium Python, pytest, UiAutomator2)

- Launch the app and confirm the dashboard loads.
- Allow and deny the location permission in the native dialog.
- Switch from `NATIVE_APP` to `WEBVIEW` context, search a city and check the temperature is shown.
- Turn network off during load and check the error state; turn it back on and check recovery.
- Rotate the device and confirm the layout holds.
- Structure: page objects, device settings in a config file, a screenshot saved on every failure.

**Acceptance**

- The APK installs on the connected device and every Phase 1 and 2 feature works inside the WebView.
- At least five Appium tests pass on the device.

## Phase 4: Accounts and persistence

Goal: add login and a database so favourites survive across sessions and devices, with the security rules written down before any code.

**Decide and document first** (in `docs/AUTH.md`)

- **Passwords:** minimum 8 characters with upper case, lower case, digit and symbol; stored with bcrypt or argon2.
- **Tokens:** short-lived access token (15 minutes) held in memory; refresh token in an HttpOnly, Secure, SameSite cookie. Rotate the refresh token on each use, reject a reused one, and revoke it on logout.
- **Lockout:** 5 failed logins lock the account for 15 minutes.
- **Password reset:** 6-digit code, valid 10 minutes, single use, rate limited. In test it goes to the fake inbox (development and test only).
- **Authorization:** a user can read and change only their own data. Another user's data returns 403 or 404.

**Build**

- PostgreSQL with Prisma, Docker Compose for local and CI, migrations committed to the repo.
- Registration, login, logout, forgot and reset password.
- Favourites: add, remove, list and sync across devices; maximum 20, duplicates rejected.
- Theme preference syncs to the account after login; browser storage stays as the fallback.
- A seed script for development and test only, using a development password that meets the policy. It refuses to run when `APP_ENV=production`.

**Tests to add**

- Registration validation: each password rule, duplicate email, invalid email.
- Login, wrong password, lockout and unlock, expired token, refresh, logout.
- Password reset: valid code, expired code, reused code.
- Cross-user authorization attempts on every favourites endpoint.
- Favourites persist after reload and sync between two browser contexts.
- Appium: log in on the device and see the same favourites.

**Acceptance**

- All earlier tests still pass; auth rules in `docs/AUTH.md` each have at least one test.

## Phase 5: Product journeys

Goal: add four feature journeys, one at a time. Each one is built, tested and committed before the next starts, and the owner may skip any of them.

| Step | Feature | Key rules | Tests |
| --- | --- | --- | --- |
| 5a | Time Machine | Slider across eras. Dinosaur era is a scientific estimate, recent past uses real Open-Meteo history from 1940, next days use the real forecast, the 31st century is fiction. Every card is labelled "Real data", "Scientific estimate" or "Fiction" and carries a "Not a forecast" note. Era text comes from a fixed JSON file. Dates before 1940 show a clear message. | Slider by keyboard and touch, first and last stop, pre-1940 date, correct label per era, era theme changes |
| 5b | Trip planner | Trip has name, city, start and end date. End must be after start, maximum 14 days, no start date in the past. Shows a forecast per day. Edit and delete allowed. | Form validation, date boundaries, edit, delete, forecast per day, full journey |
| 5c | Weather alerts | User sets a rule (city, condition, threshold, for example rain probability above 60 percent). Matches appear in an in-app notification list. In test mode the check runs against fixtures. | Create, edit and delete rules, trigger with fixtures, notification list, no duplicates |
| 5d | Landmark reviews | Rating 1 to 5, text up to 500 characters, optional image (JPG or PNG, 2 MB maximum). Users can edit and delete only their own reviews. Sort and filter. | Rating and length limits, upload type and size, own-review rule, sort and filter |

For every step, add Playwright tests for the web and API parts, and one Appium test for the main journey on the device.

**Acceptance**

- Each step has its own branch, tests and tag, and all earlier tests still pass.

## Phase 6: Isolated Test Lab

Goal: give the owner real defects to find and awkward UI to automate, without any risk to the production app.

**Isolation rules**

- The Test Lab exists only when `APP_ENV` is `development` or `test`, or on a separately deployed site labelled "Test deployment". Production returns 404 for every Test Lab route and ignores all defect flags.
- Defect flags and failure controls apply per request or per test session through a header, never globally, so parallel runs do not clash. Anything global runs in an exclusive environment.
- Data reset works only on a disposable test database.

**Build**

- **Practice defects:** switchable flags such as wrong unit conversion, missing news item, wrong era label, crash on empty city, stale cache, duplicate favourite allowed, and forecast off by one day. Each defect has an ID, expected result, actual result and severity. The answer key goes in `docs/KNOWN_DEFECTS.md`.
- **Controlled failures:** added delay, upstream 500, timeout, malformed JSON and simulated offline.
- **Fake inbox:** shows reset codes and emails, development and test only.
- **UI practice cards:** alert, confirm and prompt dialogs; iframe; open shadow DOM; closed shadow DOM; file download; drag and drop; dynamic table; infinite scroll; toast that disappears.

The closed shadow DOM card demonstrates a limit: Playwright locators cannot enter a closed shadow root, so tests assert only on behaviour the user can observe.

**Tests to add**

- One test per planted defect that fails with the flag on and passes with it off.
- Failure-handling tests for each controlled failure, including the error message shown and recovery afterwards.
- A test that starts the app with `APP_ENV=production` and confirms the Test Lab routes, fake inbox and flags are absent.
- Tests for each UI practice card.

**Acceptance**

- Every defect in the answer key is caught by a test, and the production-mode test passes.

## Phase 7: Automation and CI

Goal: connect the tests written in earlier phases into frameworks that run themselves and report results. This phase expands and tidies existing tests; it does not start testing from zero.

**Build**

- **Playwright projects:** Chromium, Firefox and WebKit for the web, a separate API project, and a mobile-emulation project.
- **Framework structure:** page objects, shared fixtures, a saved login state per worker, tags `@smoke`, `@regression`, `@live` and `@a11y`.
- **Reporting:** HTML report, trace on first retry, screenshots on failure, parallel workers and sharding.
- **Accessibility checks:** automated axe scans on the main pages.
- **Appium Python framework:** pytest, page objects, device settings in config, screenshots and an HTML report on failure.
- **Flaky-test policy:** no fixed sleeps, at most one retry, and a list of tests that needed a retry.
- **Coverage matrix** in `docs/archive/COVERAGE.md`: each feature against web, API and mobile tests.

**GitHub Actions workflows**

| Workflow | When | What it runs |
| --- | --- | --- |
| `pr.yml` | Every pull request | Lint, API tests, web smoke on Chromium |
| `nightly.yml` | Daily | Full cross-browser run, `@live` tests, Android emulator smoke |
| `news.yml` | Every 3 hours | Fetches news and updates `news.json` |

Upload reports and traces as workflow artifacts and add a status badge to the README.

**Acceptance**

- The pull request pipeline is green and a sharded parallel run passes.
- The coverage matrix has no feature without at least one automated test.

## Phase 8: Release preparation and extras

Goal: put the app online, check performance and accessibility, and produce a final Android build with a README that shows the testing work.

**Build**

- **Deployment:** the website on a free static host such as Cloudflare Pages or Netlify, the API and PostgreSQL on a free-tier host. Free servers may sleep when idle, so tests send a warm-up request first. Check each host's terms for non-commercial use.
- **Production safety:** confirm no test routes, fake inbox or defect flags exist. Optionally deploy a separate, clearly labelled Test deployment for practice.
- **Performance:** run Lighthouse under the conditions in the reference section. Animations are optional and respect the reduced-motion setting.
- **Accessibility review:** keyboard use, screen-reader labels, colour contrast.
- **Android release:** version bump, signed release build, and a final device acceptance checklist run on the connected phone.
- **README:** setup, run and test commands, an architecture diagram, screenshots, the CI badge, known limitations and the Open-Meteo credit.

**Optional extras** (one at a time, only if time remains)

- 3D weather background with Three.js: one scene (rain, clouds or sun), switchable off. Treat it as visual only, since locators cannot inspect canvas pixels.
- Air quality card, using the rules in the reference section.
- Compare two cities side by side.
- Shareable weather card image.
- Language switch.

**Acceptance**

- The hosted site and API respond, production smoke tests are green, and the final regression run passes on the device.

## Reference definitions

Use these wherever a phase mentions the topic.

- **Data labels:** every card that shows non-live content carries one of three labels: "Real data", "Scientific estimate" or "Fiction". Fiction and estimate cards also say "Not a forecast".
- **Air quality:** state which index is shown (US AQI by default, or European AQI), with its timestamp, an "unavailable" state and the Open-Meteo credit. Never show two indices on one unlabelled scale.
- **Weather stories:** short sentences generated only from validated forecast values. A line such as "Rain after 4 pm" must be backed by hourly precipitation values. Unit-test the generator with fixtures.
- **News rules:** RSS feeds only. Store the headline, a snippet of at most 200 characters, the source name and the link. Never copy full articles. Links open in a new tab with `rel="noopener"`. Show the last-updated time and a warning when the data is more than 12 hours old.
- **Scrolling:** no horizontal page overflow from 320 px wide; intentional scrolling is allowed inside forecast lists and tables.
- **Themes:** the choice is saved in browser storage before login; account sync is added in Phase 4.
- **Lighthouse conditions:** production build, mobile emulation, simulated slow 4G with 4x CPU slowdown, median of three runs. Targets: performance 80 or higher on mobile, accessibility 90 or higher, layout shift under 0.1 on the dashboard.

## How to run each session

Paste this short prompt into the coding tool at the start of each session, replacing N with the phase number. Use `0` for the baseline step.

```text
Read AGENTS.md and docs/archive/ROADMAP.md. Do Phase N only.
Before coding, list the files you will change and the tests you will add.
Keep every existing data-testid and every passing test.
When finished, run the full test suite, report passed, failed and skipped
counts, commit, tag the phase, and stop. Do not start the next phase.
```

If a phase is too big for one session, split it into smaller steps in the order listed under Build, and finish each step with its tests.

**If time is short:** do Step 0 and Phases 1 to 3 first, then decide. Phases 4 and 5 are the largest, so build only favourites, the Time Machine and the trip planner, and skip the rest.
