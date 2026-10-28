import { test } from '@playwright/test';

/** Register the existing memory-mode guard in the calling GeoGuess spec. */
export function applyGeoGuessMemoryGuard() {
  test.beforeEach(() => test.skip(process.env.EARTHSCOPE_UI_SOURCE === 'memory', 'GeoGuess uses Vite-transformed package imports and a multi-page route.'));
}
