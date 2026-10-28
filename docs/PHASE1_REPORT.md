# AtlasSphere Earth & Space — Phase 1 report

28 October 2026. Branch: `feature/atlassphere-phase1-earth-space`.

## Scope delivered

The new homepage introduces AtlasSphere as an Earth-and-space educational website. It includes the Earth hero, real geographic lookup, eight Earth discovery cards, a Saturn feature, sourced astronomy facts, featured destinations, Earth-science and history previews, GeoGuess entry points, and complete source/privacy/accessibility pages. Future engines and quizzes are explicitly marked Coming soon.

The React/TypeScript foundation uses Vite, Tailwind, React Router, TanStack Query and Lucide. Production builds render the four React pages to static HTML and hydrate their controls in the browser. The initial Earth image is responsive and discoverable from HTML; Three.js and its texture load only when the visitor activates 3D. The globe supports real geographic selection, keyboard and pointer controls, reduced motion, idle rendering, context-loss recovery and an image fallback.

Navigation includes an always-visible hamburger, desktop overlay/mobile drawer, native modal focus containment, Escape, focus return and scroll locking. Light/dark themes retain the existing preference key. Search provides validation, debounce, cancellation, cached results, keyboard selection, and clear empty/error/retry states. Selected coordinates can open weather in the preserved explorer.

Original photographs are retained. Smaller WebP derivatives improve delivery; NASA/NOAA Earth, Cassini Saturn and Webb imagery have documented provenance. Scientific values are curated and linked to sources, with approximate values labelled. No scientific simulations or live readings are invented.

## Preserved application

The complete working explorer moved from `index.html` to `explore.html`; all **157 original HTML test IDs are retained unchanged**. Weather, accounts, favorites, atlas, country directory, landmark photos, original globe, GeoGuess, Journeys, APIs and PostgreSQL remain available. The original globe module and photograph files were not replaced. Express, Vite and Vercel route configuration supports the new entry points.

Before changes, the working tree already contained Gmail reset-email code, dependency edits, tests and documentation. Those changes were preserved. They are not claimed as redesign work. No production database, deployment, GitHub main branch or live site was changed by this phase.

## Executed verification

Baseline before redesign: `npm test` **74 passed**; `npm run typecheck:api` passed; `npm run test:release` rebuilt and **5 passed**.

Post-redesign regression evidence:

- `npm test`: **74 passed**.
- `npm run typecheck:api` and `npm run check:syntax`: passed; syntax checked 33 files.
- `npm run test:api:local`: **20 passed, 6 skipped**. The skips require an isolated PostgreSQL test database; no production account database was used.
- `npm run test:ui -- --workers=2`: **100 passed, 1 intentional skip** for the production-specific gate in the development suite.
- `npm run test:bugs`: **9 passed**, including expected-defect assertions.
- `npm run test:v2`: **39 passed** after updating the homepage-return expectation to the new exact heading.
- `npm run test:release`: **5 passed**.
- `npm run typecheck:home`, `npm run lint:home`, `npm run format:home:check`: passed.
- `npm run test:home:unit`: **5 passed**.
- Development homepage Playwright suite: **20 passed**, covering 1440px desktop and 375px touch layouts, menu, search, themes, routes, WebGL fallback and zero axe violations in the checked states.
- Focused Firefox and WebKit menu/search checks passed with zero page errors.
- Focused real Chromium/SwiftShader globe QA passed: lazy activation, canvas focus, country hover/click/keyboard selection, drag, zoom, reset, reduced motion, unavailable WebGL, context loss/retry and mobile touch. Scoped axe found zero violations in dark and light. See `PHASE1_EARTH_ASSETS.md` for details and limits.
- Manual live geographic smoke: the local `/api/v1/geocode?q=Kyoto` proxy returned HTTP 200 with five real results, including Kyoto, Japan. This single live check is separate from deterministic tests; weather assertions continue to use fixtures.

Existing browser tests were changed only where the explorer entry URL moved or where the return-home assertion now refers to the new homepage. Old IDs and functional assertions remain. New tests cover the added homepage separately. GitHub Actions was extended, but no remote CI result is claimed before a push.

Final production verification:

- `npm run build`: passed, including prerender of all four React pages. Generation rejects streaming reveal markup so the static content cannot silently become JavaScript-dependent.
- `HOME_PRODUCTION=1 npm run test:home`: **28 passed** on desktop and touch. This includes all 20 interaction/accessibility tests plus eight production static-content, no-JavaScript and dark/light hydration checks. No hydration errors were recorded.
- Final API suite rerun: **20 passed, 6 PostgreSQL-dependent skips**. Verified gzip negotiation and identity fallback for static HTML, new routes and exclusion of production test fixtures. API contracts remain unchanged.
- Final production explorer release rerun against the built assets: **5 passed**.
- Final API/home TypeScript, homepage lint and formatting checks: all passed.

## Measured performance

`npm run audit:web` ran three Lighthouse mobile simulations against the local production Express server: 412 × 823 CSS pixels, device scale 1.75, simulated 4× CPU slowdown and 150 ms network RTT. The final **performance scores were 95, 94 and 94**, **accessibility was 100 in all runs**, and **CLS was 0.00152, 0 and 0.00152**. All three passed the existing targets of performance ≥80, accessibility ≥90 and CLS <0.1. Raw reports are in ignored `lighthouse-report/run-1.json` through `run-3.json` and `summary.json`.

The initial client-only version scored 67–71. Responsive imagery and static HTML made the Earth discoverable immediately. A measured streaming-boundary layout shift was fixed by rendering the small information component eagerly. Finally, public HTML/assets served through Express were compressed; API routes retain their existing handling. The last uncompressed run scored 76, so the final scores include this real production-serving improvement. These are local lab measurements, not measurements of the unchanged public Vercel deployment or a guarantee on every device.

## Known limits and deferred work

- Full solar-system, astronomy, history and earthquake engines, additional quizzes, and all later redesign phases are deferred. Android remains deferred.
- A successful local build is not a Vercel deployment verification. Publishing requires a separate reviewed release; the public website still serves its prior deployment.
- Physical devices, hardware-GPU variations and screen-reader acceptance remain manual follow-up checks. Automated accessibility scores do not establish full WCAG conformance.
- The optional Three.js chunk still triggers Vite's 500 kB advisory. It is not fetched on initial homepage load.
- Existing backend concerns from the audit remain separate: concurrent password-reset use, session renewal after token expiry, per-instance provider limits and bounded alert scheduling. Gmail delivery and scheduler setup need their existing production checks.
- The dependency audit retains the pre-existing three high-severity reports in the Prisma/deepmerge-ts chain. No forced major dependency upgrade was attempted in this frontend phase.
- Local PostgreSQL-dependent acceptance is not claimed; six API tests were skipped. Previously recorded Windows disposable-PostgreSQL teardown limitations are unchanged.

Phase 1 is the stopping point for owner review. No Phase 2 implementation, paid dependency, new database, APK, main push or deployment is included.
