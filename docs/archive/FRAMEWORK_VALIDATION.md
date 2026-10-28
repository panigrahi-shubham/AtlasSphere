# Framework refactor validation

Base: `main` at `a9bb599094ac210d7648d8ba3398c3242147577f`, 28 October 2026. The separate shared-state branch/PR was absent at the final base check. Application behavior and compatibility identifiers are unchanged. This refactor is proposed for review; it does not authorize a production release.

## Executed checks

The [original baseline](FRAMEWORK_BASELINE.md) was captured before edits. Browser validation used a normal-path Windows checkout and two workers: the hidden-folder development Test Lab route already failed on unchanged main. No retries or assertions were relaxed.

| Command | Original baseline: pass / skip / fail | Final: pass / skip / fail |
| --- | --- | --- |
| `npm test` | 70 / 0 / 0 | 70 / 0 / 0 |
| `npm run test:accounts:local` | 25 / 0 / 0 | 25 / 0 / 0 |
| `npm run test:ui -- --workers=2` | 94 / 1 / 6 with original default workers | 100 / 1 / 0 |
| `npm run test:smoke -- --workers=2` | 1 / 0 / 1 with original default workers | 2 / 0 / 0 |
| `npm run test:a11y` | 1 / 0 / 0 | 1 / 0 / 0 |
| `npm run test:bugs` | 9 / 0 / 0 | 9 / 0 / 0 |
| `npm run test:release` | 5 / 0 / 0 | 5 / 0 / 0 |
| `npm run test:v2` | 39 / 0 / 0 | 39 / 0 / 0 |
| `npm run test:home` | 20 / 8 / 0 | 20 / 8 / 0 |
| `npm run test:home:unit` | 5 / 0 / 0 | 5 / 0 / 0 |
| Production homepage, `HOME_PRODUCTION=1` | Additional verification | 28 / 0 / 0 |
| Persistence smoke, local disposable PostgreSQL | Additional verification | 2 / 0 / 0 |

`typecheck:api` and `lint:home` passed before and after. Final `lint:tests`, `typecheck:tests`, `typecheck:home`, `format:home:check`, `check:syntax`, `check:links` and `build` passed. The local wrapper passed 25 API tests plus both persistence smoke tests, then stopped PostgreSQL and exited successfully. After the final user-cleanup helper change, that same 25 + 2 run passed again.

One intermediate account run in the fresh validation checkout returned 404 for the production HTML contract because `dist` had not been built yet (24 passed, one failed). Building first resolved that prerequisite; both the installation quick start and the successful rerun retain it. Earlier Windows database-shutdown attempts hung after passing tests; the wrapper now uses a fresh run-scoped cluster/port and bounded native `pg_ctl` start/stop on Windows. No production database was used.

The short-forecast regression passed five repeated executions with two workers using `test:flaky`. The final shared GeoGuess guard check passed seven development tests with its one existing production-only skip. CI-mode smoke/accessibility reporting was checked separately to verify distinct JUnit filenames; Node and homepage unit JUnit summaries retained 70 and five results.

## Selection and assertion preservation

All eight config lists preserve their test titles and counts, after ignoring renamed paths, line numbers and the old title-based tag prefix:

| Config / subset | Before | After | Same titles |
| --- | ---: | ---: | --- |
| Development UI | 101 | 101 | yes |
| Local API | 25 | 25 | yes |
| Live API | 13 | 13 | yes |
| Planted defects | 9 | 9 | yes |
| Release build | 5 | 5 | yes |
| Persistence smoke | 2 | 2 | yes |
| Built explorer | 39 | 39 | yes |
| Homepage | 28 | 28 | yes |
| `@smoke` | 2 | 2 | yes |
| `@a11y` | 1 | 1 | yes |
| `@live` | 13 | 13 | yes |

Run `node scripts/audit-assertions.mjs a9bb599` to reproduce the assertion audit. [The full JSON](FRAMEWORK_ASSERTIONS.json) maps the original and current file/line locations for every relocated expression, including repeated identical expressions. It reports:

```json
{
  "before": { "api-local": 178, "api": 66, "bugs": 18, "home": 60, "release": 21, "smoke": 21, "support": 2, "ui": 375, "built-explorer": 135 },
  "after":  { "api-local": 178, "api": 66, "bugs": 18, "home": 60, "release": 21, "smoke": 21, "support": 2, "ui": 375, "built-explorer": 135 },
  "removed": []
}
```

All 876 `expect(...)` calls remain, with 676 expression groups receiving updated locations. Node's existing `assert` checks are unchanged; the Node test edits are file moves and explanatory comments. All 53 test files have headers and all 268 declared test/it calls have risk and Given/When/Then notes (parameterized calls expand to more executions).

Existing skip call definitions remain at 12, with no new skip condition. Focused tests and fixmes remain zero. The one old fixed sleep is replaced with Playwright's clock; no `waitForTimeout` remains. Retries remain zero. The network-boundary fixture's interception and teardown assertions are preserved.

## Scope and follow-ups

- Live provider contracts (13 selected tests) were not executed; this refactor uses deterministic weather fixtures. The existing live current-weather check expects an `incomplete` flag that its normalizer does not expose. Its assertion is preserved for separate investigation.
- Production monitoring was exercised against disposable local PostgreSQL, not the live site. Hosted schedules and real-provider availability require their existing operational checks.
- `functions/` and `shared/pagesProxy.ts` remain unchanged. They preserve tested Pages compatibility while current production uses Vercel; removal belongs in a separate change.
- The hidden-folder Windows Test Lab file-serving issue remains an application follow-up. The normal-path workaround is documented, not presented as an application fix.
- The package rebrand commit changed only lockfile name fields. Adding the requested lint packages subsequently required their transitive development dependencies and TypeScript 6.0.3: the installed typescript-eslint release supports TypeScript below 6.1, while the baseline compiler was 7.0.2. Existing API/home typechecks and production builds pass; runtime dependency versions are unchanged.
- `news.yml` has no renamed test paths or test runner and needs no behavioral change. Web/nightly and monitor workflows retain their existing jobs and checks, with additive static verification and reporting.
