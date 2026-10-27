# Free deployment (work in progress)

## PostgreSQL

Create a Neon free project in a region close to the Render service. In Neon's connection dialog, copy the pooled connection string and the direct connection string separately. In Render's web service environment, set `DATABASE_URL` to the pooled string and `DIRECT_DATABASE_URL` to the direct string. Keep both values private. The migration script uses the direct connection, and falls back to `DATABASE_URL` when the direct URL is unset.

Changing the connection does not copy existing data. Back up and migrate the existing Render database first if its users, reviews or other records must be preserved. Verify the migrated data and `/api/v1/health/db` before removing the old database; the owner controls deletion. Free plan limits and retention policies can change, so check them before relying on a provider.

The repository's Render build command runs migrations during the build for free instances. `GET /api/v1/health` stays independent of the database; `GET /api/v1/health/db` reports whether a database query succeeded.

The Cloudflare, scheduled alerts and production smoke instructions are not yet implemented.
