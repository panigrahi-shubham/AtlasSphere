import { test, expect } from '../support/uiTest';
import AxeBuilder from '@axe-core/playwright';

test('account deletion asks for a password and supports keyboard cancellation', async ({ page }) => {
  await page.route('**/api/v1/**', route => route.fulfill({ json: { favorites: [] } }));
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ json: { accessToken: 'test-token', user: { email: 'test@example.test', theme: 'dark', displayName: null } } }));
  await page.goto('/');
  await expect(page.getByTestId('account-email-display')).toHaveText('test@example.test');
  await page.getByTestId('account-delete').click();
  await expect(page.getByTestId('delete-account-dialog')).toBeVisible();
  await expect(page.getByLabel('Current password')).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('#delete-account-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('delete-account-dialog')).not.toBeVisible();
  await expect(page.getByTestId('account-delete')).toBeFocused();
});

test('a waking server is announced and a safe read retries successfully', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  let calls = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/account/export', async route => {
    calls++;
    if (calls === 1) return route.fulfill({ status: 503, headers: { 'Retry-After': '0' }, json: { error: { message: 'Waking' } } });
    await gate; return route.fulfill({ json: { account: { email: 'test@example.test' } } });
  });
  await page.goto('/');
  const read = page.evaluate(async () => (await import('/src/services/account.ts')).account.request('/account/export'));
  try {
    await expect(page.getByTestId('server-wake-status')).toBeVisible();
    await expect(page.getByTestId('server-wake-status')).toContainText('Waking up the SkyAtlas server');
  } finally { release(); }
  expect((await read).account.email).toBe('test@example.test');
  expect(calls).toBe(2);
  await expect(page.getByTestId('server-wake-status')).toBeHidden();
});

test('a failed account write is not replayed after an ambiguous wake-up error', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  let calls = 0;
  await page.route('**/api/v1/account/profile', route => { calls++; return route.fulfill({ status: 503, headers: { 'Retry-After': '0' }, json: { error: { message: 'Waking' } } }); });
  await page.goto('/');
  const message = await page.evaluate(async () => {
    try { await (await import('/src/services/account.ts')).account.request('/account/profile', { method: 'PUT', body: '{}' }); return ''; }
    catch (error) { return (error as Error).message; }
  });
  expect(message).toContain('Waking up');
  expect(calls).toBe(1);
});

test('a waking server stops retrying a read after three retries', async ({ page }) => {
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ status: 401, json: { error: { message: 'Sign in' } } }));
  let calls = 0;
  await page.route('**/api/v1/account/export', route => {
    calls++;
    return route.fulfill({ status: 503, headers: { 'Retry-After': '0' }, json: { error: { message: 'Waking' } } });
  });
  await page.goto('/');
  const message = await page.evaluate(async () => {
    try { await (await import('/src/services/account.ts')).account.request('/account/export'); return ''; }
    catch (error) { return (error as Error).message; }
  });
  expect(calls).toBe(4);
  expect(message).toContain('Waking up');
  await expect(page.getByTestId('server-wake-status')).toBeHidden();
});
