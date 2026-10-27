import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTemperature } from '../../src/utils/temperature.js';
import { locationKey, normalizeFavorites, readJSON, sameLocation, writeJSON } from '../../src/utils/storage.js';

test('formats Celsius/Fahrenheit from raw values without rounding before conversion', () => {
  assert.equal(formatTemperature(24.4, 'fahrenheit'), '76°F');
  assert.equal(formatTemperature(26.1, 'fahrenheit'), '79°F');
  assert.equal(formatTemperature(0, 'fahrenheit'), '32°F');
  assert.equal(formatTemperature(-40, 'fahrenheit'), '-40°F');
  assert.equal(formatTemperature(-40), '-40°C');
  assert.equal(formatTemperature(24.4), '24°C');
  for (const value of [null, undefined, NaN, '24', Infinity]) assert.equal(formatTemperature(value, 'fahrenheit'), 'Not available');
});

const paris = { id: '2988507', name: 'Paris', latitude: 48.85, longitude: 2.35, country: 'France' };
test('favorite identity distinguishes same-name locations and handles missing provider IDs', () => {
  const texas = { ...paris, id: '4717560', latitude: 33.66, longitude: -95.55, country: 'United States' };
  assert.notEqual(locationKey(paris), locationKey(texas));
  assert.equal(sameLocation(paris, texas), false);
  assert.equal(sameLocation(paris, { ...paris, id: null }), true);
  assert.equal(locationKey({ ...paris, id: null }), 'coordinates:48.85,2.35');
});

test('malformed favorites are filtered, duplicates removed and extra properties ignored', () => {
  const result = normalizeFavorites([paris, { ...paris }, null, { ...paris, latitude: 91 }, { id: 1, name: 'X', latitude: 0, longitude: 0, arbitrary: 'ignored' }]);
  assert.equal(result.cities.length, 2);
  assert.equal(result.invalid, true);
  assert.equal(Object.hasOwn(result.cities[1], 'arbitrary'), false);
  assert.equal(result.cities[1].elevation, null);
  assert.equal(normalizeFavorites({}).invalid, true);
});

test('storage handles malformed JSON, denied access and failed writes without throwing', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: () => '{broken', setItem: () => { throw new Error('quota'); }
    } });
    assert.equal(readJSON('key').status, 'invalid');
    assert.equal(writeJSON('key', []), false);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
    assert.equal(readJSON('key').status, 'unavailable');
    assert.equal(writeJSON('key', []), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
