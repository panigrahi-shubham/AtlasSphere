import type { Page } from '@playwright/test';

/** Fulfill local geocoding requests with the supplied deterministic city records. */
export async function mockGeocode(page: Page, cities: readonly unknown[]) {
  await page.route('**/api/v1/geocode?**', route => route.fulfill({ json: { results: cities } }));
}

/** Fulfill local weather requests with the supplied deterministic fixture. */
export async function mockCurrentWeather(page: Page, fixture: unknown) {
  await page.route('**/api/v1/weather?**', route => route.fulfill({ json: fixture }));
}

/** Fulfill daily forecast requests with a fixture, leaving other weather requests to earlier handlers. */
export async function mockDailyForecast(page: Page, fixture: unknown) {
  await page.route('**/api/v1/weather?**', route => {
    if (new URL(route.request().url()).searchParams.get('view') !== 'daily') return route.fallback();
    return route.fulfill({ json: fixture });
  });
}

/** Preserve the existing direct-provider outage mock for callers of this module. */
export { mockOpenMeteoDown } from './uiTest';
