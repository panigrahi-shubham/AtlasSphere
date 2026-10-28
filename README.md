# AtlasSphere

**Weather, geography and travel exploration — with a Playwright automation portfolio.**

[Live website](https://atlassphere.vercel.app) · [GitHub](https://github.com/panigrahi-shubham/AtlasSphere) · [API documentation](https://atlassphere.vercel.app/docs/) · [Deployment guide](docs/DEPLOY_VERCEL_NEON.md)

AtlasSphere brings city forecasts, an interactive world atlas, a 3D globe, historical weather, satellite imagery and personal journeys into one responsive website. It is a non-commercial learning and QA project, formerly named SkyAtlas. The website and Express API run on **Vercel**, with **Neon PostgreSQL** for account data.

## Features

| Area | Implemented features |
| --- | --- |
| Weather | City search, browser location lookup, current conditions, 24-hour forecast, on-demand seven-day forecast, temperature/rain/wind charts, accessible forecast tables, Celsius/Fahrenheit switching, loading and error states. |
| World atlas | Interactive map with 177 simplified country shapes, pan/zoom, keyboard navigation, searchable directory of 250 countries/territories, region filters and capital-weather lookup. |
| Landmarks | 16 curated landmarks with bundled photographs, source links, country filtering and weather at approximate landmark coordinates. |
| 3D globe | Lazy-loaded Three.js globe, selected-location marker, rotation/zoom, optional auto-rotation and illustrative weather effects. |
| GeoGuess | Landmark Pin and Country Outline modes, five timed rounds, scoring, replay, reproducible seeded games, share links and browser-local leaderboards. |
| Accounts | Registration, sign-in/sign-out, rotating refresh sessions, display-name editing, theme preferences, account-data export and password-confirmed account deletion. |
| Favorites | Browser-local favorites for visitors and PostgreSQL persistence/synchronization for signed-in users. |
| Journeys | Saved trips with city and dates; create, edit and delete trip records. |
| Time Machine | Historical daily high/low temperatures using Open-Meteo ERA5 reanalysis, from 1940 through seven days ago. No paid archive key is required for the default non-commercial setup. |
| Satellite view | Date-selectable NASA MODIS Terra true-colour mosaics for the selected coordinates, with date validation, loading/error states and attribution. |
| Weather alerts | Saved threshold rules and in-app notifications; the hosted scheduler still requires setup (see below). |
| Landmark reviews | Ratings, written reviews, photo compression/upload, review sorting and deletion. Public reviews show a display name without exposing account email or user ID. |
| Interface | Light/dark themes, responsive navigation, labelled controls, keyboard support, reduced-motion handling, About and 404 pages. |
| QA tools | Development/test-only Test Lab, fixture data, practice defects, API documentation and automated regression suites. Test tools are unavailable in production. |

Password-reset endpoints exist, but **production reset emails are unavailable until an email provider is configured**. GeoGuess scores are local to the browser; there is no online leaderboard. Explorer Lab missions and an Android APK are not implemented.

## Technology

- **Frontend:** HTML, CSS, JavaScript and TypeScript modules, built with Vite.
- **Maps/globe:** d3-geo, TopoJSON, bundled country data and Three.js.
- **Backend:** Node.js 24, Express 5 and Prisma 6.
- **Database:** PostgreSQL in development, CI and production; Neon hosts the published database.
- **Testing:** Playwright, Node's test runner, axe accessibility checks and GitHub Actions.
- **Hosting:** Vercel serves the pages and a single Express function. Render is not required for this deployment.

## Run locally

Install Node.js 24 and npm, then:

```powershell
git clone https://github.com/panigrahi-shubham/AtlasSphere.git
cd AtlasSphere
npm ci
npm run prisma:generate
npm run dev
```

Open [localhost:5173](http://127.0.0.1:5173). Public weather and geography features can run without account credentials. Weather, geocoding and satellite imagery require internet access. Open the site through the server; opening `index.html` directly is unsupported.

### Enable accounts and saved journeys

Use a separate development PostgreSQL database or Neon development branch, not the production database.

1. Copy `.env.example` to `.env` only if `.env` does not already exist.
2. Set `DATABASE_URL`, a direct `DIRECT_DATABASE_URL` for migrations, and a random `AUTH_SECRET` of at least 32 characters. Retain SSL parameters for hosted connections. Keep `.env` private and ignored by Git.
3. Apply the existing migrations and explicitly load the environment when starting Vite:

```powershell
npm run prisma:migrate
node --env-file=.env node_modules/vite/bin/vite.js --host 127.0.0.1
```

For a local production-style build, use `npm run build`, then:

```powershell
$env:APP_ENV = 'production'
$env:FIXTURES = '0'
node --env-file=.env --experimental-strip-types api/server.ts
```

Open [localhost:3000](http://127.0.0.1:3000), unless you configured another port. The same server provides the pages, `/api/v1/*`, `/docs/` and `/openapi.json`. Browser geolocation requires HTTPS or localhost.

## Automated testing

Weather-value assertions use fixtures. Separate `@live` tests check upstream services; they are not part of the default deterministic test runs. Database tests use isolated test accounts/data, and production smoke tests clean up their temporary accounts.

Install Chromium for browser checks:

```powershell
npx playwright install chromium
```

| Command | Coverage |
| --- | --- |
| `npm test` | Unit/service regressions: weather validation, units, storage, game scoring, provider fallback, satellite URLs, deployment configuration and more. |
| `npm run typecheck:api` | Backend and deployment TypeScript checks. |
| `npm run test:ui` | Chromium UI regressions: search, weather, forecasts, geography, favorites, GeoGuess, account UI/privacy, Journeys and satellite states. |
| `npm run test:smoke` | UI scenarios tagged `@smoke`. |
| `npm run test:a11y` | Accessibility scenarios tagged `@a11y`. |
| `npm run test:v2` | Built-asset atlas, country, landmark, forecast and globe checks. |
| `npm run test:api:local` | Local API contracts; database-dependent cases need a dedicated PostgreSQL test database. |
| `npm run test:accounts:local` | Starts disposable local PostgreSQL data and runs API/account cases; see the Windows teardown limitation below. |
| `npm run test:bugs` | Isolated development-only injected-defect scenarios. |
| `npm run test:release` | Build and production protection checks. |
| `npm run test:cross-browser` | UI suite on Chromium, Firefox and WebKit; install all three browsers first. |
| `npm run test:api` | Separate live Open-Meteo/NASA contracts; requires internet access. |

`npm run test:smoke:prod` targets the live site by default and creates temporary accounts/records. Set `SKYATLAS_URL` to an intended compatible deployment before using it elsewhere. It is not a read-only health check.

GitHub Actions runs database/API, persistence, UI smoke, accessibility, practice-defect and release checks. Full cross-browser checks run on the scheduled/manual workflow. See [test guidance](tests/README.md), [Gate 2 results](docs/ATLASSPHERE_GATE2_REPORT.md) and the [production verification report](docs/VERCEL_PUBLISH_STATUS.md) for recorded results and their limits.

## Deployment and remaining setup

The published site is [atlassphere.vercel.app](https://atlassphere.vercel.app). Database migrations are applied separately from the Vercel build. Deployment credentials stay server-side; never place them in `VITE_` variables or commit them.

Remaining operational setup:

- **Automatic alerts:** create the authenticated cron-job.org POST job every three hours using the [scheduler instructions](docs/DEPLOY_VERCEL_NEON.md#automatic-alert-checks). The endpoint has been verified; the external schedule has not been confirmed. Notifications are in-app, not push notifications.
- **Password-reset emails:** configure `RESET_EMAIL_PROVIDER_URL` and `RESET_EMAIL_PROVIDER_TOKEN` for a compatible email service.
- **Automatic deployment:** connect/authorize this GitHub repository in Vercel. Use `main` after merging the upgrade; before the merge, use `atlassphere-quick-upgrade`. CLI deployments already work.
- **Old hosting:** review and disable unused Render deployments if still connected. No old service or database was deleted during the move.

Follow [DEPLOY_VERCEL_NEON.md](docs/DEPLOY_VERCEL_NEON.md) for configuration and verification. Earlier Cloudflare/Render files remain as historical alternatives and are not required by the live Vercel deployment.

## Known limits

- Weather forecasts are model estimates, not emergency warnings. Missing data is displayed as unavailable; forecast errors do not invent replacement measurements.
- Historical weather is reanalysis, not a direct station observation. NASA imagery starts on 2000-02-24; clouds, gaps, swath lines and incomplete recent dates are normal. It is not street-level imagery. See [satellite documentation](docs/SATELLITE_IMAGERY.md).
- The 3D globe's weather effects are illustrative, not satellite images or a global live-weather layer. Devices without supported WebGL can still use the atlas and directory.
- Provider budgets, caches and some request limits are per process. Shared quotas/cache and a bounded alert-job design are needed before scaling serverless traffic. A large slow alert batch can exceed the function duration.
- Existing dependency audit findings and the optional globe bundle-size warning remain follow-up work.
- The Windows local PostgreSQL wrapper previously reported 25 passing tests but hung during teardown and was interrupted. This is not recorded as a clean command pass. CI uses its own PostgreSQL service.
- News may contain explicitly labelled samples or an empty/latest stored snapshot. The RSS workflow updates the repository; the published site needs a deployment to receive that update.
- There is no offline weather cache, service worker or Android APK. Android remains deferred until explicitly authorized.

## Sources and credits

- [Weather data by Open-Meteo.com](https://open-meteo.com/) — forecasts and historical reanalysis; geocoding uses [GeoNames](https://www.geonames.org/). This project is non-commercial and must respect provider usage limits.
- [NASA GIBS / EOSDIS](https://www.earthdata.nasa.gov/engage/open-data-services-and-software/api/gibs) — satellite imagery.
- Natural Earth through [world-atlas](https://github.com/topojson/world-atlas) — generalized map boundaries, not navigation data or an endorsement of territorial claims.
- [mledoze/countries](https://github.com/mledoze/countries) — country snapshot under ODbL; see [dataset license](docs/licenses/countries-LICENSE.txt).
- Landmark cards link to UNESCO source records and individual photograph credits. See [attribution](docs/ATTRIBUTION.md).
- Third-party packages retain their respective licenses, including Three.js (MIT), d3-geo (ISC) and topojson-client (ISC).

## Repository guide

| Path | Purpose |
| --- | --- |
| `src/components/`, `src/services/`, `src/utils/` | UI behavior, service clients and shared helpers. |
| `src/geoguess/`, `src/journeys/` | Game and journey features. |
| `src/data/`, `public/` | Reference datasets and bundled assets. |
| `api/` | Express API, account logic, provider proxies and OpenAPI/Postman documentation. |
| `prisma/` | PostgreSQL schema and migrations. |
| `deployment/`, `vercel.json` | Vercel entry point and routing/build configuration. |
| `tests/` | Unit, UI, API, accessibility, smoke and release suites. |
| `docs/` | Deployment guides, roadmap, acceptance evidence and historical phase reports. |

The [website-first roadmap](docs/ROADMAP.md) and [phase status](docs/PHASES3-6_STATUS.md) preserve earlier milestones. For current hosting status, use the [Vercel/Neon launch report](docs/VERCEL_PUBLISH_STATUS.md). The npm package name and existing environment variables, storage keys, cookies and test IDs retain compatibility names from SkyAtlas.
