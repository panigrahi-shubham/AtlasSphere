# Architecture

AtlasSphere is an educational website built as a Vite multi-page application. The discovery homepage uses React, TypeScript, React Router, TanStack Query and scoped CSS. The preserved explorer, Journeys and GeoGuess applications remain separate HTML entries and share the existing JavaScript/TypeScript modules. The existing `data-testid` attributes and compatibility names are retained.

## Pages and rendering

- `/` is the React Earth-and-space homepage. `/sources`, `/privacy` and `/accessibility` are its information pages. Production builds prerender these pages and React hydrates the controls in the browser.
- `/explore.html` and `/explore` serve the weather and geography explorer, including accounts, favorites, the atlas and the original globe. `/journeys` and `/geoguess` serve the existing applications.
- The homepage initially displays a local NASA Earth composite. The optional Three.js renderer and its texture load on request; geographic selection uses Natural Earth data. The static image remains available if WebGL fails. See [Earth imagery and adapter details](archive/PHASE1_EARTH_ASSETS.md).
- The homepage and explorer use the existing geographic search and weather API. Search inputs and coordinates are validated before display or navigation. Scientific preview content is curated and linked to its sources.

## Services and data

The Node.js 24 / Express API provides weather and geocoding proxy routes, authentication, favorites, journeys, alerts and reviews. Open-Meteo supplies weather and geocoding; NASA GIBS supplies optional satellite imagery. Prisma accesses PostgreSQL; production uses Neon, and development and CI use separate PostgreSQL databases. Credentials remain server-side and are not included in browser bundles.

Vercel hosts the Vite build and a single Express function. The build generates the Prisma client and validates production configuration without applying migrations. GitHub `main` is connected to the Vercel project. Scheduled alerts require the separately configured authenticated scheduler. See [deployment instructions](DEPLOY_VERCEL_NEON.md), [account security](AUTH.md), [satellite imagery](SATELLITE_IMAGERY.md), and [credits](../ATTRIBUTION.md).

## Verification boundaries

The deterministic browser suites intercept provider responses and fail on unexpected external requests or uncaught page errors. PostgreSQL tests require an isolated test database; live provider checks run separately. Production does not expose test routes or practice defects. See [the test guide](../tests/README.md) for commands and the [known defects catalogue](KNOWN_DEFECTS.md) for deliberate practice cases.
