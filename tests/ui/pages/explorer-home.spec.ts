/**
 * Feature: Explorer discovery entry points
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in explorer discovery entry points; negative cases remain explicit below
 * Run: npm run test:v2 -- tests/ui/pages/explorer-home.spec.ts
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';

test.beforeEach(async ({ page }) => { await page.goto('/explore.html'); });


// Risk: A discovery card could advertise a missing destination.
// Given the explorer homepage, When primary entry points are inspected, Then cards connect to real features.
test('AtlasSphere homepage connects every primary card to a real feature', async ({ page }) => {
  await expect(page).toHaveTitle(/AtlasSphere/);
  await expect(page.getByRole('heading', { name: /Weather and wonders/ })).toBeVisible();
  await expect(page.getByTestId('city-search-input')).toBeVisible();
  await expect(page.getByTestId('home-geoguess-play')).toHaveAttribute('href', '/geoguess');
  await expect(page.locator('.sky-discovery-card')).toHaveCount(3);
  for (const card of await page.locator('.sky-discovery-card').all()) expect(await card.getAttribute('href')).toMatch(/^#/);
  await expect(page.locator('a[href^="/lab"]')).toHaveCount(0);
  await expect(page.getByTestId('featured-photo')).toHaveCount(3);
  await page.locator('.sky-discovery-card').nth(1).click();
  await expect(page.locator('#atlas-content')).toBeVisible();
  await expect(page.locator('#directory-heading')).toBeVisible();
  await expect(page).toHaveURL(/#directory-heading$/);
});


// Risk: A preview could show invented weather before a city is selected.
// Given no selection, When a real fixture city is chosen, Then the invitation becomes selected-city weather.
test('weather preview changes from invitation to real selected city', async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [{ id: 1, name: 'Nashik', country: 'India', latitude: 19.99, longitude: 73.78 }] } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
  await expect(page.locator('#home-weather-empty')).toBeVisible();
  await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click(); await page.getByTestId('city-suggestion').click();
  await expect(page.locator('#home-weather-empty')).toBeHidden();
  await expect(page.getByTestId('current-weather')).toBeVisible();
  await page.getByTestId('city-search-clear').click();
  await expect(page.locator('#home-weather-empty')).toBeVisible();
});


// Risk: Mobile discovery cards could push controls offscreen.
// Given a narrow viewport, When the homepage renders, Then imagery and controls fit within it.
test('mobile AtlasSphere home keeps controls and imagery within viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByTestId('menu-toggle')).toBeVisible();
  await expect(page.getByTestId('hero-photo')).toBeVisible();
  await page.getByTestId('menu-toggle').click();
  await expect(page.getByTestId('nav-geoguess')).toBeVisible();
});
