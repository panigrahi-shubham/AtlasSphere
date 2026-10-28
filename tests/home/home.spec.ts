import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const places = { results: [{ id: 1857910, name: 'Kyoto', admin1: 'Kyoto', country: 'Japan', latitude: 35.021, longitude: 135.754 }] };

test.beforeEach(async ({ context }) => {
  await context.route('**/api/v1/geocode?*', route => route.fulfill({ json: places }));
});

test('homepage presents all discovery sections, real imagery and a lazy globe', async ({ page }) => {
  const requested: string[] = [], errors: string[] = [];
  page.on('request', request => requested.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Explore Earth and Beyond.');
  await expect(page.getByTestId('home-globe-fallback')).toBeVisible();
  await expect(page.getByTestId('home-menu-toggle')).toBeVisible();
  for (const id of ['introduction', 'planet', 'universe', 'destinations', 'astronomy', 'earth-science', 'history', 'learning']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  expect(requested.filter(url => /earthRenderer|earth-texture|three\.module/.test(url))).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect.poll(() => page.getByTestId('home-globe-fallback').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test('navigation traps focus, closes on Escape and returns focus; explicit close works', async ({ page, isMobile }) => {
  await page.goto('/');
  const toggle = page.getByTestId('home-menu-toggle');
  if (isMobile) await toggle.tap(); else await toggle.click();
  const menu = page.getByTestId('home-menu');
  await expect(menu).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  const close = page.getByTestId('home-menu-close');
  await close.focus(); await page.keyboard.press('Shift+Tab');
  await expect(menu.getByRole('link', { name: 'Data Sources' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await page.keyboard.press('Escape'); await expect(menu).not.toBeVisible(); await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await toggle.click(); await close.click(); await expect(toggle).toBeFocused();
});

test('geographic search validates input, selects by keyboard and hands off real coordinates', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('home-search-submit').click();
  await expect(page.getByTestId('home-search-status')).toContainText('at least 2');
  const input = page.getByTestId('home-search-input');
  await input.fill('Kyoto');
  await expect(page.getByTestId('home-search-results')).toContainText('Kyoto, Japan');
  await input.press('ArrowDown'); await input.press('Enter');
  await expect(page.getByTestId('home-selected-place')).toContainText('35.021');
  await expect(page.getByTestId('home-globe-selection')).toContainText('Kyoto');
  const href = await page.getByTestId('home-place-weather').getAttribute('href');
  expect(href).toContain('/explore.html?'); expect(href).toContain('lat=35.021'); expect(href).toContain('lon=135.754');
  await page.getByTestId('home-search-clear').click();
  await expect(page.getByTestId('home-selected-place')).toHaveCount(0);
  await expect(page.getByTestId('home-globe-selection')).toHaveCount(0);
});

test('search has meaningful empty, outage and retry states', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/v1/geocode?*', route => { calls++; return route.fulfill(calls === 1 ? { status: 503, json: {} } : calls === 2 ? {json: places} : { json: {results:[]} }); });
  await page.goto('/'); await page.getByTestId('home-search-input').fill('Kyoto');
  await expect(page.getByTestId('home-search-status')).toContainText('try again');
  await page.getByTestId('home-search-submit').click();
  await expect(page.getByTestId('home-search-results')).toContainText('Japan');
  await page.getByTestId('home-search-input').fill('No such city');
  await expect(page.getByTestId('home-search-status')).toContainText('No places found');
});

test('a newer search cannot display obsolete results', async ({ page }) => {
  let release: (() => void) | undefined;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/geocode?*', async route => {
    if (route.request().url().includes('Oldtown')) { await hold; await route.fulfill({ json: {results:[{name:'Oldtown',latitude:0,longitude:0,country:'Test'}]} }).catch(() => {}); }
    else await route.fulfill({json:places});
  });
  await page.goto('/'); await page.getByTestId('home-search-input').fill('Oldtown');
  await expect(page.getByTestId('home-search-status')).toContainText('Finding');
  await page.getByTestId('home-search-input').fill('Kyoto');
  await expect(page.getByTestId('home-search-results')).toContainText('Kyoto'); release?.();
  await expect(page.getByTestId('home-search-results')).not.toContainText('Oldtown');
});

test('themes persist and educational controls reveal sourced content', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('home-theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByTestId('home-space-black-holes').click();
  await expect(page.getByTestId('home-space-detail')).toContainText('event horizon');
  await page.getByTestId('home-fact-moon').click();
  await expect(page.getByTestId('home-fact-detail')).toContainText('384,400');
  await page.getByTestId('home-science-earthquakes').click();
  await expect(page.getByTestId('home-science-detail')).toContainText('fault');
  await page.getByTestId('home-history-historical-timelines').click();
  await expect(page.locator('.history-detail')).toContainText('20 July 1969');
});

for (const theme of ['dark', 'light']) test(`homepage and menu accessibility in ${theme} theme`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem('earthscope:theme:v1', JSON.stringify(value)), theme);
  await page.goto('/');
  await expect(page.getByRole('heading', {level:1})).toBeVisible();
  const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByTestId('home-menu-toggle').click();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});

test('WebGL failure retains the image and search with an honest retry state', async ({ page }) => {
  await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (String(type).startsWith('webgl')) return null; return original.call(this, type, ...args); } as typeof original; });
  await page.goto('/'); await page.getByTestId('home-globe-activate').click();
  await expect(page.getByTestId('home-globe-status')).toContainText('3D is unavailable');
  await expect(page.getByTestId('home-globe-fallback')).toBeVisible();
  await expect(page.getByTestId('home-globe-activate')).toHaveText('Try 3D again ↗');
  await expect(page.getByTestId('home-search-input')).toBeVisible();
});

test('sources, privacy and accessibility routes are readable directly', async ({ page }) => {
  for (const [route, heading] of [['/sources','A world of trusted sources.'], ['/privacy','Your privacy, explained.'], ['/accessibility','Exploration is for everyone.']]) {
    await page.goto(route); await expect(page.getByRole('heading', {level:1})).toHaveText(heading);
  }
  await page.goto('/sources'); await expect(page.getByText('NASA, ESA, CSA, STScI; processing:', {exact:false})).toBeVisible();
});
