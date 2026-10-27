import { test, expect, mockOpenMeteoDown, type Page } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';

const endpoint = '**/api/v1/weather?**';
const cities = [
  { id: 1, name: 'Nashik', admin1: 'Maharashtra', country: 'India', latitude: 19.99, longitude: 73.78 },
  { id: 2, name: 'Tokyo', admin1: 'Tokyo', country: 'Japan', latitude: 35.68, longitude: 139.69 }
];
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: cities } }));
  await page.route(endpoint, route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/');
});
async function select(page: Page, name = 'Nashik') {
  await page.getByTestId('city-search-input').fill(name);
  await page.getByTestId('city-search-button').click();
  await page.getByTestId('city-suggestions').getByRole('button', { name: new RegExp(`^${name},`) }).click();
}

test('selected city requests and displays current weather with explicit units', async ({ page }) => {
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
  await select(page);
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

test('local clock uses the selected timezone and advances without refetching weather', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T10:00:00Z') });
  await select(page);
  await expect(page.getByTestId('local-time')).toHaveText('26 Oct 2026, 15:30 (Asia/Kolkata)');
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('local-time')).toHaveText('26 Oct 2026, 15:31 (Asia/Kolkata)');
});

test('missing secondary values are unavailable while valid weather remains visible', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture);
  Object.assign(data.current, { relative_humidity_2m: null, apparent_temperature: null });
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('humidity-value')).toHaveText('Not available');
  await expect(page.getByTestId('feels-like-temperature')).toHaveText('Not available');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('weather-note')).toContainText('Some weather details are unavailable');
});

test('weather API failure offers a retry without repeating city search', async ({ page }) => {
  await mockOpenMeteoDown(page);
  await page.route(endpoint, route => route.fulfill({ status: 503, json: {} }));
  await select(page);
  await expect(page.getByTestId('weather-error')).toContainText('Weather service unavailable (503)');
  await expect(page.getByTestId('weather-values')).toBeHidden();
  await page.route(endpoint, route => route.fulfill({ json: currentWeatherFixture }));
  await page.getByTestId('weather-retry').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('weather-error')).toBeEmpty();
});

test('invalid core data gives an error instead of NaN or a misleading temperature', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture);
  Object.assign(data.current, { temperature_2m: null });
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('weather-error')).toContainText('incomplete or invalid');
  await expect(page.getByTestId('weather-values')).toBeHidden();
});

test('unknown weather code has a safe description and icon', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture); data.current.weather_code = 1234;
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('weather-description')).toHaveText('Weather conditions unavailable');
  await expect(page.getByTestId('weather-icon')).toHaveText('?');
});

test('pending weather is discarded when the user starts editing a new location', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => { await gate; await route.fulfill({ json: currentWeatherFixture }).catch(() => {}); });
  await select(page);
  await expect(page.getByTestId('weather-loading')).toBeVisible();
  await page.getByTestId('city-search-input').fill('Tokyo');
  release();
  await expect(page.getByTestId('selected-location')).toBeHidden();
  await expect(page.getByTestId('weather-error')).toBeEmpty();
});

test('changing cities hides old weather and renders only the newly selected city', async ({ page }) => {
  await select(page); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  const data = structuredClone(currentWeatherFixture);
  data.timezone = 'Asia/Tokyo'; data.current.temperature_2m = 12;
  await page.route(endpoint, route => route.fulfill({ json: data }));
  await select(page, 'Tokyo');
  await expect(page.getByTestId('city-name')).toHaveText('Tokyo');
  await expect(page.getByTestId('current-temperature')).toHaveText('12°C');
  await expect(page.getByTestId('local-time')).toContainText('Asia/Tokyo');
});

test('weather timeout restores controls with an actionable error', async ({ page }) => {
  await page.clock.install();
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => { await gate; await route.fulfill({ json: currentWeatherFixture }).catch(() => {}); });
  await select(page);
  await expect(page.getByTestId('weather-loading')).toBeVisible();
  await page.clock.fastForward(15001);
  await expect(page.getByTestId('weather-error')).toContainText('Weather request timed out');
  await expect(page.getByTestId('weather-retry')).toBeVisible();
  release();
});

test('current weather is usable on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await select(page);
  await expect(page.getByTestId('current-temperature')).toBeVisible();
  await expect(page.getByTestId('humidity-value')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
