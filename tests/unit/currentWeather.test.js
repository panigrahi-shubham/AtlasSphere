/**
 * Feature: current Weather
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in current weather; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentWeatherFixture } from '../fixtures/currentWeather.js';
import { CURRENT_VARIABLES, getCurrentWeather, validateCurrentWeather, weatherURL } from '../../src/services/weatherService.js';
import { initCurrentWeather, localTime } from '../../src/components/currentWeather.js';
import { weatherCondition } from '../../src/utils/weatherCodes.js';

const fixture = () => structuredClone(currentWeatherFixture);

// Risk: Implicit provider defaults could change displayed units.
// Given city coordinates, When the weather URL is built, Then requested variables, units and timestamp format are explicit.
test('weather requests explicit current variables, metric units and Unix time', () => {
  const url = new URL(weatherURL({ latitude: 19.99, longitude: 73.78 }));
  assert.equal(url.searchParams.get('latitude'), '19.99');
  assert.equal(url.searchParams.get('current'), CURRENT_VARIABLES.join(','));
  for (const [key, value] of Object.entries({ timezone: 'auto', timeformat: 'unixtime', temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm' })) {
    assert.equal(url.searchParams.get(key), value);
  }
  assert.ok(url.searchParams.get('hourly').includes('temperature_2m'));
  assert.equal(url.searchParams.get('forecast_hours'), '48');
  assert.throws(() => weatherURL({ latitude: 91, longitude: 0 }), /invalid coordinates/);
});

// Risk: Falsy checks could discard valid zero or negative readings.
// Given zero and negative fixture values, When data is normalized, Then those measurements remain valid.
test('preserves zero values and negative temperatures', () => {
  const data = fixture();
  Object.assign(data.current, { temperature_2m: -3.5, apparent_temperature: 0, relative_humidity_2m: 0, wind_speed_10m: 0 });
  const result = validateCurrentWeather(data);
  assert.equal(result.temperature, -3.5);
  assert.equal(result.feelsLike, 0); assert.equal(result.humidity, 0);
  assert.equal(result.precipitation, 0); assert.equal(result.wind, 0);
  assert.equal(result.incomplete, false);
});

// Risk: Invalid secondary readings could be presented as real measurements.
// Given absent or out-of-range optional values, When validation runs, Then they remain unavailable.
test('missing or invalid secondary metrics stay unavailable', () => {
  const data = fixture();
  Object.assign(data.current, { apparent_temperature: null, relative_humidity_2m: 101, wind_speed_10m: -1, precipitation: '0' });
  const result = validateCurrentWeather(data);
  for (const field of ['feelsLike', 'humidity', 'wind', 'precipitation']) assert.equal(result[field], null);
  assert.equal(result.incomplete, true);
  data.current = { ...fixture().current };
  data.current_units.wind_speed_10m = 'mph';
  assert.equal(validateCurrentWeather(data).wind, null);
});

// Risk: Broken core data could pass as usable weather.
// Given invalid temperature, units, timezone or time, When validation runs, Then the payload is rejected.
test('rejects missing temperature, wrong temperature units and invalid timezones/times', () => {
  for (const change of [
    data => { data.current.temperature_2m = null; },
    data => { data.current_units.temperature_2m = '°F'; },
    data => { data.timezone = 'Invalid/Zone'; },
    data => { data.current.time = '2026-10-26T10:00'; },
    data => { delete data.current; },
    data => { data.error = true; }
  ]) {
    const data = fixture(); change(data);
    assert.throws(() => validateCurrentWeather(data), /incomplete|timezone/);
  }
});

// Risk: A generic error could leave users unsure which service failed.
// Given weather failures, When errors are formatted, Then the message identifies the weather service.
test('weather failures use weather-specific service messages', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  try { await assert.rejects(getCurrentWeather({ latitude: 1, longitude: 2 }), /Weather service unavailable \(503\)/); }
  finally { globalThis.fetch = original; }
});

// Risk: Whole-hour assumptions could show the wrong local time.
// Given fractional offsets and DST transitions, When time is formatted, Then the selected timezone determines the display.
test('local clock respects fractional offsets and daylight saving time', () => {
  assert.equal(localTime('Asia/Kolkata', new Date('2026-10-26T10:00:00Z')), '26 Oct 2026, 15:30');
  assert.equal(localTime('America/New_York', new Date('2026-11-01T05:30:00Z')), '1 Nov 2026, 01:30');
  assert.equal(localTime('America/New_York', new Date('2026-11-01T06:30:00Z')), '1 Nov 2026, 01:30');
});

// Risk: Unknown condition codes could invent a weather description.
// Given day, night and unknown codes, When presentation is selected, Then documented icons or honest fallback labels appear.
test('maps WMO conditions, night icons and unknown codes without inventing conditions', () => {
  assert.equal(weatherCondition(0, 0).icon, '☾');
  assert.equal(weatherCondition(0, 1).icon, '☀');
  assert.equal(weatherCondition(65, 1).description, 'Heavy rain');
  assert.equal(weatherCondition(97, 0).description, 'Heavy thunderstorm');
  assert.deepEqual(weatherCondition(1234, 1), { description: 'Weather conditions unavailable', icon: '?' });
});

// Risk: An uncancellable slow response could replace a newer city.
// Given overlapping requests whose fetch ignores abort, When the older response finishes last, Then it cannot overwrite the new selection.
test('an obsolete weather response cannot overwrite a newer city even if fetch ignores abort', async () => {
  const original = globalThis.document;
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { textContent: '', hidden: true, setAttribute() {}, addEventListener() {} });
    return elements.get(id);
  };
  globalThis.document = { querySelector: selector => element(selector.slice(1)), getElementById: element };
  const pending = [];
  const weather = initCurrentWeather({ fetchWeather: () => new Promise(resolve => pending.push(resolve)) });
  try {
    const a = weather.load({ name: 'Old city' });
    const b = weather.load({ name: 'New city' });
    pending[1]({ ...validateCurrentWeather(fixture()), temperature: 10 }); await b;
    pending[0]({ ...validateCurrentWeather(fixture()), temperature: 35 }); await a;
    assert.equal(element('temperature').textContent, '10°C');
    assert.equal(element('weather-values').hidden, false);
  } finally { weather.clear(); globalThis.document = original; }
});
