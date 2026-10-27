# Baseline inventory

Recorded before the new roadmap Phase 1 changes on 26 October 2026.

## Existing implementation

- Vite; HTML/CSS/JavaScript; TypeScript appearance module; Three.js, d3-geo, topojson-client, world-atlas.
- One page: /. Features: city search, current weather, hourly and seven-day forecasts, charts/table, geography, map/directory, landmarks, globe, units, favorites/filter/sort/clear-all, weather refresh, connection feedback, themes, menu, local photos, development Bug Mode.
- No API backend, auth, database or Android project.

## External calls

- https://geocoding-api.open-meteo.com/v1/search: city and capital lookup.
- https://api.open-meteo.com/v1/forecast: current/hourly and seven-day daily data.
- Country/map/photo assets are bundled; no runtime image CDN or font request.

## Scripts

- npm test; npm run test:ui; npm run test:ui:memory; npm run test:v2; npm run test:bugs:memory; npm run test:release.
- npm run test:api is a separate live integration suite.
- npm run dev, npm run build, npm run preview.

## Existing test IDs

| ID | Source |
| --- | --- |
| `advanced-load` | index.html |
| `advanced-section` | index.html |
| `advanced-status` | index.html |
| `appearance-status` | index.html |
| `atlas-load` | index.html |
| `atlas-section` | index.html |
| `atlas-status` | index.html |
| `brand-home` | index.html |
| `bug-mode-exit` | src/dev/bugMode.js |
| `bug-mode-panel` | src/dev/bugMode.js |
| `chart-caption` | index.html |
| `chart-metric` | index.html |
| `city-name` | index.html |
| `city-search-button` | index.html |
| `city-search-clear` | index.html |
| `city-search-input` | index.html |
| `city-search-loading` | index.html |
| `city-suggestion` | src/components/citySearch.js |
| `city-suggestions` | index.html |
| `connection-status` | index.html |
| `country-count` | index.html |
| `country-details` | index.html |
| `country-directory` | index.html |
| `country-facts` | index.html |
| `country-filter` | index.html |
| `country-name` | index.html |
| `country-option` | src/components/worldAtlas.js |
| `country-region` | index.html |
| `country-status` | index.html |
| `country-title` | index.html |
| `country-weather` | index.html |
| `current-temperature` | index.html |
| `current-weather` | index.html |
| `daily-forecast` | index.html |
| `daily-row` | src/components/advancedForecast.js |
| `daily-table` | index.html |
| `elevation-value` | index.html |
| `favorite-item` | src/components/favorites.js |
| `favorite-toggle` | index.html |
| `favorites-cancel-clear` | index.html |
| `favorites-clear` | index.html |
| `favorites-clear-dialog` | index.html |
| `favorites-confirm-clear` | index.html |
| `favorites-count` | index.html |
| `favorites-empty` | index.html |
| `favorites-filter` | index.html |
| `favorites-list` | index.html |
| `favorites-no-matches` | index.html |
| `favorites-section` | index.html |
| `favorites-sort` | index.html |
| `favorites-status` | index.html |
| `featured-atlas-link` | index.html |
| `featured-photo` | index.html |
| `feels-like-temperature` | index.html |
| `forecast-hour` | src/components/hourlyForecast.js |
| `forecast-note` | index.html |
| `forecast-precipitation` | src/components/hourlyForecast.js |
| `forecast-section` | index.html |
| `forecast-temperature` | src/components/hourlyForecast.js |
| `forecast-time` | src/components/hourlyForecast.js |
| `forecast-timezone` | index.html |
| `forecast-wind` | src/components/hourlyForecast.js |
| `geography-country` | index.html |
| `geography-details` | index.html |
| `geography-local-time` | index.html |
| `geography-region` | index.html |
| `globe-canvas` | index.html |
| `globe-controls` | index.html |
| `globe-load` | index.html |
| `globe-renderer` | src/components/globe.js |
| `globe-reset` | index.html |
| `globe-rotate` | index.html |
| `globe-status` | index.html |
| `globe-weather` | index.html |
| `globe-zoom-in` | index.html |
| `globe-zoom-out` | index.html |
| `hero-photo` | index.html |
| `hourly-forecast` | index.html |
| `humidity-value` | index.html |
| `landmark-card` | src/components/worldAtlas.js |
| `landmark-count` | index.html |
| `landmark-list` | index.html |
| `landmark-photo` | src/components/worldAtlas.js |
| `landmarks-worldwide` | index.html |
| `latitude-value` | index.html |
| `local-time` | index.html |
| `longitude-value` | index.html |
| `main-navigation` | index.html |
| `map-location` | index.html |
| `map-reset` | index.html |
| `map-zoom-in` | index.html |
| `map-zoom-level` | index.html |
| `map-zoom-out` | index.html |
| `menu-toggle` | index.html |
| `nav-atlas` | index.html |
| `nav-favorites` | index.html |
| `nav-weather` | index.html |
| `precipitation-period` | index.html |
| `precipitation-value` | index.html |
| `region-name` | index.html |
| `search-error` | index.html |
| `search-status` | index.html |
| `selected-location` | index.html |
| `skip-to-search` | index.html |
| `temperature-caption` | index.html |
| `theme-toggle` | index.html |
| `timezone-value` | index.html |
| `unit-celsius` | index.html |
| `unit-fahrenheit` | index.html |
| `unit-status` | index.html |
| `weather-as-of` | index.html |
| `weather-chart` | index.html |
| `weather-description` | index.html |
| `weather-error` | index.html |
| `weather-icon` | index.html |
| `weather-loading` | index.html |
| `weather-note` | index.html |
| `weather-refresh` | index.html |
| `weather-retry` | index.html |
| `weather-story` | index.html |
| `weather-values` | index.html |
| `wind-speed` | index.html |
| `world-map` | index.html |
