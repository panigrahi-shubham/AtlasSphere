# Changelog

## Phase 2 API foundation — 2026-10-27

- Added same-origin Express/TypeScript weather, geocoding, news and health routes with validation, caching, limits, fixture mode and OpenAPI/Swagger docs.
- Routed the website through its API; added an RSS news snapshot job, scheduled GitHub workflow, Postman collection and deterministic API/browser checks.
- Added one-service production hosting configuration and GitHub upload instructions.

## SkyAtlas homepage — 2026-10-26

- Adapted the supplied homepage design into the working weather and geography app, with local photos, responsive discovery cards and live weather preview state.
- Rebranded visible pages to SkyAtlas, connected country and landmark cards to the lazy atlas, and added a static-host game route rule.
- Added homepage behavior and 320 px layout coverage; retained the existing atlas, globe, favorites and GeoGuess features.

## Phase 1.5 GeoGuess — 2026-10-26

- Added a reproducible, seeded five-round geography game at `/geoguess`, with landmark map pinning and country silhouette options.
- Added keyboard play, round timer, scoring, feedback, results, replay, share links and browser-local top-10 leaderboards.
- Added development-only automation hooks and two isolated GeoGuess practice defects, plus deterministic logic and browser tests.
- Reused bundled landmark and country data without a game API or new dependency.

## Weather QA roadmap Phase 1 - 2026-10-26

- Consolidated search, units, theme and responsive navigation in a sticky header; added a synchronous saved/system theme bootstrap.
- Added current-weather loading skeleton, browser geolocation with permission/error states, and on-demand daily high/low, UV and sunrise/sunset dashboard details.
- Added clearly marked sample news from a local fixture, with loading, empty, stale, unsafe-link and retry handling. No live news feed is claimed.
- Added About, custom 404, favicon, visible Open-Meteo credits and narrow-screen layout checks.
- Expanded deterministic unit and Chromium coverage while preserving previous test IDs and the photographic atlas/globe experience.

See `docs/ROADMAP_PHASE1.md` for measured results and outstanding acceptance checks.

## v3 Phase 1 — 2026-10-26

- Added photographic hero and featured destinations gallery.
- Bundled 16 Wikimedia Commons landmark photos and a Pexels landscape photograph,
  with source/photographer/license credits and lazy loading for secondary images.
- Added persistent light/dark themes, semantic design tokens and mobile navigation.
- Refreshed weather metrics, cards, search, favorites and forecast styling.
- Added weather-condition/day-night page colors and a factual current-weather story.
- Added eight browser scenarios for appearance, persistence, navigation and images.
- Preserved the existing application features, endpoints and test IDs.

Full execution record and limits: docs/PHASE1.md.
