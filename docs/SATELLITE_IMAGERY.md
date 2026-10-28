# Satellite imagery verification

Verified on 27 October 2026 before implementing the panel.

- [NASA GIBS access documentation](https://nasa-gibs.github.io/gibs-api-docs/access-basics/)
- [Current EPSG:4326 WMS capabilities](https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0)
- [NASA's MODIS Terra true-colour layer overview](https://gis.earthdata.nasa.gov/portal/home/item.html?id=780c03ffe3dc42e8bb03ca3b07bb283e)

The capabilities response advertises WMS 1.3.0, JPEG GetMap output and the exact layer `MODIS_Terra_CorrectedReflectance_TrueColor`. Its time dimension begins `2000-02-24/2000-04-25/P1D`; subsequent intervals have gaps. The latest advertised interval at verification ends on 2026-10-27. Requests use a single ISO date, `YYYY-MM-DD`.

The EPSG:4326 bounding box has latitude bounds -90…90 on its first axis and longitude bounds -180…180 on its second. The builder therefore follows WMS 1.3.0 latitude/longitude order: south, west, north, east. The requested span is latitude ±3° and longitude ±4°, clamped to valid bounds, with an 800 × 600 JPEG. At the date line the image is clipped; it does not wrap across the opposite edge.

The panel loads one image only after the user requests it. It shares the existing coordinates, but has its own UTC date: seven days ago by default, minimum 2000-02-24, maximum today. A catalogue allowlists the provider layer and keeps URL construction separate from the UI. Failed images and a 20-second wait produce a retry message; a newer request cannot display an older response.

The visible credit is “Imagery: NASA GIBS / EOSDIS”. This is a daily satellite mosaic; clouds, missing coverage and swath lines are normal. A successful JPEG response does not guarantee clear ground imagery, especially on recent dates. It is not street-level imagery. These images and the historical ERA5 weather output have different date coverage and are displayed separately. Coordinates and the selected satellite date are sent to NASA only when loading an image.

## Checks

`tests/unit/satelliteImagery.test.js` checks URL parameters, asymmetric axis order, boundary clamping, UTC dates, invalid coordinates and layer restrictions. `tests/ui/journeys/satellite.spec.ts` uses a tiny generated JPEG fixture rather than external imagery and covers loaded/loading/error/range states, attribution, image alt text and serious/critical accessibility violations in the panel. The fixture is test data, never product imagery.

`npx playwright test --config=playwright.api.config.ts tests/api/satellite.spec.ts` passed on 27 October 2026: NASA returned HTTP 200, `image/jpeg` and JPEG signature bytes for 2024-01-01. This test is tagged `@live`, uses no API key and is separate from default deterministic UI/unit runs.
