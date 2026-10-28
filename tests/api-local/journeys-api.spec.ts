import { test, expect } from '@playwright/test';
import { createApp } from '../../api/app.ts';
import { startTestServer } from '../support/apiServer';
import type { Server } from 'node:http';
test('time-machine validates coordinates and supported historical dates', async ({ request }) => {
  const app = await startTestServer({ env: 'test' });
  try {
    const endpoint = app.origin + '/api/v1/journeys/time-machine';
    expect((await request.get(`${endpoint}?date=1900-01-01&lat=2&lon=3`)).status()).toBe(400);
    expect((await request.get(`${endpoint}?date=2020-01-01&lat=999&lon=3`)).status()).toBe(400);
    const result = await request.get(`${endpoint}?date=1980-01-01&lat=27.175&lon=78.042`);
    expect(result.status()).toBe(200); expect((await result.json()).label).toBe('Real data');
  } finally { await app.close(); }
});
test('historical weather uses free or customer archive and caches results', async ({ request }) => {
  for (const key of ['', 'server-only-test-key']) {
    const urls: string[] = [];
    const app = createApp({ env: 'production', historicalApiKey: key, fetcher: async input => {
      urls.push(String(input));
      return new Response(JSON.stringify({ daily: { temperature_2m_max: [22], temperature_2m_min: [11] } }), { status: 200 });
    } });
    const server = await new Promise<Server>(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
    try {
      const endpoint = `http://127.0.0.1:${(server.address() as any).port}/api/v1/journeys/time-machine?date=1980-01-01&lat=27.175&lon=78.042`;
      const response = await request.get(endpoint);
      expect(response.status()).toBe(200);
      expect(response.headers()['cache-control']).toBe('public, max-age=86400');
      expect(JSON.stringify(await response.json())).not.toContain('server-only-test-key');
      expect(new URL(urls[0]).hostname).toBe(key ? 'customer-archive-api.open-meteo.com' : 'archive-api.open-meteo.com');
      expect(new URL(urls[0]).searchParams.get('apikey')).toBe(key || null);
      expect((await request.get(endpoint)).status()).toBe(200);
      expect(urls).toHaveLength(1);
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  }
});
test('test lab defects are isolated per request and failures recover', async ({ request }) => {
  const app = await startTestServer({ env: 'test' });
  try {
    const endpoint = app.origin + '/api/v1/test-lab/scenario';
    const bad = await request.get(endpoint, { headers: { 'x-skyatlas-defects': 'wrong-units,missing-news,duplicate-favorite,day-offset' } });
    expect((await bad.json()).units).toBe('fahrenheit');
    const normal = await (await request.get(endpoint)).json();
    expect(normal).toMatchObject({ units: 'celsius', news: ['Sample headline'], forecastDay: 1, favorites: ['Tokyo'] });
    expect((await request.get(endpoint + '?failure=upstream-500')).status()).toBe(502);
    expect((await request.get(endpoint + '?failure=offline')).status()).toBe(503);
    expect((await request.get(endpoint + '?failure=malformed-json')).body()).toBeTruthy();
    expect((await request.get(endpoint + '?failure=delay')).status()).toBe(200);
    expect((await request.get(endpoint)).status()).toBe(200);
  } finally { await app.close(); }
});
test('production excludes lab, fake inbox and dev assets', async ({ request }) => {
  const app = await startTestServer({ env: 'production' });
  try {
    expect((await request.get(app.origin + '/api/v1/test-lab/scenario')).status()).toBe(404);
    expect((await request.get(app.origin + '/api/v1/test/inbox/user@example.com')).status()).toBe(404);
    expect((await request.get(app.origin + '/test-lab')).status()).toBe(404);
    expect((await request.get(app.origin + '/test-lab.html')).status()).toBe(404);
  } finally { await app.close(); }
});
