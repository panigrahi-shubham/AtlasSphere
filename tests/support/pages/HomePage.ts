import type { Page } from '@playwright/test';

/** Navigation and controls for the React discovery homepage. */
export class HomePage {
  constructor(private readonly page: Page) {}
  /** Navigate to the homepage. */
  async open() { await this.page.goto('/'); }
  /** Open the navigation dialog. */
  async openMenu() { await this.page.getByTestId('home-menu-toggle').click(); }
  /** Submit text to geographic search, using the response configured by the test. */
  async search(query: string) {
    await this.page.getByTestId('home-search-input').fill(query);
    await this.page.getByTestId('home-search-submit').click();
  }
  /** Return the navigation dialog for assertions in the spec. */
  get menu() { return this.page.getByTestId('home-menu'); }
  /** Return the result list for assertions in the spec. */
  get results() { return this.page.getByTestId('home-search-results'); }
}
