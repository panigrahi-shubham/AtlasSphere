import { test, expect } from '@playwright/test';
import { haversine, landmarkPoints } from '../../src/geoguess/core.ts';
test.beforeEach(() => test.skip(process.env.EARTHSCOPE_UI_SOURCE === 'memory', 'GeoGuess requires the Vite multi-page route.'));

test('GG-BUG-1: Fahrenheit changes distance units, never score maths', async ({ page }) => {
  test.fail(true, 'GG-BUG-1 intentionally scores miles as kilometres in practice mode');
  await page.addInitScript(() => localStorage.setItem('earthscope:practice:earthscope:temperature-unit:v1', JSON.stringify('fahrenheit')));
  await page.goto('/geoguess?mode=landmark&seed=42&start=1&bugMode=1&bugs=GG-BUG-1');
  const answer = await page.evaluate(() => (window as any).__geoguess.getRounds()[0]);
  await page.getByTestId('gg-map').scrollIntoViewIfNeeded();
  const pos = await page.evaluate(() => (window as any).__geoguess.toScreen(0, 0)); await page.mouse.click(pos.x, pos.y); await page.getByTestId('gg-confirm').click();
  await expect(page.getByTestId('gg-points')).toHaveText(`${landmarkPoints(haversine(0, 0, answer.lat, answer.lon))} points`);
});

test('GG-BUG-2: timer stops immediately after the answer', async ({ page }) => {
  test.fail(true, 'GG-BUG-2 intentionally keeps the visible countdown running for three seconds');
  await page.clock.install(); await page.goto('/geoguess?mode=outline&seed=42&start=1&bugMode=1&bugs=GG-BUG-2');
  await page.keyboard.press('1'); const stopped = await page.getByTestId('gg-timer').textContent();
  await page.clock.fastForward('00:02'); await expect(page.getByTestId('gg-timer')).toHaveText(stopped!);
});
