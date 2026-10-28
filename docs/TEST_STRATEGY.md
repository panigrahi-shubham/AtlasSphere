# Test strategy

## Test pyramid and boundaries

Fast Node tests exercise parsers, conversions, storage and service decisions. Local API tests exercise Express and, when configured, an isolated PostgreSQL database. Browser tests exercise rendered flows, keyboard interaction and accessibility. A smaller production-build suite checks deployed-mode behavior, while separately selected live contracts and production monitoring check real services.

Counts below are the recorded baseline for the current repository; counts describe executions and may overlap between suites. The original hidden-folder Windows checkout had UI and smoke failures; an unchanged checkout in a normal path passed those suites with two workers. The original and diagnostic outcomes are recorded in archive/FRAMEWORK_BASELINE.md.

| Suite | Command | Baseline | Real / mocked | Where it runs |
| --- | --- | --- | --- | --- |
| Node tests (`tests/unit`, `tests/*.test.cjs`) | `npm test` | 70 passed | Real modules; fixture or injected dependencies | PR |
| Local API (`tests/api-local`) | `npm run test:accounts:local` | 25 passed | Express and disposable PostgreSQL; provider responses supplied by tests | PR with PostgreSQL |
| UI (`tests/ui`) | `npm run test:ui` | 100 passed, one production-only skip | Real browser/app; provider routes normally mocked | PR; cross-browser scheduled |
| Explorer built assets (`tests/ui/pages`) | `npm run test:v2` | 39 passed | Built application, mocked geographic/weather responses, SwiftShader globe | PR |
| React homepage (`tests/home`) | `npm run test:home` | 20 passed, eight production-only skips | React UI, fixture geocoding; optional WebGL fallback | PR, desktop and touch |
| Homepage production build (`tests/home`) | `HOME_PRODUCTION=1 npm run test:home` after build | 28 passed in release validation | Express and prerendered pages; fixture geocoding | PR |
| Intentional defects (`tests/bugs`) | `npm run test:bugs` | 9 passed | Test-only defect flags and mocked providers | PR |
| Production assets (`tests/release`) | `npm run test:release` | 5 passed | Built application and fixture providers | PR |
| Live provider contracts (`tests/api`) | `npm run test:api` | 13 selected, not run in baseline | Real internet endpoints, one worker | Separate live run |
| Persistence smoke (`tests/smoke`) | `npm run test:smoke:prod` | Not run against production in this refactor | Creates unique accounts and records, then deletes them | Production monitor; isolated database in PR |

## Determinism and isolation

`tests/support/uiTest.ts` supplies an automatic network boundary to specs that import its `test`: unmocked external browser requests are aborted and recorded, and uncaught page errors fail teardown. Specs using Playwright directly must isolate the requests they make. Deterministic weather assertions use checked-in fixtures, not live values. Live provider tests are marked `@live`, use a separate config and require internet; respect the published provider limits before running them.

The local PostgreSQL wrapper creates a randomly named disposable database and removes it afterwards. API tests create uniquely named records and clean up in `finally` or teardown. Parallel work must isolate user data per worker; never reset a shared environment. The Test Lab and fake inbox exist only in development/test. Its deliberate failures are listed in [known defects](KNOWN_DEFECTS.md).

## Running and debugging

Use `npm run test:smoke` and `npm run test:a11y` for their existing tagged subsets. `npm run test:flaky -- tests/ui/explorer/forecast-geography.spec.ts` repeats a spec five times with two workers; it does not add retries to CI. On failure, open the HTML report with the matching `npm run report:*` script or inspect the retained trace using `npx playwright show-trace <trace.zip>`. Keep retries at zero and fix nondeterminism at its source.

## Adding a test

1. Pick the feature folder and the right layer; use a deterministic fixture unless the test is explicitly live.
2. Reuse a page object for common actions, while keeping assertions visible in the spec.
3. Mock external requests at the browser or API boundary and isolate any database user/data.
4. Add the appropriate tag and a file header and risk/scenario comment explaining the behavior.
5. Run the affected suite and `npm run test:flaky -- <spec>`, then inspect its report or trace on failure.

Folder layout and quick-start commands are in [tests/README.md](../tests/README.md). The complete source tree and API deployment are described in [architecture](ARCHITECTURE.md).
