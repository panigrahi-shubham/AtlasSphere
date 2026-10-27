import { test, expect } from '@playwright/test';
import { createApp, type ApiOptions } from '../../api/app.ts';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import type { Server } from 'node:http';
import { fetchNews, parseNews } from '../../scripts/fetch-news.ts';

async function serve(options: ApiOptions = {}) {
  const app = createApp({ env: 'test', fixtures: true, ...options });
  const server = await new Promise<Server>(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  return { app, base: `http://127.0.0.1:${(server.address() as { port: number }).port}`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
const weather = '/api/v1/weather?lat=19.99&lon=73.78';

test('example account credentials report unconfigured instead of querying a database', async ({ request }) => {
  const savedUrl = process.env.DATABASE_URL, savedSecret = process.env.AUTH_SECRET;
  process.env.DATABASE_URL = 'postgresql://example.invalid/skyatlas';
  process.env.AUTH_SECRET = 'replace-with-a-random-secret-of-at-least-32-characters';
  const server = await serve();
  try {
    const response = await request.get(server.base + '/api/v1/journeys/reviews/taj-mahal');
    expect(response.status()).toBe(503);
    expect((await response.json()).error.message).toBe('Account service is not configured.');
  } finally {
    await server.close();
    if (savedUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = savedUrl;
    if (savedSecret === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = savedSecret;
  }
});

test('configured Pages origin is accepted and other origins are rejected', async ({ request }) => {
  const previous = process.env.ALLOWED_ORIGINS;
  const previousDb = process.env.DATABASE_URL;
  const previousSecret = process.env.AUTH_SECRET;
  process.env.ALLOWED_ORIGINS = 'https://sky.pages.dev';
  process.env.DATABASE_URL = 'test-only';
  process.env.AUTH_SECRET = 'test-secret-for-origin-checks-at-least-32';
  const server = await serve();
  try {
    for (const path of ['/api/v1/auth/logout', '/api/v1/journeys/alerts']) {
      expect((await request.post(server.base + path, { headers: { origin: 'https://evil.example' } })).status()).toBe(403);
    }
    expect((await request.post(server.base + '/api/v1/journeys/alerts', { headers: { origin: 'https://sky.pages.dev' } })).status()).toBe(401);
  } finally {
    await server.close();
    if (previous === undefined) delete process.env.ALLOWED_ORIGINS; else process.env.ALLOWED_ORIGINS = previous;
    if (previousDb === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousDb;
    if (previousSecret === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = previousSecret;
  }
});

test('trusted proxy hop count separates client rate limits', async ({ request }) => {
  const previous = process.env.TRUST_PROXY_HOPS;
  const previousSecret = process.env.PROXY_SHARED_SECRET;
  process.env.TRUST_PROXY_HOPS = '2';
  process.env.PROXY_SHARED_SECRET = 'proxy-test-secret';
  const server = await serve({ rateLimit: 1 });
  server.app.get('/client-ip', (req, res) => res.json({ ip: req.ip }));
  try {
    const client = await request.get(server.base + '/client-ip', { headers: { 'x-forwarded-for': '203.0.113.10, 192.0.2.10', 'x-skyatlas-proxy-secret': 'proxy-test-secret' } });
    expect((await client.json()).ip).toBe('203.0.113.10');
    const path = server.base + '/api/v1/health';
    expect((await request.get(path, { headers: { 'x-forwarded-for': '203.0.113.10, 192.0.2.10', 'x-skyatlas-proxy-secret': 'proxy-test-secret' } })).status()).toBe(200);
    expect((await request.get(path, { headers: { 'x-forwarded-for': '203.0.113.11, 192.0.2.10', 'x-skyatlas-proxy-secret': 'proxy-test-secret' } })).status()).toBe(200);
    expect((await request.get(path, { headers: { 'x-forwarded-for': '203.0.113.10, 192.0.2.10', 'x-skyatlas-proxy-secret': 'proxy-test-secret' } })).status()).toBe(429);
    expect((await request.get(path, { headers: { 'x-forwarded-for': '203.0.113.12, 192.0.2.20' } })).status()).toBe(200);
    expect((await request.get(path, { headers: { 'x-forwarded-for': '203.0.113.13, 192.0.2.20' } })).status()).toBe(429);
  } finally { await server.close(); if (previous === undefined) delete process.env.TRUST_PROXY_HOPS; else process.env.TRUST_PROXY_HOPS = previous; if (previousSecret === undefined) delete process.env.PROXY_SHARED_SECRET; else process.env.PROXY_SHARED_SECRET = previousSecret; }
});

test('alert cron is hidden, authenticates, prevents overlap and limits calls', async ({ request }) => {
  const savedSecret = process.env.CRON_SECRET;
  let started!: () => void, finish!: () => void;
  const startSignal = new Promise<void>(resolve => { started = resolve; });
  const finishSignal = new Promise<void>(resolve => { finish = resolve; });
  delete process.env.CRON_SECRET;
  const server = await serve({ cronCheck: async () => { started(); await finishSignal; return { checked: 2, created: 1 }; } });
  try {
    const url = server.base + '/api/v1/internal/cron/alerts';
    expect((await request.post(url)).status()).toBe(404);
    process.env.CRON_SECRET = 'private-test-secret';
    expect((await request.post(url, { headers: { 'x-cron-secret': 'wrong' } })).status()).toBe(401);
    const first = request.post(url, { headers: { 'x-cron-secret': 'private-test-secret' } });
    await startSignal;
    expect((await request.post(url, { headers: { 'x-cron-secret': 'private-test-secret' } })).status()).toBe(409);
    finish();
    expect(await (await first).json()).toEqual({ checked: 2, created: 1 });
    expect((await request.post(url, { headers: { 'x-cron-secret': 'private-test-secret' } })).status()).toBe(429);
  } finally {
    finish(); await server.close();
    if (savedSecret === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = savedSecret;
  }
});

test('database health reports unavailable without exposing configuration', async ({ request }) => {
  const savedUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const server = await serve();
  try {
    const response = await request.get(server.base + '/api/v1/health/db');
    expect(await response.json()).toEqual({ status: 'ok', db: 'unavailable' });
    expect((await request.get(server.base + '/api/v1/health')).status()).toBe(200);
  } finally {
    await server.close();
    if (savedUrl !== undefined) process.env.DATABASE_URL = savedUrl;
  }
});

test('fixture endpoints, arrays, health and OpenAPI contract', async ({ request }) => {
  const server = await serve();
  try {
    const health = await request.get(server.base + '/api/v1/health');
    expect(health.status()).toBe(200); expect((await health.json()).status).toBe('ok');
    const started = performance.now();
    const first = await request.get(server.base + weather);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(first.status()).toBe(200); expect(first.headers()['x-cache']).toBe('MISS');
    const body = await first.json();
    expect(typeof body.timezone).toBe('string');
    expect(Number.isFinite(body.current.temperature_2m)).toBe(true);
    for (const key of ['temperature_2m','weather_code','precipitation_probability','wind_speed_10m','is_day']) expect(body.hourly[key].length).toBe(body.hourly.time.length);
    expect((await request.get(server.base + weather)).headers()['x-cache']).toBe('HIT');
    const daily = await (await request.get(server.base + weather + '&view=daily')).json();
    for (const key of ['temperature_2m_max','temperature_2m_min','precipitation_sum','weather_code']) expect(daily.daily[key].length).toBe(daily.daily.time.length);
    const geo = await request.get(server.base + '/api/v1/geocode?q=Nashik');
    expect(geo.headers()['x-cache']).toBe('MISS'); expect((await geo.json()).results[0].name).toBe('Nashik');
    expect((await request.get(server.base + '/api/v1/geocode?q=Nashik')).headers()['x-cache']).toBe('HIT');
    const news = await (await request.get(server.base + '/api/v1/news')).json();
    expect(Array.isArray(news.items)).toBe(true); expect(Number.isFinite(Date.parse(news.lastUpdated))).toBe(true);
    const spec = await (await request.get(server.base + '/openapi.json')).json();
    expect(spec.openapi).toBe('3.0.3');
    for (const route of ['/api/v1/health','/api/v1/weather','/api/v1/geocode','/api/v1/news']) expect(spec.paths[route].get.responses['200']).toBeDefined();
    const docs = await request.get(server.base + '/docs/'); expect(docs.status()).toBe(200); expect(await docs.text()).toContain('swagger-ui');
  } finally { await server.close(); }
});

test('validation, 404 and rate limit share the error contract', async ({ request }) => {
  const server = await serve({ rateLimit: 6 });
  try {
    for (const [route, field] of [['/api/v1/weather?lat=91&lon=0','lat'],['/api/v1/weather?lat=0&lon=181','lon'],['/api/v1/weather?lat=0&lon=0&units=kelvin','units'],['/api/v1/geocode?q=a','q']]) {
      const response = await request.get(server.base + route); expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: 'INVALID_INPUT', field, message: expect.any(String) } });
    }
    const missing = await request.get(server.base + '/api/v1/unknown'); expect(missing.status()).toBe(404); expect((await missing.json()).error.code).toBe('NOT_FOUND');
    await request.get(server.base + '/api/v1/health');
    const rate = await request.get(server.base + '/api/v1/health'); expect(rate.status()).toBe(429); expect(Number(rate.headers()['retry-after'])).toBeGreaterThan(0);
    expect((await rate.json()).error.code).toBe('RATE_LIMITED');
  } finally { await server.close(); }
});

test('upstream errors are 502 and aborted requests are 504', async ({ request }) => {
  const bad = await serve({ fixtures: false, fetcher: async () => new Response('', { status: 503 }) });
  try { const response = await request.get(bad.base + weather); expect(response.status()).toBe(502); expect((await response.json()).error.code).toBe('UPSTREAM_ERROR'); } finally { await bad.close(); }
  const slow = await serve({ fixtures: false, timeoutMs: 15, fetcher: (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))) as typeof fetch });
  try { const response = await request.get(slow.base + weather); expect(response.status()).toBe(504); expect((await response.json()).error.code).toBe('UPSTREAM_TIMEOUT'); } finally { await slow.close(); }
});

test('misaligned upstream arrays return 502 instead of a misleading forecast', async ({ request }) => {
  const server = await serve({ fixtures: false, fetcher: async () => new Response(JSON.stringify({ timezone: 'UTC', current: { temperature_2m: 20 }, current_units: {}, hourly: { time: [1, 2], temperature_2m: [20] } }), { status: 200, headers: { 'content-type': 'application/json' } }) });
  try { const response = await request.get(server.base + weather); expect(response.status()).toBe(502); expect((await response.json()).error.code).toBe('UPSTREAM_ERROR'); } finally { await server.close(); }
});

test('news accepts empty and stale snapshots and rejects unsafe links', async ({ request }) => {
  const directory = await mkdtemp(path.join(process.cwd(), 'test-results', 'skyatlas-news-'));
  const output = path.join(directory, 'news.json');
  await writeFile(output, JSON.stringify({ lastUpdated: '2000-01-01T00:00:00Z', items: [] }));
  const server = await serve({ newsPath: output });
  try {
    const empty = await (await request.get(server.base + '/api/v1/news')).json(); expect(empty.items).toEqual([]); expect(empty.lastUpdated).toBe('2000-01-01T00:00:00Z');
    await writeFile(output, JSON.stringify({ lastUpdated: '2000-01-01T00:00:00Z', items: [{ headline: 'Unsafe', snippet: '', source: 'X', publishedAt: '2000-01-01T00:00:00Z', url: 'javascript:alert(1)' }] }));
    const bad = await request.get(server.base + '/api/v1/news'); expect(bad.status()).toBe(502); expect((await bad.json()).error.code).toBe('INVALID_NEWS');
  } finally { await server.close(); }
});

test('production Express serves pages and never enables test fixtures', async ({ request }) => {
  const server = await serve({ env: 'production', fixtures: true, fetcher: async () => new Response('', { status: 503 }) });
  try {
    const home = await request.get(server.base + '/'); expect(home.status()).toBe(200); expect(await home.text()).toContain('SkyAtlas');
    const game = await request.get(server.base + '/geoguess'); expect(game.status()).toBe(200);
    const missing = await request.get(server.base + '/missing-page'); expect(missing.status()).toBe(404);
    const weatherResponse = await request.get(server.base + weather); expect(weatherResponse.status()).toBe(502);
  } finally { await server.close(); }
});

test('RSS filtering, truncation and feed failure preserve the last saved file', async () => {
  const xml = '<rss><channel><item><title>Monsoon forecast</title><description>' + 'Rain '.repeat(80) + '</description><link>https://www.metoffice.gov.uk/news/one</link><pubDate>Mon, 26 Oct 2026 10:00:00 GMT</pubDate></item><item><title>Sport</title><link>https://www.metoffice.gov.uk/news/two</link><pubDate>Mon, 26 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
  expect(parseNews(xml, 'Met Office')).toHaveLength(1);
  const directory = await mkdtemp(path.join(process.cwd(), 'test-results', 'skyatlas-rss-')); const output = path.join(directory, 'news.json');
  const data = await fetchNews({ feeds: ['https://www.metoffice.gov.uk/feed.xml'], fetcher: async () => new Response(xml, { status: 200 }), output });
  expect(data.items[0].snippet.length).toBeLessThanOrEqual(200); expect(data.items[0].source).toBe('www.metoffice.gov.uk');
  const prior = await readFile(output, 'utf8');
  await expect(fetchNews({ feeds: ['https://www.metoffice.gov.uk/feed.xml'], fetcher: async () => { throw new Error('offline'); }, output })).rejects.toThrow('All weather news feeds failed');
  expect(await readFile(output, 'utf8')).toBe(prior);
});
