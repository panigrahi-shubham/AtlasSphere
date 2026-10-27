import { test, expect } from '../support/uiTest';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
test.beforeEach(async ({ page }) => { await page.goto('/'); });
test('theme toggles and persists after reload', async ({ page }) => {
  const root = page.locator('html'); const initial = await root.getAttribute('data-theme');
  await page.getByTestId('theme-toggle').click(); const next = initial === 'dark' ? 'light' : 'dark';
  await expect(root).toHaveAttribute('data-theme', next); await page.reload(); await expect(root).toHaveAttribute('data-theme', next);
});
test('blocked theme storage preserves a working session toggle', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; }); await page.reload();
  await page.getByTestId('theme-toggle').click(); await expect(page.getByTestId('appearance-status')).toContainText('session');
});
test('mobile navigation supports menu, Escape and section links', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByTestId('main-navigation')).toBeHidden(); await page.getByTestId('menu-toggle').click(); await expect(page.getByTestId('main-navigation')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByTestId('menu-toggle')).toBeFocused(); await expect(page.getByTestId('main-navigation')).toBeHidden();
  await page.getByTestId('menu-toggle').click(); await page.getByTestId('nav-atlas').click(); await expect(page.getByTestId('main-navigation')).toBeHidden();
});
test('bundled hero photo loads and has a visible source credit', async ({ page }) => {
  await expect(page.getByTestId('hero-photo')).toBeVisible(); await expect.poll(() => page.getByTestId('hero-photo').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('link', { name: 'Bri Schneiter / Pexels' })).toBeVisible();
});
test('a failed hero image retains a usable search and gradient fallback', async ({ page }) => {
  await page.route('**/images/alpine-lake.jpg', route => route.abort()); await page.reload();
  await expect(page.locator('.hero-photo')).toHaveClass(/photo-unavailable/); await expect(page.getByTestId('city-search-input')).toBeVisible();
});
test('landmark photos include real local images and license links', async ({ page }) => {
  await page.getByTestId('atlas-load').click(); const photo = page.getByTestId('landmark-photo').first(); await photo.scrollIntoViewIfNeeded();
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByTestId('landmark-card').first().getByRole('link', { name: 'License', exact: true })).toBeVisible();
});
test('weather appearance comes from fetched conditions and clears with search', async ({ page }) => {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: [{ id: 1, name: 'Nashik', country: 'India', latitude: 19.99, longitude: 73.78 }] } }));
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: { ...currentWeatherFixture, current: { ...currentWeatherFixture.current, weather_code: 61, is_day: 0 } } }));
  await page.getByTestId('city-search-input').fill('Nashik'); await page.getByTestId('city-search-button').click(); await page.getByTestId('city-suggestions').getByRole('button').click();
  await expect(page.locator('body')).toHaveAttribute('data-condition', 'rain'); await expect(page.locator('body')).toHaveAttribute('data-daylight', 'night'); await expect(page.getByTestId('weather-story')).toContainText('current weather report');
  await page.getByTestId('city-search-clear').click(); await expect(page.locator('body')).not.toHaveAttribute('data-condition');
});
test('light and dark layouts fit the target viewport sizes', async ({ page }) => {
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (let i = 0; i < 2; i++) { await page.getByTestId('theme-toggle').click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  }
});
