# AtlasSphere 2.0 implementation record

Current milestone branch: `codex/atlassphere-2-solar-system`, following audit and shared-design commits on `feature/atlassphere-2-premium-explorer`. Baseline: `1e5ec28` (PR #5). Production remains on main; merging and production publication require owner review.

## Milestone 1: inventory and stability

Inspected on 28 October 2026: repository rules, README, architecture, Vite/Express routing, Prisma schema, shared browser fixtures/configuration, workflows, homepage and globe components. GitHub main matches the checkout. No open PRs and no remote branch matching `neon` were returned. This does not prove that unpublished Neon work elsewhere is complete; this release leaves the schema and existing account/provider state alone.

Public pages: `/`, `/index.html`; `/sources`, `/privacy`, `/accessibility` and their `.html` aliases; `/explore` and `/explore.html`; `/geoguess` and `/geoguess.html`; `/journeys` and `/journeys.html`; `/about.html`; `/docs/`; `/openapi.json`; and the 404 page. Explorer contains weather/search, forecasts, favorites/accounts, map, country directory, landmarks, globe and news. Journeys contains time machine, satellite imagery, trip CRUD, alerts, notifications and reviews. GeoGuess contains seeded landmark/outline games and a local leaderboard. `/test-lab` and test endpoints are development/test only.

API contracts remain in `api/openapi.json`: health, weather/geocode/news, registration/login/reset/refresh/account/export, favorites, journeys/time-machine, trips, alerts and reviews. PostgreSQL models remain User, RefreshToken, ResetCode, Favorite, Trip, WeatherAlert, Notification and Review. The existing geographic snapshot, photographs, Natural Earth geometry and lifecycle-safe Three.js Earth adapter can be reused.

Observed design gaps: older pages use cream/gold/serif styling versus the discovery homepage's navy/teal/Manrope styling; only the homepage has a desktop navigation drawer. Solar System and planet navigation are placeholders. Earth science is currently sourced reading rather than interactive experiments. Educational routes need static rendering and metadata. No existing simulation or planet dataset should be replaced.

Fresh baseline results: build passed; Node 70/70; homepage unit 5/5; emitted Vercel function 1/1; homepage browser 20 passed with eight existing production-only skips; isolated PostgreSQL API 25/25. Full legacy browser baseline is recorded below when completed. Logs are retained locally under ignored `releases/baseline-*.log`.

Risks: Windows hidden-directory Test Lab file serving is a known local baseline issue; shared serverless provider/auth state is outside this frontend release; planetary moon counts change; illustrative orbit/simulation scales must be labelled; WebGL cannot be required for reading or selection. Keep all original test IDs and assertions. NASA imagery must keep individual credits. USGS data must show timestamps and honest failure states.

## Delivery gates

1. Audit and stability — baseline above.
2. Shared design and existing-page modernization — shared navy/teal tokens and Manrope, legacy page hierarchy/forms, theme controls, reusable modal navigation with focus return/scroll locking, and footer added. Original desktop explorer shortcuts retained. Built explorer 39/39; legacy UI 100 passed, one existing production-only skip; homepage 20 passed, eight existing production-only skips. Desktop screenshot inspected locally. Initial overflow/contrast regressions were fixed without changing assertions. New homepage sections connect as their destination milestones are implemented.
3. Interactive Solar System — implemented for owner review: eight selectable planets, NASA reference facts, lazy Three.js scene, deterministic adjustable clock, camera controls, orbit/label toggles, shareable selection, reduced motion and WebGL/context-loss fallback. Initial and reset camera framing adapts to screen width. Circular orbits, illustrative starting angles and compressed scales are explicitly explained. Production HTML is prerendered through an exact route allowlist shared by Vite and Express. Desktop and touch screenshots inspected.
4. Planet encyclopedia and comparison — pending.
5. Earth and science lab — pending.
6. Feature-based automation — pending.
7. Crawlable SEO and Search Console guide — pending.
8. Cross-browser, accessibility, performance and release verification — pending.

The updated AGENTS.md requires explicit owner approval before advancing to the next milestone. Work stops after verification of milestone 3; milestones 4–8 remain pending. Critical regressions block advancement. No merge, production deployment, database migration, Android work or paid service is part of this branch's execution.

Milestone 3 validation: build, home/API/test typechecks and home/test lint pass; Node 70/70, home/model unit 7/7, emitted Vercel function 1/1 and existing production homepage 28/28 pass. Focused Solar System coverage passes in development (10 passed, two production-only skips) and production (12/12), including both themes under axe, real WebGL, loss of context, URL hydration and mobile framing. Existing assertions are preserved; new assertions cover the new behavior. Full cross-browser/device acceptance and release-wide performance work remain milestone 8; these local Chromium checks do not claim that acceptance.

Baseline legacy UI: 97 passed, one skipped, three failures. Two came from Test Lab's absolute `sendFile` rejecting the hidden `.codex` parent; its Vite error overlay also interrupted the review workflow. Serving the same fixed filename relative to an explicit root fixed all three. Production still does not register this route. A separate diagnostic run was interrupted by a reused test server shutting down; the final isolated-port legacy run passed 100 tests. Evidence: `releases/m2-ui-verified.log`, `releases/m2-explorer-verified.log`, `releases/m2-home.log` (ignored local artifacts).

Final milestone 3 release checks: 5/5 passed, including production exclusion of Test Lab and defect hooks. The assertion audit against `1e5ec28` retained all 876 existing `expect` calls and added 34 in the discovery suite, with zero removed assertions. Local Lighthouse mobile simulation of the built homepage (412 × 823, 4× CPU slowdown, no city selected) measured performance 94/93/94, accessibility 100/100/100 and CLS 0.00152 across three runs. These are local lab results, not field measurements or full accessibility certification. Reports are retained under ignored `releases/m3-*.log`, `releases/m3-assertion-audit.json` and `lighthouse-report/`.
