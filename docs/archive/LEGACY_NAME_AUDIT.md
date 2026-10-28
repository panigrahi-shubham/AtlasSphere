# Legacy-name audit

Snapshot: 27 October 2026, after commits 3892aa5 and 8849570, before the final report.

## Changed

Commit `3892aa5` changes visible page titles, headings, header/footer brands, About text, GeoGuess share messages, account wake-up text, default review authors, sample-news labels, Test Lab download content, API documentation titles, README and related expectations to AtlasSphere. Existing explicit display names are retained.

Files changed by that branding commit:

- `404.html`
- `CHANGELOG.md`
- `README.md`
- `about.html`
- `api/AtlasSphere.postman_collection.json`
- `api/journeys.ts`
- `api/news.json`
- `api/openapi.json`
- `geoguess.html`
- `index.html`
- `journeys.html`
- `public/fixtures/news.json`
- `src/dev/lab.ts`
- `src/geoguess/app.ts`
- `src/journeys/app.ts`
- `src/services/account.ts`
- `test-lab.html`
- `tests/README.md`
- `tests/api-local/api-contracts.spec.ts`
- `tests/ui/journeys/account-privacy.spec.ts`
- `tests/ui/geoguess/gameplay.spec.ts`
- `tests/ui/journeys/trips-alerts-reviews.spec.ts`
- `tests/ui/pages/development-routes.spec.ts`
- `tests/ui/pages/explorer-layout.spec.ts`
- `tests/ui/pages/explorer-home.spec.ts`

## Every remaining content match

Command: `git grep -n -I -i -E "skyatlas|earthscope" -- . ":!docs/archive/LEGACY_NAME_AUDIT.md" ":!docs/archive/ATLASSPHERE_GATE2_REPORT.md"`. This searches every tracked text file, including the lockfile, historical prompts and archived sources. Ignored/generated assets, Git history and this audit/final report are outside the snapshot to avoid recursive report matches. One row represents one matching source line and lists every matched token, including repeats.

{"matchingLines":165,"occurrences":185,"keptLines":155,"ownerLines":10}

| File:line | Matched tokens | Classification | Reason |
| --- | --- | --- | --- |
| `.env.example:5` | `skyatlas`, `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `.env.example:8` | `skyatlas`, `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `.github/workflows/monitor.yml:22` | `SKYATLAS`, `SKYATLAS` | Kept for compatibility | Existing environment variable contract. |
| `.github/workflows/web.yml:17` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `.github/workflows/web.yml:18` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `.github/workflows/web.yml:19` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `.github/workflows/web.yml:22` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `.github/workflows/web.yml:24` | `skyatlas`, `skyatlas`, `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `.github/workflows/web.yml:44` | `SKYATLAS` | Kept for compatibility | Existing environment variable contract. |
| `.github/workflows/web.yml:45` | `SKYATLAS` | Kept for compatibility | Existing environment variable contract. |
| `404.html:2` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `AGENTS.md:1` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `CHANGELOG.md:39` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `CHANGELOG.md:42` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `README.md:114` | `SkyAtlas` | Owner action | Existing repository, service, project or local path; any external rename is owner-controlled and optional. |
| `about.html:2` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `api/AtlasSphere.postman_collection.json:4` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `api/app.ts:45` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `api/app.ts:52` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `api/app.ts:111` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `api/features.ts:36` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `api/features.ts:183` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `api/openapi.json:1452` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `api/server.ts:7` | `SkyAtlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `api/testLab.ts:7` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `docs/archive/ATLASSPHERE_GATE1_AUDIT.md:23` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/ATLASSPHERE_GATE1_REPORT.md:40` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/ATTRIBUTION.md:1` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/AUTH.md:1` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/BUG_MODE.md:28` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `docs/archive/COVERAGE.md:1` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/DATABASE_MOVE_NEON.md:25` | `SkyAtlas` | Owner action | Existing repository, service, project or local path; any external rename is owner-controlled and optional. |
| `docs/archive/DATABASE_MOVE_NEON.md:38` | `skyatlas` | Owner action | Existing repository, service, project or local path; any external rename is owner-controlled and optional. |
| `docs/KNOWN_DEFECTS.md:3` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `docs/archive/PHASE1_5.md:23` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `docs/archive/PHASE2.md:1` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/PHASE2.md:3` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/PHASE2.md:14` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/PHASES3-6_STATUS.md:24` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/PLAYWRIGHT_COVERAGE.md:1` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/RELEASE_CHECKLIST.md:1` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/RELEASE_CHECKLIST.md:10` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/ROADMAP.md:1` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/ROADMAP.md:3` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/ROADMAP.md:9` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/SKYATLAS_HOME.md:1` | `SkyAtlas` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:1` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:3` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:96` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:219` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:220` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:248` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:250` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `docs/archive/V1_IMPLEMENTATION_HISTORY.md:365` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `docs/archive/V2_VALIDATION.md:1` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `geoguess.html:1` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `index.html:8` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `index.html:12` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `journeys.html:1` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `legacy/README.md:1` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `legacy/index.html:2` | `EarthScope` | Kept for compatibility | Historical documentation, archived version or supplied instructions; preserves context. |
| `package-lock.json:2` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `package-lock.json:8` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `package.json:2` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `playwright.bugs.config.ts:6` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `playwright.bugs.config.ts:7` | `EARTHSCOPE`, `EARTHSCOPE`, `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `playwright.config.ts:11` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `playwright.config.ts:19` | `EARTHSCOPE`, `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `playwright.config.ts:20` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `playwright.config.ts:22` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `playwright.config.ts:23` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `playwright.smoke.config.ts:3` | `SKYATLAS`, `skyatlas` | Owner action | Existing repository, service, project or local path; any external rename is owner-controlled and optional. |
| `playwright.smoke.config.ts:8` | `SKYATLAS` | Kept for compatibility | Existing environment variable contract. |
| `scripts/capture-web-polish.ts:17` | `earthscope` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `scripts/capture-web-polish.ts:25` | `earthscope` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `scripts/test-production.mjs:5` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `scripts/test-ui-all.mjs:19` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `scripts/test-ui-memory.mjs:9` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `scripts/test-v2.mjs:7` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `scripts/test-with-postgres.mjs:7` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `scripts/test-with-postgres.mjs:8` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `scripts/test-with-postgres.mjs:18` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `scripts/test-with-postgres.mjs:23` | `SKYATLAS`, `SKYATLAS` | Kept for compatibility | Existing environment variable contract. |
| `shared/pagesProxy.ts:9` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `shared/pagesProxy.ts:20` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `shared/pagesProxy.ts:21` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `shared/pagesProxy.ts:33` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `src/components/account.ts:46` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/components/account.ts:73` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/components/appearance.ts:6` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `src/components/appearance.ts:20` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/components/favorites.js:21` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/components/news.ts:1` | `SkyAtlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/dev/bugMode.js:16` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `src/dev/lab.ts:6` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `src/dev/lab.ts:23` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/geoguess/app.ts:11` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `src/geoguess/app.ts:108` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `src/geoguess/core.ts:2` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `src/main.js:75` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `src/services/account.ts:20` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `src/services/account.ts:39` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/services/account.ts:46` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/services/account.ts:51` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/services/account.ts:55` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/styles/skyatlas.css:1` | `SkyAtlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `src/utils/storage.js:3` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `src/utils/storage.js:4` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `tests/api-local/accounts.spec.ts:50` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/accounts.spec.ts:53` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/accounts.spec.ts:61` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/accounts.spec.ts:87` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/api-local/accounts.spec.ts:93` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/accounts.spec.ts:107` | `skyatlas`, `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/api-local/api-contracts.spec.ts:24` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/api-local/api-contracts.spec.ts:64` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/api-local/api-contracts.spec.ts:107` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/api-contracts.spec.ts:110` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/api-contracts.spec.ts:111` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/api-contracts.spec.ts:112` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api-local/api-contracts.spec.ts:211` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/api-local/api-contracts.spec.ts:235` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/api-local/journeys-api.spec.ts:44` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/api/contracts.spec.ts:37` | `earthscope` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/bugs/geoguess.spec.ts:3` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `tests/bugs/geoguess.spec.ts:7` | `earthscope`, `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `tests/support/uiTest.ts:22` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `tests/ui/journeys/account-privacy.spec.ts:42` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/ui/journeys/account-privacy.spec.ts:58` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/ui/journeys/account-privacy.spec.ts:76` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/ui/geoguess/gameplay.spec.ts:2` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `tests/ui/geoguess/gameplay.spec.ts:5` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `tests/ui/geoguess/gameplay.spec.ts:52` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `tests/ui/geoguess/gameplay.spec.ts:92` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `tests/ui/pages/test-lab.spec.ts:2` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `tests/ui/pages/test-lab.spec.ts:17` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |
| `tests/ui/pages/development-routes.spec.ts:4` | `EARTHSCOPE` | Kept for compatibility | Existing environment variable contract. |
| `tests/unit/pagesProxy.test.js:6` | `skyatlas`, `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:15` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:18` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:20` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:23` | `skyatlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:31` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:42` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:56` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/unit/pagesProxy.test.js:67` | `SkyAtlas` | Kept for compatibility | Header/cookie contract and its documentation or tests. |
| `tests/ui/pages/explorer-layout.spec.ts:5` | `earthscope` | Kept for compatibility | Persistent browser-storage namespace; preserves preferences and scores. |
| `vite.config.js:22` | `skyatlas` | Kept for compatibility | Existing technical identifier, contract, fixture or related assertion. |

## Names in tracked file paths

These paths remain for compatibility and documentation history; no existing file needs renaming for the visible rebrand.

- `api/AtlasSphere.postman_collection.json` — kept for compatibility/history.
- `docs/archive/SKYATLAS_HOME.md` — kept for compatibility/history.
- `src/styles/skyatlas.css` — kept for compatibility/history.
- `tests/ui/pages/explorer-home.spec.ts` — kept for compatibility/history.

No external rename was performed. The current GitHub and hosting addresses continue to work under their existing names. Archived `legacy/` pages retain their original branding and are not current entry pages.
