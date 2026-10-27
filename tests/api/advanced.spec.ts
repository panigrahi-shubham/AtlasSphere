import { test, expect } from '@playwright/test';
import { advancedForecastURL, normalizeDaily } from '../../src/services/advancedForecast.js';

test('@live live seven-day forecast satisfies daily units, date and timezone contracts', async ({ request }) => {
  const response = await request.get(advancedForecastURL({ latitude: 19.99, longitude: 73.78 }), { timeout: 15000 });
  expect(response.ok()).toBeTruthy();
  const raw = await response.json(); const data = normalizeDaily(raw);
  expect(data.days).toHaveLength(7); expect(data.timezone).toBe('Asia/Kolkata');
  for (const key of ['time', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max', 'uv_index_max', 'sunrise', 'sunset', 'weather_code']) expect(raw.daily[key]).toHaveLength(7);
  for (const day of data.days) { expect(Number.isFinite(day.max)).toBe(true); expect(Number.isFinite(day.min)).toBe(true); expect(day.max).toBeGreaterThanOrEqual(day.min!); }
});
test('@live live capital lookup is restricted to the requested country', async ({ request }) => {
  const response = await request.get('https://geocoding-api.open-meteo.com/v1/search', { params: { name: 'New Delhi', countryCode: 'IN', count: 5, language: 'en', format: 'json' }, timeout: 15000 });
  expect(response.ok()).toBeTruthy(); const data = await response.json(); expect(data.results.length).toBeGreaterThan(0);
  expect(data.results.every((city: any) => city.country_code === 'IN')).toBe(true);
});
