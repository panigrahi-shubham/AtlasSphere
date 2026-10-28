/**
 * Feature: Geographic search
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in geographic search; negative cases remain explicit below
 * Run: npx playwright test tests/ui/explorer/search.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect, mockOpenMeteoDown } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';

const cities = [
  { id: 2657896, name: 'Zürich', admin1: 'Zurich', country: 'Switzerland', latitude: 47.37, longitude: 8.55 },
  { id: 123, name: 'Zurich', admin1: 'Kansas', country: 'United States', latitude: 39.23, longitude: -99.43 }
];
const endpoint = '**/api/v1/geocode?**';

test.beforeEach(async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ json: { results: cities } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/explore.html');
});



// Risk: Opening the explorer could make unexpected provider calls.
// Given a fresh browser context, When the page opens, Then no automatic lookup or uncaught error occurs.
test('loads without console errors or an automatic API call', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let calls = 0;
  await page.route(endpoint, route => { calls++; return route.fulfill({ json: {} }); });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('city-search-input')).toBeVisible();
  expect(calls).toBe(0);
  expect(errors).toEqual([]);
});


// Risk: Similar city names could make the selected country ambiguous.
// Given multiple matching places, When one is selected, Then its city and country are displayed.
test('shows matching countries and lets the user select a city', async ({ explorer, page }) => {
  await explorer.search('Zürich');
  await expect(page.getByTestId('city-suggestions').getByRole('button')).toHaveCount(2);
  await page.getByRole('button', { name: 'Zürich, Zurich, Switzerland', exact: true }).click();
  await expect(page.getByTestId('city-name')).toHaveText('Zürich');
  await expect(page.getByTestId('country-name')).toHaveText('Switzerland');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
});


// Risk: Search could require a mouse despite appearing keyboard accessible.
// Given matching suggestions, When Enter and arrow keys are used, Then a city can be selected.
test('supports Enter, arrow navigation and keyboard selection', async ({ page }) => {
  const input = page.getByTestId('city-search-input');
  await input.fill('Zurich'); await input.press('Enter');
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  await input.press('ArrowDown');
  await expect(page.getByTestId('city-suggestion').first()).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(page.getByTestId('country-name')).toHaveText('United States');
});


// Risk: Closing suggestions could lose keyboard focus.
// Given an open result list, When Escape is pressed, Then suggestions close and focus returns.
test('Escape closes suggestions and returns focus', async ({ explorer, page }) => {
  await explorer.search('Zürich');
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  await page.getByTestId('city-search-input').press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
  await expect(page.getByTestId('city-search-input')).toBeFocused();
});


// Risk: Whitespace could generate unnecessary provider traffic.
// Given blank input, When search is submitted, Then validation runs without an API call.
test('rejects whitespace without making an API request', async ({ explorer, page }) => {
  let calls = 0;
  await page.route(endpoint, route => { calls++; return route.fulfill({ json: {} }); });
  await explorer.search( '   ');
  await expect(page.getByTestId('search-error')).toHaveText('Enter a city name.');
  expect(calls).toBe(0);
});


// Risk: A no-match result could leave stale options selectable.
// Given earlier suggestions, When a new query has no matches, Then the old list is cleared.
test('no matches clears previous suggestions', async ({ explorer, page }) => {
  await explorer.search('Zürich'); await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  await page.route(endpoint, route => route.fulfill({ json: {} }));
  await explorer.search( 'zzzzunknown');
  await expect(page.getByTestId('search-error')).toContainText('No cities found');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
});


// Risk: A failed lookup could leave search permanently unusable.
// Given a provider error, When it recovers and search is retried, Then the error and result states recover.
test('reports API errors and allows retry', async ({ explorer, page }) => {
  await mockOpenMeteoDown(page);
  await page.route(endpoint, route => route.fulfill({ status: 503, json: {} }));
  await explorer.search('Zürich');
  await expect(page.getByTestId('search-error')).toContainText('503');
  await expect(page.getByTestId('city-search-loading')).toBeHidden();
  await page.route(endpoint, route => route.fulfill({ json: { results: cities } }));
  await page.getByTestId('city-search-button').click();
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
});


// Risk: A pending result could overwrite an edited query.
// Given a delayed search, When the input changes first, Then the obsolete response stays hidden.
test('editing a pending search cancels its stale results', async ({ explorer, page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => { await gate; await route.fulfill({ json: { results: cities } }).catch(() => {}); });
  await explorer.search('Zürich');
  await expect(page.getByTestId('city-search-loading')).toBeVisible();
  await page.getByTestId('city-search-input').fill('Tokyo');
  release();
  await expect(page.getByTestId('city-search-loading')).toBeHidden();
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
  await expect(page.getByTestId('search-error')).toBeEmpty();
});


// Risk: Mobile search controls could overflow the page.
// Given a narrow viewport, When a search is performed, Then controls and results fit the viewport.
test('works at mobile width without horizontal page overflow', async ({ explorer, page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await explorer.search('Zürich');
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
