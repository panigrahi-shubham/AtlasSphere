import { test, expect } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';

const cities = [
  { id: 2657896, name: 'Zürich', admin1: 'Zurich', country: 'Switzerland', latitude: 47.37, longitude: 8.55 },
  { id: 123, name: 'Zurich', admin1: 'Kansas', country: 'United States', latitude: 39.23, longitude: -99.43 }
];
const endpoint = '**/api/v1/geocode?**';

test.beforeEach(async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ json: { results: cities } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
  await page.goto('/');
});

async function search(page, query = 'Zürich') {
  await page.getByTestId('city-search-input').fill(query);
  await page.getByTestId('city-search-button').click();
}

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

test('shows matching countries and lets the user select a city', async ({ page }) => {
  await search(page);
  await expect(page.getByTestId('city-suggestions').getByRole('button')).toHaveCount(2);
  await page.getByRole('button', { name: 'Zürich, Zurich, Switzerland', exact: true }).click();
  await expect(page.getByTestId('city-name')).toHaveText('Zürich');
  await expect(page.getByTestId('country-name')).toHaveText('Switzerland');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
});

test('supports Enter, arrow navigation and keyboard selection', async ({ page }) => {
  const input = page.getByTestId('city-search-input');
  await input.fill('Zurich'); await input.press('Enter');
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  await input.press('ArrowDown');
  await expect(page.getByTestId('city-suggestion').first()).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(page.getByTestId('country-name')).toHaveText('United States');
});

test('Escape closes suggestions and returns focus', async ({ page }) => {
  await search(page);
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  await page.getByTestId('city-search-input').press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
  await expect(page.getByTestId('city-search-input')).toBeFocused();
});

test('rejects whitespace without making an API request', async ({ page }) => {
  let calls = 0;
  await page.route(endpoint, route => { calls++; return route.fulfill({ json: {} }); });
  await search(page, '   ');
  await expect(page.getByTestId('search-error')).toHaveText('Enter a city name.');
  expect(calls).toBe(0);
});

test('no matches clears previous suggestions', async ({ page }) => {
  await search(page); await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  await page.route(endpoint, route => route.fulfill({ json: {} }));
  await search(page, 'zzzzunknown');
  await expect(page.getByTestId('search-error')).toContainText('No cities found');
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
});

test('reports API errors and allows retry', async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ status: 503, json: {} }));
  await search(page);
  await expect(page.getByTestId('search-error')).toContainText('503');
  await expect(page.getByTestId('city-search-loading')).toBeHidden();
  await page.route(endpoint, route => route.fulfill({ json: { results: cities } }));
  await page.getByTestId('city-search-button').click();
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
});

test('editing a pending search cancels its stale results', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => { await gate; await route.fulfill({ json: { results: cities } }).catch(() => {}); });
  await search(page);
  await expect(page.getByTestId('city-search-loading')).toBeVisible();
  await page.getByTestId('city-search-input').fill('Tokyo');
  release();
  await expect(page.getByTestId('city-search-loading')).toBeHidden();
  await expect(page.getByTestId('city-suggestions')).toBeHidden();
  await expect(page.getByTestId('search-error')).toBeEmpty();
});

test('works at mobile width without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await search(page);
  await expect(page.getByTestId('city-suggestion')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
