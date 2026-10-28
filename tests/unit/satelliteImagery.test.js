/**
 * Feature: satellite Imagery
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in satellite imagery; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SATELLITE_LAYERS, buildSatelliteImageryURL, satelliteDateBounds } from '../../src/services/satelliteImagery.ts';

const now = new Date('2026-10-27T12:00:00Z');
test('satellite URL uses the allowlisted NASA layer and WMS latitude-longitude order', () => {
  const url = new URL(buildSatelliteImageryURL({ latitude: 10, longitude: 100, date: '2024-01-01' }, now));
  assert.equal(url.origin, 'https://gibs.earthdata.nasa.gov');
  assert.equal(url.pathname, '/wms/epsg4326/best/wms.cgi');
  for (const [key, value] of Object.entries({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.3.0', LAYERS: SATELLITE_LAYERS[0].id, CRS: 'EPSG:4326', BBOX: '7,96,13,104', WIDTH: '800', HEIGHT: '600', FORMAT: 'image/jpeg', TIME: '2024-01-01' })) assert.equal(url.searchParams.get(key), value);
});
test('satellite bounding boxes are clamped at the poles and date line', () => {
  for (const [latitude, longitude, expected] of [[90, 180, '87,176,90,180'], [-90, -180, '-90,-180,-87,-176']]) {
    const url = new URL(buildSatelliteImageryURL({ latitude, longitude, date: '2024-01-01' }, now));
    assert.equal(url.searchParams.get('BBOX'), expected);
  }
});
test('satellite dates use UTC bounds and reject unsupported, malformed and future days', () => {
  assert.deepEqual(satelliteDateBounds(now), { minimum: '2000-02-24', maximum: '2026-10-27', defaultDate: '2026-10-20' });
  assert.doesNotThrow(() => buildSatelliteImageryURL({ latitude: 1, longitude: 2, date: '2000-02-24' }, now));
  assert.doesNotThrow(() => buildSatelliteImageryURL({ latitude: 1, longitude: 2, date: '2026-10-27' }, now));
  for (const date of ['1999-01-01', '2000-02-23']) assert.throws(() => buildSatelliteImageryURL({ latitude: 1, longitude: 2, date }, now), /starts on 2000-02-24/);
  for (const date of ['', '2024-02-30', '2024-1-01', '2024-01-01T00:00:00Z']) assert.throws(() => buildSatelliteImageryURL({ latitude: 1, longitude: 2, date }, now), /valid satellite date/);
  assert.throws(() => buildSatelliteImageryURL({ latitude: 1, longitude: 2, date: '2026-10-28' }, now), /on or before 2026-10-27/);
});
test('satellite URL rejects unknown layers and invalid coordinates', () => {
  assert.throws(() => buildSatelliteImageryURL({ latitude: 1, longitude: 2, date: '2024-01-01', layerId: 'untrusted-layer' }, now), /Unsupported/);
  for (const [latitude, longitude] of [[91, 0], [0, 181], [NaN, 1], [1, Infinity], ['10', 1]]) assert.throws(() => buildSatelliteImageryURL({ latitude, longitude, date: '2024-01-01' }, now), /valid latitude and longitude/);
});
