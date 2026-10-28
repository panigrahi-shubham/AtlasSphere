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
async function select(page: Page, name = 'Nashik') {
  await page.getByTestId('city-search-input').fill(name); await page.getByTestId('city-search-button').click();
  await page.getByTestId('city-suggestions').getByRole('button', { name: new RegExp(`^${name},`) }).click();
}
async function save(page: Page, name: string) { await select(page, name); await page.getByTestId('favorite-toggle').click(); }

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

test('clear search clears selection, cancels pending work and retains favorites', async ({ page }) => {
  await save(page, 'Nashik');
  await page.getByTestId('city-search-clear').click();
  await expect(page.getByTestId('city-search-input')).toHaveValue('');
  await expect(page.getByTestId('city-search-input')).toBeFocused();
  await expect(page.getByTestId('selected-location')).toBeHidden();
  await expect(page.getByTestId('forecast-section')).toBeHidden();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
});

test('refresh loads new weather without repeating geocoding', async ({ page }) => {
  await select(page); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  const updated = structuredClone(currentWeatherFixture); updated.current.temperature_2m = 9;
  let lookups = 0;
  await page.route('**/api/v1/geocode?**', route => { lookups++; return route.fulfill({ json: {} }); });
  await page.route(weatherEndpoint, route => route.fulfill({ json: updated }));
  await page.getByTestId('weather-refresh').click();
  await expect(page.getByTestId('current-temperature')).toHaveText('9°C');
  expect(lookups).toBe(0);
});

test('refresh is disabled while loading and clear search discards its response', async ({ page }) => {
  await select(page); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(weatherEndpoint, async route => { await gate; await route.fulfill({ json: currentWeatherFixture }).catch(() => {}); });
  await page.getByTestId('weather-refresh').click();
  await expect(page.getByTestId('weather-refresh')).toBeDisabled();
  await page.getByTestId('city-search-clear').click(); release();
  await expect(page.getByTestId('selected-location')).toBeHidden();
  await expect(page.getByTestId('weather-error')).toBeEmpty();
});

test('offline and restored status never silently refresh the snapshot', async ({ page, context }) => {
  let calls = 0;
  await page.route(weatherEndpoint, route => { calls++; return route.fulfill({ json: currentWeatherFixture }); });
  await select(page); await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await context.setOffline(true);
  await expect(page.getByTestId('connection-status')).toContainText('offline');
  await expect(page.getByTestId('current-temperature')).toHaveText('24°C');
  await context.setOffline(false);
  await expect(page.getByTestId('connection-status')).toContainText('Connection restored');
  expect(calls).toBe(1);
});

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
  test(`layout stays within ${width}px with usable buttons`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await save(page, 'Nashik');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const id of ['city-search-button', 'city-search-clear', 'unit-celsius', 'unit-fahrenheit', 'favorite-toggle', 'weather-refresh']) {
      const box = await page.getByTestId(id).boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test('practice mode is absent during normal regression', async ({ page }) => {
  await expect(page.getByTestId('bug-mode-panel')).toHaveCount(0);
});
