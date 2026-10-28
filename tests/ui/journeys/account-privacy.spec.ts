/**
 * Feature: Account deletion and safe wake-up recovery
 * Layer: UI regression — Playwright
 * Real: Browser rendering, routing and interaction
 * Mocked: Provider responses and browser failures where supplied by the scenario
 * Guards: Regressions in account deletion and safe wake-up recovery; negative cases remain explicit below
 * Run: npx playwright test tests/ui/journeys/account-privacy.spec.ts --project=ui
 * Needs: Installed Chromium and the suite’s local server or production build
 */
import { test, expect } from '../../support/uiTest';
import AxeBuilder from '@axe-core/playwright';


// Risk: Account deletion could proceed without a safe confirmation.
// Given a signed-in user, When deletion is requested and cancelled, Then the password dialog is accessible and focus returns.
test('account deletion asks for a password and supports keyboard cancellation', async ({ page, account }) => {
  await page.route('**/api/v1/**', route => route.fulfill({ json: { favorites: [] } }));
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ json: { accessToken: 'test-token', user: { email: 'test@example.test', theme: 'dark', displayName: null } } }));
  await page.goto('/explore.html');
  await expect(page.getByTestId('account-email-display')).toHaveText('test@example.test');
  await account.requestDeletion();
  await expect(page.getByTestId('delete-account-dialog')).toBeVisible();
  await expect(page.getByLabel('Current password')).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('#delete-account-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('delete-account-dialog')).not.toBeVisible();
  await expect(page.getByTestId('account-delete')).toBeFocused();
});


// Risk: A sleeping backend could make a safe read look permanently broken.
// Given one wake-up response, When the read retries, Then progress is announced and data eventually returns.
test('a waking server is announced and a safe read retries successfully', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  let calls = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/account/export', async route => {
    calls++;
    if (calls === 1) return route.fulfill({ status: 503, headers: { 'Retry-After': '0' }, json: { error: { message: 'Waking' } } });
    await gate; return route.fulfill({ json: { account: { email: 'test@example.test' } } });
  });
  await page.goto('/explore.html');
  const read = page.evaluate(async () => (await import('/src/services/account.ts')).account.request('/account/export'));
  try {
    await expect(page.getByTestId('server-wake-status')).toBeVisible();
    await expect(page.getByTestId('server-wake-status')).toContainText('Waking up the AtlasSphere server');
  } finally { release(); }
  expect((await read).account.email).toBe('test@example.test');
  expect(calls).toBe(2);
  await expect(page.getByTestId('server-wake-status')).toBeHidden();
});


// Risk: An uncertain write could be replayed and duplicate data.
// Given an ambiguous wake-up failure, When the client handles it, Then it does not repeat the write.
test('a failed account write is not replayed after an ambiguous wake-up error', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  let calls = 0;
  await page.route('**/api/v1/account/profile', route => { calls++; return route.fulfill({ status: 503, headers: { 'Retry-After': '0', 'X-SkyAtlas-Retry-Safe': '0' }, json: { error: { message: 'Waking' } } }); });
  await page.goto('/explore.html');
  const message = await page.evaluate(async () => {
    try { await (await import('/src/services/account.ts')).account.request('/account/profile', { method: 'PUT', body: '{}' }); return ''; }
    catch (error) { return (error as Error).message; }
  });
  expect(message).toContain('Check whether your change was saved');
  expect(calls).toBe(1);
});


// Risk: A write confirmed as unforwarded could become unrecoverable.
// Given an explicit safe-retry response, When the client retries, Then the save succeeds without duplicate forwarding.
test('a save retries when the proxy confirms no write was forwarded', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  let calls = 0, saves = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/account/profile', async route => {
    calls++;
    if (calls === 1) return route.fulfill({ status: 503, headers: { 'Retry-After': '0', 'X-SkyAtlas-Retry-Safe': '1' }, json: { error: { message: 'Waking' } } });
    await gate; saves++;
    return route.fulfill({ json: { displayName: route.request().postDataJSON().displayName } });
  });
  await page.goto('/explore.html');
  const save = page.evaluate(async () => (await import('/src/services/account.ts')).account.request('/account/profile', { method: 'PUT', body: JSON.stringify({ displayName: 'Explorer' }) }));
  try { await expect(page.getByTestId('server-wake-status')).toBeVisible(); }
  finally { release(); }
  expect(await save).toEqual({ displayName: 'Explorer' });
  expect(calls).toBe(2); expect(saves).toBe(1);
  await expect(page.getByTestId('server-wake-status')).toBeHidden();
});


// Risk: A wake-up failure could destroy a still-valid session.
// Given an unforwarded refresh attempt, When the backend wakes, Then refresh recovers without losing the session.
test('session refresh survives an unforwarded wake-up attempt', async ({ page }) => {
  await page.route('**/api/v1/**', route => route.fulfill({ json: { favorites: [] } }));
  let calls = 0;
  await page.route('**/api/v1/auth/refresh', route => {
    calls++;
    if (calls === 1) return route.fulfill({ status: 503, headers: { 'Retry-After': '0', 'X-SkyAtlas-Retry-Safe': '1' }, json: { error: { message: 'Waking' } } });
    return route.fulfill({ json: { accessToken: 'test-token', user: { email: 'refresh@example.test', theme: 'dark', displayName: null } } });
  });
  await page.goto('/explore.html');
  await expect(page.getByTestId('account-email-display')).toHaveText('refresh@example.test');
  expect(calls).toBe(2);
  await expect(page.getByTestId('server-wake-status')).toBeHidden();
});


// Risk: A sleeping backend could cause an endless retry loop.
// Given repeated wake-up responses, When the retry budget is exhausted, Then the client stops after three retries.
test('a waking server stops retrying a read after three retries', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  let calls = 0;
  await page.route('**/api/v1/account/export', route => {
    calls++;
    return route.fulfill({ status: 503, headers: { 'Retry-After': '0' }, json: { error: { message: 'Waking' } } });
  });
  await page.goto('/explore.html');
  const message = await page.evaluate(async () => {
    try { await (await import('/src/services/account.ts')).account.request('/account/export'); return ''; }
    catch (error) { return (error as Error).message; }
  });
  expect(calls).toBe(4);
  expect(message).toContain('Waking up');
  await expect(page.getByTestId('server-wake-status')).toBeHidden();
});
