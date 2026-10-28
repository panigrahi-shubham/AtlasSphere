/**
 * Feature: geography-data
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in geography-data; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDaily, advancedForecastURL } from '../../src/services/advancedForecast.js';
import { normalizeCountries, filterCountries, hemisphere } from '../../src/utils/countries.js';
import { landmarks } from '../../src/data/landmarks.js';

const fixture = () => ({ timezone: 'Asia/Kolkata', daily_units: { time: 'unixtime', temperature_2m_max: '°C', temperature_2m_min: '°C', precipitation_probability_max: '%', precipitation_sum: 'mm', wind_speed_10m_max: 'km/h', uv_index_max: '', sunrise: 'unixtime', sunset: 'unixtime', weather_code: 'wmo code' }, daily: { time: [1792972800, 1793059200], temperature_2m_max: [25, 26], temperature_2m_min: [15, 16], precipitation_probability_max: [0, 100], precipitation_sum: [0, 10], wind_speed_10m_max: [12, 13], uv_index_max: [4, 5], weather_code: [2, 61] } });
test('extended forecast requests seven days and explicit units separately from current weather', () => {
  const url = new URL(advancedForecastURL({ latitude: 19.99, longitude: 73.78 }));
  assert.equal(url.searchParams.get('forecast_days'), '7'); assert.equal(url.searchParams.get('timeformat'), 'unixtime');
  assert.equal(url.searchParams.get('temperature_unit'), 'celsius'); assert.equal(url.searchParams.has('current'), false);
  assert.throws(() => advancedForecastURL({ latitude: Infinity, longitude: 0 }), /Invalid/);
});
test('daily validation preserves zeros and absent polar sunrise without inventing data', () => {
  const data = normalizeDaily(fixture()); assert.equal(data.days[0].rain, 0); assert.equal(data.days[0].precipitation, 0); assert.equal(data.days[0].sunrise, null); assert.equal(data.days.length, 2);
});
test('daily validation rejects invalid dates, timezones and reversed temperature bounds', () => {
  const f = fixture(); f.daily.temperature_2m_min[0] = 30; assert.equal(normalizeDaily(f).days[0].max, null);
  f.daily.time.reverse(); assert.throws(() => normalizeDaily(f), /dates/);
  assert.throws(() => normalizeDaily({ ...fixture(), timezone: 'Bad/Zone' }), /timezone/);
  assert.throws(() => normalizeDaily({ ...fixture(), timezone: undefined }), /timezone/);
});
test('daily secondary values require correct units and physically valid ranges', () => {
  const f = fixture(); f.daily_units.temperature_2m_max = '°F'; f.daily.precipitation_probability_max[0] = 101; f.daily.wind_speed_10m_max[1] = -1;
  const { days } = normalizeDaily(f); assert.equal(days[0].max, null); assert.equal(days[0].rain, null); assert.equal(days[1].wind, null);
});
test('country filtering handles capitals, regions and empty results without altering records', () => {
  const countries = normalizeCountries([{ name: { common: 'India' }, cca2: 'IN', cca3: 'IND', ccn3: '356', capital: ['New Delhi'], region: 'Asia', latlng: [20, 77], landlocked: false, area: 3287263, languages: { hin: 'Hindi' } }, { name: { common: 'Peru' }, cca3: 'PER', region: 'Americas' }, null]);
  assert.equal(filterCountries(countries, ' delhi ', 'Asia')[0].code, 'IND'); assert.equal(filterCountries(countries, '', 'Americas').length, 1); assert.equal(filterCountries(countries, 'nonsense', '').length, 0); assert.equal(countries.length, 2);
  assert.equal(countries[1].area, null); assert.equal(countries[0].latitude, 20);
});
test('hemisphere facts handle equator and prime meridian explicitly', () => {
  assert.match(hemisphere(0, 0), /Equator.*prime meridian/); assert.match(hemisphere(-20, -10), /Southern.*west/); assert.match(hemisphere(null, 0), /unavailable/);
});
test('curated landmarks have distinct identities, source records and valid coordinates', () => {
  assert.equal(new Set(landmarks.map(l => l.name)).size, landmarks.length);
  for (const l of landmarks) { assert.ok(Math.abs(l.latitude) <= 90 && Math.abs(l.longitude) <= 180); assert.match(l.source, /^https:\/\/whc\.unesco\.org\/en\/list\/\d+\/$/); assert.match(l.country, /^[A-Z]{3}$/); }
});
