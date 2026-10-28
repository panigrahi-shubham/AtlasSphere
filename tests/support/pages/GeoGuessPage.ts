import type { Page } from '@playwright/test';

/** Navigation and observable game state for GeoGuess. */
export class GeoGuessPage {
  constructor(private readonly page: Page) {}
  /** Open the game with optional URL parameters such as a deterministic seed. */
  async open(parameters = '') { await this.page.goto(`/geoguess${parameters}`); }
  /** Answer with the labelled option and leave feedback visible to the test. */
  async answer(name: string) { await this.page.getByRole('button', { name, exact: true }).click(); }
  /** Return the current round label for assertions in the spec. */
  get round() { return this.page.getByTestId('gg-round'); }
  /** Return the result section for assertions in the spec. */
  get results() { return this.page.getByTestId('gg-results'); }
}
