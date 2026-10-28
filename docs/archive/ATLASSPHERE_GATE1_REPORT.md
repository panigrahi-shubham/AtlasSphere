# Gate 1 report

## Branch / commits

Branch: `atlassphere-quick-upgrade`, based on the preserved Stage A checkpoint `eec5ff9`.

- `77a7310`: adapted prompt, audit and baseline.
- `2c1058e`: precise HTTP fallback and sanitized diagnostics.
- `e04f7c7`: Time Machine success and generic provider-error coverage.
- `03ef0ae`: non-empty public-review privacy assertion.
- `fca7051`: owner-controlled Neon move and rollback instructions.

No merge, tag, push, hosting-setting change or production data operation was performed. The branch inherits earlier Stage A schema, CI and proxy work; the quick-upgrade delta adds no migration, database table, CI change or Cloudflare implementation.

## Baseline

Node `v24.15.0`; npm `11.12.1`; starting working tree clean. Full script inventory and audit evidence are in [ATLASSPHERE_GATE1_AUDIT.md](ATLASSPHERE_GATE1_AUDIT.md).

| Exact command | Result |
| --- | --- |
| `npm ci` | Passed; npm reported three high-severity dependency findings. |
| `npm test` immediately after install | Failed: 56 passed, 2 failed because Prisma client code was not generated. |
| `npm run typecheck:api` immediately after install | Failed for the missing generated Prisma types. |
| `npm run build` immediately after install | Failed for the missing generated Prisma client. |
| `npm run test:smoke` / `npm run test:api:local` immediately after install | Failed to start correctly for the same prerequisite. |
| `npm run prisma:generate` | Passed; client-code generation only, no migration. |
| `npm test` after generation | 58 passed. |
| `npm run typecheck:api` after generation | Passed. |
| `npm run build` after generation | Passed. |
| `npm run test:smoke` after generation | 2 passed. |
| `npm run test:api:local` after generation | 17 passed, 6 skipped because isolated PostgreSQL was not configured. |

## Changes

- `src/services/http.js`: HTTP errors carry `status`; `fetchJSONWithFallback` tries the supplied public URL once after 502/503/504 only. No fallback on 400/404/429, client timeouts, cancellation, connection errors or unreadable JSON. Failure of the second request preserves the original error.
- Weather, seven-day forecast, city search and capital lookup use that helper. `directGeocodeURL` preserves country restrictions; the previous `geocodingURL` export remains compatible.
- `api/app.ts`: diagnostic logs contain only the upstream hostname, HTTP status and controlled message. Raw URLs, keys and thrown private messages are not logged.
- The earlier slow-request fallback was replaced by the new prompt's precise HTTP-only behavior. The legacy `VITE_PAGES_FALLBACK` name remains documented for compatibility but no longer enables a timed fallback.
- The free archive, validation, server budget reservations and 2,000-entry historical cache already existed and were retained. Added the missing generic 502 UI path.
- Existing review display names and the current privacy response shape were retained. No reviewer ID or email is selected or exposed. Kept the SkyAtlas author fallback until Part 2's coordinated rebrand; did not reintroduce a previously removed review ID.
- `docs/archive/DATABASE_MOVE_NEON.md`: owner steps, verification, data-copy precautions and rollback of both connection variables. Existing `directUrl`, migration-script fallback and free-instance build command were retained.
- README, changelog, OpenAPI and Postman notes document the fallback. README records the Prisma-generation prerequisite.

## Tests

New: four unit tests for fallback policy; seven browser tests for successful fallback, rate-limit behavior, original errors, capitals and daily forecasts; one API test for safe diagnostics; one non-empty review API fixture test; one generic Time Machine error UI test.

Changed tests: existing 503 error-path tests now explicitly mock the direct provider as unavailable, preserving their original error-handling assertions. The earlier slow-fallback unit test now verifies that a client timeout does not trigger fallback, as required by the new prompt. Existing success, validation, unit and ownership assertions were preserved.

| Exact command | Result |
| --- | --- |
| `npm test` | 62 passed. |
| `npm run typecheck:api` | Passed. |
| `npm run build` | Passed; existing optional globe chunk warning remains. |
| `npm run test:ui` | 96 passed, 1 existing production-only test skipped. |
| `npm run test:smoke` | 2 passed. |
| `npm run test:api:local` | 19 passed, 6 database-dependent checks skipped. |
| `npx playwright test --project=ui tests/ui/explorer/search.spec.ts tests/ui/explorer/current-weather.spec.ts tests/ui/explorer/resilience.spec.ts tests/ui/explorer/provider-fallback.spec.ts` | 40 passed (before adding the two additional capital/daily cases, which were then covered below and in the full suite). |
| `npx playwright test --project=ui tests/ui/explorer/provider-fallback.spec.ts tests/ui/explorer/forecast-geography.spec.ts` | 16 passed. |
| `npm run test:v2 -- tests/ui/pages/atlas-features.spec.ts` | 17 passed, including globe, capital and daily-forecast error recovery. |
| `npx playwright test --config=playwright.api-local.config.ts tests/api-local/journeys-api.spec.ts --grep 'time-machine\|historical weather'` | 2 passed: validation, free/customer archive selection, key non-disclosure and cache. |
| `npx playwright test --project=ui tests/ui/journeys/trips-alerts-reviews.spec.ts` | 3 passed. |
| `git diff --check eec5ff9..HEAD` | Passed. |

The public-review API fixture supplies a non-empty model result without using a database. Database-dependent account tests were not represented as passed. No database migration was run during this quick-upgrade task. Firefox/WebKit and production write smoke were not run for this gate.

## Known issues confirmed / refuted

1. **Live geocode 502:** not reproduced at audit time: the live health and Delhi geocode endpoints returned 200, and direct Open-Meteo returned 200. The shared-IP explanation is not proven. Source evidence: `api/app.ts:107` now records safe diagnostics; `src/services/http.js:38` implements the fallback. The source fix is prepared for intermittent failures, not claimed as deployed.
2. **Database expiry:** Render Free PostgreSQL's 30-day expiry and 14-day subsequent upgrade grace period are confirmed by [Render's documentation](https://render.com/docs/free). The current live database plan and credentials were not inspected. Preparation: `prisma/schema.prisma:8`, `scripts/prisma-migrate.mjs:6`, `retired historical file:9` and the new owner guide.
3. **Paid historical key:** the live endpoint returned 503 with the old Professional-key message. The local implementation already uses the free archive without a key (`api/journeys.ts:45`) and caches results (`:35` and `:54`). Stubbed API tests passed. The endpoint was not redeployed by this work.
4. **Reviewer IDs:** fixed in the local source (`api/journeys.ts:99`) and verified with a non-empty API fixture. The live response had zero reviews, so its empty array cannot establish the privacy behavior of older deployed code. The original `main` source exposed `userId`.

## Owner actions

- Review this branch and publish the intended reviewed code through the existing deployment process. The live service still uses older code.
- Follow [DATABASE_MOVE_NEON.md](DATABASE_MOVE_NEON.md) for an owner-operated data move, verification and rollback. Keep the Render database until verification is complete. Preserve the existing authentication secret.
- Review the dependency audit findings separately; no forced or unrelated package upgrades were applied.
- Keep the GitHub repository, Render URLs and compatibility identifiers unchanged. No GitHub rename is needed for Part 2's user-facing branding.

## Not done / time-boxed out

No Part 1 task was time-boxed out. Rebranding, NASA imagery, its live test and the Gate 2 final checks are intentionally not started: the supplied prompt requires stopping here for the owner's `continue`. Live deployment, database migration and hosting/secret changes remain owner actions.

## Ready for owner review

**Yes, for Gate 1.** The available local checks pass. This is a reviewed-code gate, not a claim that the live site was upgraded or that the skipped database and production checks passed.
