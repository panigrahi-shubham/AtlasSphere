import type { Page } from '@playwright/test';

/** Actions and observable controls for the existing weather explorer. */
export class ExplorerPage {
  constructor(private readonly page: Page) {}

  /** Navigate to the preserved explorer entry point. */
  async open() { await this.page.goto('/explore.html'); }

  /** Enter a geographic query and submit it; responses are controlled by the test. */
  async search(query: string) {
    await this.page.getByTestId('city-search-input').fill(query);
    await this.page.getByTestId('city-search-button').click();
  }

  /** Submit a query and select its only suggestion, triggering its weather request. */
  async selectOnly(query: string) {
    await this.search(query);
    await this.page.getByTestId('city-suggestion').click();
  }

  /** Submit a query and select the suggestion with the exact accessible name. */
  async selectExact(query: string, suggestion: string) {
    await this.search(query);
    await this.page.getByTestId('city-suggestions').getByRole('button', { name: suggestion, exact: true }).click();
  }

  /** Submit a query and select a suggestion whose accessible name matches. */
  async selectMatching(query: string, suggestion: RegExp) {
    await this.search(query);
    await this.page.getByTestId('city-suggestions').getByRole('button', { name: suggestion }).click();
  }

  /** Select a city using the existing city-name prefix convention. */
  async selectCity(name = 'Nashik') {
    await this.selectMatching(name, new RegExp(`^${name},`));
  }

  /** Select an exact full place label after searching for its city name. */
  async selectPlace(name = 'Nashik, Maharashtra, India') {
    await this.selectExact(name.split(',')[0], name);
  }

  /** Return the current-weather container for assertions in the calling test. */
  get weather() { return this.page.getByTestId('weather-values'); }
}
