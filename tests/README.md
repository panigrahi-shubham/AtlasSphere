# Test quick start

Install Node.js 24, then run `npm ci`, `npm run prisma:generate`, `npx playwright install chromium` and `npm run build`. The local API suite also verifies production HTML routes, so it needs the built pages.

```sh
npm test
npm run test:ui
npm run test:accounts:local
npm run test:home
npm run test:discovery
npm run test:release
```

`test:accounts:local` creates a disposable PostgreSQL database. Never use production credentials for local tests. Open the latest UI report with `npm run report:ui`, or inspect a retained trace with `npx playwright show-trace <trace.zip>`. To repeat a changed spec five times, run `npm run test:flaky -- <spec>`.

See [the test strategy](../docs/TEST_STRATEGY.md) for counts, fixture boundaries, live tests and CI coverage.

Solar System tests use isolated development/production servers on ports 5177/31425. After building, run `test:discovery` with `HOME_PRODUCTION=1` to include prerendered HTML and real 404 checks. The suite covers desktop and touch, the deterministic clock, camera controls, visible facts, shareable selection, theme accessibility and WebGL fallback. SwiftShader provides software WebGL in CI; real-device GPU acceptance remains a separate release check.
