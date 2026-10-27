# Vercel and Neon publishing status

27 October 2026. Branch: `atlassphere-quick-upgrade`.

## Completed

- The owner authorized publishing without Render and confirmed that the intended Neon database is empty.
- Owner completed Vercel CLI device authorization. Verified account `panigrahishubham275-4028`, workspace `atlas-sphere`, plan **Hobby**.
- Created and linked the `atlas-sphere/atlassphere` project. The local `.vercel/` metadata and credential files are ignored.
- Added a single production-only Express function, explicit API/page/static routing, deployment exclusions, a build script and a check that refuses incomplete production credentials or development flags.
- Configured five production environment variables: `APP_ENV`, `FIXTURES`, `TRUST_PROXY_HOPS`, `AUTH_SECRET`, `CRON_SECRET`. Secret values were generated privately, passed to the CLI through stdin and retained in ignored `.env.production.local`; no secret value was included in the source or report.
- Created an authenticated preview: [preview](https://atlassphere-oznr0z75q-atlas-sphere.vercel.app), [build inspector](https://vercel.com/atlas-sphere/atlassphere/DGAHssAK4ubde2nWt1bK4LE3aLXV). This is a protected preview with no production database connection.

## Checks actually run

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

The eight-route check saved response bodies only to ignored `test-results/vercel-preview/` and checked the HTTP status of each response. Cloud routing is verified; database-backed production workflows are not.

## Pending before production

1. Owner saves Neon's pooled `DATABASE_URL` and direct `DIRECT_DATABASE_URL` in local `.env`, keeping credentials private. At the last check, the file still had its local example URL and no active direct URL.
2. Validate that both URLs target the intended same Neon branch/database with SSL, then configure the two **production** Vercel variables. Preserve the already-created authentication secret.
3. Apply the two existing Prisma migrations to the confirmed empty Neon target. Verify database readiness. No Neon schema or data has been changed so far.
4. Deploy explicitly with `--prod`, verify the resulting public URL and the signup/sign-in/persistence/privacy workflows, then run the existing production smoke checks with their temporary-record cleanup.
5. Set the existing cron-job.org POST job to the new alert endpoint and private cron secret. Optional password-reset email delivery needs its email-provider settings. See [deployment guide](DEPLOY_VERCEL_NEON.md).

Automatic GitHub deployments are also pending: Vercel's link attempt returned “You need to add a Login Connection to your GitHub account first.” The owner can connect GitHub in Vercel's account settings and authorize the repository. CLI deployments already work and do not depend on that optional connection. Select the upgraded branch, not the older `main`, when enabling repository deployments.

No Render service/database was changed or deleted, and no paid service was selected. A protected preview is ready; **full production publication is not complete** until the Neon connection and live checks above succeed.
