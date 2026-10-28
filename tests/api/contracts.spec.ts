/**
 * Feature: Live provider response contracts
 * Layer: Live contract — Playwright request client
 * Real: Public provider endpoints and application validation
 * Mocked: None; external services can fail independently
 * Guards: Regressions in live provider response contracts; negative cases remain explicit below
 * Run: npx playwright test --config=playwright.api.config.ts tests/api/contracts.spec.ts
 * Needs: Internet access; one worker; respect provider rate limits
 */
import { test, expect } from '@playwright/test';

const endpoint = 'https://api.open-meteo.com/v1/forecast';
for (const [unit, label] of [['celsius', '°C'], ['fahrenheit', '°F']] as const) {

// Risk: Provider unit options could return unexpectedly scaled values.
// Given each supported unit, When live weather is requested, Then the response honours that unit contract.
test(`live temperature unit contract: ${unit}`, { tag: ['@live'] }, async ({ request }) => {
    const response = await request.get(endpoint, {
      params: { latitude: 47.37, longitude: 8.55, current: 'temperature_2m,apparent_temperature', hourly: 'temperature_2m', temperature_unit: unit, timezone: 'auto', forecast_hours: 2 }, timeout: 15000
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.current_units.temperature_2m).toBe(label);
    expect(data.current_units.apparent_temperature).toBe(label);
    expect(data.hourly_units.temperature_2m).toBe(label);
    expect(Number.isFinite(data.current.temperature_2m)).toBe(true);
    expect(data.hourly.temperature_2m).toHaveLength(data.hourly.time.length);
    expect(data.hourly.temperature_2m.every(Number.isFinite)).toBe(true);
  });
}

for (const timezone of ['Asia/Kolkata', 'America/New_York']) {

// Risk: Provider timezone formatting could drift.
// Given each selected timezone, When live weather is requested, Then local time metadata follows the contract.
test(`live timezone contract: ${timezone}`, { tag: ['@live'] }, async ({ request }) => {
    const response = await request.get(endpoint, {
      params: { latitude: 40.71, longitude: -74.01, current: 'temperature_2m', hourly: 'temperature_2m', timezone, timeformat: 'unixtime', forecast_hours: 3 }, timeout: 15000
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.timezone).toBe(timezone);
    expect(Number.isInteger(data.utc_offset_seconds)).toBe(true);
    expect(data.hourly_units.time).toBe('unixtime');
    expect(data.hourly.time).toHaveLength(3);
    expect(data.hourly.time.every((time: number, i: number, all: number[]) => Number.isFinite(time) && (i === 0 || time - all[i - 1] === 3600))).toBe(true);
  });
}


// Risk: Invalid variables could return a misleading successful response.
// Given an unknown variable, When the live endpoint receives it, Then it returns a structured error.
test('live weather rejects unknown variables with a structured error', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get(endpoint, {
    params: { latitude: 1, longitude: 2, current: 'earthscope_invalid_variable' }, timeout: 15000
  });
  expect(response.status()).toBe(400);
  const data = await response.json();
  expect(data.error).toBe(true); expect(typeof data.reason).toBe('string');
});


// Risk: International location names could stop resolving.
// Given non-ASCII place text, When the live lookup runs, Then results contain valid geographic data.
test('live geocoding supports international names', { tag: ['@live'] }, async ({ request }) => {
  const response = await request.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: 'Zürich', count: 5, language: 'en', format: 'json' }, timeout: 15000
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(Array.isArray(data.results)).toBe(true);
  expect(data.results.length).toBeGreaterThan(0);
  for (const city of data.results) {
    expect(typeof city.name).toBe('string');
    expect(Number.isFinite(city.latitude)).toBe(true);
    expect(Number.isFinite(city.longitude)).toBe(true);
    expect(Math.abs(city.latitude)).toBeLessThanOrEqual(90);
    expect(Math.abs(city.longitude)).toBeLessThanOrEqual(180);
  }
});
