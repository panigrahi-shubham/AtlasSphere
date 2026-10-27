# Phase 2: SkyAtlas API

SkyAtlas now serves a same-origin Express API. The website calls `/api/v1/weather`, `/api/v1/geocode` and `/api/v1/news`; the Three.js globe, atlas and GeoGuess remain client-side. Vite mounts the API in development and preview; `npm start` serves both the built site and API in production.

| Route | Parameters | Response | Cache |
| --- | --- | --- | --- |
| `GET /api/v1/weather` | `lat`, `lon`, optional `units=celsius|fahrenheit`, `view=current|daily` | Open-Meteo-compatible current/hourly or seven-day payload | 10 minutes |
| `GET /api/v1/geocode` | `q` (2–80 characters), optional ISO `countryCode` | Up to five city matches | 24 hours |
| `GET /api/v1/news` | none | Saved `lastUpdated` and news items | On disk |
| `GET /api/v1/health` | none | Service status and time | none |

Input failures return HTTP 400 and `{ "error": { "code": "INVALID_INPUT", "message": "...", "field": "..." } }`. Unknown API routes return 404. Each IP has 60 requests per minute; excess requests return 429 and `Retry-After`. Provider errors return 502, and the five-second abort returns 504. Cache responses have `X-Cache: HIT` or `MISS`. Cache and rate buckets are per server process and reset on restart; multiple instances do not share them.

Swagger UI is at `/docs/` and its source contract at `/openapi.json`. The Postman collection is `api/SkyAtlas.postman_collection.json`. `APP_ENV=test FIXTURES=1` enables deterministic JSON under `tests/fixtures` without calling Open-Meteo. The API checks use an ephemeral in-process server; live provider tests remain separate.

The news file starts with visibly marked sample items. `npm run news:fetch` fetches the Met Office news RSS feed, keeps entries matching weather topics, strips markup, limits snippets to 200 characters, verifies HTTPS links and saves at most 30 items. If all feeds fail, it leaves the previous snapshot intact. The scheduled workflow runs at minute 7 every three hours and commits updates. The source links must continue to open the original Met Office content.

Deploy source from GitHub as a Render Node web service with `npm ci && npm run build`, `npm start`, and health check `/api/v1/health`. The included `render.yaml` has those settings. Keep `APP_ENV=production` and `FIXTURES` unset. The production server serves the `dist` assets and `/geoguess` route. Do not use a static-only host for this phase.

Checks: `npm run typecheck:api`, `npm test`, `npm run test:api:local`, `npm run test:v2 -- --workers=1`, `npm run test:ui -- --workers=1`, `npm run test:bugs -- --workers=1`, `npm run test:release`. The app has no login or database in Phase 2.
