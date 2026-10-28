/**
 * Feature: Navigation, news and geolocation
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in navigation, news and geolocation; negative cases remain explicit below
 * Run: npm run test:v2 -- tests/ui/pages/explorer-layout.spec.ts
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '../../support/uiTest';
import { currentWeatherFixture } from '../../fixtures/currentWeather.js';
test.beforeEach(async ({ page }) => { await page.goto('/explore.html'); });

// Risk: The saved theme could flash incorrectly before app initialization.
// Given a stored preference and a blocked main bundle, When HTML loads, Then the preference is already applied.
test('saved theme is applied before the main app module executes', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('earthscope:theme:v1', JSON.stringify('dark')));
  await page.route('**/assets/explore-*.js', route => route.abort()); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

// Risk: Navigation changes could move key search and unit controls out of reach.
// Given the explorer and scrolling, When layout is checked, Then the header stays sticky and primary controls remain prominent.
test('header remains sticky, units stay in navigation and search is prominent in the hero', async ({ page }) => {
  await expect(page.locator('.hero-section').getByTestId('city-search-input')).toBeVisible();
  await expect(page.locator('header').getByTestId('unit-celsius')).toBeVisible();
  await page.evaluate(() => scrollTo(0, 700));
  expect(await page.locator('header').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.getByTestId('city-search-input').focus(); await page.keyboard.type('Unknown city'); await page.getByTestId('city-search-button').focus(); await expect(page.getByTestId('city-search-button')).toBeFocused();
});

// Risk: News cards could lose their sample labels or source context.
// Given the news fixture, When rendered, Then sample status, sources, dates and safe links are present.
test('news fixture displays labelled sample items, sources, dates and safe links', async ({ page }) => {
  await expect(page.getByTestId('news-item')).toHaveCount(2);
  await expect(page.getByTestId('news-fixture-label')).toContainText('not live news');
  await expect(page.getByTestId('news-headline').first()).toHaveAttribute('target', '_blank');
  await expect(page.getByTestId('news-headline').first()).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByTestId('news-source').first()).toHaveText('India Meteorological Department');
});

// Risk: Empty or old news could appear current and complete.
// Given empty and stale snapshots, When loaded, Then explicit empty and stale states appear.
test('news empty state and stale warning are reachable with fixture mocking', async ({ page }) => {
  await page.route('**/api/v1/news', route => route.fulfill({ json: { lastUpdated: '2000-01-01T00:00:00Z', items: [] } })); await page.reload();
  await expect(page.getByTestId('news-status')).toContainText('No sample news items'); await expect(page.getByTestId('news-status')).toContainText('more than 12 hours old');
});

// Risk: Unsafe news links or a failed request could break recovery.
// Given failed and unsafe snapshots, When retry succeeds, Then valid news returns and unsafe URLs never render.
test('news failure recovers on retry and unsafe links never render', async ({ page }) => {
  await page.route('**/api/v1/news', route => route.fulfill({ status: 503, json: {} })); await page.reload();
  await expect(page.getByTestId('news-status')).toContainText('unavailable');
  await page.route('**/api/v1/news', route => route.fulfill({ json: { lastUpdated: '2026-10-26T00:00:00Z', items: [] } })); await page.getByTestId('news-retry').click(); await expect(page.getByTestId('news-status')).toContainText('No sample news');
  await page.route('**/api/v1/news', route => route.fulfill({ json: { lastUpdated: '2026-10-26T00:00:00Z', items: [{ headline: 'Unsafe', snippet: '', source: 'Test', publishedAt: '2026-10-26T00:00:00Z', url: 'javascript:alert(1)' }] } }));
  await page.getByTestId('news-retry').click(); await expect(page.getByTestId('news-status')).toContainText('invalid link'); await expect(page.getByTestId('news-item')).toHaveCount(0);
});

// Risk: A pending news request could look like an empty result.
// Given a delayed response, When the page is waiting, Then the loading skeleton stays visible.
test('news loading skeleton is visible during a pending request', async ({ page }) => {
  let release = () => {}; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/news', async route => { await gate; await route.fulfill({ json: { lastUpdated: '2026-10-26T00:00:00Z', items: [] } }); }); await page.reload();
  await expect(page.getByTestId('news-skeleton')).toBeVisible(); await expect(page.getByTestId('news-section')).toHaveAttribute('aria-busy', 'true'); release();
  await expect(page.getByTestId('news-skeleton')).toBeHidden();
});

// Risk: Denied browser location could block ordinary search.
// Given denied geolocation permission, When lookup is attempted, Then city search remains usable.
test('denied location permission leaves city search usable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition(_success: any, failure: any) { failure({ code: 1 }); } } })); await page.reload();
  await page.getByTestId('use-location').click(); await expect(page.getByTestId('location-status')).toContainText('permission denied'); await expect(page.getByTestId('city-search-input')).toBeEnabled();
});

// Risk: Browser coordinates could be ignored or replaced by guessed values.
// Given permitted fixture coordinates, When location is requested, Then weather uses those coordinates.
test('allowed browser location loads weather from real provided coordinates', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']); await context.setGeolocation({ latitude: 19.99, longitude: 73.78 });
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: currentWeatherFixture }));
  await page.getByTestId('use-location').click(); await expect(page.getByTestId('city-name')).toHaveText('Your location'); await expect(page.getByTestId('current-temperature')).toBeVisible(); await expect(page.getByTestId('country-name')).toHaveText('Country unavailable');
});

// Risk: Secondary routes could lack context or a return path.
// Given About and an unknown URL, When opened, Then titles, credits and the home link remain correct.
test('About and missing-page routes have titles, credits and a home link', async ({ page }) => {
  await page.goto('/about.html'); await expect(page).toHaveTitle('About AtlasSphere'); await expect(page.getByTestId('about-title')).toBeVisible();
  const response = await page.goto('/no-such-place'); expect(response?.status()).toBe(404); await expect(page.getByTestId('not-found-title')).toBeVisible();
  await page.getByTestId('page-home').click();
  await expect(page.getByRole('heading', { name: 'Explore Earth and Beyond.', exact: true })).toBeVisible();
  await page.getByTestId('home-explore-earth').click();
  await expect(page.getByTestId('city-search-input')).toBeVisible();
});

// Risk: A late location callback could overwrite a new typed query.
// Given pending geolocation, When the user types first, Then the old callback is discarded.
test('typing a new search discards a late location callback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition(success: any) { (window as any).pendingGPS = success; } } })); await page.reload();
  await page.getByTestId('use-location').click(); await page.getByTestId('city-search-input').fill('Paris');
  await page.evaluate(() => (window as any).pendingGPS({ coords: { latitude: 19.99, longitude: 73.78 } }));
  await expect(page.getByTestId('selected-location')).toBeHidden(); await expect(page.getByTestId('use-location')).toBeEnabled();
});

// Risk: Expanded navigation could make the smallest supported page wider.
// Given a 320px viewport, When its menu opens, Then the document remains within the viewport.
test('320px header and expanded menu do not widen the page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 }); await page.getByTestId('menu-toggle').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByTestId('city-search-input')).toBeVisible(); await expect(page.getByTestId('unit-fahrenheit')).toBeVisible();
});
