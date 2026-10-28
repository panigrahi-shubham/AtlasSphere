/**
 * Feature: Malformed responses and recovery
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in malformed responses and recovery; negative cases remain explicit below
 * Run: npx playwright test tests/ui/explorer/resilience.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';
import { STORAGE_KEYS } from '../../../src/utils/storage.js';

const geo = '**/api/v1/geocode?**';
const weather = '**/api/v1/weather?**';
const city = { id: 1, name: 'Nashik', country: 'India', latitude: 19.99, longitude: 73.78, timezone: 'Asia/Kolkata' };
test.beforeEach(async ({ page }) => {
  await page.route(geo, route => route.fulfill({ json: { results: [city] } }));
  await page.route(weather, route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/explore.html');
});


// Risk: Very short queries could consume upstream requests.
// Given one character, When search is submitted, Then validation rejects it before geocoding.
test('one-character query is rejected before contacting geocoding', async ({ explorer, page }) => {
  let calls = 0;
  await page.route(geo, route => { calls++; return route.fulfill({ json: {} }); });
  await explorer.search( 'a');
  await expect(page.getByTestId('search-error')).toContainText('at least 2');
  await expect(page.getByTestId('city-search-input')).toHaveAttribute('aria-invalid', 'true');
  expect(calls).toBe(0);
});


// Risk: A single international result could be selected without consent.
// Given non-Latin input and one result, When lookup completes, Then text is encoded correctly and explicit selection is still required.
test('non-Latin search is encoded correctly and a single result still requires selection', async ({ explorer, page }) => {
  let weatherCalls = 0;
  await page.route(geo, route => {
    expect(new URL(route.request().url()).searchParams.get('q')).toBe('東京');
    return route.fulfill({ json: { results: [{ ...city, name: '東京' }] } });
  });
  await page.route(weather, route => { weatherCalls++; return route.fulfill({ json: currentWeatherFixture }); });
  await explorer.search( '東京');
  await expect(page.getByTestId('city-suggestion')).toHaveCount(1);
  await expect(page.getByTestId('selected-location')).toBeHidden();
  expect(weatherCalls).toBe(0);
  await page.getByTestId('city-suggestion').click();
  await expect(page.getByTestId('city-name')).toHaveText('東京');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
});

for (const stage of ['search', 'weather'] as const) {

// Risk: Invalid JSON could crash search or weather rendering.
// Given unreadable provider JSON, When it is received, Then an honest error appears without uncaught exceptions.
test(`${stage} reports unreadable JSON without uncaught errors`, async ({ explorer, page }) => {
    await page.route(stage === 'search' ? geo : weather, route => route.fulfill({ body: '{not-json', contentType: 'application/json' }));
    if (stage === 'search') await explorer.search('Nashik'); else await explorer.selectOnly('Nashik');
    await expect(page.getByTestId(stage === 'search' ? 'search-error' : 'weather-error')).toContainText('unreadable data');
  });

// Risk: A network failure could leave an unexplained empty panel.
// Given a disconnected provider, When a request runs, Then the corresponding connection message appears.
test(`${stage} handles a network outage with a connection message`, async ({ explorer, page }) => {
    await page.route(stage === 'search' ? geo : weather, route => route.abort('internetdisconnected'));
    if (stage === 'search') await explorer.search('Nashik'); else await explorer.selectOnly('Nashik');
    await expect(page.getByTestId(stage === 'search' ? 'search-error' : 'weather-error')).toContainText('Check your internet connection');
  });

// Risk: A limited request could create an automatic retry loop.
// Given a 429 response, When it is handled, Then the UI explains the limit without repeated requests.
test(`${stage} handles rate limiting without automatic repeated requests`, async ({ explorer, page }) => {
    let calls = 0;
    await page.route(stage === 'search' ? geo : weather, route => { calls++; return route.fulfill({ status: 429, json: {} }); });
    if (stage === 'search') await explorer.search('Nashik'); else await explorer.selectOnly('Nashik');
    await expect(page.getByTestId(stage === 'search' ? 'search-error' : 'weather-error')).toContainText('Too many');
    expect(calls).toBe(1);
  });
}


// Risk: A timeout could permanently block later searches.
// Given a delayed lookup, When it times out and a new search runs, Then the new result can succeed.
test('geocoding timeout supports a successful new search', async ({ explorer, page }) => {
  await page.clock.install();
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(geo, async route => { await gate; await route.fulfill({ json: {} }).catch(() => {}); });
  await explorer.search('Nashik'); await expect(page.getByTestId('city-search-loading')).toBeVisible();
  await page.clock.fastForward(15001);
  await expect(page.getByTestId('search-error')).toContainText('Search timed out');
  release();
  await page.route(geo, route => route.fulfill({ json: { results: [city] } }));
  await page.getByTestId('city-search-button').click();
  await expect(page.getByTestId('city-suggestion')).toHaveCount(1);
});


// Risk: Invalid coordinates could leave earlier choices active.
// Given malformed new results, When validation fails, Then invalid and stale suggestions are removed.
test('invalid geocoding coordinates are rejected and earlier choices disappear', async ({ explorer, page }) => {
  await explorer.search('Nashik'); await expect(page.getByTestId('city-suggestion')).toHaveCount(1);
  await page.route(geo, route => route.fulfill({ json: { results: [{ ...city, latitude: 200 }] } }));
  await explorer.search('Nashik');
  await expect(page.getByTestId('search-error')).toContainText('Location data is incomplete');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
});


// Risk: A provider unit mismatch could show Fahrenheit values labelled Celsius.
// Given inconsistent unit metadata, When weather is validated, Then misleading readings are rejected.
test('weather temperature unit mismatch cannot display Fahrenheit numbers labelled Celsius', async ({ explorer, page }) => {
  const data = structuredClone(currentWeatherFixture); data.current_units.temperature_2m = '°F';
  await page.route(weather, route => route.fulfill({ json: data }));
  await explorer.selectOnly('Nashik');
  await expect(page.getByTestId('weather-error')).toContainText('incomplete or invalid');
  await expect(page.getByTestId('weather-values')).toBeHidden();
});


// Risk: Duplicate timestamps could appear as distinct forecast hours.
// Given repeated hourly timestamps, When validation runs, Then only the forecast is disabled.
test('duplicate hourly timestamps disable only the forecast', async ({ explorer, page }) => {
  const data = structuredClone(currentWeatherFixture); data.hourly.time[2] = data.hourly.time[1];
  await page.route(weather, route => route.fulfill({ json: data }));
  await explorer.selectOnly('Nashik');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await expect(page.getByTestId('forecast-note')).toContainText('unavailable');
  await expect(page.getByTestId('forecast-hour')).toHaveCount(0);
});


// Risk: Repeated DST hours could look identical.
// Given a fall-back transition, When cards render, Then their offsets distinguish the repeated local hours.
test('repeated DST hours have different offsets in browser forecast cards', async ({ explorer, page }) => {
  const data = structuredClone(currentWeatherFixture);
  data.timezone = 'America/New_York';
  data.current.time = Date.parse('2026-11-01T04:00:00Z') / 1000;
  data.hourly.time = Array.from({ length: 25 }, (_, i) => data.current.time + i * 3600);
  await page.route(weather, route => route.fulfill({ json: data }));
  await explorer.selectOnly('Nashik');
  await expect(page.getByTestId('forecast-time').nth(1)).toHaveText('01 Nov, 01:00 GMT-4');
  await expect(page.getByTestId('forecast-time').nth(2)).toHaveText('01 Nov, 01:00 GMT-5');
});


// Risk: Storage failures could be misrepresented as persistent saves.
// Given failed writes, When preferences or favorites change, Then session behavior works with an honest saving warning.
test('failed storage writes keep session features but do not claim persistence', async ({ explorer, page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  });
  await page.reload(); await explorer.selectOnly('Nashik');
  await page.getByTestId('unit-fahrenheit').click(); await page.getByTestId('favorite-toggle').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  await expect(page.getByTestId('favorites-status')).toContainText('could not save');
  await page.reload();
  await expect(page.getByTestId('unit-celsius')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('favorite-item')).toHaveCount(0);
});


// Risk: Saved place names could inject executable markup.
// Given markup-like saved names, When restored, Then text is displayed without executing it.
test('saved markup-like names are displayed as text and never executed', async ({ page }) => {
  const name = '<img src=x onerror="window.injected=true">';
  await page.evaluate(({ key, name }) => localStorage.setItem(key, JSON.stringify([{ id: '5', name, latitude: 1, longitude: 2 }])), { key: STORAGE_KEYS.favorites, name });
  await page.reload();
  await expect(page.getByTestId('favorite-item')).toContainText(name);
  await expect(page.getByTestId('favorites-list').locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).injected)).toBeUndefined();
});


// Risk: An invalid stored unit could corrupt temperature labels.
// Given an unsupported saved unit, When the page loads, Then the safe Celsius default is selected.
test('invalid saved unit schema defaults to Celsius', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ unit: 'fahrenheit' })), STORAGE_KEYS.unit);
  await page.reload();
  await expect(page.getByTestId('unit-celsius')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('unit-status')).toContainText('invalid');
});
