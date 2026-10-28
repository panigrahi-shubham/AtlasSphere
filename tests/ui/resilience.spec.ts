import { test, expect, type Page } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
import { STORAGE_KEYS } from '../../src/utils/storage.js';

const geo = '**/api/v1/geocode?**';
const weather = '**/api/v1/weather?**';
const city = { id: 1, name: 'Nashik', country: 'India', latitude: 19.99, longitude: 73.78, timezone: 'Asia/Kolkata' };
test.beforeEach(async ({ page }) => {
  await page.route(geo, route => route.fulfill({ json: { results: [city] } }));
  await page.route(weather, route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/explore.html');
});
async function search(page: Page, query = 'Nashik') {
  await page.getByTestId('city-search-input').fill(query);
  await page.getByTestId('city-search-button').click();
}
async function select(page: Page) {
  await search(page); await page.getByTestId('city-suggestion').click();
}

test('one-character query is rejected before contacting geocoding', async ({ page }) => {
  let calls = 0;
  await page.route(geo, route => { calls++; return route.fulfill({ json: {} }); });
  await search(page, 'a');
  await expect(page.getByTestId('search-error')).toContainText('at least 2');
  await expect(page.getByTestId('city-search-input')).toHaveAttribute('aria-invalid', 'true');
  expect(calls).toBe(0);
});

test('non-Latin search is encoded correctly and a single result still requires selection', async ({ page }) => {
  let weatherCalls = 0;
  await page.route(geo, route => {
    expect(new URL(route.request().url()).searchParams.get('q')).toBe('東京');
    return route.fulfill({ json: { results: [{ ...city, name: '東京' }] } });
  });
  await page.route(weather, route => { weatherCalls++; return route.fulfill({ json: currentWeatherFixture }); });
  await search(page, '東京');
  await expect(page.getByTestId('city-suggestion')).toHaveCount(1);
  await expect(page.getByTestId('selected-location')).toBeHidden();
  expect(weatherCalls).toBe(0);
  await page.getByTestId('city-suggestion').click();
  await expect(page.getByTestId('city-name')).toHaveText('東京');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
});

for (const stage of ['search', 'weather'] as const) {
  test(`${stage} reports unreadable JSON without uncaught errors`, async ({ page }) => {
    await page.route(stage === 'search' ? geo : weather, route => route.fulfill({ body: '{not-json', contentType: 'application/json' }));
    if (stage === 'search') await search(page); else await select(page);
    await expect(page.getByTestId(stage === 'search' ? 'search-error' : 'weather-error')).toContainText('unreadable data');
  });
  test(`${stage} handles a network outage with a connection message`, async ({ page }) => {
    await page.route(stage === 'search' ? geo : weather, route => route.abort('internetdisconnected'));
    if (stage === 'search') await search(page); else await select(page);
    await expect(page.getByTestId(stage === 'search' ? 'search-error' : 'weather-error')).toContainText('Check your internet connection');
  });
  test(`${stage} handles rate limiting without automatic repeated requests`, async ({ page }) => {
    let calls = 0;
    await page.route(stage === 'search' ? geo : weather, route => { calls++; return route.fulfill({ status: 429, json: {} }); });
    if (stage === 'search') await search(page); else await select(page);
    await expect(page.getByTestId(stage === 'search' ? 'search-error' : 'weather-error')).toContainText('Too many');
    expect(calls).toBe(1);
  });
}

test('geocoding timeout supports a successful new search', async ({ page }) => {
  await page.clock.install();
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(geo, async route => { await gate; await route.fulfill({ json: {} }).catch(() => {}); });
  await search(page); await expect(page.getByTestId('city-search-loading')).toBeVisible();
  await page.clock.fastForward(15001);
  await expect(page.getByTestId('search-error')).toContainText('Search timed out');
  release();
  await page.route(geo, route => route.fulfill({ json: { results: [city] } }));
  await page.getByTestId('city-search-button').click();
  await expect(page.getByTestId('city-suggestion')).toHaveCount(1);
});

test('invalid geocoding coordinates are rejected and earlier choices disappear', async ({ page }) => {
  await search(page); await expect(page.getByTestId('city-suggestion')).toHaveCount(1);
  await page.route(geo, route => route.fulfill({ json: { results: [{ ...city, latitude: 200 }] } }));
  await search(page);
  await expect(page.getByTestId('search-error')).toContainText('Location data is incomplete');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
});

test('weather temperature unit mismatch cannot display Fahrenheit numbers labelled Celsius', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture); data.current_units.temperature_2m = '°F';
  await page.route(weather, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('weather-error')).toContainText('incomplete or invalid');
  await expect(page.getByTestId('weather-values')).toBeHidden();
});

test('duplicate hourly timestamps disable only the forecast', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture); data.hourly.time[2] = data.hourly.time[1];
  await page.route(weather, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('forecast-note')).toContainText('unavailable');
  await expect(page.getByTestId('forecast-hour')).toHaveCount(0);
});

test('repeated DST hours have different offsets in browser forecast cards', async ({ page }) => {
  const data = structuredClone(currentWeatherFixture);
  data.timezone = 'America/New_York';
  data.current.time = Date.parse('2026-11-01T04:00:00Z') / 1000;
  data.hourly.time = Array.from({ length: 25 }, (_, i) => data.current.time + i * 3600);
  await page.route(weather, route => route.fulfill({ json: data }));
  await select(page);
  await expect(page.getByTestId('forecast-time').nth(1)).toHaveText('01 Nov, 01:00 GMT-4');
  await expect(page.getByTestId('forecast-time').nth(2)).toHaveText('01 Nov, 01:00 GMT-5');
});

test('failed storage writes keep session features but do not claim persistence', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  });
  await page.reload(); await select(page);
  await page.getByTestId('unit-fahrenheit').click(); await page.getByTestId('favorite-toggle').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  await expect(page.getByTestId('favorites-status')).toContainText('could not save');
  await page.reload();
  await expect(page.getByTestId('unit-celsius')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('favorite-item')).toHaveCount(0);
});

test('saved markup-like names are displayed as text and never executed', async ({ page }) => {
  const name = '<img src=x onerror="window.injected=true">';
  await page.evaluate(({ key, name }) => localStorage.setItem(key, JSON.stringify([{ id: '5', name, latitude: 1, longitude: 2 }])), { key: STORAGE_KEYS.favorites, name });
  await page.reload();
  await expect(page.getByTestId('favorite-item')).toContainText(name);
  await expect(page.getByTestId('favorites-list').locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).injected)).toBeUndefined();
});

test('invalid saved unit schema defaults to Celsius', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ unit: 'fahrenheit' })), STORAGE_KEYS.unit);
  await page.reload();
  await expect(page.getByTestId('unit-celsius')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('unit-status')).toContainText('invalid');
});
