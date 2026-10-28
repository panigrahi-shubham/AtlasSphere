# Earth & Space homepage testability

## Route boundaries

- `/` and `/index.html`: new React homepage.
- `/sources`, `/privacy`, `/accessibility`: prerendered React information pages; direct URL navigation works through Vite, Express and Vercel, including their `.html` aliases.
- `/explore` and `/explore.html`: complete preserved explorer. Existing `data-testid` contracts remain here. `/journeys`, `/geoguess`, API and documentation routes are unchanged.
- `explore.html?place=Kyoto&lat=35.021&lon=135.754&country=Japan#selection`: validated geographic handoff; invalid coordinates are ignored. The display uses text nodes, not HTML from query parameters.

## Homepage contracts

- `home-brand`, `home-explore-earth`, `home-discover-space`, `home-account-link`, `home-play-geoguess`: entry points into functioning journeys.
- `home-menu-toggle`, `home-menu`, `home-menu-close`: native modal dialog with explicit focus wrap, background scroll lock, Escape close and focus return. The same menu exists at all viewport sizes; mobile uses a side drawer.
- `home-theme-toggle`: light/dark appearance and existing `earthscope:theme:v1` preference. Storage failure leaves a usable session theme with an explanation.
- `home-search-input`, `home-search-submit`, `home-search-clear`, `home-search-status`, `home-search-results`: labelled combobox. Minimum two and maximum eighty characters; 350 ms debounce; ten-second timeout; no automatic retry. TanStack Query caches results in memory for 24-hour freshness, with 30-minute garbage collection. Editing/clearing hides obsolete results. Up/down/Enter/Escape and pointer/touch selection are supported.
- `home-selected-place`, `home-place-weather`: selected real coordinates and an encoded link to the preserved explorer.
- `home-category-*`, `home-destination-*`: place discovery links.
- `home-space-*`, `home-space-detail`, `home-fact-*`, `home-fact-detail`, `home-science-*`, `home-science-detail`, `home-history-*`: sourced curated content selectors with pressed state. Future full engines remain explicitly Coming soon.
- `home-globe-*`: see `PHASE1_EARTH_ASSETS.md` for activation, fallback, canvas, country selector, zoom/rotation/reset and observable selection. No Three.js/texture request is expected before activation. Reduced motion disables automatic rotation; context loss restores the NASA image and retry.

## API contract

The existing `GET /api/v1/geocode?q=...` returns Open-Meteo/GeoNames results. New code validates names and finite coordinate ranges before rendering or passing a location to the explorer. Tests supply deterministic responses, including empty lists, invalid fields, failures and delayed obsolete requests. No production account or live weather writes are used for homepage tests. Geographic values asserted in deterministic tests come only from fixtures.

## Commands

`npm run typecheck:home`, `npm run lint:home`, `npm run format:home:check`, `npm run test:home:unit`, and `npm run test:home` check the new app. The Playwright config runs at 1440 px desktop and 375 px Chromium touch emulation. Tests use isolated browser contexts and mocked geographic requests. Existing suites retain their weather/atlas/account/game assertions, with entry URLs changed to `/explore.html` because the explorer moved.

GitHub Actions runs the new static, unit, desktop/touch and axe checks and the preserved v2 built-asset suite. Exact local results and unrun/blocked checks are recorded in `PHASE1_REPORT.md`; workflow edits are not evidence of a GitHub run.

After `npm run build`, PowerShell users can run `$env:HOME_PRODUCTION='1'; npm run test:home; Remove-Item Env:HOME_PRODUCTION` to repeat homepage tests against production Express on port 31424. This mode explicitly clears database/account credentials and disables fixtures. It also runs static-content and hydration tests for all four prerendered routes. No-JavaScript tests are intentionally skipped in Vite development, which serves an empty React shell.

## Further scenarios

Full physical-device and screen-reader acceptance; saved-account cross-tab refresh conflicts; real SMTP inbox delivery; fair/persistent scheduled alerts; persistent provider quotas; full production deployment smoke after owner review. These remain distinct from the new homepage's deterministic acceptance.
