# EarthScope — Version 1
A simple geography-inspired weather app using HTML, CSS, JavaScript, Open-Meteo Geocoding API and Forecast API.

## Run on Windows
1. Extract this ZIP.
2. Open the folder.
3. Double-click `index.html` (internet required).
4. If your browser restricts requests from local files, open PowerShell in this folder and run `py -m http.server 8000`, then visit `http://localhost:8000`.

## Features
- Worldwide city search with selection of matching locations
- Current temperature, weather description, wind, coordinates, elevation and local time
- Next 24 hourly forecast rows with precipitation probability
- Stable data-testid attributes for Playwright automation
- Responsive design for PC and mobile
- Search and API error handling

## Suggested testing
1. Search Nashik and verify the city label and temperature.
2. Search Paris and select the correct location from possible matches.
3. Search a nonsense city to confirm an error appears.
4. Submit an empty city and verify browser validation.
5. Check there are 24 forecast rows when the API has 24 available hours.
6. Test at narrow mobile width.

## Next increments
News mock JSON, map, bookmarks, weather animations, Capacitor APK, and Playwright tests.

## Automated regression checks
With Node.js installed, run `node --test tests/weather.test.cjs` from this folder.
These checks simulate API responses and cover stale city choices, overlapping searches,
incomplete weather data, 24-hour forecast rendering, failed searches and request timeouts.
They do not contact the live API or verify browser layout.

Requests time out after 15 seconds. Starting a search clears previous location choices
and hides earlier weather, so failures cannot leave another city's forecast visible.

Weather data: Open-Meteo. Geocoding data based on GeoNames. Follow API terms and attribution for noncommercial use.
