# Vercel and Neon publishing status

27 October 2026. Branch: `atlassphere-quick-upgrade`.

**Production is live:** [https://atlassphere.vercel.app](https://atlassphere.vercel.app). Vercel hosts the website/API; Neon hosts PostgreSQL. The deployed application source is commit `242210b`. Subsequent launch documentation and the smoke-test default URL do not change the running application.

The owner subsequently requested the GitHub repository title match the product. On 27 October 2026, the repository was renamed to [panigrahi-shubham/AtlasSphere](https://github.com/panigrahi-shubham/AtlasSphere), and this checkout's `origin` URL was updated. [PR #1](https://github.com/panigrahi-shubham/AtlasSphere/pull/1) remains open. The local folder and application compatibility identifiers retain their existing names; historical reports describe their original snapshot.

## Production publication completed

After the owner saved the Neon URLs and said “Neon done”:

- Validated paired pooled/direct connections, SSL and existing production secrets without displaying their values.
- A direct read-only check found zero public tables in the intended Neon target.
- `npm run prisma:migrate` passed and applied `20261027_initial` and `20261028_add_display_name`. No reset or data deletion was used.
- Pooled readiness returned successfully; both migration records were finished and the initial account count was zero.
- Stored `DATABASE_URL` and `DIRECT_DATABASE_URL` as private production variables, preserving the five existing production settings/secrets.
- `npx --offline --yes vercel@65.4.0 deploy --prod --yes --scope atlas-sphere` passed. Deployment `dpl_5r51dfm1T9EpCg7fUkfGVn8DA8CQ` reached READY and was aliased to the public URL above. [Production build inspector](https://vercel.com/atlas-sphere/atlassphere/5r51dfm1T9EpCg7fUkfGVn8DA8CQ).

## Live production verification

All checks below ran against the real public production domain, without mocked API/weather/NASA responses:

| Check | Result |
| --- | --- |
| Thirteen unauthenticated public route requests | Passed: `/`, `/journeys`, `/geoguess`, `/about.html`, `/api/v1/health`, `/api/v1/health/db`, `/openapi.json`, `/docs/`, `/docs/swagger-ui.css` returned 200; Test Lab, internal source and unknown-page checks returned 404. Database health reported `db: ok`. No Vercel login or protection bypass was required. |
| `SKYATLAS_URL=https://atlassphere.vercel.app npm run test:smoke:prod` (set using PowerShell's environment variable syntax) | **2 passed**: alert persistence/validation/ownership and review persistence/image/validation/deletion. Temporary account cleanup passed. |
| Headless Chromium live browser workflow | Passed: UI sign-up, profile update, live city/weather loading, favorite save and persistence after reload, secure HttpOnly SameSite=Lax refresh cookie, sign-out and password sign-in, trip save/reload, review save/display name, and public review response without reviewer ID/email. |
| Historical weather and NASA in that browser workflow | Passed: historical reanalysis loaded without a paid archive key; a real 800-pixel NASA JPEG for 2024-01-01 loaded with its attribution. Desktop/mobile panel screenshots were inspected. The 390-pixel mobile page had no horizontal overflow, and the browser reported no uncaught page JavaScript errors. No particular live weather values were asserted. |
| Authenticated alert cron endpoint check | Passed: missing secret returned 401; correct private header returned 200 with `checked: 0, created: 0` after the test rules were removed. |
| Read-only Neon cleanup check | Passed: zero `smoke-` or `launch-` temporary test accounts remained. Their owned records were removed through the API's cascading account deletion. No unrelated records were deleted. |

One-time browser and route checks ran as Node/Playwright scripts through the terminal. Screenshots are local ignored artifacts under `test-results/production-launch/`. These checks supplement the existing automated suites; they do not imply every cross-browser or accessibility scenario was rerun during publication.

## Preparation history

- The owner authorized publishing without Render and confirmed that the intended Neon database is empty.
- Owner completed Vercel CLI device authorization. Verified account `panigrahishubham275-4028`, workspace `atlas-sphere`, plan **Hobby**.
- Created and linked the `atlas-sphere/atlassphere` project. The local `.vercel/` metadata and credential files are ignored.
- Added a single production-only Express function, explicit API/page/static routing, deployment exclusions, a build script and a check that refuses incomplete production credentials or development flags.
- Configured five production environment variables: `APP_ENV`, `FIXTURES`, `TRUST_PROXY_HOPS`, `AUTH_SECRET`, `CRON_SECRET`. Secret values were generated privately, passed to the CLI through stdin and retained in ignored `.env.production.local`; no secret value was included in the source or report.
- Created an authenticated preview: [preview](https://atlassphere-oznr0z75q-atlas-sphere.vercel.app), [build inspector](https://vercel.com/atlas-sphere/atlassphere/DGAHssAK4ubde2nWt1bK4LE3aLXV). This is a protected preview with no production database connection.

## Earlier preparation checks

| Command/check | Result |
| --- | --- |
| `npm test` before deployment changes | 66 passed. |
| `npm test` after adding the production configuration checks | 70 passed. |
| `npm run typecheck:api` | Passed, including the deployment entry point. |
| `npm run vercel-build` | Passed locally before and after adding the production preflight; existing large globe chunk warning remains. |
| `npm run test:accounts:local` | The test runner reported 25 passed, including all six database-dependent cases previously skipped at Gate 2. The wrapper hung after the summary during Windows teardown and was interrupted with exit 1. This command is not recorded as a clean pass. The local test port was subsequently no longer listening; ignored cluster files were retained. |
| Local HTTP adapter check | Ten routes passed, including built pages, API health, documentation, unknown-page 404 and disabled Test Lab despite stray test flags. No hosted database used. |
| `npx --offline --yes vercel@65.4.0 deploy --yes --scope atlas-sphere` | Failed. Vercel treated this initial deployment as production; the preflight correctly rejected the absent Neon URLs/secrets. No production deployment became ready. |
| `npx --offline --yes vercel@65.4.0 inspect atlassphere-8t6lgf1ls-atlas-sphere.vercel.app --logs --scope atlas-sphere` | Confirmed the missing-environment preflight as the build failure. |
| `npx --offline --yes vercel@65.4.0 deploy --environment preview --yes --scope atlas-sphere` | Passed, cloud deployment state READY. |
| `npx --offline --yes vercel@65.4.0 curl /api/v1/health --deployment https://atlassphere-oznr0z75q-atlas-sphere.vercel.app --scope atlas-sphere -- --silent --show-error --write-out '\nHTTP %{http_code}\n'` | HTTP 200, JSON `status: ok`. CLI created its project-scoped automation protection token; its value was not printed. |
| Eight preview requests through authenticated `vercel curl` | `/`, `/journeys`, `/geoguess`, `/openapi.json`, `/docs/swagger-ui.css`: 200. `/api/app.ts`, `/test-lab`: 404. `/api/v1/health/db`: 200 with `db: unavailable`, accurately reflecting the missing Neon connection. Page HTML also contained the AtlasSphere title. |
| `git diff --check` | Passed. |

The eight-route preview check saved response bodies only to ignored `test-results/vercel-preview/` and checked the HTTP status of each response. The preview was verified before production database configuration; its earlier `db: unavailable` response is historical, not the current production status.

## Owner-selected remaining setup

The owner chose **“I'll create the scheduled job myself using your steps.”** Configure the three-hour cron-job.org POST job using the exact URL, method and private header in [DEPLOY_VERCEL_NEON.md](../DEPLOY_VERCEL_NEON.md#automatic-alert-checks). The endpoint is verified, but the external schedule has not been created or claimed as running.

Password-reset email delivery still needs the existing email-provider URL/token; it is currently unavailable. Provider quota/cache counters remain per process, as documented in the deployment guide. Existing dependency audit findings and the large lazy globe chunk remain separate follow-up work.

Automatic GitHub deployments are also pending: Vercel's link attempt returned “You need to add a Login Connection to your GitHub account first.” The owner can connect GitHub in Vercel's account settings and authorize the repository. CLI deployments already work and do not depend on that optional connection. Select the upgraded branch, not the older `main`, when enabling repository deployments.

No Render service/database was changed or deleted, and no paid service was selected. **The website and database are published and verified.** Automatic alert scheduling, email-provider setup and optional GitHub deployment integration are separate remaining setup items, accurately listed above.
