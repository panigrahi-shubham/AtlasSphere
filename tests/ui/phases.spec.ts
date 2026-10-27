import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// The legacy raw-file harness cannot transpile the new Journeys TypeScript.
test.skip(process.env.EARTHSCOPE_UI_SOURCE === 'memory', 'Journeys requires Vite module transforms.');

test('@smoke homepage, journeys and account controls are reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('account-section')).toBeVisible();
  await expect(page.getByTestId('nav-journeys')).toBeVisible();
  await page.getByTestId('nav-journeys').click();
  await expect(page.getByTestId('time-year')).toBeVisible();
  await page.getByTestId('time-year').fill('2090');
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Fiction');
});
test('@smoke isolated lab presents practice controls only in development', async ({ page }) => {
  await page.goto('/test-lab');
  await expect(page.getByRole('heading', { name: 'SkyAtlas Test deployment' })).toBeVisible();
  await page.getByTestId('lab-scenario').selectOption('wrong-units');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-result')).toContainText('fahrenheit');
  await page.getByTestId('lab-scenario').selectOption('');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-result')).toContainText('celsius');
});
test('@a11y homepage and journeys have no serious axe issues', async ({ page }) => {
  for (const path of ['/', '/journeys']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(results.violations.filter(v => ['critical','serious'].includes(v.impact || '')), `${path}: ${results.violations.map(v => `${v.id}: ${v.nodes.length}`).join(', ')}`).toEqual([]);
  }
});
