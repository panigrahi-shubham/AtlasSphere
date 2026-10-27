import { test, expect } from '@playwright/test';

const endpoint = 'https://api.open-meteo.com/v1/forecast';
for (const [unit, label] of [['celsius', '°C'], ['fahrenheit', '°F']] as const) {
  test(`@live live temperature unit contract: ${unit}`, async ({ request }) => {
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
  test(`@live live timezone contract: ${timezone}`, async ({ request }) => {
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

test('@live live weather rejects unknown variables with a structured error', async ({ request }) => {
  const response = await request.get(endpoint, {
    params: { latitude: 1, longitude: 2, current: 'earthscope_invalid_variable' }, timeout: 15000
  });
  expect(response.status()).toBe(400);
  const data = await response.json();
  expect(data.error).toBe(true); expect(typeof data.reason).toBe('string');
});

test('@live live geocoding supports international names', async ({ request }) => {
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
