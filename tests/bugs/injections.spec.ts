/**
 * Feature: Practice defect selection and storage isolation
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in practice defect selection and storage isolation; negative cases remain explicit below
 * Run: npm run test:bugs
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { ExplorerPage } from '../support/pages/ExplorerPage';

import { test, expect, type Page } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
import { STORAGE_KEYS } from '../../src/utils/storage.js';
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [{ id: 1, name: 'Nashik', country: 'India', latitude: 19.99, longitude: 73.78 }] } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
});
async function loadPracticeWeather(page: Page) {
  await new ExplorerPage(page).selectOnly('Nashik');
  await expect(page.getByTestId('weather-values')).toBeVisible();
}
for (const id of ['TEMP-001', 'HUM-001', 'FAV-001', 'SEARCH-001', 'TIME-001']) {

// Risk: Practice defects could be impossible to reproduce independently.
// Given one selected defect, When its affected flow runs, Then the fixture shows that defect’s specific result.
test(`practice defect ${id} is reproducible only when selected`, async ({ page }) => {
    await page.goto(`/explore.html?bugMode=1&bugs=${id}`);
    await expect(page.getByTestId('bug-mode-panel')).toBeVisible();
    await expect(page.getByTestId(`bug-${id}`)).toBeChecked();
    if (id === 'SEARCH-001') {
      const request = page.waitForRequest(url => url.url().includes('/api/v1/geocode'));
      await page.getByTestId('city-search-button').click();
      expect(new URL((await request).url()).searchParams.get('q')).toBe(''); return;
    }
    await loadPracticeWeather(page);
    if (id === 'TEMP-001') { await page.getByTestId('unit-fahrenheit').click(); await expect(page.getByTestId('current-temperature')).toHaveText('44°F'); }
    if (id === 'HUM-001') await expect(page.getByTestId('humidity-value')).toHaveText('Not available');
    if (id === 'FAV-001') { await page.getByTestId('favorite-toggle').click(); await page.getByTestId('favorite-toggle').click(); await expect(page.getByTestId('favorite-item')).toHaveCount(2); }
    if (id === 'TIME-001') await expect(page.getByTestId('forecast-time').first()).toHaveText('26 Oct, 07:30 GMT');
  });
}

// Risk: Practice storage could overwrite ordinary saved data.
// Given normal favorites and preferences, When practice mode changes them, Then normal storage remains isolated.
test('practice storage cannot read or overwrite normal favorites/preferences', async ({ page }) => {
  await page.goto('/explore.html');
  const saved = JSON.stringify([{ id: '9', name: 'Original', latitude: 1, longitude: 2 }]);
  await page.evaluate(({ keys, saved }) => { localStorage.setItem(keys.favorites, saved); localStorage.setItem(keys.unit, JSON.stringify('fahrenheit')); }, { keys: STORAGE_KEYS, saved });
  await page.goto('/explore.html?bugMode=1&bugs=FAV-001');
  await expect(page.getByTestId('favorite-item')).toHaveCount(0);
  await expect(page.getByTestId('unit-celsius')).toHaveAttribute('aria-pressed', 'true');
  await loadPracticeWeather(page); await page.getByTestId('favorite-toggle').click();
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.favorites)).toBe(saved);
  await page.getByTestId('bug-mode-exit').click();
  await expect(page.getByTestId('bug-mode-panel')).toHaveCount(0);
  await expect(page.getByTestId('favorite-item')).toContainText('Original');
  await expect(page.getByTestId('unit-fahrenheit')).toHaveAttribute('aria-pressed', 'true');
});

// Risk: Disabling one defect could leave stale behavior active.
// Given selected, disabled and unknown flags, When the page loads, Then only enabled known defects affect it.
test('defects can be individually disabled and unknown IDs are ignored', async ({ page }) => {
  await page.goto('/explore.html?bugMode=1&bugs=HUM-001,UNKNOWN');
  await page.getByTestId('bug-HUM-001').uncheck();
  await expect(page.getByTestId('bug-HUM-001')).not.toBeChecked();
  await loadPracticeWeather(page); await expect(page.getByTestId('humidity-value')).toHaveText('64 %');
});

