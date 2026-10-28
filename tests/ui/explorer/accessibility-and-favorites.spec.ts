/**
 * Feature: Accessible controls and favorite management
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in accessible controls and favorite management; negative cases remain explicit below
 * Run: npx playwright test tests/ui/explorer/accessibility-and-favorites.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { ExplorerPage } from '../../support/pages/ExplorerPage';

import { test, expect, type Page } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';
import { STORAGE_KEYS } from '../../../src/utils/storage.js';
const weatherEndpoint = '**/api/v1/weather?**';
const cities = [
  { id: 1, name: 'Tokyo', country: 'Japan', latitude: 35.6, longitude: 139.6 },
  { id: 2, name: 'Nashik', country: 'India', latitude: 19.99, longitude: 73.78 },
  { id: 3, name: 'Zürich', country: 'Switzerland', latitude: 47.3, longitude: 8.5 }
];
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: cities } }));
  await page.route(weatherEndpoint, route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/explore.html');
});
async function save(page: Page, name: string) { await new ExplorerPage(page).selectCity(name); await page.getByTestId('favorite-toggle').click(); }


// Risk: Keyboard users could miss search or encounter unnamed controls.
// Given the explorer, When focus navigation and accessible names are checked, Then search and ordinary controls remain identifiable.
test('skip link and all normal form controls have accessible names', async ({ page }) => {
  const webkit = page.context().browser()?.browserType().name() === 'webkit';
  if (webkit) await page.getByTestId('skip-to-search').focus();
  else {
    await page.locator('body').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('skip-to-search')).toBeFocused();
  }
  await page.keyboard.press('Enter'); await expect(page.getByTestId('city-search-input')).toBeFocused();
  for (const control of await page.locator('input:visible, select:visible').all()) await expect(control).toHaveAccessibleName(/\S/);
});


// Risk: Clearing search could erase favorites or allow stale work to return.
// Given selected weather and saved places, When search is cleared, Then the selection is removed while favorites remain.
test('clear search clears selection, cancels pending work and retains favorites', async ({ page }) => {
  await save(page, 'Nashik');
  await page.getByTestId('city-search-clear').click();
  await expect(page.getByTestId('city-search-input')).toHaveValue('');
  await expect(page.getByTestId('city-search-input')).toBeFocused();
  await expect(page.getByTestId('selected-location')).toBeHidden();
  await expect(page.getByTestId('forecast-section')).toBeHidden();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
});


// Risk: Refreshing weather could waste a second geocoding request.
// Given a selected city, When refresh is used, Then only its weather is requested again.
test('refresh loads new weather without repeating geocoding', async ({ explorer, page }) => {
  await explorer.selectCity(); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  const updated = structuredClone(currentWeatherFixture); updated.current.temperature_2m = 9;
  let lookups = 0;
  await page.route('**/api/v1/geocode?**', route => { lookups++; return route.fulfill({ json: {} }); });
  await page.route(weatherEndpoint, route => route.fulfill({ json: updated }));
  await page.getByTestId('weather-refresh').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('9°C');
  expect(lookups).toBe(0);
});


// Risk: Repeated refresh or clearing could allow stale weather to reappear.
// Given an in-flight refresh, When controls are used, Then duplicate refresh is disabled and clear discards the response.
test('refresh is disabled while loading and clear search discards its response', async ({ explorer, page }) => {
  await explorer.selectCity(); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(weatherEndpoint, async route => { await gate; await route.fulfill({ json: currentWeatherFixture }).catch(() => {}); });
  await page.getByTestId('weather-refresh').click();
  await expect(page.getByTestId('weather-refresh')).toBeDisabled();
  await page.getByTestId('city-search-clear').click(); release();
  await expect(page.getByTestId('selected-location')).toBeHidden();
  await expect(page.getByTestId('weather-error')).toBeEmpty();
});


// Risk: Reconnection could silently replace the visible snapshot.
// Given offline and restored connectivity, When status changes, Then no automatic refresh happens.
test('offline and restored status never silently refresh the snapshot', async ({ explorer, page, context }) => {
  let calls = 0;
  await page.route(weatherEndpoint, route => { calls++; return route.fulfill({ json: currentWeatherFixture }); });
  await explorer.selectCity(); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await context.setOffline(true);
  await expect(page.getByTestId('connection-status')).toContainText('offline');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await context.setOffline(false);
  await expect(page.getByTestId('connection-status')).toContainText('Connection restored');
  expect(calls).toBe(1);
});


// Risk: Favorite filtering could delete places or mishandle accents.
// Given saved places, When city, country and accented queries are entered, Then filtering changes only the visible view.
test('favorite filter matches city, country and accent-insensitive text without deleting data', async ({ page }) => {
  await save(page, 'Tokyo'); await save(page, 'Zürich');
  await page.getByTestId('favorites-filter').fill('zurich');
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  await expect(page.getByTestId('favorite-item')).toContainText('Zürich');
  await page.getByTestId('favorites-filter').fill('Japan');
  await expect(page.getByTestId('favorite-item')).toContainText('Tokyo');
  await page.getByTestId('favorites-filter').fill('unknown');
  await expect(page.getByTestId('favorites-no-matches')).toBeVisible();
  await expect(page.getByTestId('favorites-count')).toHaveText('Showing 0 of 2 favorites');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), STORAGE_KEYS.favorites);
  expect(saved).toHaveLength(2);
});


// Risk: Sorting could overwrite the persisted favorite order.
// Given saved locations, When another display order is chosen, Then the original saved order remains.
test('favorite sort changes display order and preserves saved order', async ({ page }) => {
  await save(page, 'Tokyo'); await save(page, 'Nashik'); await save(page, 'Zürich');
  const names = page.getByTestId('favorite-item').locator('.favorite-open');
  await page.getByTestId('favorites-sort').selectOption('name-asc');
  await expect(names).toHaveText(['Nashik, India', 'Tokyo, Japan', 'Zürich, Switzerland']);
  await page.getByTestId('favorites-sort').selectOption('name-desc');
  await expect(names).toHaveText(['Zürich, Switzerland', 'Tokyo, Japan', 'Nashik, India']);
  await page.getByTestId('favorites-sort').selectOption('saved');
  await expect(names).toHaveText(['Tokyo, Japan', 'Nashik, India', 'Zürich, Switzerland']);
});


// Risk: A destructive confirmation could trap or lose focus.
// Given a clear-all request, When it is cancelled or escaped, Then focus and saved places remain correct.
test('clear-all confirmation supports cancel, keyboard focus and Escape', async ({ page }) => {
  await save(page, 'Tokyo');
  await page.getByTestId('favorites-clear').click();
  await expect(page.getByTestId('favorites-clear-dialog')).toBeVisible();
  await expect(page.getByTestId('favorites-cancel-clear')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('favorites-confirm-clear')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('favorites-clear-dialog')).not.toBeVisible();
  await expect(page.getByTestId('favorites-clear')).toBeFocused();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
  await page.getByTestId('favorites-clear').click(); await page.getByTestId('favorites-cancel-clear').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
});


// Risk: Clear-all could remove only filtered rows or reset unrelated preferences.
// Given filtered favorites and chosen units, When clear-all is confirmed, Then all favorites are removed while weather and units remain.
test('confirmed clear-all removes filtered favorites, persists, and preserves weather and units', async ({ page }) => {
  await save(page, 'Tokyo'); await save(page, 'Nashik');
  await page.getByTestId('unit-fahrenheit').click();
  await page.getByTestId('favorites-filter').fill('Tokyo');
  await page.getByTestId('favorites-clear').click(); await page.getByTestId('favorites-confirm-clear').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(0);
  await expect(page.getByTestId('favorites-clear')).toBeDisabled();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('favorite-toggle')).toHaveText('Save favorite');
  await page.reload();
  await expect(page.getByTestId('favorite-item')).toHaveCount(0);
  await expect(page.getByTestId('unit-fahrenheit')).toHaveAttribute('aria-pressed', 'true');
});

for (const width of [320, 768, 1440]) {

// Risk: A narrow layout could make controls unreachable.
// Given each target width, When the page renders, Then buttons remain usable within the viewport.
test(`layout stays within ${width}px with usable buttons`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await save(page, 'Nashik');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const id of ['city-search-button', 'city-search-clear', 'unit-celsius', 'unit-fahrenheit', 'favorite-toggle', 'weather-refresh']) {
      const box = await page.getByTestId(id).boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
}


// Risk: Practice tools could appear during ordinary regression.
// Given an ordinary page URL, When the explorer loads, Then practice controls remain absent.
test('practice mode is absent during normal regression', async ({ page }) => {
  await expect(page.getByTestId('bug-mode-panel')).toHaveCount(0);
});
