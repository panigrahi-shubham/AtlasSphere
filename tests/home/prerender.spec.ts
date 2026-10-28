/**
 * Feature: Static HTML and React hydration
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in static html and react hydration; negative cases remain explicit below
 * Run: npm run test:home
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '@playwright/test';

test.skip(process.env.HOME_PRODUCTION !== '1', 'Static HTML and hydration are production-build checks.');

const pages = [
  ['/', 'Explore Earth and Beyond.'],
  ['/sources', 'A world of trusted sources.'],
  ['/privacy', 'Your privacy, explained.'],
  ['/accessibility', 'Exploration is for everyone.'],
] as const;


// Risk: Static HTML could become dependent on a streaming reveal script.
// Given a production build, When HTML is requested, Then real page content exists without pending reveal markup.
test('initial HTML includes real content and no streaming reveal dependency', async ({ request }) => {
  for (const [path, heading] of pages) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`data-prerendered="${path}"`);
    expect(html).toContain('<main');
    expect(html).toContain(path === '/' ? 'id="home-title"' : heading);
    expect(html).not.toContain('<!--$?-->');
    expect(html).not.toContain('$RC(');
    if (path === '/') expect(html).toContain('/images/earth-space/earth-hero');
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

// Risk: Visitors without JavaScript could see an empty shell.
// Given JavaScript is disabled, When each public page opens, Then its own heading and content remain visible.
test('homepage and information routes display their own content', async ({ page }) => {
    for (const [path, heading] of pages) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      if (path === '/') await expect(page.getByTestId('home-globe-fallback')).toBeVisible();
    }
  });
});

for (const theme of ['dark', 'light']) {

// Risk: Hydration could break theme, menu or focus behavior.
// Given a saved theme, When each production page hydrates, Then it stays error-free and its menu and focus work.
test(`${theme} page hydrates without errors and keeps menu and focus working`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(theme => localStorage.setItem('earthscope:theme:v1', JSON.stringify(theme)), theme);
    for (const [path, heading] of pages) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.getByTestId('home-theme-toggle')).toHaveAttribute('aria-pressed', String(theme === 'light'));
      await page.getByTestId('home-menu-toggle').click();
      await expect(page.getByTestId('home-menu')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('home-menu-toggle')).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}
