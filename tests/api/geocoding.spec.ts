/**
 * Feature: Geographic lookup
 * Layer: Live contract — Playwright request client
 * Real: Public provider endpoints and application validation
 * Mocked: None; external services can fail independently
 * Guards: Regressions in geographic lookup; negative cases remain explicit below
 * Run: npx playwright test --config=playwright.api.config.ts tests/api/geocoding.spec.ts
 * Needs: Internet access; one worker; respect provider rate limits
 */
import { test, expect } from '@playwright/test';


// Risk: A live search response could contain unusable locations.
// Given a real city query, When geocoding responds, Then its coordinates are valid.
test('live geocoding lookup returns valid coordinates', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: 'Zurich', count: 5, language: 'en', format: 'json' }, timeout: 15000
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(Array.isArray(data.results)).toBe(true);
  expect(data.results.length).toBeGreaterThan(0);
  for (const city of data.results) {
    expect(typeof city.name).toBe('string');
    expect(Number.isFinite(city.latitude)).toBe(true);
    expect(Math.abs(city.latitude)).toBeLessThanOrEqual(90);
    expect(Number.isFinite(city.longitude)).toBe(true);
    expect(Math.abs(city.longitude)).toBeLessThanOrEqual(180);
  }
});
