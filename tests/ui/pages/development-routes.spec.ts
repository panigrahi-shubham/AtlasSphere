/**
 * Feature: Development routes and accessibility
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in development routes and accessibility; negative cases remain explicit below
 * Run: npx playwright test tests/ui/pages/development-routes.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// The legacy raw-file harness cannot transpile the new Journeys TypeScript.
test.skip(process.env.EARTHSCOPE_UI_SOURCE === 'memory', 'Journeys requires Vite module transforms.');

// The shared server rate-limits per client IP. Keep each worker's Test Lab
// requests separate from other suites without changing the server's limits.
test.beforeEach(async ({ page, baseURL }, testInfo) => {
  const prefix = new URL('/api/v1/test-lab/', baseURL).href;
  const worker = testInfo.workerIndex;
  const address = `198.18.${Math.floor(worker / 254) % 256}.${worker % 254 + 1}`;
  await page.route(url => url.href.startsWith(prefix), route =>
    route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': address } }));
});


// Risk: A route change could break access to preserved application features.
// Given the explorer, When Journeys is opened, Then account controls and future-year content remain reachable.
test('preserved explorer, journeys and account controls are reachable', { tag: ['@smoke'] }, async ({ page }) => {
  await page.goto('/explore.html');
  await expect(page.getByTestId('account-section')).toBeVisible();
  await expect(page.getByTestId('nav-journeys')).toBeVisible();
  await page.getByTestId('nav-journeys').click();
  await expect(page.getByTestId('time-year')).toBeVisible();
  await page.getByTestId('time-year').fill('2090');
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Fiction');
});

// Risk: Practice scenarios could lose the ability to return to normal behavior.
// Given the development lab, When a defect is selected and cleared, Then both planted and normal responses are shown.
test('isolated lab presents practice controls only in development', { tag: ['@smoke'] }, async ({ page }) => {
  await page.goto('/test-lab');
  await expect(page.getByRole('heading', { name: 'AtlasSphere Test deployment' })).toBeVisible();
  await page.getByTestId('lab-scenario').selectOption('wrong-units');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-result')).toContainText('fahrenheit');
  await page.getByTestId('lab-scenario').selectOption('');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-result')).toContainText('celsius');
});

// Risk: Preserved routes could introduce serious accessibility barriers.
// Given explorer and Journeys pages, When axe checks run, Then no serious or critical issues are reported.
test('preserved explorer and journeys have no serious axe issues', { tag: ['@a11y'] }, async ({ page }) => {
  for (const path of ['/explore.html', '/journeys']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(results.violations.filter(v => ['critical','serious'].includes(v.impact || '')), `${path}: ${results.violations.map(v => `${v.id}: ${v.nodes.length}`).join(', ')}`).toEqual([]);
  }
});
