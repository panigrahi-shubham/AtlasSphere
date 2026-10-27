# Weather QA roadmap Phase 1 — Web polish

Implemented 26 October 2026. This is the first phase of `ROADMAP.md`; the earlier photographic visual phase is recorded separately in `PHASE1.md`.

## Delivered

- Sticky responsive header with city search, unit switcher, saved/system theme, mobile menu and browser location action. The theme bootstrap runs before the CSS request.
- Current-weather loading skeleton, factual condition story, horizontal hourly strip, on-demand seven-day chart/table, and dashboard high/low, UV and sun times derived from the first returned local date. Favorites, error/empty states and existing features remain.
- Local sample-news fixture with explicit demo labels, source and timestamp, HTTPS links, loading/empty/error/retry states and a warning when data is over 12 hours old. This is not a live feed.
- About and custom 404 pages, favicon, visible Open-Meteo credits and mobile layout down to 320 px.
- Browser geolocation with permission/timeout/unavailable feedback; stale location responses are discarded if the user chooses a different place.
- New pure weather-story unit cases and browser cases for first paint, navigation, units, news states, location permission/races, About/404 and narrow layouts. The bulk accessibility-name audit has a 90-second test budget because it checks hundreds of controls; assertions are unchanged.

No new remote images or 3D features were added in this phase. The already bundled photos, atlas and globe remain. Inter is requested as the first CSS font family with system fallbacks; no local Inter binary was available to bundle under the current network limits.

## Verification

Baseline: `BASELINE_RESULTS.md` records 145 deterministic passes before this phase. The final sequential run passed 158 deterministic checks with no failures or skips:

| Suite | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Node service/unit (`npm test`) | 43 | 0 | 0 |
| Normal Vite Chromium UI (`npm run test:ui -- --workers=1`) | 69 | 0 | 0 |
| Built-asset Chromium (`npm run test:v2 -- --workers=1`) | 36 | 0 | 0 |
| Development Bug Mode (`npm run test:bugs:memory`) | 7 | 0 | 0 |
| Production protection (`npm run test:release`) | 3 | 0 | 0 |
| **Total** | **158** | **0** | **0** |

The production build passed. A direct Vite preview smoke check returned HTTP 200 for `/` and `/about.html`, and HTTP 404 for `/missing-place`.

Screenshots: `screenshots/roadmap-phase1-before-{desktop,mobile}.png` and `screenshots/roadmap-phase1-after-{desktop,mobile}.png` plus viewport previews. Desktop and mobile preview captures were reviewed for layout.

The browser suites use mocked weather and geocoding values. The historical 11 live API checks were not rerun because upstream domains are outside this environment's allowlist. The optional globe chunk still raises Vite's size advisory.

## Acceptance limits and follow-up

- The Lighthouse accessibility target of at least 90 on desktop and mobile is **unverified**. Lighthouse is neither installed nor cached (`npm exec --offline lighthouse -- --version` returns ENOTCACHED), and its registry is outside the current allowlist. This is an acceptance gate before calling Phase 1 fully complete.
- A Git repository was initialized, but its `.git` directory is read-only in this session. `git add .` failed opening `.git/index.lock`; baseline commit, phase branch, completion commit and tag cannot be made here. Run those Git actions in a writable checkout after reviewing changes and clearing acceptance.
- Firefox/WebKit, screen readers and physical touch devices have not been audited in this run. Android/APK, backend and account work belong to later phases; Phase 2 has not started.
