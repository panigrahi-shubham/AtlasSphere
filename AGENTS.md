# SkyAtlas permanent rules

- Inventory existing work and run tests before changes. Preserve passing checks and explain any test changes.
- Never rename/remove an existing data-testid without approval. Add stable kebab-case IDs for new controls and values.
- Test routes, fake inboxes, resets, chaos, defect flags and seeded accounts belong only to development/test. Production does not register them. A public practice deployment must be labelled Test deployment.
- No secrets in browser bundles or the repository. Use ignored .env files and a documented .env.example; third-party secrets require a backend proxy.
- When Phase 3 adds a database, use PostgreSQL consistently in development, CI and production.
- Isolate test users/data by worker. Never globally reset a parallel environment; global chaos needs an exclusive disposable environment.
- Weather-value assertions use fixtures. Tag separate live tests @live and keep them out of default deterministic runs.
- Use one Git branch per phase, descriptive commits and completion tags only after acceptance passes. Report blocked checks accurately.
- This is non-commercial: no ads or payments. Show linked Weather data by Open-Meteo.com credits and respect upstream usage limits. The requested roadmap ceiling is 10,000 calls/day; verify current terms before deployment.
- Label inputs, provide keyboard access/logical focus, and maintain WCAG AA contrast.
- Keep the existing website stack; new modules use TypeScript. Preserve working photographs and globe.
- Implement one phase at a time. Do not start the next phase until acceptance passes and the owner says go.
- Finish the website through Phase 5 or 6 before Android. Do not scaffold Capacitor or build an APK during Phases 3-6. Start the deferred Android phase only after the owner explicitly authorizes it.

The revised website-first plan is docs/ROADMAP.md; docs/ROADMAP_ORIGINAL.md preserves the earlier plan. The owner has authorized website Phases 3–6 together; implementation is in progress with outstanding gates in docs/PHASES3-6_STATUS.md. Phases 1, 1.5 and 2 remain regression requirements. Android remains deferred.

On 28 October 2026 the owner authorized a separately scoped Earth & Space redesign Phase 1, including React/TypeScript/Tailwind alongside the existing Vite/Express application. This explicit upgrade permits the incremental frontend addition while preserving the stack's existing explorer, APIs and PostgreSQL. Work belongs on `feature/atlassphere-phase1-earth-space`; see `docs/PHASE1_ARCHITECTURE.md` and `docs/PHASE1_REPORT.md`. Stop for owner review after this redesign phase; no redesign Phase 2 or production publication is authorized by that brief. Existing stable test IDs remain on `/explore.html`.


The owner subsequently reviewed the Phase 1 preview and explicitly authorized production deployment. The release is prepared from current main in an isolated checkout, excluding unrelated local Gmail reset-email changes. This publication authorization does not start redesign Phase 2.
