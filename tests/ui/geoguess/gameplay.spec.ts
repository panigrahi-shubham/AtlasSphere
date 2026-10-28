/**
 * Feature: GeoGuess game and leaderboard
 * Layer: UI regression — Playwright
 * Real: Browser game, bundled data and browser storage
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in geoguess game and leaderboard; negative cases remain explicit below
 * Run: npx playwright test tests/ui/geoguess/gameplay.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '@playwright/test';
import { GeoGuessPage } from '../../support/pages/GeoGuessPage';
test.beforeEach(() => test.skip(process.env.EARTHSCOPE_UI_SOURCE === 'memory', 'GeoGuess uses Vite-transformed package imports and a multi-page route.'));


// Risk: Navigation or scoring could break the first seeded round.
// Given a known landmark seed, When the correct location is pinned, Then navigation and the perfect score work.
test('GeoGuess navigation and seeded landmark perfect guess', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('earthscope:theme:v1', JSON.stringify('dark')));
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/explore.html'); await page.getByTestId('nav-geoguess').click();
  await expect(page.getByTestId('gg-mode-landmark')).toBeVisible();
  await new GeoGuessPage(page).open('?mode=landmark&seed=42&start=1');
  await expect(page.getByTestId('gg-round')).toHaveText('Round 1 / 5');
  const pos = await page.evaluate(() => { const g = (window as any).__geoguess; const r = g.getRounds()[0]; return g.toScreen(r.lat, r.lon); });
  await page.mouse.click(pos.x, pos.y); await page.getByTestId('gg-confirm').click();
  await expect(page.getByTestId('gg-points')).toContainText('5000');
  expect(await page.getByTestId('gg-feedback').evaluate(n => getComputedStyle(n).backgroundColor)).not.toBe('rgb(255, 255, 255)');
  expect(errors).toEqual([]);
});



// Risk: A full game could fail between answering, saving and replay.
// Given a deterministic outline game, When all rounds are answered and saved, Then totals, validation and replay remain correct.
test('outline answer, result, save and replay', async ({ page }) => {
  await page.goto('/geoguess?mode=outline&seed=42&start=1');
  const first = await page.getByTestId('gg-question').textContent();
  await test.step('Complete five outline rounds', async () => {
    for (let i = 0; i < 5; i++) {
      const answer = await page.evaluate(() => (window as any).__geoguess.getRounds()[(window as any).__geoguess.getState().round - 1].answer);
      await page.getByRole('button', { name: answer, exact: true }).click();
      await expect(page.getByTestId('gg-points')).toContainText('1600');
      await page.getByTestId('gg-next').click();
    }
    await expect(page.getByTestId('gg-results')).toBeVisible();
    await expect(page.getByTestId('gg-total')).toContainText('8000');
  });
  await test.step('Validate a name and save the score once', async () => {
    await page.getByTestId('gg-name').fill('A'); await page.getByTestId('gg-save').click(); await expect(page.getByTestId('gg-name-error')).toHaveText('Name must be 2-20 characters');
    await page.getByTestId('gg-name').fill('Rupesh'); await page.getByTestId('gg-save').click(); await expect(page.getByTestId('gg-leaderboard')).toContainText('Rupesh');
    await page.getByTestId('gg-save').click(); await expect(page.getByTestId('gg-name-error')).toHaveText('Score already saved');
  });
  await test.step('Replay the same seeded game', async () => {
    await page.getByTestId('gg-replay').click(); await expect(page.getByTestId('gg-question')).toHaveText(first!);
  });
});



// Risk: Seeded rounds could be nondeterministic or repeat questions.
// Given fixed and changed seeds, When rounds are generated, Then fixed seeds repeat and each game stays unique.
test('seed reproduces five unique questions and outline options', async ({ page }) => {
  await page.goto('/geoguess?mode=outline&seed=42&start=1');
  const a = await page.evaluate(() => (window as any).__geoguess.getRounds());
  expect(a).toHaveLength(5); expect(new Set(a.map((r: any) => r.id)).size).toBe(5);
  await page.reload(); expect(await page.evaluate(() => (window as any).__geoguess.getRounds())).toEqual(a);
  await page.goto('/geoguess?mode=outline&seed=43&start=1');
  expect(await page.evaluate(() => (window as any).__geoguess.getRounds())).not.toEqual(a);
});



// Risk: Keyboard input or time expiry could leave a round unresolved.
// Given a running outline round, When an answer or timeout occurs, Then feedback and points reflect it.
test('timer expires and keyboard controls work', async ({ page }) => {
  await page.clock.install(); await page.goto('/geoguess?mode=outline&seed=13&start=1');
  await page.keyboard.press('1'); await expect(page.getByTestId('gg-feedback')).toBeVisible();
  await page.getByTestId('gg-next').click(); await page.clock.fastForward('00:31');
  await expect(page.getByTestId('gg-feedback')).toContainText("Time's up!"); await expect(page.getByTestId('gg-points')).toHaveText('0 points');
});



// Risk: Display preferences or replay could corrupt landmark gameplay.
// Given a seeded landmark game in Fahrenheit, When keyboard pinning and a new game are used, Then distance display and seed behavior remain correct.
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



// Risk: A mobile keyboard user could be unable to start or answer.
// Given a narrow game page, When mode cards and numeric keys are used, Then the game works without overflow.
test('mode cards, keyboard options and mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto('/geoguess');
  await page.getByTestId('gg-mode-outline').focus(); await page.keyboard.press('Enter'); await expect(page.getByTestId('gg-start')).toBeEnabled(); await page.getByTestId('gg-start').click();
  await page.keyboard.press('1'); await expect(page.getByTestId('gg-feedback')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const one = await page.getByTestId('gg-option-1').boundingBox(), two = await page.getByTestId('gg-option-2').boundingBox(); expect(two!.y).toBeGreaterThan(one!.y);
});



// Risk: A production bundle could expose development game internals.
// Given production preview mode, When GeoGuess loads, Then its test hook is absent.
test('production test hook is absent', async ({ page }) => {
  test.skip(!process.env.EARTHSCOPE_PRODUCTION, 'Only on production preview');
  await page.goto('/geoguess?mode=landmark&seed=7&start=1');
  expect(await page.evaluate(() => (window as any).__geoguess)).toBeUndefined();
});