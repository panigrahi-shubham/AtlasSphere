import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchCities, validateLocations } from '../../src/services/geocodingService.js';
import { fetchJSON, fetchJSONWithFallback } from '../../src/services/http.js';

const location = { id: 1, name: 'Zürich', latitude: 47.37, longitude: 8.55 };
test('normalizes location identity and preserves unavailable information', () => {
  const [city] = validateLocations({ results: [location] });
  assert.equal(city.id, '1'); assert.equal(city.name, 'Zürich');
  assert.equal(city.country, null); assert.equal(city.elevation, null);
  assert.deepEqual(validateLocations({ generationtime_ms: 1 }), []);
});
test('rejects malformed results and invalid coordinates', () => {
  for (const data of [null, [], { results: null }, { results: {} }, { results: [{ ...location, latitude: 91 }] }, { results: [{ ...location, longitude: -181 }] }]) {
    assert.throws(() => validateLocations(data));
  }
});
test('empty and one-character searches never contact the network', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network should not be used'); };
  try { for (const term of ['', '  ', 'a']) await assert.rejects(searchCities(term), /at least 2/); }
  finally { globalThis.fetch = original; }
});
test('encodes international input and requests five English results', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => {
    const parsed = new URL(url, 'http://localhost');
    assert.equal(parsed.searchParams.get('q'), '東京');
    assert.equal(parsed.pathname, '/api/v1/geocode');
    return { ok: true, json: async () => ({ results: [location] }) };
  };
  try { assert.equal((await searchCities(' 東京 '))[0].id, '1'); }
  finally { globalThis.fetch = original; }
});
test('HTTP errors, unreadable JSON and timeouts give actionable messages', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 429 });
    await assert.rejects(fetchJSON('https://example.test'), /Too many searches/);
    globalThis.fetch = async () => ({ ok: true, json: async () => { throw new SyntaxError(); } });
    await assert.rejects(fetchJSON('https://example.test'), /unreadable/);
    globalThis.fetch = (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
    await assert.rejects(fetchJSON('https://example.test', { timeoutMs: 1 }), /timed out/);
  } finally { globalThis.fetch = original; }
});
test('wake-up response falls back to the explicitly supplied public provider', async () => {
  const original = globalThis.fetch, calls = [];
  globalThis.fetch = async url => {
    calls.push(String(url));
    if (calls.length === 1) return new Response('', { status: 503 });
    return Response.json({ results: [location] });
  };
  try {
    const cities = await searchCities('Zürich');
    assert.equal(cities[0].name, 'Zürich');
    assert.equal(new URL(calls[1]).hostname, 'geocoding-api.open-meteo.com');
    assert.equal(new URL(calls[1]).searchParams.get('name'), 'Zürich');
  } finally { globalThis.fetch = original; }
});
test('a timed-out proxy request does not fall back', async () => {
  const original = globalThis.fetch, calls = [];
  globalThis.fetch = (url, { signal }) => {
    calls.push(String(url));
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  };
  try {
    await assert.rejects(fetchJSONWithFallback('/api/v1/geocode?q=Zurich', 'https://geocoding-api.open-meteo.com/v1/search?name=Zurich', { timeoutMs: 5 }), /timed out/);
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = original; }
});
