import { test, expect } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';
test.beforeEach(async ({ page }) => { await page.goto('/explore.html'); });
test('saved theme is applied before the main app module executes', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('earthscope:theme:v1', JSON.stringify('dark')));
  await page.route('**/assets/explore-*.js', route => route.abort()); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('header remains sticky, units stay in navigation and search is prominent in the hero', async ({ page }) => {
  await expect(page.locator('.hero-section').getByTestId('city-search-input')).toBeVisible();
  await expect(page.locator('header').getByTestId('unit-celsius')).toBeVisible();
  await page.evaluate(() => scrollTo(0, 700));
  expect(await page.locator('header').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.getByTestId('city-search-input').focus(); await page.keyboard.type('Unknown city'); await page.getByTestId('city-search-button').focus(); await expect(page.getByTestId('city-search-button')).toBeFocused();
});
test('news fixture displays labelled sample items, sources, dates and safe links', async ({ page }) => {
  await expect(page.getByTestId('news-item')).toHaveCount(2);
  await expect(page.getByTestId('news-fixture-label')).toContainText('not live news');
  await expect(page.getByTestId('news-headline').first()).toHaveAttribute('target', '_blank');
  await expect(page.getByTestId('news-headline').first()).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByTestId('news-source').first()).toHaveText('India Meteorological Department');
});
test('news empty state and stale warning are reachable with fixture mocking', async ({ page }) => {
  await page.route('**/api/v1/news', route => route.fulfill({ json: { lastUpdated: '2000-01-01T00:00:00Z', items: [] } })); await page.reload();
  await expect(page.getByTestId('news-status')).toContainText('No sample news items'); await expect(page.getByTestId('news-status')).toContainText('more than 12 hours old');
});
test('news failure recovers on retry and unsafe links never render', async ({ page }) => {
  await page.route('**/api/v1/news', route => route.fulfill({ status: 503, json: {} })); await page.reload();
  await expect(page.getByTestId('news-status')).toContainText('unavailable');
  await page.route('**/api/v1/news', route => route.fulfill({ json: { lastUpdated: '2026-10-26T00:00:00Z', items: [] } })); await page.getByTestId('news-retry').click(); await expect(page.getByTestId('news-status')).toContainText('No sample news');
  await page.route('**/api/v1/news', route => route.fulfill({ json: { lastUpdated: '2026-10-26T00:00:00Z', items: [{ headline: 'Unsafe', snippet: '', source: 'Test', publishedAt: '2026-10-26T00:00:00Z', url: 'javascript:alert(1)' }] } }));
  await page.getByTestId('news-retry').click(); await expect(page.getByTestId('news-status')).toContainText('invalid link'); await expect(page.getByTestId('news-item')).toHaveCount(0);
});
test('news loading skeleton is visible during a pending request', async ({ page }) => {
  let release = () => {}; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/news', async route => { await gate; await route.fulfill({ json: { lastUpdated: '2026-10-26T00:00:00Z', items: [] } }); }); await page.reload();
  await expect(page.getByTestId('news-skeleton')).toBeVisible(); await expect(page.getByTestId('news-section')).toHaveAttribute('aria-busy', 'true'); release();
  await expect(page.getByTestId('news-skeleton')).toBeHidden();
});
test('denied location permission leaves city search usable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition(_success: any, failure: any) { failure({ code: 1 }); } } })); await page.reload();
  await page.getByTestId('use-location').click(); await expect(page.getByTestId('location-status')).toContainText('permission denied'); await expect(page.getByTestId('city-search-input')).toBeEnabled();
});
test('allowed browser location loads weather from real provided coordinates', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']); await context.setGeolocation({ latitude: 19.99, longitude: 73.78 });
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
  await page.getByTestId('use-location').click(); await expect(page.getByTestId('city-name')).toHaveText('Your location'); await expect(page.getByTestId('current-temperature')).toBeVisible(); await expect(page.getByTestId('country-name')).toHaveText('Country unavailable');
});
test('About and missing-page routes have titles, credits and a home link', async ({ page }) => {
  await page.goto('/about.html'); await expect(page).toHaveTitle('About AtlasSphere'); await expect(page.getByTestId('about-title')).toBeVisible();
  const response = await page.goto('/no-such-place'); expect(response?.status()).toBe(404); await expect(page.getByTestId('not-found-title')).toBeVisible();
  await page.getByTestId('page-home').click();
  await expect(page.getByRole('heading', { name: 'Explore Earth and Beyond.', exact: true })).toBeVisible();
  await page.getByTestId('home-explore-earth').click();
  await expect(page.getByTestId('city-search-input')).toBeVisible();
});
test('typing a new search discards a late location callback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition(success: any) { (window as any).pendingGPS = success; } } })); await page.reload();
  await page.getByTestId('use-location').click(); await page.getByTestId('city-search-input').fill('Paris');
  await page.evaluate(() => (window as any).pendingGPS({ coords: { latitude: 19.99, longitude: 73.78 } }));
  await expect(page.getByTestId('selected-location')).toBeHidden(); await expect(page.getByTestId('use-location')).toBeEnabled();
});
test('320px header and expanded menu do not widen the page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 }); await page.getByTestId('menu-toggle').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByTestId('city-search-input')).toBeVisible(); await expect(page.getByTestId('unit-fahrenheit')).toBeVisible();
});
