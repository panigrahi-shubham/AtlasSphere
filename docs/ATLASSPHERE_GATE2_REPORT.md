# Gate 2 report

Completed 27 October 2026. Part 2 was authorized by the owner's “Yes” after Gate 1. This completes the quick-upgrade prompt, with the required stop at Gate 2.

## Branch / commits

Branch: `atlassphere-quick-upgrade`, continuing from Gate 1 commit `a71ac7e`.

- `3892aa5` — Task 6: rebrand visible product text to AtlasSphere.
- `8849570` — Task 7: add the dated NASA satellite view to Journeys.
- The final documentation commit contains this report, the name inventory and README updates.

No merge, tag, push, live deployment, database migration or hosting/secret change was performed. Earlier Stage A work and Part 1 fixes are preserved.

## Changes

| Files | What and why |
| --- | --- |
| Current HTML entry pages, relevant UI modules, sample-news JSON and API documentation titles | Visible AtlasSphere branding across titles, headers, footers, About, sharing, server wake-up status, fallback review authors and Test Lab content. |
| `src/services/satelliteImagery.ts` | One allowlisted NASA layer, strict date/coordinate validation and a dedicated WMS URL builder. Uses verified latitude/longitude axis order, valid clamped bounds and an 800 × 600 JPEG. |
| `src/journeys/satellitePanel.ts`, `src/journeys/app.ts`, `journeys.html`, `src/styles/journeys.css` | Separate Satellite view panel inside Time Machine, sharing coordinates but using its own UTC date, loading/loaded/error/range states, descriptive alt text, NASA credit and coverage limitations. No automatic image request on page load. |
| `about.html` | Explains that selected coordinates/date are sent to NASA when an image is requested. |
| `docs/SATELLITE_IMAGERY.md` | NASA documentation/capabilities evidence, earliest date 2000-02-24, WMS axis order, availability gaps and honest limitations. A real fixed-date request returned a JPEG. |
| `README.md` | What's new, known limitations and current verification instructions. |
| `docs/LEGACY_NAME_AUDIT.md` | Every remaining tracked-text content match and legacy file path, classified with reasons. |

The live NASA capabilities were checked before coding: exact layer `MODIS_Terra_CorrectedReflectance_TrueColor`, WMS 1.3.0 EPSG:4326 latitude/longitude order, ISO date and JPEG output agree with the requested approach. The actual start date is 2000-02-24. Current/recent dates are selectable but do not guarantee clear imagery or complete coverage.

## Tests: new and changed

New: four URL/date/coordinate unit checks in `tests/unit/satelliteImagery.test.js`; four mocked browser checks in `tests/ui/journeys/satellite.spec.ts`; a tiny generated JPEG fixture; one separate `@live` real-image check in `tests/api/satellite.spec.ts`. The loaded browser test also checks serious/critical accessibility violations in the panel.

Existing expectations changed only to match visible branding:

- `tests/ui/pages/explorer-home.spec.ts`: homepage title and two product-facing test names now say AtlasSphere; filename remains compatible.
- `tests/ui/pages/explorer-layout.spec.ts`: About page title is now `About AtlasSphere`.
- `tests/ui/pages/development-routes.spec.ts`: practice heading is `AtlasSphere Test deployment`.
- `tests/ui/journeys/account-privacy.spec.ts`: wake-up status names AtlasSphere.
- `tests/ui/geoguess/gameplay.spec.ts`: additionally asserts AtlasSphere in the share status; the shared URL remains unchanged.
- `tests/ui/journeys/trips-alerts-reviews.spec.ts`: review fixture and rendered fallback-author expectation use `AtlasSphere explorer`.
- `tests/api-local/api-contracts.spec.ts`: production HTML assertion expects AtlasSphere.
- `tests/README.md`: guide title updated.

### Commands actually run in Part 2

| Exact command | Result |
| --- | --- |
| `npx playwright test --project=ui tests/ui/geoguess/gameplay.spec.ts tests/ui/journeys/trips-alerts-reviews.spec.ts tests/ui/journeys/account-privacy.spec.ts tests/ui/pages/development-routes.spec.ts` | 19 passed, 1 existing production-only check skipped. |
| `npm run test:v2 -- tests/ui/pages/explorer-home.spec.ts tests/ui/pages/explorer-layout.spec.ts` | 14 passed. |
| `node --test tests/unit/satelliteImagery.test.js` | 4 passed. |
| `npx tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --skipLibCheck src/services/satelliteImagery.ts src/journeys/satellitePanel.ts` | Passed. |
| `npx playwright test --project=ui tests/ui/journeys/satellite.spec.ts tests/ui/journeys/trips-alerts-reviews.spec.ts` | 7 passed. |
| `npx playwright test --config=playwright.api.config.ts tests/api/satellite.spec.ts` | 1 passed: real NASA HTTP 200, `image/jpeg`, JPEG signature, fixed date 2024-01-01. |
| `npm test` | 66 passed. |
| `npm run typecheck:api` | Passed. |
| `npm run build` | Passed; existing lazy globe chunk warning (523.49 kB) remains. |
| `npm run test:ui` | 100 passed, 1 existing production-only check skipped. Includes the existing smoke/accessibility cases and the new satellite checks. |
| `npm run test:api:local` | 19 passed, 6 database-dependent account checks skipped. PostgreSQL/authentication test prerequisites are not configured; no migration or database write was attempted to enable them. |
| `npm run test:v2` | 39 passed against built assets, including the working atlas, weather charts, photographs and globe. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed before the satellite commit and final documentation commit. |

Counting the final full unit/UI/local-API/v2 runs plus the separate live satellite check gives **225 passed, 7 skipped**. Focused earlier runs overlap and are not added again. No failed check remains. A temporary local Playwright inspection captured desktop and 390-pixel mobile panel screenshots using the fixture; both were visually inspected, and the mobile document had no horizontal overflow. Those generated screenshots are ignored local test artifacts.

## Remaining legacy names

[LEGACY_NAME_AUDIT.md](LEGACY_NAME_AUDIT.md) records 185 remaining content occurrences across 165 matching lines: 155 lines kept for compatibility/history and 10 classified as owner-controlled references. It includes package-lock content and separately lists matching filenames. This report and the inventory itself are excluded to avoid recursive report matches; ignored generated files and Git history are outside the snapshot.

**Changed:** current visible branding and the expectations listed above. **Kept for compatibility:** environment variables, cookie/header contracts, browser-storage keys, events, database/package identifiers, filenames, paths, test fixtures and historical records. **Owner action:** existing repository/service/project names and addresses or local paths; renaming these is optional and was not performed. The archived `legacy/` version retains its historical branding.

## Owner actions

1. Review this branch and publish the reviewed changes through the existing GitHub/Render deployment process when ready. The live site still runs older code.
2. Follow [DATABASE_MOVE_NEON.md](DATABASE_MOVE_NEON.md) to preserve existing data, configure pooled/direct database URLs, verify the deployed account workflows and retain a rollback path. Do not remove the old database before verification.
3. Supply an isolated PostgreSQL test configuration to run the six skipped account integration checks. Live production write-smoke and deployment verification remain unrun.

No repository or hosting rename is required for the visible AtlasSphere brand. Dependency audit findings from Gate 1 (three high-severity findings) and the pre-existing globe bundle warning remain for a separate review.

## Not done / time-boxed out

No Part 2 task was time-boxed out. No new schema, hosting, CI or Cloudflare changes, paid services, Android work, map library, climate projection feature or 3D satellite layer were added. Firefox/WebKit and production write-smoke were not run at this gate. Database integration remains skipped as stated above.

## Ready for owner review

**Yes, for local code review at Gate 2.** The available checks pass, and the satellite panel works with mocked imagery and a real provider response. This is not a claim that the live service or database was upgraded, or that skipped checks passed. Work stops here as required by the supplied prompt.
