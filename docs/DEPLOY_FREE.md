# Free deployment

## PostgreSQL

Create a Neon free project in a region close to the Render service. In Neon's connection dialog, copy the pooled connection string and the direct connection string separately. In Render's web service environment, set `DATABASE_URL` to the pooled string and `DIRECT_DATABASE_URL` to the direct string. Keep both values private. The migration script uses the direct connection, and falls back to `DATABASE_URL` when the direct URL is unset.

Changing the connection does not copy existing data. If the Render database contains accounts or reviews, arrange a maintenance window so no one writes to the old database while copying it. Use [Neon's migration guidance](https://neon.com/migration) or PostgreSQL's `pg_dump` and `pg_restore` tools with the Render **external** URL as the source and the Neon **direct** URL as the destination. Restore into an empty destination; never overwrite an existing database without a verified backup. Keep credentials out of shell history, logs and chat. Confirm the import completed, compare records, and verify a sign-in and saved data before switching the web service. Keep the Render database until the new deployment and `/api/v1/health/db` have been verified; the owner controls deletion. Free plan limits and retention policies can change, so check them before relying on a provider.

For a small existing database, Neon's Import Data Assistant is one option:

1. Schedule downtime and stop writes to the Render-backed application. Keep a backup of the source database.
2. In Render's database **Connections** section, copy the **External Database URL**. Do not reveal it in screenshots or chat.
3. In the Neon console, open **Import Database**, choose the SkyAtlas project, and supply the Render URL as the source. Follow Neon's compatibility checks and import prompts. The assistant can create a new Neon branch for the imported data; use that branch's connection strings in the next steps, not an unrelated empty branch.
4. Verify the import and compare expected account, trip, alert and review records. If anything is missing, keep the Render connection and investigate before switching.
5. In Neon, open **Connect** for the imported branch. Copy the pooled URL for `DATABASE_URL` and the direct URL for `DIRECT_DATABASE_URL`. In Render's SkyAtlas **Environment** screen, save both as secret values. Preserve the existing `AUTH_SECRET` so existing sessions remain valid.
6. After the Stage A code is available to the Render service, redeploy. Check the deploy log for successful migrations, then open `https://skyatlas-9mae.onrender.com/api/v1/health/db` and confirm it reports `"db":"ok"`. Sign in and check the copied records before reopening the app for writes.
7. Run the production smoke suite below. Retain the old Render database until the owner confirms that the data and site are working. The old database does not receive new writes after cutover.

The repository's Render build command runs migrations during the build for free instances. `GET /api/v1/health` stays independent of the database; `GET /api/v1/health/db` reports whether a database query succeeded.

## Scheduled alerts

Set a long random `CRON_SECRET` in the Render service environment. Configure an external scheduler that supports custom request headers to send a `POST` to `https://YOUR-RENDER-SERVICE/api/v1/internal/cron/alerts` every 60 minutes with `x-cron-secret` set to that value. Keep the value private. A missing secret disables the route. The server also checks alerts periodically while it is running. These checks do not send push notifications.

For an optional keep-warm monitor, request `GET https://YOUR-RENDER-SERVICE/api/v1/health` every 10 minutes. Check the scheduler provider's current free-plan limits before relying on it. Render's free instance-hour allowance is shared by the workspace: an always-running service can use almost the entire monthly allowance, so don't keep multiple services warm in the same workspace.

In cron-job.org, create one job for the alert URL, select **POST**, set an hourly schedule, and add the custom header `x-cron-secret` with the same secret saved in Render. Check its execution history for a successful response. For keep-warm, create a separate **GET** job for the health URL on a ten-minute schedule. One continuously running service can use about 744 of the workspace's 750 free instance hours in a 31-day month; do not keep ShopLab and SkyAtlas warm together in the same workspace.

## Cloudflare Pages

The repository includes a Pages proxy for `/api`, `/docs`, and `/openapi.json`. Set `API_ORIGIN` to the HTTPS origin of the Render service and add the Pages origin to `ALLOWED_ORIGINS` on Render. Use Node 24, `npm run build`, and output directory `dist`. Complete the preview checks below before switching the public site.

Once the verified Stage A branch is available on GitHub, open Cloudflare **Workers & Pages → Create application → Pages → Connect to Git**. Authorize GitHub and select the SkyAtlas repository. Choose the intended branch, build command `npm run build`, and output directory `dist`. Add build variable `NODE_VERSION=24` and, if slow-request fallback is desired, `VITE_PAGES_FALLBACK=1`. Add `API_ORIGIN=https://skyatlas-9mae.onrender.com` and the shared proxy secret in the Pages environment settings. The secret must also be set in Render; it must not use a `VITE_` prefix.

After the Pages build, add its exact HTTPS origin to Render's `ALLOWED_ORIGINS` and configure the proxy settings described below. In a preview, check city search, weather, atlas, GeoGuess, sign-in, refresh after reload, and saving and deleting a test alert and review. Verify that cookies remain on the Pages origin and that a disallowed origin cannot write. Switch users to Pages only after those checks pass and the provider usage limits below have been reviewed.

The proxy checks database readiness before forwarding a mutation. If readiness fails, it returns 503 with `Retry-After: 20` and `X-SkyAtlas-Retry-Safe: 1`; the browser announces the wait and retries up to three times without duplicating the write. If the request was forwarded and its response is lost, the marker is `0`: the browser asks the user to check their saved data instead of replaying an uncertain action. This also preserves refresh-token replay protection. Reads can retry safely. Normal backend responses, including cookies, pass through unchanged.

City search and weather requests fall back to Open-Meteo directly when the proxy returns a 503 with `Retry-After`. Setting the public build variable `VITE_PAGES_FALLBACK=1` on Pages also enables fallback after a 3.5-second slow request. The server retains its existing 550/minute, 4,500/hour and 9,000/day reservations. Direct browser requests are the explicitly supported fallback and are not part of that in-process counter; monitor total usage against Open-Meteo's per-application limits, and disable the optional slow-request fallback if traffic outgrows a small non-commercial demo. An abandoned slow request may still reach Open-Meteo, so it can count as an additional call.

`TRUST_PROXY_HOPS` defaults to 1. For the Cloudflare-to-Render chain, configure the same long random `PROXY_SHARED_SECRET` as a secret on Pages and Render before setting `TRUST_PROXY_HOPS=2` on Render. The Pages function attaches it to proxied requests; the server ignores untrusted extra forwarding entries when it is missing or incorrect. Confirm the actual chain and client addresses after deployment. Keep this secret out of source code and screenshots.

## Production smoke monitoring

After deploying the account deletion and other Stage A changes, set GitHub's repository variable `SKYATLAS_URL` to the public site URL. The production smoke workflow runs every six hours and can be started from Actions. It registers two temporary accounts, creates alert rules and a review, then deletes the records and accounts. It uploads a report and opens or updates a single issue on failure. GitHub Actions needs permission to write issues.

To run it manually after deployment, set `SKYATLAS_URL` in your shell and run `npm run test:smoke:prod`. This writes temporary records to the chosen site. For a local disposable database instead, run `node scripts/test-with-postgres.mjs --smoke`.
