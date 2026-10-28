/**
 * Feature: Live forecast, capital lookup and archive
 * Layer: Live contract — Playwright request client
 * Real: Public provider endpoints and application validation
 * Mocked: None; external services can fail independently
 * Guards: Regressions in live forecast, capital lookup and archive; negative cases remain explicit below
 * Run: npx playwright test --config=playwright.api.config.ts tests/api/advanced.spec.ts
 * Needs: Internet access; one worker; respect provider rate limits
 */
import { test, expect } from '@playwright/test';
import { advancedForecastURL, normalizeDaily } from '../../src/services/advancedForecast.js';

test('live seven-day forecast satisfies daily units, date and timezone contracts', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get(advancedForecastURL({ latitude: 19.99, longitude: 73.78 }), { timeout: 15000 });
  expect(response.ok()).toBeTruthy();
  const raw = await response.json(); const data = normalizeDaily(raw);
  expect(data.days).toHaveLength(7); expect(data.timezone).toBe('Asia/Kolkata');
  for (const key of ['time', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max', 'uv_index_max', 'sunrise', 'sunset', 'weather_code']) expect(raw.daily[key]).toHaveLength(7);
  for (const day of data.days) { expect(Number.isFinite(day.max)).toBe(true); expect(Number.isFinite(day.min)).toBe(true); expect(day.max).toBeGreaterThanOrEqual(day.min!); }
});
test('live capital lookup is restricted to the requested country', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get('https://geocoding-api.open-meteo.com/v1/search', { params: { name: 'New Delhi', countryCode: 'IN', count: 5, language: 'en', format: 'json' }, timeout: 15000 });
  expect(response.ok()).toBeTruthy(); const data = await response.json(); expect(data.results.length).toBeGreaterThan(0);
  expect(data.results.every((city: any) => city.country_code === 'IN')).toBe(true);
});

test('free historical archive returns modelled Taj Mahal temperatures', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get('https://archive-api.open-meteo.com/v1/archive', { params: { latitude: '27.175', longitude: '78.042', start_date: '1980-01-01', end_date: '1980-01-01', daily: 'temperature_2m_max,temperature_2m_min', timezone: 'auto', models: 'era5' }, timeout: 15000 });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(Number.isFinite(data.daily.temperature_2m_max[0])).toBe(true);
  expect(Number.isFinite(data.daily.temperature_2m_min[0])).toBe(true);
});
