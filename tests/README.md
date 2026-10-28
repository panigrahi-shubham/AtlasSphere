# Test quick start

Install Node.js 24, then run `npm ci`, `npm run prisma:generate`, `npx playwright install chromium` and `npm run build`. The local API suite also verifies production HTML routes, so it needs the built pages.

```sh
npm test
npm run test:ui
npm run test:accounts:local
npm run test:home
npm run test:release
```

`test:accounts:local` creates a disposable PostgreSQL database. Never use production credentials for local tests. Open the latest UI report with `npm run report:ui`, or inspect a retained trace with `npx playwright show-trace <trace.zip>`. To repeat a changed spec five times, run `npm run test:flaky -- <spec>`.

See [the test strategy](../docs/TEST_STRATEGY.md) for counts, fixture boundaries, live tests and CI coverage.
