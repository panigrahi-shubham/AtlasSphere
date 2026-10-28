/**
 * Feature: GeoGuess score persistence and sharing
 * Layer: UI regression — Playwright
 * Real: Browser game, bundled data and browser storage
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in geoguess game and leaderboard; negative cases remain explicit below
 * Run: npx playwright test tests/ui/geoguess/leaderboard.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '@playwright/test';
test.beforeEach(() => test.skip(process.env.EARTHSCOPE_UI_SOURCE === 'memory', 'GeoGuess uses Vite-transformed package imports and a multi-page route.'));


// Risk: Saved scores or confirmation could fail across reload.
// Given a completed game, When sharing, reloading and clearing scores, Then persistence and cancel/confirm behavior remain correct.
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