# Phase 1 preserved feature inventory

The inventory was made before the Earth & Space redesign on 28 October 2026.

- Weather: current conditions, 24 hourly cards, seven-day forecast, unit switching, error/retry/offline states, browser geolocation; existing Open-Meteo proxy and explicit upstream fallback.
- Geography: Natural Earth/world-atlas map with 177 simplified shapes; bundled directory of 250 countries/territories; filters, capital lookups, pan/zoom and keyboard alternatives.
- Photographs: 16 landmark photos and a landscape hero with existing license records in `docs/PHOTO_CREDITS.md` and `src/data/photos.json`.
- Globe: lazy Three.js sphere, zoom/drag/keyboard rotation, selected-location marker and explicitly illustrative weather effects. Original implementation stays in the explorer.
- GeoGuess: country outlines and landmark pin games, five rounds, deterministic seeds, scores, local leaderboard, replay and share links.
- Accounts: registration, login, refresh/logout, password-reset endpoints, profile, export/delete, persisted theme and favorites, anonymous local storage. PostgreSQL and Prisma remain mandatory for accounts, not public browsing.
- Journeys: trips, historical reanalysis, NASA satellite view, alerts/in-app notifications and landmark reviews with image upload.
- Infrastructure: Express APIs, OpenAPI/Swagger/Postman contracts, Prisma migrations, Vercel deployment adapter, historical Render/Cloudflare alternatives and scheduled RSS snapshot.
- QA: Node unit tests, API integration tests, Playwright UI/v2/release/defect/live suites, axe and Lighthouse; GitHub Actions with isolated PostgreSQL.

The current explorer moves intact to `/explore.html`. Its existing `data-testid` values are preserved. The archived `legacy/` folder is not used as a substitute. Current public production is unchanged during this local phase.

Pre-existing limitations: Gmail reset delivery uncommitted/unverified in production; no persistent shared provider budget; limited concurrent-session coverage; bounded alert processing without fair pagination; Windows disposable PostgreSQL teardown issue; optional large globe bundle; manual accessibility acceptance pending. Android and full astronomy/history engines remain deferred.
