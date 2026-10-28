# Deploy AtlasSphere with Vercel and Neon

The existing Vercel project serves the Vite build and the Express API; Neon supplies PostgreSQL. GitHub `main` is linked to the Vercel project and changes deploy after a reviewed merge. See [architecture](ARCHITECTURE.md) and the historical [launch record](archive/VERCEL_PUBLISH_STATUS.md).

## Production configuration

In the Vercel project’s Production environment, configure `DATABASE_URL` with the pooled Neon connection, `DIRECT_DATABASE_URL` with the direct connection, and distinct random `AUTH_SECRET` and `CRON_SECRET` values. Set `APP_ENV=production`, `FIXTURES=0` and `TRUST_PROXY_HOPS=1`. Keep credentials out of source control, browser bundles and chat. An Open-Meteo key is not required for the free non-commercial weather/archive endpoints.

Use separate development and test PostgreSQL databases and separate secrets. Preview deployments must use their own database branch and must not use production credentials. Configure the optional reset email provider only through server-side settings. See [account security](AUTH.md).

## Build and release

`npm run vercel-build` checks required production settings, generates the Prisma client and builds static pages and the single Express function. The build does not apply database migrations. Apply reviewed migrations separately to the intended database with `npm run prisma:migrate`; never reset a production database as part of testing.

The Node builder reads `deployment/tsconfig.json`. It rewrites relative TypeScript imports to `.js` in emitted functions; source-mode API tests alone do not verify this packaging contract. After building, run `npm run test:vercel` to compile and boot the production entry point without its TypeScript source files, check health, and verify test routes remain absent. CI runs this check before browser tests.

For a release, verify the pull-request checks and Vercel preview, then merge only after review. Confirm the production deployment is ready and check the public homepage, `/explore`, `/journeys`, `/geoguess`, `/docs/`, `/api/v1/health` and `/api/v1/health/db`. Test Lab and its API must return 404 in production. Use disposable records for any account or persistence smoke test and verify cleanup.

## Alerts and external services

Weather alerts are in-app notifications. An external scheduler must send an authenticated POST to `/api/v1/internal/cron/alerts`; configure its secret privately and confirm the schedule independently. Password-reset emails require the configured server-side provider. These operations are not enabled by deploying the front-end alone.

The free [Open-Meteo terms](https://open-meteo.com/en/terms) apply to non-commercial use and require attribution. API limits can change and may be shared by hosting IPs; verify current terms and quotas before deployment. NASA GIBS is used only for requested satellite imagery. Relevant sources: [Vercel Express hosting](https://vercel.com/docs/frameworks/backend/express), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Neon and Prisma](https://neon.com/docs/guides/prisma), and [cron-job.org request configuration](https://cron-job.org/en/faq/).
