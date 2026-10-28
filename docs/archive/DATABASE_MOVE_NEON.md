# Owner checklist: move the database to Neon

This document prepares the move. The quick-upgrade work does not change hosting settings, copy production data, or delete any database. Render's free PostgreSQL expires after 30 days and is deleted after the subsequent 14-day upgrade grace period: [Render's policy](https://render.com/docs/free).

## 1. Prepare the source and destination

1. Create or open your Neon **Free** project in a region near the Render service. Do not enable paid options for this project.
2. Keep the old Render database and its connection string. Keep the existing `AUTH_SECRET` in Render. Store credentials privately, never in GitHub, screenshots or chat.
3. If Render contains accounts, trips, alerts or reviews, back up and copy them before switching. Arrange a maintenance window and pause writes while making the final copy. The owner can use [Neon's migration guidance](https://neon.com/migration) and its Import Data Assistant with Render's **external** connection URL. An empty Neon database does not automatically contain the old data.
4. Verify the import and select its actual Neon branch. Use connection strings for that branch, not an unrelated empty branch. Check that the expected records are present.

## 2. Obtain both connection strings

In Neon, click **Connect** for the chosen database and branch:

- With pooling enabled, copy the URL for `DATABASE_URL`.
- With pooling disabled, copy the direct URL for `DIRECT_DATABASE_URL`.

Retain Neon's SSL parameters. Both URLs must point to the same database. Prisma uses the pooled URL at runtime and the direct URL for migrations. In local development and CI, `npm run prisma:migrate` falls back to `DATABASE_URL` if the direct variable is omitted. `npm run prisma:generate` generates client code and does not migrate a database.

## 3. Update Render and redeploy

After the reviewed code is available on the branch used by Render:

1. Open the SkyAtlas web service, then **Environment**.
2. Set `DATABASE_URL` to the Neon pooled URL and `DIRECT_DATABASE_URL` to the Neon direct URL. Preserve `AUTH_SECRET` and the other existing settings; use `APP_ENV=production`.
3. In **Settings → Build**, use:

   ```sh
   npm ci && npm run prisma:generate && npm run prisma:migrate && npm run build
   ```

4. Keep `npm start` as the start command and Node 24 as the runtime. Free instances run migrations during the build; they do not need a paid pre-deploy command.
5. Redeploy and check that the migration and build steps succeed. If either fails, stop and investigate; do not delete the source database.

## 4. Verify before deleting anything

1. Open `https://skyatlas-9mae.onrender.com/api/v1/health/db` and confirm `{"status":"ok","db":"ok"}`.
2. Sign in to an existing copied account and check its saved records. Also check sign-up with a disposable account.
3. Create, edit, reload and delete a test trip, alert and review. Check that the review's public response contains no reviewer ID or email.
4. Check sign-in again after a reload. Confirm the old data was copied and new data persists.
5. Once this code is deployed, optionally run `npm run test:smoke:prod` against the intended site. It creates two temporary accounts and records, then deletes them. Do not run it against an older build without the cleanup endpoint.
6. Keep the old Render database until the owner has verified the data and is satisfied with the rollback window. Only the owner deletes it afterwards. Free-plan limits and retention policies can change, so review the provider's current plan details.

## 5. Roll back if verification fails

Pause writes. Restore the old `DATABASE_URL` in Render and restore `DIRECT_DATABASE_URL` to the old direct connection too (or remove it so the script uses the old `DATABASE_URL`). Redeploy the known working application version. Check sign-in and the saved records before reopening writes.

Changing a connection string does not synchronize databases. If users wrote new data to Neon after cutover, reconcile those records before rolling back; they will not already exist in the old Render database. Keep the backup and Neon database until that is resolved.
