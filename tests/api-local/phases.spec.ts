import { test, expect } from '@playwright/test';
import { createApp } from '../../api/app.ts';
import type { Server } from 'node:http';
async function serve(env: string) {
  const app = createApp({ env, fixtures: true });
  const server = await new Promise<Server>(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  return { origin: `http://127.0.0.1:${(server.address() as any).port}`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
test('time-machine validates coordinates and supported historical dates', async ({ request }) => {
  const app = await serve('test');
  try {
    const endpoint = app.origin + '/api/v1/journeys/time-machine';
    expect((await request.get(`${endpoint}?date=1900-01-01&lat=2&lon=3`)).status()).toBe(400);
    expect((await request.get(`${endpoint}?date=2020-01-01&lat=999&lon=3`)).status()).toBe(400);
    const result = await request.get(`${endpoint}?date=1980-01-01&lat=27.175&lon=78.042`);
    expect(result.status()).toBe(200); expect((await result.json()).label).toBe('Real data');
  } finally { await app.close(); }
});
test('historical weather requires licensed credentials and keeps the key server-side', async ({ request }) => {
  const disabled = createApp({ env: 'production' });
  const noKeyServer = await new Promise<Server>(resolve => { const server = disabled.listen(0, '127.0.0.1', () => resolve(server)); });
  const noKeyOrigin = `http://127.0.0.1:${(noKeyServer.address() as any).port}`;
  try {
    const response = await request.get(`${noKeyOrigin}/api/v1/journeys/time-machine?date=1980-01-01&lat=27.175&lon=78.042`);
    expect(response.status()).toBe(503);
    expect((await response.json()).error.message).toContain('Professional');
  } finally { await new Promise<void>(resolve => noKeyServer.close(() => resolve())); }

  let upstreamUrl = '';
  const enabled = createApp({ env: 'production', historicalApiKey: 'server-only-test-key', fetcher: async (input) => {
    upstreamUrl = String(input);
    return new Response(JSON.stringify({ daily: { temperature_2m_max: [22], temperature_2m_min: [11] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } });
  const keyServer = await new Promise<Server>(resolve => { const server = enabled.listen(0, '127.0.0.1', () => resolve(server)); });
  try {
    const response = await request.get(`http://127.0.0.1:${(keyServer.address() as any).port}/api/v1/journeys/time-machine?date=1980-01-01&lat=27.175&lon=78.042`);
    expect(response.status()).toBe(200);
    expect(upstreamUrl).toContain('customer-archive-api.open-meteo.com');
    expect(upstreamUrl).toContain('apikey=server-only-test-key');
    expect(JSON.stringify(await response.json())).not.toContain('server-only-test-key');
  } finally { await new Promise<void>(resolve => keyServer.close(() => resolve())); }
});
test('test lab defects are isolated per request and failures recover', async ({ request }) => {
  const app = await serve('test');
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
  const app = await serve('production');
  try {
    expect((await request.get(app.origin + '/api/v1/test-lab/scenario')).status()).toBe(404);
    expect((await request.get(app.origin + '/api/v1/test/inbox/user@example.com')).status()).toBe(404);
    expect((await request.get(app.origin + '/test-lab')).status()).toBe(404);
    expect((await request.get(app.origin + '/test-lab.html')).status()).toBe(404);
  } finally { await app.close(); }
});
