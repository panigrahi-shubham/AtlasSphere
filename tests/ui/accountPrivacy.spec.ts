import { test, expect } from '../support/uiTest';

test('account deletion asks for a password and supports keyboard cancellation', async ({ page }) => {
  await page.route('**/api/v1/**', route => route.fulfill({ json: { favorites: [] } }));
  await page.route('**/api/v1/auth/refresh', route => route.fulfill({ json: { accessToken: 'test-token', user: { email: 'test@example.test', theme: 'dark', displayName: null } } }));
  await page.goto('/');
  await expect(page.getByTestId('account-email-display')).toHaveText('test@example.test');
  await page.getByTestId('account-delete').click();
  await expect(page.getByTestId('delete-account-dialog')).toBeVisible();
  await expect(page.getByLabel('Current password')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('delete-account-dialog')).not.toBeVisible();
  await expect(page.getByTestId('account-delete')).toBeFocused();
});
