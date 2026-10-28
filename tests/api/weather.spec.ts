/**
 * Feature: Weather provider contracts
 * Layer: Live contract — Playwright request client
 * Real: Public provider endpoints and application validation
 * Mocked: None; external services can fail independently
 * Guards: Regressions in weather provider contracts; negative cases remain explicit below
 * Run: npx playwright test --config=playwright.api.config.ts tests/api/weather.spec.ts
 * Needs: Internet access; one worker; respect provider rate limits
 */
import { test, expect } from '@playwright/test';
import { weatherURL, validateCurrentWeather, validateHourlyForecast, HOURLY_VARIABLES } from '../../src/services/weatherService.js';


// Risk: The live weather schema could drift from application validation.
// Given a real forecast request, When normalized, Then metric units, timestamps and required values satisfy the existing contract.
test('live current weather has metric units, valid values and a usable timezone', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get(weatherURL({ latitude: 19.99, longitude: 73.78 }), { timeout: 15000 });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const weather = validateCurrentWeather(data) as ReturnType<typeof validateCurrentWeather> & { incomplete?: boolean };
  expect(Number.isFinite(weather.temperature)).toBe(true);
  expect(data.current_units.apparent_temperature).toBe('°C');
  expect(data.current_units.relative_humidity_2m).toBe('%');
  expect(data.current_units.wind_speed_10m).toBe('km/h');
  expect(data.current_units.precipitation).toBe('mm');
  expect(weather.incomplete).toBe(false);
  expect(weather.interval).toBeGreaterThan(0);
  expect(data.hourly_units.time).toBe('unixtime');
  for (const field of ['time', ...HOURLY_VARIABLES]) {
    expect(Array.isArray(data.hourly[field])).toBe(true);
    expect(data.hourly[field].length).toBe(data.hourly.time.length);
  }
  expect(data.hourly_units.temperature_2m).toBe('°C');
  expect(data.hourly_units.precipitation_probability).toBe('%');
  expect(data.hourly_units.wind_speed_10m).toBe('km/h');
  const forecast = validateHourlyForecast(data, weather.time);
  expect(forecast.hours).toHaveLength(24);
  expect(forecast.hours[0].time).toBeGreaterThanOrEqual(weather.time);
});


// Risk: The provider could accept invalid coordinates.
// Given out-of-range coordinates, When the live endpoint receives them, Then it rejects the request.
test('live weather rejects invalid coordinates', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get('https://api.open-meteo.com/v1/forecast', {
    params: { latitude: 100, longitude: 0, current: 'temperature_2m' }, timeout: 15000
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe(true);
});
