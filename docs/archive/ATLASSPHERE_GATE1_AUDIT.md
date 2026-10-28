# Quick upgrade: baseline audit

Recorded 27 October 2026 before quick-upgrade source changes. Branch `atlassphere-quick-upgrade`, starting commit `eec5ff9`. This branch preserves the preceding Stage A work. The live service was not redeployed.

## Environment and baseline

- Node `v24.15.0`; npm `11.12.1`; working tree initially clean.
- `npm ci`: passed; npm reported three high-severity dependency findings. No automatic dependency upgrades were applied.
- Immediately after clean install, `npm test`: 56 passed, 2 failed because the generated Prisma client was absent. `npm run typecheck:api` and `npm run build` also failed for that missing prerequisite. `npm run test:smoke` and `npm run test:api:local` failed to start correctly for the same reason.
- Ran the existing prerequisite `npm run prisma:generate`: passed. No database was migrated.
- After generation: `npm test`: 58 passed; `npm run typecheck:api`: passed; `npm run build`: passed; `npm run test:smoke`: 2 passed; `npm run test:api:local`: 17 passed, 6 skipped because an isolated PostgreSQL database was not configured for that command.
- The existing optional globe chunk remains above Vite's 500 kB warning threshold.

## Known-issue audit

1. **Search 502:** not reproduced during the read-only audit. Live health and live Delhi geocoding returned 200; direct Open-Meteo geocoding also returned 200 with five results. `api/app.ts:87` maps upstream failures to a generic API error, and `src/services/http.js:34` handles HTTP errors. A shared outbound-IP block is a possible explanation for an intermittent failure, but these observations do not prove it. Task 2 adds controlled fallback and safe server diagnostics.
2. **Database expiry:** confirmed as a provider policy for Render Free PostgreSQL: expiry after 30 days and deletion after the following 14-day upgrade grace period. Source: [Render Free documentation](https://render.com/docs/free). This audit did not read the live database's secrets or query its plan. Move preparation is needed if it remains on that plan.
3. **Paid archive key:** confirmed on the live service, which returned 503 with the old Professional-key message. Already fixed in this local checkout: `api/journeys.ts:35` checks its cache, `:42` reserves budget, `:45` selects the free archive without a key, and `:54` sets the one-day cache header. [Open-Meteo's historical API](https://open-meteo.com/en/docs/historical-weather-api) supports non-commercial keyless archive access. The live service is running older code.
4. **Public reviewer IDs:** refuted in the current local source: `api/journeys.ts:99` returns an author and omits `userId` and email. The original `main` source selected and exposed `userId`. The live list returned 200 with zero reviews, so its empty response cannot establish whether the older live implementation still leaks IDs on non-empty data. Do not create public review data merely to inspect this.

## Adaptation decisions

Reuse the existing archive/cache implementation, reviewer display names, direct database URL fallback and free-instance migration build command. Keep the current public review shape and the SkyAtlas fallback author during Part 1; do not reintroduce a removed ID or prematurely rebrand. Add no schema migration or hosting change. Replace the earlier timeout-based fallback with the new HTTP-only policy. Document the separate Prisma-generation prerequisite.

## npm script inventory

```json
{
  "dev": "vite --host 127.0.0.1",
  "build": "vite build",
  "preview": "vite preview --host 127.0.0.1",
  "start": "node --experimental-strip-types api/server.ts",
  "typecheck:api": "tsc --project tsconfig.api.json --noEmit",
  "test:api:local": "playwright test --config=playwright.api-local.config.ts",
  "news:fetch": "node --experimental-strip-types scripts/fetch-news.ts",
  "test": "node --experimental-strip-types --test tests/*.test.cjs tests/unit/*.test.js",
  "test:ui": "playwright test --project=ui",
  "test:api": "playwright test --config=playwright.api.config.ts",
  "test:ui:memory": "node scripts/test-ui-memory.mjs --project=ui",
  "test:ui:all": "node scripts/test-ui-all.mjs",
  "test:ui:memory:all": "node scripts/test-ui-all.mjs --memory",
  "report:ui": "playwright show-report playwright-report/ui",
  "report:api": "playwright show-report playwright-report/api",
  "test:bugs": "playwright test --config=playwright.bugs.config.ts",
  "test:bugs:memory": "node scripts/test-ui-memory.mjs --config=playwright.bugs.config.ts",
  "test:release": "node scripts/test-production.mjs",
  "report:bugs": "playwright show-report playwright-report/bugs",
  "report:release": "playwright show-report playwright-report/release",
  "test:v2": "node scripts/test-v2.mjs",
  "report:v2": "playwright show-report playwright-report/v2",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "node scripts/prisma-migrate.mjs",
  "test:smoke": "playwright test --project=ui --grep @smoke",
  "test:smoke:prod": "playwright test --config=playwright.smoke.config.ts",
  "test:a11y": "playwright test --project=ui --grep @a11y",
  "test:cross-browser": "playwright test --project=ui --project=firefox --project=webkit",
  "check:syntax": "node scripts/check-syntax.mjs",
  "audit:web": "node --experimental-strip-types scripts/audit-web.mjs",
  "test:accounts:local": "node scripts/test-with-postgres.mjs"
}
```
