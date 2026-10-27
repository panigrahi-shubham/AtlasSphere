import { test, expect } from '@playwright/test';

test('@live live geocoding lookup returns valid coordinates', async ({ request }) => {
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
