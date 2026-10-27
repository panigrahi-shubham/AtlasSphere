# Free deployment (work in progress)

## PostgreSQL

Create a Neon free project in a region close to the Render service. In Neon's connection dialog, copy the pooled connection string and the direct connection string separately. In Render's web service environment, set `DATABASE_URL` to the pooled string and `DIRECT_DATABASE_URL` to the direct string. Keep both values private. The migration script uses the direct connection, and falls back to `DATABASE_URL` when the direct URL is unset.

Changing the connection does not copy existing data. Back up and migrate the existing Render database first if its users, reviews or other records must be preserved. Verify the migrated data and `/api/v1/health/db` before removing the old database; the owner controls deletion. Free plan limits and retention policies can change, so check them before relying on a provider.

The repository's Render build command runs migrations during the build for free instances. `GET /api/v1/health` stays independent of the database; `GET /api/v1/health/db` reports whether a database query succeeded.

## Scheduled alerts

Set a long random `CRON_SECRET` in the Render service environment. Configure an external scheduler that supports custom request headers to send a `POST` to `https://YOUR-RENDER-SERVICE/api/v1/internal/cron/alerts` every 60 minutes with `x-cron-secret` set to that value. Keep the value private. A missing secret disables the route. The server also checks alerts periodically while it is running. These checks do not send push notifications.

For an optional keep-warm monitor, request `GET https://YOUR-RENDER-SERVICE/api/v1/health` every 10 minutes. Check the scheduler provider's current free-plan limits before relying on it. Render's free instance-hour allowance is shared by the workspace: an always-running service can use almost the entire monthly allowance, so don't keep multiple services warm in the same workspace.

## Cloudflare Pages (not ready to deploy)

The repository includes a Pages proxy for `/api`, `/docs`, and `/openapi.json`. Set `API_ORIGIN` to the HTTPS origin of the Render service and add the Pages origin to `ALLOWED_ORIGINS` on Render. Use Node 24, `npm run build`, and output directory `dist`. Account wake-up handling remains incomplete, so do not switch the public site yet.

City search and weather requests fall back to Open-Meteo directly when the proxy returns a 503 with `Retry-After`. The browser's timeout can occur before the proxy's 30-second timeout, so this does not yet guarantee immediate results during a cold start. Direct browser requests bypass the server's shared in-process provider counter; monitor usage and account for them when assessing the provider's per-application limits.

`TRUST_PROXY_HOPS` defaults to 1. For the Cloudflare-to-Render chain, configure the same long random `PROXY_SHARED_SECRET` as a secret on Pages and Render before setting `TRUST_PROXY_HOPS=2` on Render. The Pages function attaches it to proxied requests; the server ignores untrusted extra forwarding entries when it is missing or incorrect. Confirm the actual chain and client addresses after deployment. Keep this secret out of source code and screenshots.

## Production smoke monitoring

After deploying the account deletion and other Stage A changes, set GitHub's repository variable `SKYATLAS_URL` to the public site URL. The production smoke workflow runs every six hours and can be started from Actions. It registers two temporary accounts, creates alert rules and a review, then deletes the records and accounts. It uploads a report and opens or updates a single issue on failure. GitHub Actions needs permission to write issues.

To run it manually after deployment, set `SKYATLAS_URL` in your shell and run `npm run test:smoke:prod`. This writes temporary records to the chosen site. For a local disposable database instead, run `node scripts/test-with-postgres.mjs --smoke`.
