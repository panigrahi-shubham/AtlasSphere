import { test, expect } from '../support/uiTest';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const imagery = 'https://gibs.earthdata.nasa.gov/wms/**';
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T12:00:00Z') });
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  await page.route('**/api/v1/journeys/reviews/**', route => route.fulfill({ json: { reviews: [] } }));
});

test('satellite view loads one fixture image on request and shows date, credit and limitations', async ({ page }) => {
  const jpeg = await readFile(new URL('../fixtures/satellite.jpg', import.meta.url));
  let calls = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(imagery, async route => {
    calls++;
    const url = new URL(route.request().url());
    expect(url.searchParams.get('LAYERS')).toBe('MODIS_Terra_CorrectedReflectance_TrueColor');
    expect(url.searchParams.get('TIME')).toBe('2026-10-20');
    await gate; return route.fulfill({ contentType: 'image/jpeg', body: jpeg });
  });
  await page.goto('/journeys');
  await expect(page.getByTestId('sat-date')).toHaveValue('2026-10-20');
  await expect(page.getByTestId('sat-date')).toHaveAttribute('min', '2000-02-24');
  await expect(page.getByTestId('sat-date')).toHaveAttribute('max', '2026-10-27');
  expect(calls).toBe(0);
  await page.getByTestId('sat-load').click();
  try { await expect(page.getByTestId('sat-status')).toHaveText('Loading satellite image…'); }
  finally { release(); }
  await expect(page.getByTestId('sat-image')).toBeVisible();
  await expect(page.getByTestId('sat-image')).toHaveAttribute('alt', /27\.175.*78\.042.*2026-10-20/);
  await expect(page.getByTestId('sat-caption')).toHaveText('2026-10-20 — MODIS Terra true colour');
  await expect(page.getByTestId('sat-attribution')).toHaveText('Imagery: NASA GIBS / EOSDIS');
  await expect(page.getByTestId('sat-limitations')).toContainText('Not street-level imagery.');
  expect(await page.getByTestId('sat-image').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(8);
  expect(calls).toBe(1);
  const result = await new AxeBuilder({ page }).include('[data-testid="sat-panel"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('a satellite image failure offers an honest retry message', async ({ page }) => {
  await page.route(imagery, route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/journeys'); await page.getByTestId('sat-load').click();
  await expect(page.getByTestId('sat-status')).toHaveText('Satellite image unavailable for this date or place. Try another date.');
  await expect(page.getByTestId('sat-image')).toBeHidden();
  await expect(page.getByTestId('sat-load')).toBeEnabled();
});

test('an unsupported satellite date shows the range without requesting NASA', async ({ page }) => {
  let calls = 0;
  await page.route(imagery, route => { calls++; return route.fulfill({ status: 404, body: '' }); });
  await page.goto('/journeys'); await page.getByTestId('sat-date').fill('1999-01-01'); await page.getByTestId('sat-load').click();
  await expect(page.getByTestId('sat-status')).toHaveText('Satellite imagery for this layer starts on 2000-02-24.');
  await expect(page.getByTestId('sat-date')).toHaveAttribute('aria-invalid', 'true');
  expect(calls).toBe(0);
});

test('satellite view validates the shared coordinate controls', async ({ page }) => {
  let calls = 0;
  await page.route(imagery, route => { calls++; return route.fulfill({ status: 404, body: '' }); });
  await page.goto('/journeys'); await page.getByLabel('Latitude', { exact: true }).fill('91'); await page.getByTestId('sat-load').click();
  await expect(page.getByTestId('sat-status')).toContainText('Enter valid latitude and longitude above');
  expect(calls).toBe(0);
});
