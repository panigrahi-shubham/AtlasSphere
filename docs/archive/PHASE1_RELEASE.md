# Phase 1 production release

The owner reviewed the local homepage and explicitly requested production deployment after the implementation report. This is a release of the reviewed Earth & Space Phase 1; redesign Phase 2 is not started.

The release checkout starts from GitHub main `49cb1db`, retaining the latest scheduled news snapshot. It includes the React homepage, preserved explorer route, responsive assets, static rendering, public-file compression, tests and documentation. Separate uncommitted Gmail reset-email code, credentials documentation and nodemailer dependencies are excluded; they remain intact in the original working folder.

GitHub's Vercel status confirms the existing `atlas-sphere/atlassphere` project is connected to main. Publication uses the existing GitHub-to-Vercel path through a reviewed pull request. No database schema change or production migration is needed.

## Provider terms checked

[Open-Meteo terms](https://open-meteo.com/en/terms), checked 28 October 2026: free non-commercial use requires attribution and fewer than 10,000 calls/day, 5,000/hour and 600/minute. This site has no ads or payments and retains linked attribution. Existing per-process budgets are 9,000/day, 4,500/hour and 550/minute; these are not a shared deployment-wide quota across serverless instances. Public launch does not expand these limits or add background weather polling. Persistent shared quota enforcement remains a documented backend follow-up.

## Validation

The earlier implementation evidence and limitations are in `PHASE1_REPORT.md`. Release checks are repeated against this isolated checkout because it excludes the unrelated Gmail changes. GitHub CI supplies isolated PostgreSQL for database-dependent tests. Production verification must check the actual published homepage, preserved routes, application/database health, and absence of test-only endpoints.

The clean checkout passed `npm ci`, Prisma client generation, production build/prerender, 70 existing unit tests, five homepage unit tests, API/home TypeScript, homepage lint and formatting. The count differs from the implementation report because four Gmail-specific unit tests are deliberately excluded from this release.

The isolated checkout exposed a Windows hidden-parent-directory issue in Express page aliases. Page sends now use a fixed `dist` root with relative filenames, retaining default hidden-file protection. Route and hydration checks are repeated after this fix.

The final local rerun passed all 28 production homepage checks, all five built-explorer release checks, API typechecking and 19 local API checks. Six PostgreSQL-dependent API tests were explicitly skipped locally; the separate Gmail API test is excluded from this release along with its implementation.

The pre-release production deployment is linked from GitHub commit `49cb1db` and its successful [Vercel deployment](https://vercel.com/atlas-sphere/atlassphere/CPHSP8VFFxp3y47mZkGGzmm5Bkdf). It remains the rollback reference until the new release is verified.
