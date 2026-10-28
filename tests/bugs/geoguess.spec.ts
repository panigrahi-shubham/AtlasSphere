/**
 * Feature: GeoGuess scoring and timer behavior
 * Layer: UI regression — Playwright
 * Real: Browser game, bundled data and browser storage
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in geoguess scoring and timer behavior; negative cases remain explicit below
 * Run: npm run test:bugs
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '@playwright/test';
// The legacy module is untyped; describe only the functions exercised here.
const corePath = '../../src/geoguess/core.ts';
const { haversine, landmarkPoints } = await import(corePath) as {
  haversine: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  landmarkPoints: (km: number) => number;
};
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
