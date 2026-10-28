/**
 * Feature: Historical weather, climate context and fiction
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in journeys, alerts and review workflows; negative cases remain explicit below
 * Run: npx playwright test tests/ui/journeys/time-machine.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '../../support/uiTest';


// Risk: An archive outage could be mistaken for missing historical weather.
// Given a provider failure, When Time Machine runs, Then the page shows the generic archive error.
test('Time Machine reports a generic archive provider failure', async ({ page, journeys }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  await page.route('**/api/v1/journeys/reviews/**', route => route.fulfill({ json: { reviews: [] } }));
  await page.route('**/api/v1/journeys/time-machine?**', route => route.fulfill({ status: 502, json: { error: { message: 'Historical weather is unavailable.' } } }));
  await journeys.open();
  await journeys.exploreYear('1980');
  await expect(page.getByTestId('time-result')).toHaveText('Historical weather is unavailable.');
});



// Risk: Future projections or fiction could be presented as historical observations.
// Given historical and future years, When explored, Then data, climate context and fiction are explicitly distinguished.
test('Time Machine separates historical data, climate context, and fiction', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  await page.route('**/api/v1/journeys/reviews/**', route => route.fulfill({ json: { reviews: [] } }));
  await page.route('**/api/v1/journeys/time-machine?**', route => route.fulfill({ json: { date: '1980-01-01', label: 'Real data', kind: 'Historical reanalysis', source: 'Open-Meteo ERA5', maximum: 21, minimum: 12, note: 'Modelled historical weather.' } }));
  await page.goto('/journeys');
  const year = page.getByTestId('time-year');
  const setYear = async (value: number) => year.evaluate((input, next) => {
    (input as HTMLInputElement).value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await setYear(new Date().getUTCFullYear() + 1);
  await expect(page.locator('#time-value')).toHaveText(String(new Date().getUTCFullYear() + 1));
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Scientific estimate');
  await expect(page.getByTestId('time-result')).toContainText('not a forecast');
  await setYear(new Date().getUTCFullYear() + 31);
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Fiction');
  await expect(page.getByTestId('time-result')).toContainText('Not a forecast');
  await setYear(1980);
  await page.getByTestId('time-explore').click();
  await expect(page.getByTestId('time-result')).toContainText('Modelled historical weather');
});