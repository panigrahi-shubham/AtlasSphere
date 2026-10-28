# Earth & Space homepage — Phase 1 architecture

28 October 2026. Branch: `feature/atlassphere-phase1-earth-space`.

## Assessment before implementation

The existing site is a Vite multi-page HTML application with JavaScript/TypeScript modules, d3/TopoJSON country maps, a lazy Three.js globe, Express 5 APIs, Prisma 6 and PostgreSQL. Vercel hosts the website/API; Neon hosts production accounts. No new database or backend rewrite is required. The owner's new brief explicitly authorizes an incremental React foundation, superseding the earlier instruction to retain only the existing frontend stack.

The working tree already contains an unfinished Gmail reset-email adapter, tests and documentation. These changes are preserved and are not attributed to this redesign. Prior review found session-renewal, reset-concurrency, serverless-quota and alert-batch limitations. Those existing backend concerns remain separate from this homepage phase.

Baseline on this working tree: `npm test` 74 passed; `npm run typecheck:api` passed; `npm run test:release` rebuilt production assets and passed 5 tests. Existing optional globe chunk warning: 523.49 kB minified. Earlier same-session Chromium regression: 100 passed, one intentional skip; local API: 20 passed, six PostgreSQL-dependent cases skipped.

## Incremental integration

- `/` becomes a React/TypeScript discovery homepage, implemented in `src/home/` with Vite, Tailwind CSS and Lucide icons. React Router owns only homepage information routes; existing applications remain separate HTML entries.
- `/explore` and `/explore.html` preserve the complete existing explorer, including every existing test ID, weather, account forms, favorites, atlas, photographs and original globe. This is the current working explorer, not the ancient `legacy/index.html` archive.
- `/journeys`, `/geoguess`, `/about.html`, `/docs/` and every `/api/v1` contract remain available. Express, Vite and Vercel resolve the new routes consistently.
- TanStack Query caches geographic lookup results from the existing `/api/v1/geocode` proxy. Searches are debounced, abortable and validated. Selection displays real coordinates and updates the Earth marker; weather remains a secondary explorer action.
- The hero globe uses a React lifecycle adapter based on the existing globe's interaction model, real country boundaries and NASA assets. Three.js is imported only on activation; a local image remains available without WebGL. No real-time illumination claim is made.
- Curated science content is an educational preview with source links. Unbuilt engines and quizzes are visibly marked Coming soon. No new paid service, remote tracking, Android work or simulated scientific readings are added.
- Theme storage retains `earthscope:theme:v1`. New CSS is scoped to the React application and does not restyle existing pages.
- Production builds prerender the homepage and each information route to complete HTML with React's server renderer. The browser hydrates that content; Vite development uses normal client rendering. This makes text and the responsive Earth image discoverable before JavaScript runs. The small information component is eager to avoid hiding static content behind a streaming boundary. The build-only Vite loader does not read deployment environment files or start the API/database.
- Responsive WebP derivatives supplement the original photographs. All originals and license attributions remain intact. The optional Three.js renderer stays in a separate lazy chunk.

## Verification and release boundary

Existing regression tests follow their unchanged explorer to `/explore.html`; assertions and stable IDs are retained. New homepage tests separately cover responsive navigation, real-contract fixture search, error recovery, themes, accessibility, sources and lazy globe behavior. New TypeScript, lint, formatting and Vitest checks are limited to the incremental React application.

This phase is local and on a dedicated branch. No main push, production migration or deployment is part of acceptance. Phase 2 requires owner approval. Final executed evidence and limitations belong in `PHASE1_REPORT.md`.
