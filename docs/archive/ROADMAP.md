# SkyAtlas development roadmap — website first

Updated 27 October 2026. This supersedes the earlier APK-first phase order; `docs/archive/ROADMAP_ORIGINAL.md` preserves the original plan. SkyAtlas is a non-commercial geography and weather QA portfolio project. Keep the existing HTML/CSS/JavaScript/Vite website and Express/TypeScript API; do not rewrite the stack.

## Current state

Website Phases 3–6 are authorized and under active implementation. See `docs/archive/PHASES3-6_STATUS.md` for actual verification status and blockers.

- Phase 1 web polish and the SkyAtlas image-led homepage are implemented. The atlas, landmarks, Three.js globe, weather dashboard, favorites and responsive themes remain.
- Phase 1.5 GeoGuess is implemented with landmark and country-outline games.
- Phase 2 own API is implemented: `/api/v1/weather`, `/api/v1/geocode`, `/api/v1/news`, `/api/v1/health`, OpenAPI/Swagger, fixture mode, cache, validation, rate limiting and scheduled RSS snapshot. See `docs/archive/PHASE2.md`.
- Android has **not** started. Finish the website and web automation through Phase 5 or 6 first. Android is planned as Phase 7, only when the owner explicitly says to begin. Do not scaffold Capacitor or install an APK as part of Phases 3-6.

## Non-negotiable rules for every phase

1. Inventory the current implementation and run relevant passing tests before changes. Preserve stable kebab-case `data-testid` values, routes, photographs, attribution, globe and working behavior. Explain any test change.
2. Work on one phase, or one named substep, at a time. Finish its implementation, deterministic tests, documentation and acceptance checks; report actual pass/fail/skip counts. Stop before the next phase until the owner says go.
3. Keep test fixtures, fake inbox, reset and chaos routes, seeded accounts and defect flags out of production. Production must return 404 for Test Lab routes and must ignore practice flags. Never put secrets in browser bundles, APKs or Git.
4. Use PostgreSQL consistently in development, CI and production once the database is introduced. Isolate data per Playwright worker. Live weather tests are tagged `@live` and excluded from default deterministic suites.
5. Keep the site non-commercial. Show Open-Meteo and photo/news source credits, verify current upstream usage terms before deployment, meet WCAG AA contrast, keyboard/focus basics and 320 px no-overflow behavior.
6. If Git metadata is writable, use a branch and descriptive commits for each phase. If it is read-only or no remote exists, do not claim a commit/tag; provide a clean source ZIP for the owner to upload.

## Revised order

| Phase | Scope | Gate before moving on |
| --- | --- | --- |
| 1, 1.5, 2 | Existing web polish, GeoGuess and API | Preserve through regression |
| 3 | Accounts, PostgreSQL and synchronized favorites | Security and cross-user tests pass |
| 4 | Website product journeys, one at a time | Each journey and regression pass |
| 5 | Isolated web Test Lab | Defect tests and production isolation pass |
| 6 | Web automation, CI, accessibility, performance and hosted-web readiness | Green CI and web release checks |
| 7 | First Android APK and Appium | Start only after owner approval following Phase 5 or 6 |
| 8 | Final cross-platform release and portfolio | Hosted site, API and device acceptance pass |

## Phase 3 — Accounts and persistence (next website phase)

Goal: account-based favorites and theme sync while anonymous visitors retain browser-local functionality. Document the security contract first in `docs/AUTH.md`.

- Add PostgreSQL with Prisma migrations and a reproducible local/CI setup. No second database engine. Keep migrations and a safe `.env.example` in Git; ignore actual secrets.
- Registration and login use a minimum eight-character password with upper/lowercase, digit and symbol, stored with Argon2 or bcrypt. Reject duplicate and invalid emails without leaking private account details.
- Access tokens last 15 minutes and remain in memory; refresh tokens use HttpOnly, Secure, SameSite cookies, rotation, reuse detection and logout revocation. Lock an account for 15 minutes after five failed logins.
- Password reset uses a six-digit, single-use code valid for 10 minutes with rate limiting. The fake inbox exists only in development/test. Production sends through a configured server-side provider or clearly disables reset until configured; never expose codes in responses or logs.
- Add authenticated favorite add/remove/list/sync (maximum 20, no duplicates), plus theme sync. Anonymous users keep existing browser storage; define a conflict/merge rule on login. Enforce authorization on every user resource.
- Add accessible sign-up, sign-in, reset and account states without removing existing weather/geography journeys. Use stable test IDs.

Tests: registration boundaries, duplicate email, lockout/unlock, expired/reused tokens and codes, logout, cross-user access attempts, favorites syncing in two browser contexts, anonymous fallback, and production absence of fake inbox/reset controls. Acceptance: every rule in `docs/AUTH.md` has a deterministic test; all Phase 1-2 suites pass.

## Phase 4 — Website product journeys

Build and test one substep at a time; the owner can defer a substep. Do not implement all four in one unreviewable change.

- **4a Time Machine:** interactive era slider with keyboard and touch support. Label each card `Real data`, `Scientific estimate` or `Fiction`; estimates and fiction say `Not a forecast`. Verify the provider's actual historical date range before claiming real data. Recent/future forecast data comes through the server; far-future text is fixed fiction. Test endpoints, slider boundaries and unsupported dates.
- **4b Trip planner:** authenticated trip name, city, start/end dates, maximum 14 days, no past start, end after start, edit/delete and day-specific available forecasts. Never invent forecasts outside the supported horizon. Test date boundaries and full journey.
- **4c Weather alerts:** authenticated condition/threshold rules, in-app notification list, edit/delete and deduplication. Deterministic checks use fixtures. Do not imply push notifications exist yet.
- **4d Landmark reviews:** one user's rating 1-5, text up to 500 characters, optional JPG/PNG up to 2 MB, edit/delete only own review, sort/filter and safe file handling. Test authorization and upload boundaries.

Each substep needs web and API tests, source/data labeling and accessibility checks. Preserve existing atlas and GeoGuess flows.

## Phase 5 — Isolated web Test Lab

Goal: realistic defects and difficult UI patterns for QA practice, safely separated from the public product. Only development/test or a separately labeled Test deployment may serve it. Production returns 404 and ignores flags.

- Per-request/session defect flags for wrong units, missing news, stale cache, duplicate favorite, forecast day offset and other documented cases. Keep an answer key with expected/actual result and severity in `docs/KNOWN_DEFECTS.md`.
- Controlled delay, upstream 500, timeout, malformed JSON and offline responses, isolated per worker. Database reset only on disposable test databases.
- Practice controls: alert/confirm/prompt, iframe, open shadow root, closed shadow root (assert only user-visible effects), upload/download, drag/drop, dynamic table, infinite scroll and ephemeral toast.
- Fake inbox for reset-code testing in non-production environments only.

Tests: each planted defect is caught while its off state passes; each failure has recovery coverage; a production-mode test proves all Lab routes and controls are absent.

## Phase 6 — Web automation, CI and hosted-web readiness

- Organize Playwright projects for Chromium, Firefox, WebKit, mobile emulation and API. Add page objects/shared fixtures where they reduce duplication, worker-isolated data, `@smoke`, `@regression`, `@live`, `@a11y`, HTML reports, traces and failure screenshots. No fixed sleeps as a substitute for state waits; at most one retry with a flaky-test log.
- GitHub Actions: pull-request lint/typecheck/API/Chromium smoke; nightly cross-browser, selected live checks and accessibility/performance; preserve the existing three-hour news job. Upload reports/traces as artifacts.
- Add `docs/archive/COVERAGE.md` mapping every web/API feature to tests. Run axe checks on main pages and a manual keyboard/contrast review. On a production build, measure Lighthouse three times under documented mobile conditions; target mobile performance >=80, accessibility >=90 and dashboard CLS <0.1, or record a measured shortfall with remediation.
- Deploy the website **with its Node API** as one service or a documented equivalent. A static-only host cannot serve `/api/v1`. Verify health, API, routes, news timestamp, credits and absence of test controls on the hosted site. Keep development fixture mode off.

Acceptance: CI passes, the hosted web product works, test coverage is documented, and web accessibility/performance results are reported. At this point ask the owner whether to start Android, or complete any deferred Phase 4/5 work first.

## Phase 7 — Android APK (deferred)

Only after the owner approves Android following Phase 5 or 6: package the already finished website as a Capacitor Android app with bundled shell, a configurable HTTPS API origin (root-relative `/api/v1` cannot target `capacitor://localhost`), native geolocation, Android back/offline behavior and debug-only WebView inspection. Add one-command debug APK build and Appium Python/pytest tests for launch, permissions, WebView search, network recovery and rotation. Confirm real-device install and at least five passing device tests. No store publication or release signing yet.

## Phase 8 — Final release

Complete cross-platform regression, production safety, accessibility/performance follow-up, optional signed Android release only with owner approval, architecture/coverage documentation and portfolio README. Keep optional extras such as air quality or extra 3D effects separate from acceptance scope.

## Session prompt

```text
Read AGENTS.md, README.md, docs/archive/ROADMAP.md and the current source.
Work only on the phase or substep I authorize. Before changing code, inspect
the baseline and relevant tests. Preserve existing IDs and working journeys.
Implement the smallest reviewable slice with deterministic tests. Run its
acceptance gate and regression, report actual pass/fail/skip results and
limitations, update docs, then stop. Do not start Android before I approve
Phase 7 after the website reaches Phase 5 or 6.
```
