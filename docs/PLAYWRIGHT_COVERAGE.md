# EarthScope v1.0 web testing coverage

Milestone 6 implements the remaining bounded v1.0 web scope. This matrix is a
practical testing catalogue, not a claim that every conceivable website feature
or accessibility requirement has been implemented.

| Feature / state | Interactions and assertions | Automated coverage |
| --- | --- | --- |
| Initial page | Title, heading, named form controls, no automatic API call | search, releaseReadiness, production |
| Search validation | Blank, spaces, one character, aria-invalid, input focus | search, resilience |
| International search | Unicode URL encoding, translated labels, country distinction | resilience, live contracts |
| Suggestions | Multiple/single match, explicit selection, empty results | search, resilience |
| Search keyboard | Enter, Tab, arrows, Escape, skip-to-search | search, releaseReadiness |
| Clear search | Reset field, results, weather/forecast/geography; retain favorites; focus input | releaseReadiness |
| Search failures | HTTP errors, unreadable JSON, invalid coordinates, offline request, 429, timeout, retry | search, resilience |
| Race conditions | Cancel old search/weather, ignore obsolete responses, opening favorites during search | search, weather, preferences, unit |
| Current weather | Temperature, feels-like, humidity, wind, precipitation, units | weather, production, live weather |
| Condition icons | Known, unknown and night codes, accessible descriptions | weather, unit |
| Partial weather | Missing metrics are unavailable; required-field failures give retry | weather, resilience |
| Manual refresh | New response without geocoding; loading disables duplicate refresh; cancellation | releaseReadiness |
| Connectivity | Offline banner, restored status, existing snapshot preserved, no auto-refetch | releaseReadiness |
| Hourly forecast | 24 aligned rows, icons, temperatures, probability and wind | forecastGeography, unit, live weather |
| Forecast gaps | Short, absent, partial, wrong units, duplicate times; no invented values | forecastGeography, resilience, unit |
| Timezones | Selected location time, minute clock updates, midnight, fractional offsets, repeated DST hours | weather, forecastGeography, resilience, unit, live contracts |
| Geography | Coordinates, country, region, geocoding elevation, timezone, missing values and weather failure | forecastGeography, production |
| Units | Celsius/Fahrenheit, current/feels-like/all hourly rows, reload, pending response, no extra fetch | preferences, production |
| Favorites | Save, reopen, remove, reload, stable identity, duplicate prevention, same-name cities | preferences, production |
| Filter favorites | City/region/country matching, accent-insensitive search, zero matches and count | releaseReadiness, unit |
| Sort favorites | Saved order, A–Z, Z–A; original persisted order retained | releaseReadiness, unit |
| Clear all | Disabled when empty, native modal, cancel, Escape, Tab focus loop, explicit confirmation, filtered records included | releaseReadiness, production |
| Storage failures | Malformed JSON/schema, invalid records, quota failures, denied storage, session fallback | preferences, resilience, unit |
| Safe text rendering | Saved markup-like names remain plain text | resilience |
| Responsive layout | 320/375/768/1440px, no page overflow, horizontal cards, 44px buttons | preferences, forecastGeography, releaseReadiness, production |
| Forecast keyboard scroll | End/Home stay inside forecast, arrow scrolling on mobile | forecastGeography |
| Development defects | Five individually selected defects, isolated storage, disable/exit | bugs/injections |
| Production gate | All defect URL flags ignored in built code; normal validation/conversion/storage | release/production |
| Built app journey | Search → weather → forecast → unit switch → favorite → reload → reopen | release/production |
| Public API contracts | Coordinates, response arrays, units, timezones, invalid coordinates/variables | api suite (requires internet) |

All normal UI tests use mocked external APIs and stable test IDs/roles. The shared
fixture fails unmocked external browser requests and uncaught page errors. Practice
defect checks and production checks use separate configurations and reports.

## Useful locators

Search: city-search-input, city-search-button, city-search-clear, city-suggestions,
search-error, city-search-loading. Weather: weather-loading, weather-refresh,
weather-retry, weather-error, current-temperature, feels-like-temperature,
humidity-value, wind-speed, precipitation-value, weather-description, weather-icon.

Forecast: hourly-forecast, forecast-hour, forecast-time, forecast-temperature,
forecast-precipitation, forecast-wind, forecast-note. Geography: latitude-value,
longitude-value, elevation-value, timezone-value, geography-local-time.

Preferences: unit-celsius, unit-fahrenheit, unit-status. Favorites: favorite-toggle,
favorites-list, favorite-item, favorites-filter, favorites-sort, favorites-count,
favorites-no-matches, favorites-clear, favorites-clear-dialog,
favorites-cancel-clear, favorites-confirm-clear, favorites-status.

Connectivity/accessibility: connection-status, skip-to-search. Practice: bug-mode-panel,
bug-TEMP-001, bug-HUM-001, bug-FAV-001, bug-SEARCH-001, bug-TIME-001, bug-mode-exit.

## Release limits

No login, backend/database, map, news, charts, 3D globe, location permission,
notifications, file uploads, Android APK, native bridge or offline weather caching
is included. These are future product choices, not artificial features added only
to inflate automation counts. Cross-browser compatibility and live API acceptance
need matching browsers and network access. Screen-reader usability, zoom, high
contrast and real touch-device testing still merit manual review; keyboard/name/
layout assertions do not constitute a complete WCAG audit.
