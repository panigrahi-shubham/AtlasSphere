/**
 * Feature: favorite View
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in favorite view; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { favoriteView } from '../../src/utils/favoriteView.js';
import { BUG_MODE, bugEnabled, practiceStorageKey } from '../../src/dev/bugMode.js';
const cities = [{ name: 'Tokyo', country: 'Japan' }, { name: 'Zürich', country: 'Switzerland' }, { name: 'Nashik', country: 'India' }];
// Risk: Filtering could hide valid accented names or delete saved places.
// Given names and countries, When filter text varies, Then matching is accent-insensitive and empty results are explicit.
test('favorite filtering supports accents, countries and empty/no-match queries', () => {
  assert.equal(favoriteView(cities, 'zurich')[0].name, 'Zürich');
  assert.equal(favoriteView(cities, ' JAPAN ')[0].name, 'Tokyo');
  assert.equal(favoriteView(cities, '').length, 3); assert.equal(favoriteView(cities, 'unknown').length, 0);
});
// Risk: Sorting a view could rewrite the saved order.
// Given persisted favorites, When another sort is requested, Then the original array is unchanged.
test('favorite sorting never mutates persistent saved order', () => {
  assert.deepEqual(favoriteView(cities, '', 'name-asc').map(city => city.name), ['Nashik', 'Tokyo', 'Zürich']);
  assert.deepEqual(favoriteView(cities, '', 'name-desc').map(city => city.name), ['Zürich', 'Tokyo', 'Nashik']);
  assert.deepEqual(cities.map(city => city.name), ['Tokyo', 'Zürich', 'Nashik']);
});
// Risk: Practice defects could affect ordinary or production use.
// Given a non-development execution context, When defect state is read, Then practice flags remain off.
test('practice defects are off outside a Vite development browser', () => {
  assert.equal(BUG_MODE, false); assert.equal(bugEnabled('TEMP-001'), false); assert.equal(practiceStorageKey('key'), 'key');
});
