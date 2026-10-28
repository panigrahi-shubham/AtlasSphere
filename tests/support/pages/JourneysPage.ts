import type { Page } from '@playwright/test';

/** Actions and observable controls on the journeys page. */
export class JourneysPage {
  constructor(private readonly page: Page) {}
  /** Open Journeys; test-supplied API routes determine signed-in state. */
  async open() { await this.page.goto('/journeys'); }
  /** Submit a year to Time Machine, using the data supplied by the test. */
  async exploreYear(year: string) {
    await this.page.getByTestId('time-year').fill(year);
    await this.page.getByTestId('time-explore').click();
  }
  /** Return the Time Machine result for assertions in the spec. */
  get timeResult() { return this.page.getByTestId('time-result'); }
  /** Return the trip list for assertions in the spec. */
  get trips() { return this.page.getByTestId('trip-list'); }
  /** Return the alert list for assertions in the spec. */
  get alerts() { return this.page.getByTestId('alert-list'); }
  /** Return the review list for assertions in the spec. */
  get reviews() { return this.page.getByTestId('review-list'); }
}
