import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
import { getCurrentWeather, validateHourlyForecast } from '../../src/services/weatherService.js';
import { forecastTime } from '../../src/utils/time.js';

test('selects 24 future slots, excludes an elapsed hour and preserves zero rain', () => {
  const result = validateHourlyForecast(currentWeatherFixture, currentWeatherFixture.current.time);
  assert.equal(result.hours.length, 24);
  assert.equal(result.hours[0].time, currentWeatherFixture.hourly.time[1]);
  assert.equal(result.hours[0].precipitation, 0);
  assert.equal(result.incomplete, false);
});

test('includes an exact current-hour boundary and stops before the end boundary', () => {
  const start = currentWeatherFixture.hourly.time[0];
  const result = validateHourlyForecast(currentWeatherFixture, start);
  assert.equal(result.hours[0].time, start);
  assert.equal(result.hours.at(-1).time, start + 23 * 3600);
  assert.equal(result.hours.length, 24);
});

test('missing values, wrong units and uneven arrays retain timestamp alignment', () => {
  const data = structuredClone(currentWeatherFixture);
  data.hourly.temperature_2m[1] = null;
  data.hourly.precipitation_probability[2] = 101;
  data.hourly.wind_speed_10m = [8.5];
  const result = validateHourlyForecast(data, data.current.time);
  assert.equal(result.hours[0].temperature, null);
  assert.equal(result.hours[0].precipitation, 0);
  assert.equal(result.hours[1].precipitation, null);
  assert.equal(result.hours[0].wind, null);
  assert.equal(result.hours[0].time, data.hourly.time[1]);
  assert.equal(result.incomplete, true);
  data.hourly_units.temperature_2m = '°F';
  assert.equal(validateHourlyForecast(data, data.current.time).hours[1].temperature, null);
});

test('short, exhausted or malformed forecasts never fall back to past hours', () => {
  const data = structuredClone(currentWeatherFixture);
  data.hourly.time = data.hourly.time.slice(0, 4);
  const result = validateHourlyForecast(data, data.current.time);
  assert.equal(result.hours.length, 3); assert.equal(result.incomplete, true);
  assert.equal(validateHourlyForecast(data, data.hourly.time.at(-1) + 1).hours.length, 0);
  data.hourly.time = [100, 100];
  assert.equal(validateHourlyForecast(data, 0).hours.length, 0);
  data.hourly.time = [200, 100];
  assert.equal(validateHourlyForecast(data, 0).hours.length, 0);
  assert.equal(validateHourlyForecast({}, 0).hours.length, 0);
});

test('does not fill gaps in the next 24 hours with timestamps from later days', () => {
  const data = structuredClone(currentWeatherFixture);
  data.hourly.time = Array.from({ length: 25 }, (_, i) => data.current.time + i * 7200);
  assert.equal(validateHourlyForecast(data, data.current.time).hours.length, 12);
});

test('formats midnight and fractional offsets using the location timezone', () => {
  const time = Date.parse('2026-10-26T18:30:00Z') / 1000;
  assert.equal(forecastTime(time, 'Asia/Kolkata'), '27 Oct, 00:00 GMT+5:30');
  assert.equal(forecastTime(time, 'Asia/Tokyo'), '27 Oct, 03:30 GMT+9');
});

test('distinguishes repeated fall-back hours and skips spring-forward local hours', () => {
  const format = iso => forecastTime(Date.parse(iso) / 1000, 'America/New_York');
  assert.equal(format('2026-11-01T05:00:00Z'), '01 Nov, 01:00 GMT-4');
  assert.equal(format('2026-11-01T06:00:00Z'), '01 Nov, 01:00 GMT-5');
  assert.equal(format('2026-03-08T06:00:00Z'), '08 Mar, 01:00 GMT-5');
  assert.equal(format('2026-03-08T07:00:00Z'), '08 Mar, 03:00 GMT-4');
});

test('a missing forecast does not reject valid current conditions', async () => {
  const original = globalThis.fetch;
  const data = structuredClone(currentWeatherFixture); delete data.hourly;
  globalThis.fetch = async () => ({ ok: true, json: async () => data });
  try {
    const result = await getCurrentWeather({ latitude: 1, longitude: 2 });
    assert.equal(result.temperature, 24.4);
    assert.equal(result.forecast.hours.length, 0);
  } finally { globalThis.fetch = original; }
});
