/**
 * Feature: hourly Forecast
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in hourly forecast; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
import { getCurrentWeather, validateHourlyForecast } from '../../src/services/weatherService.js';
import { forecastTime } from '../../src/utils/time.js';

// Risk: Past hours or zero rain values could be mishandled.
// Given a fixed current time, When slots are selected, Then the next 24 valid hours are used and zero rain is preserved.
test('selects 24 future slots, excludes an elapsed hour and preserves zero rain', () => {
  const result = validateHourlyForecast(currentWeatherFixture, currentWeatherFixture.current.time);
  assert.equal(result.hours.length, 24);
  assert.equal(result.hours[0].time, currentWeatherFixture.hourly.time[1]);
  assert.equal(result.hours[0].precipitation, 0);
  assert.equal(result.incomplete, false);
});

// Risk: A boundary comparison could omit the current hour or include an extra one.
// Given exact start and end boundaries, When slots are selected, Then only the intended interval is included.
test('includes an exact current-hour boundary and stops before the end boundary', () => {
  const start = currentWeatherFixture.hourly.time[0];
  const result = validateHourlyForecast(currentWeatherFixture, start);
  assert.equal(result.hours[0].time, start);
  assert.equal(result.hours.at(-1).time, start + 23 * 3600);
  assert.equal(result.hours.length, 24);
});

// Risk: Uneven arrays could attach a measurement to the wrong timestamp.
// Given missing values and mismatched arrays, When rows are normalized, Then timestamp alignment is preserved.
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

// Risk: A short forecast could be filled with stale past data.
// Given short, exhausted or malformed input, When selection runs, Then it never substitutes earlier hours.
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

// Risk: A missing hour could be concealed with data from another day.
// Given gaps within the next day, When slots are selected, Then later-day timestamps do not fill those gaps.
test('does not fill gaps in the next 24 hours with timestamps from later days', () => {
  const data = structuredClone(currentWeatherFixture);
  data.hourly.time = Array.from({ length: 25 }, (_, i) => data.current.time + i * 7200);
  assert.equal(validateHourlyForecast(data, data.current.time).hours.length, 12);
});

// Risk: Midnight and fractional offsets could display the wrong date.
// Given a selected timezone, When timestamps are formatted, Then date and offset follow that location.
test('formats midnight and fractional offsets using the location timezone', () => {
  const time = Date.parse('2026-10-26T18:30:00Z') / 1000;
  assert.equal(forecastTime(time, 'Asia/Kolkata'), '27 Oct, 00:00 GMT+5:30');
  assert.equal(forecastTime(time, 'Asia/Tokyo'), '27 Oct, 03:30 GMT+9');
});

// Risk: DST transitions could create duplicate-looking or nonexistent hours.
// Given fall-back and spring-forward timestamps, When formatted, Then repeated hours keep distinct offsets and skipped hours stay absent.
test('distinguishes repeated fall-back hours and skips spring-forward local hours', () => {
  const format = iso => forecastTime(Date.parse(iso) / 1000, 'America/New_York');
  assert.equal(format('2026-11-01T05:00:00Z'), '01 Nov, 01:00 GMT-4');
  assert.equal(format('2026-11-01T06:00:00Z'), '01 Nov, 01:00 GMT-5');
  assert.equal(format('2026-03-08T06:00:00Z'), '08 Mar, 01:00 GMT-5');
  assert.equal(format('2026-03-08T07:00:00Z'), '08 Mar, 03:00 GMT-4');
});

// Risk: Missing forecast data could invalidate current conditions.
// Given usable current weather without hourly data, When forecast validation runs, Then current weather remains valid.
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
