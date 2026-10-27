# Publish AtlasSphere with Vercel and Neon

This deployment uses Vercel for the built website and existing Express API, and Neon for PostgreSQL. It has no Render dependency. The owner selected a fresh, empty Neon database on 27 October 2026; this setup creates the application tables there and does not copy or delete data from any old service.

Production is live at [atlassphere.vercel.app](https://atlassphere.vercel.app). The two existing migrations have been applied, and production verification passed. See [launch status](VERCEL_PUBLISH_STATUS.md).

## Required account steps

1. Use a Vercel Hobby account for this non-commercial portfolio. Run `npx --yes vercel@65.4.0 login` and finish the device authorization, including the final authorization screen. Merely signing into the dashboard does not authenticate the CLI.
2. In Neon, choose the intended production branch/database and click **Connect**. Copy the pooled URL into `DATABASE_URL` in the ignored local `.env`. Disable pooling and copy the direct URL into `DIRECT_DATABASE_URL`. Retain the SSL query parameters. Do not paste credentials into chat or commit them.
3. Generate a random server-only `AUTH_SECRET` of at least 32 characters and a different `CRON_SECRET`. Store them privately; keep the authentication secret stable across deployments.

The application uses Prisma 6. Its existing schema already separates runtime and migration connections. Do not enable Neon's Data API or expose its database credentials to the browser; the existing Express API handles authentication and authorization.

## Publish

After the private connection settings and CLI sign-in are ready:

1. Check `npx --yes vercel@65.4.0 whoami` reports the intended account.
2. Link or create the Vercel project with `npx --yes vercel@65.4.0 link`. Use the repository root and the included configuration. Do not connect a production deployment to an unrelated existing project.
3. In the project's **Production** environment variables, set `DATABASE_URL` (pooled), `DIRECT_DATABASE_URL` (direct), `AUTH_SECRET`, `CRON_SECRET`, `APP_ENV=production`, `FIXTURES=0` and `TRUST_PROXY_HOPS=1`. Never prefix secrets with `VITE_`. No Open-Meteo key is needed for the free historical archive.
4. Against the confirmed empty Neon target, run `npm run prisma:migrate`. This applies the two existing migrations; it does not reset or drop the database. Check database readiness before publishing.
5. Run `npx --yes vercel@65.4.0 deploy --prod`. The default deployment URL is supplied by Vercel; do not assume a particular subdomain is available. A successful build alone is not a successful database/application verification.
6. Optionally connect the GitHub repository after the first deployment. Select `atlassphere-quick-upgrade` as the deployment branch until the upgrade is merged. Connecting GitHub may require the owner to authorize the Vercel GitHub app. Do not accidentally deploy the older `main` branch.

Preview deployments must use a separate Neon branch/database and separate secrets, rather than production credentials. This guide configures production only.

## How this repository is packaged

`deployment/vercel.ts` exports one Express application with production mode and fixture mode disabled. It starts neither a persistent HTTP listener nor a background timer. Existing routes, cookie names, authorization, test IDs and browser-storage names are preserved.

`vercel.json` explicitly builds the Vite output with `@vercel/static-build` and the API entry point with `@vercel/node`. This repository's `api/` contains internal modules as well as route implementations, so the explicit build list prevents auto-publishing each internal TypeScript file as a separate function. These builder settings are deliberate compatibility configuration; Vercel generally recommends framework presets for new applications. `vercel-build` validates production settings without exposing values, generates Prisma's client on the Linux build host and builds the pages. It does not migrate the production database during previews or builds.

Static pages and assets are served from the build output. `/journeys` and `/geoguess` map to their built pages. API, Swagger and OpenAPI routes use the single Node function; unknown pages retain the application's 404 page. JSON documentation/news, the Prisma client and Swagger assets are included in the function bundle. The deployment ignore file excludes local credentials, reports, tests and the disposable local database. Local `npm run dev`, `npm start` and existing tests remain available.

## Verify the live URL

- Homepage, `/journeys`, `/geoguess`, `/docs/`, `/openapi.json` and an unknown-page 404.
- `/api/v1/health` reports `status: ok`; `/api/v1/health/db` reports `db: ok`.
- `/test-lab` and `/api/v1/test-lab/scenario` are unavailable in production, even if stray development flags are present.
- Sign-up, sign-in, refresh, favorites, trips, alerts, review save/reload/delete and public reviewer privacy. Use disposable records and remove them after checking.
- Weather search, historical weather and the NASA satellite panel with its attribution.
- Run the existing `test:smoke:prod` against the intended new URL only after the cleanup endpoint is available. It creates temporary accounts/records and deletes them.

## Automatic alert checks

A serverless deployment does not keep the old three-hour timer alive. The owner chose to create this job manually. In the existing cron-job.org account, click **Create cronjob** and configure:

- Title: `AtlasSphere alert checks`.
- URL: `https://atlassphere.vercel.app/api/v1/internal/cron/alerts`.
- Method: **POST**.
- Header: `x-cron-secret`, value matching the private Vercel `CRON_SECRET`. Copy it from local `.env.production.local`; do not paste it into chat or a public URL.
- Schedule: every three hours. For a custom cron schedule, minute `17`, hours `0,3,6,9,12,15,18,21`, every day/month/weekday. Choose timezone `Asia/Kolkata` if offered.
- Enable and save the job. Use its test action and check for HTTP **200** with numeric `checked` and `created` fields in the response. Zero counts are normal when there are no rules or matches. If a test immediately follows another successful run, the endpoint can return **429** until its one-minute cooldown has passed.

No keep-warm job is needed for correctness. Alerts are in-app notifications, not push notifications. Password reset also requires the existing optional server-side email-provider configuration before it can deliver mail publicly.

Provider budgets and caches are currently per process. Serverless instances do not share those counters or the weather cache. This is suitable only for controlled portfolio traffic; a shared quota/cache design is needed before traffic grows. The free-provider usage ceilings still apply. The alert worker's existing database transaction prevents duplicate matching notifications across overlapping invocations; a large batch of slow provider requests may exceed the function duration and needs a later bounded-job design.

## Current verification status

On 27 October 2026, before account provisioning:

- `npm test`: 70 passed, including four production-configuration checks.
- `npm run vercel-build`: passed (existing globe chunk warning).
- `npm run typecheck:api`: passed, including the new deployment entry point.
- `npm run test:accounts:local`: all 25 tests reported passed with a disposable local PostgreSQL database, including the six account tests previously skipped at Gate 2. The wrapper then hung during Windows teardown and was interrupted; the command did not exit successfully. Afterwards the local test port was no longer listening. Ignored local cluster files were retained. This is not a clean pass of the wrapper command.
- A local HTTP check imported the new entry point with stray test environment flags and verified ten routes, production-only behavior and the AtlasSphere homepage. This checks the adapter locally, not Vercel's hosted routing/build.

The Vercel preview cloud build and eight hosted route checks subsequently passed. Production publication, Neon initialization, thirteen public route checks, two production smoke tests and a live browser workflow also passed. See [VERCEL_PUBLISH_STATUS.md](VERCEL_PUBLISH_STATUS.md). The owner-operated alert schedule, optional email-provider setup and automatic GitHub deployment connection remain pending.

Sources checked 27 October 2026: [Vercel Express hosting](https://vercel.com/docs/frameworks/backend/express), [Vercel build configuration](https://vercel.com/docs/project-configuration/vercel-json), [Neon with Prisma](https://neon.com/docs/guides/prisma), [cron-job.org request configuration](https://cron-job.org/en/faq/).
