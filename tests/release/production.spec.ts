/**
 * Feature: Production build workflows
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in production build workflows; negative cases remain explicit below
 * Run: npm run test:release
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
import { STORAGE_KEYS } from '../../src/utils/storage.js';
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [{ id: 1, name: 'Nashik', country: 'India', latitude: 19.99, longitude: 73.78 }] } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
});

// Risk: A development success could hide broken bundled workflows.
// Given built assets, When search, units and favorites are exercised across reload, Then the preserved explorer still works.
test('built website completes search, weather, forecast, units and favorite reload', async ({ page }) => {
  await page.goto('/explore.html');
  await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click(); await page.getByTestId('city-suggestion').click();
  await expect(page.getByTestId('forecast-hour')).toHaveCount(24);
  await page.getByTestId('unit-fahrenheit').click(); await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await page.getByTestId('favorite-toggle').click(); await page.reload();
  await page.getByTestId('favorites-list').getByRole('button', { name: /^Open Nashik/ }).click();
  await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('latitude-value')).toHaveText('19.990°');
});

// Risk: Development query flags could activate defects in production.
// Given every practice flag on a built page, When weather and favorites are used, Then ordinary production behavior remains.
test('production ignores every development defect flag', async ({ page }) => {
  await page.goto('/explore.html?bugMode=1&bugs=TEMP-001,HUM-001,FAV-001,SEARCH-001,TIME-001');
  await expect(page.getByTestId('bug-mode-panel')).toHaveCount(0);
  await page.getByTestId('city-search-button').click(); await expect(page.getByTestId('search-error')).toHaveText('Enter a city name.');
  await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click(); await page.getByTestId('city-suggestion').click();
  await page.getByTestId('unit-fahrenheit').click(); await expect(page.getByTestId('current-temperature')).toHaveText('76°F');
  await expect(page.getByTestId('humidity-value')).toHaveText('64 %');
  await expect(page.getByTestId('forecast-time').first()).toHaveText('26 Oct, 13:00 GMT+5:30');
  await page.getByTestId('favorite-toggle').click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)! ).length, STORAGE_KEYS.favorites)).toBe(1);
  await page.getByTestId('favorite-toggle').click(); await expect(page.getByTestId('favorite-item')).toHaveCount(0);
});

// Risk: Bundled styles could hide mobile confirmation controls.
// Given a narrow built page, When favorites are cleared, Then confirmation remains usable without overflow.
test('built mobile layout supports favorites confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 }); await page.goto('/explore.html');
  await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click(); await page.getByTestId('city-suggestion').click();
  await page.getByTestId('favorite-toggle').click(); await page.getByTestId('favorites-clear').click();
  await expect(page.getByTestId('favorites-clear-dialog')).toBeVisible();
  await page.getByTestId('favorites-confirm-clear').click(); await expect(page.getByTestId('favorite-item')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Risk: Production could expose game internals or leave the timer running.
// Given a built GeoGuess page with practice flags, When a round is answered, Then test hooks are absent and the countdown stops.
test('GeoGuess production route plays without test hooks or practice defects', async ({ page }) => {
  // Advance the browser clock explicitly to verify the timer stays stopped.
  await page.clock.install();
  await page.goto('/geoguess?mode=outline&seed=42&start=1&bugMode=1&bugs=GG-BUG-2');
  await expect(page.getByTestId('gg-round')).toHaveText('Round 1 / 5');
  expect(await page.evaluate(() => (window as any).__geoguess)).toBeUndefined();
  await page.getByTestId('gg-option-1').click();
  await expect(page.getByTestId('gg-feedback')).toBeVisible();
  const stopped = await page.getByTestId('gg-timer').textContent();
  await page.clock.fastForward(1200);
  await expect(page.getByTestId('gg-timer')).toHaveText(stopped!);
});


// Risk: A release could expose the development Test Lab.
// Given built routes, When Journeys and Test Lab are opened, Then Journeys works and lab controls remain absent.
test('production includes journeys but excludes the isolated Test Lab', async ({ page }) => {
  await page.goto('/journeys');
  await expect(page.getByTestId('time-year')).toBeVisible();
  await page.getByTestId('time-year').fill('2090');
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Fiction');
  await page.goto('/test-lab');
  await expect(page.getByTestId('lab-scenario')).toHaveCount(0);
});
