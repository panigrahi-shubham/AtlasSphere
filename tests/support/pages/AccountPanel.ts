import type { Page } from '@playwright/test';

/** Observable account controls on the explorer page. */
export class AccountPanel {
  constructor(private readonly page: Page) {}
  /** Open the account deletion confirmation; it does not delete an account. */
  async requestDeletion() { await this.page.getByTestId('account-delete').click(); }
  /** Return the deletion dialog for assertions or user interaction. */
  get deletionDialog() { return this.page.getByTestId('delete-account-dialog'); }
  /** Return the signed-in email display for assertions in the spec. */
  get email() { return this.page.getByTestId('account-email-display'); }
}
