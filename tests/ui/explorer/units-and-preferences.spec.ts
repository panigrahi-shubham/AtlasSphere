import { test, expect } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';
import { STORAGE_KEYS } from '../../../src/utils/storage.js';

const weatherEndpoint = '**/api/v1/weather?**';
const geocodingEndpoint = '**/api/v1/geocode?**';
const cities = [
  { id: 1, name: 'Nashik', country: 'India', admin1: 'Maharashtra', latitude: 19.99, longitude: 73.78, timezone: 'Asia/Kolkata', elevation: 565 },
  { id: 2, name: 'Paris', country: 'France', latitude: 48.85, longitude: 2.35 },
  { id: 3, name: 'Paris', country: 'United States', latitude: 33.66, longitude: -95.55 }
];
test.beforeEach(async ({ page }) => {
  await page.route(geocodingEndpoint, route => route.fulfill({ json: { results: cities } }));
  await page.route(weatherEndpoint, route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/explore.html');
});

test('unit switching updates all temperatures without refetching or losing precision', async ({ page, explorer }) => {
  let calls = 0;
  await page.route(weatherEndpoint, route => { calls++; return route.fulfill({ json: currentWeatherFixture }); });
  await explorer.selectPlace();
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await page.getByTestId('unit-fahrenheit').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('feels-like-temperature')).toHaveText('79°F');
  await expect(page.getByTestId('forecast-temperature').first()).toHaveText('68°F');
  await expect(page.getByTestId('forecast-temperature')).toHaveCount(24);
  for (const temperature of await page.getByTestId('forecast-temperature').allTextContents()) expect(temperature).toMatch(/°F$/);
  await expect(page.getByTestId('temperature-caption')).toContainText('Fahrenheit');
  await expect(page.getByTestId('unit-fahrenheit')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('unit-celsius').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('forecast-temperature').first()).toHaveText('20°C');
  expect(calls).toBe(1);
});

test('unit preference persists on reload and applies to new weather', async ({ page, explorer }) => {
  await page.getByTestId('unit-fahrenheit').click();
  await page.reload();
  await expect(page.getByTestId('unit-fahrenheit')).toHaveAttribute('aria-pressed', 'true');
  await explorer.selectPlace();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
});

test('unit selected during loading is used when the response arrives', async ({ page, explorer }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(weatherEndpoint, async route => { await gate; await route.fulfill({ json: currentWeatherFixture }); });
  await explorer.selectPlace();
  await expect(page.getByTestId('weather-loading')).toBeVisible();
  await page.getByTestId('unit-fahrenheit').click(); release();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('forecast-temperature').first()).toHaveText('68°F');
});

test('unavailable temperatures are never converted to a number', async ({ page, explorer }) => {
  const data = structuredClone(currentWeatherFixture);
  Object.assign(data.current, { apparent_temperature: null });
  data.hourly.temperature_2m = [];
  await page.route(weatherEndpoint, route => route.fulfill({ json: data }));
  await explorer.selectPlace(); await page.getByTestId('unit-fahrenheit').click();
  await expect(page.getByTestId('feels-like-temperature')).toHaveText('Not available');
  await expect(page.getByTestId('forecast-temperature').first()).toHaveText('Not available');
});

test('favorite can be saved, survives reload, and opens without geocoding', async ({ page, explorer }) => {
  await explorer.selectPlace(); await page.getByTestId('favorite-toggle').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  await expect(page.getByTestId('favorite-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  let lookups = 0;
  await page.route(geocodingEndpoint, route => { lookups++; return route.fulfill({ json: {} }); });
  await page.getByTestId('favorites-list').getByRole('button', { name: 'Open Nashik, Maharashtra, India' }).click();
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('elevation-value')).toHaveText('565 m');
  expect(lookups).toBe(0);
});

test('same-name cities remain distinct favorites with no duplicates on reselection', async ({ page, explorer }) => {
  await explorer.selectPlace('Paris, France'); await page.getByTestId('favorite-toggle').click();
  await explorer.selectPlace('Paris, United States'); await page.getByTestId('favorite-toggle').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(2);
  await explorer.selectPlace('Paris, France');
  await expect(page.getByTestId('favorite-toggle')).toHaveText('Remove favorite');
  await expect(page.getByTestId('favorite-item')).toHaveCount(2);
  await expect(page.getByTestId('favorite-item').first()).toHaveAttribute('data-location-id', 'geonames:2');
});

test('favorites can be removed by either control and removal persists', async ({ page, explorer }) => {
  await explorer.selectPlace(); await page.getByTestId('favorite-toggle').click();
  await page.getByTestId('favorites-list').getByRole('button', { name: /^Remove / }).click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(0);
  await expect(page.getByTestId('favorites-empty')).toBeVisible();
  await expect(page.getByTestId('favorite-toggle')).toHaveText('Save favorite');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await page.getByTestId('favorite-toggle').click(); await page.getByTestId('favorite-toggle').click();
  await page.reload(); await expect(page.getByTestId('favorite-item')).toHaveCount(0);
});

test('malformed storage falls back safely without overwriting it on load', async ({ page, explorer }) => {
  await page.evaluate(keys => {
    localStorage.setItem(keys.unit, '{broken'); localStorage.setItem(keys.favorites, '{broken');
  }, STORAGE_KEYS);
  await page.reload();
  await expect(page.getByTestId('unit-celsius')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('unit-status')).toContainText('invalid');
  await expect(page.getByTestId('favorites-status')).toContainText('could not be read');
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.favorites)).toBe('{broken');
  await explorer.selectPlace(); await page.getByTestId('favorite-toggle').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
});

test('restored favorite entries are validated and deduplicated', async ({ page }) => {
  await page.evaluate(({ key }) => {
    const city = { id: '1', name: 'Nashik', latitude: 19.99, longitude: 73.78, country: 'India' };
    localStorage.setItem(key, JSON.stringify([city, city, null, { ...city, latitude: 999 }]));
  }, { key: STORAGE_KEYS.favorites });
  await page.reload();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  await expect(page.getByTestId('favorites-status')).toContainText('could not be read');
});

test('blocked browser storage still allows session favorites and unit switching', async ({ page, explorer }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.reload(); await explorer.selectPlace();
  await page.getByTestId('unit-fahrenheit').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('unit-status')).toContainText('could not save');
  await page.getByTestId('favorite-toggle').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  await expect(page.getByTestId('favorites-status')).toContainText('could not save');
});

test('opening a favorite cancels an obsolete city search', async ({ page, explorer }) => {
  await explorer.selectPlace(); await page.getByTestId('favorite-toggle').click();
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(geocodingEndpoint, async route => { await gate; await route.fulfill({ json: { results: cities } }).catch(() => {}); });
  await page.getByTestId('city-search-input').fill('Tokyo'); await page.getByTestId('city-search-button').click();
  await expect(page.getByTestId('city-search-loading')).toBeVisible();
  await page.getByTestId('favorites-list').getByRole('button', { name: /^Open Nashik/ }).click(); release();
  await expect(page.getByTestId('city-name')).toHaveText('Nashik');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
});

test('unit controls and favorites stay usable on a narrow phone', async ({ page, explorer }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await explorer.selectPlace(); await page.getByTestId('favorite-toggle').click();
  await page.getByTestId('unit-fahrenheit').click();
  await expect(page.getByTestId('favorite-item')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
