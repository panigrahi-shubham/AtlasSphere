import { test, expect } from '@playwright/test';
test.beforeEach(() => test.skip(process.env.EARTHSCOPE_UI_SOURCE === 'memory', 'GeoGuess uses Vite-transformed package imports and a multi-page route.'));

test('GeoGuess navigation and seeded landmark perfect guess', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('earthscope:theme:v1', JSON.stringify('dark')));
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/explore.html'); await page.getByTestId('nav-geoguess').click();
  await expect(page.getByTestId('gg-mode-landmark')).toBeVisible();
  await page.goto('/geoguess?mode=landmark&seed=42&start=1');
  await expect(page.getByTestId('gg-round')).toHaveText('Round 1 / 5');
  const pos = await page.evaluate(() => { const g = (window as any).__geoguess; const r = g.getRounds()[0]; return g.toScreen(r.lat, r.lon); });
  await page.mouse.click(pos.x, pos.y); await page.getByTestId('gg-confirm').click();
  await expect(page.getByTestId('gg-points')).toContainText('5000');
  expect(await page.getByTestId('gg-feedback').evaluate(n => getComputedStyle(n).backgroundColor)).not.toBe('rgb(255, 255, 255)');
  expect(errors).toEqual([]);
});

test('outline answer, result, save and replay', async ({ page }) => {
  await page.goto('/geoguess?mode=outline&seed=42&start=1');
  const first = await page.getByTestId('gg-question').textContent();
  for (let i = 0; i < 5; i++) {
    const answer = await page.evaluate(() => (window as any).__geoguess.getRounds()[(window as any).__geoguess.getState().round - 1].answer);
    await page.getByRole('button', { name: answer, exact: true }).click();
    await expect(page.getByTestId('gg-points')).toContainText('1600');
    await page.getByTestId('gg-next').click();
  }
  await expect(page.getByTestId('gg-results')).toBeVisible();
  await expect(page.getByTestId('gg-total')).toContainText('8000');
  await page.getByTestId('gg-name').fill('A'); await page.getByTestId('gg-save').click(); await expect(page.getByTestId('gg-name-error')).toHaveText('Name must be 2-20 characters');
  await page.getByTestId('gg-name').fill('Rupesh'); await page.getByTestId('gg-save').click(); await expect(page.getByTestId('gg-leaderboard')).toContainText('Rupesh');
  await page.getByTestId('gg-save').click(); await expect(page.getByTestId('gg-name-error')).toHaveText('Score already saved');
  await page.getByTestId('gg-replay').click(); await expect(page.getByTestId('gg-question')).toHaveText(first!);
});

test('seed reproduces five unique questions and outline options', async ({ page }) => {
  await page.goto('/geoguess?mode=outline&seed=42&start=1');
  const a = await page.evaluate(() => (window as any).__geoguess.getRounds());
  expect(a).toHaveLength(5); expect(new Set(a.map((r: any) => r.id)).size).toBe(5);
  await page.reload(); expect(await page.evaluate(() => (window as any).__geoguess.getRounds())).toEqual(a);
  await page.goto('/geoguess?mode=outline&seed=43&start=1');
  expect(await page.evaluate(() => (window as any).__geoguess.getRounds())).not.toEqual(a);
});

test('timer expires and keyboard controls work', async ({ page }) => {
  await page.clock.install(); await page.goto('/geoguess?mode=outline&seed=13&start=1');
  await page.keyboard.press('1'); await expect(page.getByTestId('gg-feedback')).toBeVisible();
  await page.getByTestId('gg-next').click(); await page.clock.fastForward('00:31');
  await expect(page.getByTestId('gg-feedback')).toContainText("Time's up!"); await expect(page.getByTestId('gg-points')).toHaveText('0 points');
});

test('landmark keyboard pin, Fahrenheit distance, replay and new seed', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('earthscope:temperature-unit:v1', JSON.stringify('fahrenheit')));
  await page.goto('/geoguess?mode=landmark&seed=42&start=1');
  await page.getByTestId('gg-map').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  await expect(page.getByTestId('gg-pin')).toHaveAttribute('visibility', 'visible');
  await page.getByTestId('gg-confirm').click(); await expect(page.getByTestId('gg-distance')).toContainText('miles');
  for (let i = 1; i < 5; i++) { await page.getByTestId('gg-next').click(); await page.getByTestId('gg-map').click({ position: { x: 100, y: 100 } }); await page.getByTestId('gg-confirm').click(); }
  await page.getByTestId('gg-next').click(); await expect(page.getByTestId('gg-breakdown').locator('tbody tr')).toHaveCount(5);
  const old = new URL(page.url()).searchParams.get('seed'); await page.getByTestId('gg-new').click(); expect(new URL(page.url()).searchParams.get('seed')).not.toBe(old);
});

test('leaderboard persists, share link copies, and clear asks confirmation', async ({ page }) => {
  const webkit = page.context().browser()?.browserType().name() === 'webkit';
  await page.clock.install();
  await page.goto('/geoguess?mode=outline&seed=143&start=1');
  for (let i = 0; i < 5; i++) { await page.clock.fastForward('00:31'); await page.getByTestId('gg-next').click(); }
  await page.getByTestId('gg-name').fill('Rupesh'); await page.getByTestId('gg-save').click();
  await page.getByTestId('gg-share').click();
  await expect(page.locator('#gg-share-status')).toContainText(/Link copied|Copy this link:/);
  await expect(page.locator('#gg-share-status')).toContainText('AtlasSphere GeoGuess');
  if (await page.locator('#gg-share-status input[aria-label="Share link"]').count()) {
    await expect(page.locator('#gg-share-status')).toContainText('Copy this link:');
    await expect(page.locator('#gg-share-status input[aria-label="Share link"]')).toHaveValue(/seed=143/);
  } else {
    await expect(page.locator('#gg-share-status')).toContainText('Link copied');
    if (!webkit) expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('seed=143');
  }
  await page.reload(); await page.goto('/geoguess'); await page.getByRole('tab', { name: 'Country Outline' }).click(); await expect(page.getByTestId('gg-leaderboard')).toContainText('Rupesh');
  await page.getByTestId('gg-clear').click(); await page.getByTestId('gg-cancel-clear').click(); await expect(page.getByTestId('gg-leaderboard')).toContainText('Rupesh');
  await page.getByTestId('gg-clear').click(); await page.getByTestId('gg-confirm-clear').click(); await expect(page.getByTestId('gg-leaderboard')).toContainText('No saved scores yet');
});

test('mode cards, keyboard options and mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto('/geoguess');
  await page.getByTestId('gg-mode-outline').focus(); await page.keyboard.press('Enter'); await expect(page.getByTestId('gg-start')).toBeEnabled(); await page.getByTestId('gg-start').click();
  await page.keyboard.press('1'); await expect(page.getByTestId('gg-feedback')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const one = await page.getByTestId('gg-option-1').boundingBox(), two = await page.getByTestId('gg-option-2').boundingBox(); expect(two!.y).toBeGreaterThan(one!.y);
});

test('production test hook is absent', async ({ page }) => {
  test.skip(!process.env.EARTHSCOPE_PRODUCTION, 'Only on production preview');
  await page.goto('/geoguess?mode=landmark&seed=7&start=1');
  expect(await page.evaluate(() => (window as any).__geoguess)).toBeUndefined();
});
