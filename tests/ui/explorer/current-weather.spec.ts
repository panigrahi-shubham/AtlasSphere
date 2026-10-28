/**
 * Feature: Current weather and city changes
 * Layer: UI regression — Playwright, Chromium (Firefox/WebKit on scheduled runs)
 * Real: Browser rendering, interaction and local storage
 * Mocked: Geographic and weather API responses from local fixture data
 * Guards: Incorrect request units, stale responses, incomplete data and unreadable mobile weather
 * Run: npx playwright test tests/ui/explorer/current-weather.spec.ts --project=ui
 * Needs: Vite and Chromium; the test config starts the local server.
 */
import { test, expect, mockOpenMeteoDown } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';
import { mockGeocode, mockCurrentWeather } from '../../support/mocks';

const endpoint = '**/api/v1/weather?**';
const cities = [
  { id: 1, name: 'Nashik', admin1: 'Maharashtra', country: 'India', latitude: 19.99, longitude: 73.78 },
  { id: 2, name: 'Tokyo', admin1: 'Tokyo', country: 'Japan', latitude: 35.68, longitude: 139.69 }
];
test.beforeEach(async ({ page }) => {
  await mockGeocode(page, cities);
  await mockCurrentWeather(page, currentWeatherFixture);
  await page.goto('/explore.html');
});

// Risk: The selected place could show another location’s measurements.
// Given a fixture city, When it is selected, Then one request uses its coordinates and displays the exact values and units.
test('selected city requests and displays current weather with explicit units', async ({ page, explorer }) => {
  let calls = 0;
  await page.route(endpoint, route => {
    calls++;
    const params = new URL(route.request().url()).searchParams;
    expect(params.get('lat')).toBe('19.99');
    expect(params.get('units')).toBe('celsius');
    expect(params.get('lon')).toBe('73.78');
    expect(params.get('view')).toBeNull();
    return route.fulfill({ json: currentWeatherFixture });
  });
  await explorer.selectCity();
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('feels-like-temperature')).toHaveText('26°C');
  await expect(page.getByTestId('humidity-value')).toHaveText('64 %');
  await expect(page.getByTestId('wind-speed')).toHaveText('8.5 km/h');
  await expect(page.getByTestId('precipitation-value')).toHaveText('0 mm');
  await expect(page.getByTestId('precipitation-period')).toContainText('15 minutes');
  await expect(page.getByTestId('weather-description')).toHaveText('Partly cloudy');
  await expect(page.getByTestId('weather-icon')).toHaveAccessibleName('Partly cloudy');
  await expect(page.getByTestId('weather-as-of')).toContainText('Asia/Kolkata');
  await expect(page.getByTestId('weather-loading')).toBeHidden();
  expect(calls).toBe(1);
});

// Risk: A place’s clock could show the visitor’s local time.
// Given a fixed UTC instant, When one minute passes, Then the displayed Kolkata time advances in its own timezone.
test('local clock uses the selected timezone and advances without refetching weather', async ({ page, explorer }) => {
  await page.clock.install({ time: new Date('2026-10-26T10:00:00Z') });
  await explorer.selectCity();
  await expect(page.getByTestId('local-time')).toHaveText('26 Oct 2026, 15:30 (Asia/Kolkata)');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('local-time')).toHaveText('26 Oct 2026, 15:31 (Asia/Kolkata)');
});

// Risk: Missing optional metrics could hide otherwise valid weather.
// Given missing humidity and apparent temperature, When weather loads, Then temperature remains visible and gaps are labelled.
test('missing secondary values are unavailable while valid weather remains visible', async ({ page, explorer }) => {
  const data = structuredClone(currentWeatherFixture);
  Object.assign(data.current, { relative_humidity_2m: null, apparent_temperature: null });
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await explorer.selectCity();
  await expect(page.getByTestId('humidity-value')).toHaveText('Not available');
  await expect(page.getByTestId('feels-like-temperature')).toHaveText('Not available');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('weather-note')).toContainText('Some weather details are unavailable');
});

// Risk: A provider outage could leave the user unable to recover.
// Given a 503 response, When the provider recovers and retry is pressed, Then the existing city loads without another search.
test('weather API failure offers a retry without repeating city search', async ({ page, explorer }) => {
  await mockOpenMeteoDown(page);
  await page.route(endpoint, route => route.fulfill({ status: 503, json: {} }));
  await explorer.selectCity();
  await expect(page.getByTestId('weather-error')).toContainText('Weather service unavailable (503)');
  await expect(page.getByTestId('weather-values')).toBeHidden();
  await page.route(endpoint, route => route.fulfill({ json: currentWeatherFixture }));
  await page.getByTestId('weather-retry').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('weather-error')).toBeEmpty();
});

// Risk: Invalid core data could be presented as a real temperature.
// Given a missing temperature, When weather loads, Then the page shows an error instead of weather values.
test('invalid core data gives an error instead of NaN or a misleading temperature', async ({ page, explorer }) => {
  const data = structuredClone(currentWeatherFixture);
  Object.assign(data.current, { temperature_2m: null });
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await explorer.selectCity();
  await expect(page.getByTestId('weather-error')).toContainText('incomplete or invalid');
  await expect(page.getByTestId('weather-values')).toBeHidden();
});

// Risk: An unexpected condition code could show a misleading icon.
// Given an unknown code, When weather loads, Then the description and icon show unavailable states.
test('unknown weather code has a safe description and icon', async ({ page, explorer }) => {
  const data = structuredClone(currentWeatherFixture); data.current.weather_code = 1234;
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await explorer.selectCity();
  await expect(page.getByTestId('weather-description')).toHaveText('Weather conditions unavailable');
  await expect(page.getByTestId('weather-icon')).toHaveText('?');
});

// Risk: A slow response could overwrite a new search.
// Given a pending weather request, When the query changes before it finishes, Then the old selection stays hidden.
test('pending weather is discarded when the user starts editing a new location', async ({ page, explorer }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => { await gate; await route.fulfill({ json: currentWeatherFixture }).catch(() => {}); });
  await explorer.selectCity();
  await expect(page.getByTestId('weather-loading')).toBeVisible();
  await page.getByTestId('city-search-input').fill('Tokyo');
  release();
  await expect(page.getByTestId('selected-location')).toBeHidden();
  await expect(page.getByTestId('weather-error')).toBeEmpty();
});

// Risk: A new city could retain the prior city’s data.
// Given Nashik weather, When Tokyo is selected, Then its temperature and timezone replace the old values.
test('changing cities hides old weather and renders only the newly selected city', async ({ page, explorer }) => {
  await explorer.selectCity(); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  const data = structuredClone(currentWeatherFixture);
  data.timezone = 'Asia/Tokyo'; data.current.temperature_2m = 12;
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await explorer.selectCity('Tokyo');
  await expect(page.getByTestId('city-name')).toHaveText('Tokyo');
  await expect(page.getByTestId('current-temperature')).toHaveText('12°C');
  await expect(page.getByTestId('local-time')).toContainText('Asia/Tokyo');
});

// Risk: A hung request could leave the controls blocked indefinitely.
// Given a pending response, When the simulated timeout passes, Then an actionable error and retry control appear.
test('weather timeout restores controls with an actionable error', async ({ page, explorer }) => {
  await page.clock.install();
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => { await gate; await route.fulfill({ json: currentWeatherFixture }).catch(() => {}); });
  await explorer.selectCity();
  await expect(page.getByTestId('weather-loading')).toBeVisible();
  await page.clock.fastForward(15001);
  await expect(page.getByTestId('weather-error')).toContainText('Weather request timed out');
  await expect(page.getByTestId('weather-retry')).toBeVisible();
  release();
});

// Risk: Weather controls could overflow a small screen.
// Given a narrow viewport, When weather loads, Then key readings remain visible without horizontal page overflow.
test('current weather is usable on a narrow phone', async ({ page, explorer }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await explorer.selectCity();
  await expect(page.getByTestId('current-temperature')).toBeVisible();
  await expect(page.getByTestId('humidity-value')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
