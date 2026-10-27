import express, { type Request, type Response } from 'express';
import { createFeatures } from './features.ts';
import { createJourneys } from './journeys.ts';
import { createTestLab } from './testLab.ts';
import { reserveOpenMeteoCall } from './providerBudget.ts';
import swaggerUi from 'swagger-ui-express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db, waitForDatabaseWarmup } from './database.ts';
import { checkAlerts, alertsRunning } from './alertWorker.ts';
import { timingSafeEqual } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = (name: string) => path.join(root, name);
const current = 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day';
const hourly = 'temperature_2m,weather_code,precipitation_probability,wind_speed_10m,is_day';
const daily = 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset,weather_code';
type ErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'UPSTREAM_TIMEOUT' | 'INVALID_NEWS';
type Cached = { data: unknown; expires: number };
export type ApiOptions = { env?: string; fixtures?: boolean; fetcher?: typeof fetch; now?: () => number; newsPath?: string; rateLimit?: number; timeoutMs?: number; historicalApiKey?: string; cronCheck?: () => Promise<{ checked: number; created: number }> };

export function createApp(options: ApiOptions = {}) {
  const app = express();
  const env = options.env ?? process.env.APP_ENV ?? 'development';
  const fixtureMode = env === 'test' && (options.fixtures ?? process.env.FIXTURES === '1');
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const cache = new Map<string, Cached>();
  const requests = new Map<string, { start: number; count: number }>();
  const limit = options.rateLimit ?? 60;
  const timeoutMs = options.timeoutMs ?? 5000;
  const newsPath = options.newsPath ?? file('api/news.json');
  let cronRunning = false;
  let lastCronRun = -Infinity;
  function fail(res: Response, status: number, code: ErrorCode, message: string, field?: string) {
    return res.status(status).json({ error: { code, message, ...(field ? { field } : {}) } });
  }
  app.disable('x-powered-by');
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  app.set('trust proxy', Number.isInteger(hops) && hops >= 0 && hops <= 10 ? hops : 1);
  app.use((req, _res, next) => {
    if (hops > 1) {
      const expected = process.env.PROXY_SHARED_SECRET || '';
      const supplied = Buffer.from(req.get('x-skyatlas-proxy-secret') || ''), required = Buffer.from(expected);
      const verified = required.length > 0 && supplied.length === required.length && timingSafeEqual(supplied, required);
      if (!verified && req.headers['x-forwarded-for']) {
        const forwarded = String(req.headers['x-forwarded-for']).split(',');
        req.headers['x-forwarded-for'] = forwarded[forwarded.length - 1].trim();
      }
    }
    delete req.headers['x-skyatlas-proxy-secret'];
    next();
  });
  app.use('/api/v1', (req, res, next) => {
    const key = req.ip ?? 'unknown';
    const existing = requests.get(key);
    const bucket = !existing || now() - existing.start >= 60000 ? { start: now(), count: 0 } : existing;
    bucket.count++; requests.set(key, bucket);
    if (bucket.count > limit) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((60000 - (now() - bucket.start)) / 1000))));
      fail(res, 429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.'); return;
    }
    next();
  });
  function param(req: Request, key: string) { return typeof req.query[key] === 'string' ? req.query[key] as string : ''; }
  function coordinate(req: Request, res: Response, key: 'lat' | 'lon', max: number) {
    const raw = param(req, key);
    if (!raw || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(raw) || !Number.isFinite(Number(raw)) || Math.abs(Number(raw)) > max) {
      fail(res, 400, 'INVALID_INPUT', `${key} must be between -${max} and ${max}.`, key); return null;
    }
    return Number(raw);
  }
  async function upstream(res: Response, key: string, ttl: number, url: URL, fixture: string) {
    const cached = cache.get(key);
    if (cached && cached.expires > now()) { res.setHeader('X-Cache', 'HIT'); res.json(cached.data); return; }
    res.setHeader('X-Cache', 'MISS');
    let providerStatus: number | undefined;
    try {
      let data: unknown;
      if (fixtureMode) data = JSON.parse(await readFile(file(`tests/fixtures/${fixture}`), 'utf8'));
      else {
        if (!reserveOpenMeteoCall()) return fail(res, 429, 'RATE_LIMITED', 'Weather provider usage limit reached. Try again later.');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetcher(url, { signal: controller.signal });
          providerStatus = response.status;
          if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
          data = await response.json();
        } finally { clearTimeout(timer); }
      }
      if (!data || typeof data !== 'object' || (data as { error?: boolean }).error) throw new Error('Invalid upstream response');
      const raw = data as Record<string, any>;
      if (fixture === 'api-geocode.json') {
        if (raw.results !== undefined && (!Array.isArray(raw.results) || !raw.results.every((city: any) => typeof city.name === 'string' && Number.isFinite(city.latitude) && Number.isFinite(city.longitude)))) throw new Error('Invalid geocode response');
      } else {
        const section = fixture === 'api-daily.json' ? 'daily' : 'hourly';
        const times = raw[section]?.time;
        if (typeof raw.timezone !== 'string' || !Array.isArray(times) || !times.length) throw new Error('Invalid weather response');
        for (const [name, values] of Object.entries(raw[section])) if (!Array.isArray(values) || values.length !== times.length) throw new Error(`Invalid ${name} array`);
        if (section === 'hourly' && (!Number.isFinite(raw.current?.temperature_2m) || !raw.current_units)) throw new Error('Invalid current weather');
      }
      cache.set(key, { data, expires: now() + ttl }); res.json(data);
    } catch (error) {
      const timeout = error instanceof Error && error.name === 'AbortError';
      if (!fixtureMode) console.error('Weather upstream failure', { hostname: url.hostname, status: providerStatus ?? null, message: timeout ? 'Request timed out' : providerStatus !== undefined ? `HTTP ${providerStatus}` : 'Provider connection or response failed' });
      fail(res, timeout ? 504 : 502, timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR', timeout ? 'Weather provider timed out.' : 'Weather provider is unavailable.');
    }
  }
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', service: 'skyatlas-api', time: new Date(now()).toISOString() }));
  app.get('/api/v1/health/db', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!process.env.DATABASE_URL) throw new Error('Database unavailable');
      await Promise.race([db.$queryRaw`SELECT 1`, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Timeout')), 3000); })]);
      res.json({ status: 'ok', db: 'ok' });
    } catch { res.json({ status: 'ok', db: 'unavailable' }); }
    finally { if (timer) clearTimeout(timer); }
  });
  app.post('/api/v1/internal/cron/alerts', async (req, res) => {
    const expected = process.env.CRON_SECRET;
    if (!expected) return res.status(404).json({ error: { message: 'API route not found.' } });
    const supplied = Buffer.from(req.get('x-cron-secret') || ''), required = Buffer.from(expected);
    if (supplied.length !== required.length || !timingSafeEqual(supplied, required)) return res.status(401).json({ error: { message: 'Unauthorized.' } });
    if (cronRunning || alertsRunning()) return res.status(409).json({ error: { message: 'Alert check already running.' } });
    if (now() - lastCronRun < 60000) return res.status(429).json({ error: { message: 'Try again later.' } });
    if (!process.env.DATABASE_URL && !options.cronCheck) return res.status(503).json({ error: { message: 'Account service is not configured.' } });
    lastCronRun = now(); cronRunning = true;
    try { return res.json(await (options.cronCheck ?? checkAlerts)()); }
    catch { return res.status(503).json({ error: { message: 'Alert check unavailable.' } }); }
    finally { cronRunning = false; }
  });
  app.get('/api/v1/weather', async (req, res) => {
    const lat = coordinate(req, res, 'lat', 90); if (lat === null) return;
    const lon = coordinate(req, res, 'lon', 180); if (lon === null) return;
    const units = param(req, 'units') || 'celsius';
    if (!['celsius', 'fahrenheit'].includes(units)) return void fail(res, 400, 'INVALID_INPUT', 'units must be celsius or fahrenheit.', 'units');
    const view = param(req, 'view') || 'current';
    if (!['current', 'daily'].includes(view)) return void fail(res, 400, 'INVALID_INPUT', 'view must be current or daily.', 'view');
    const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), timezone: 'auto', timeformat: 'unixtime', temperature_unit: units, wind_speed_unit: 'kmh', precipitation_unit: 'mm' });
    if (view === 'daily') { params.set('daily', daily); params.set('forecast_days', '7'); }
    else { params.set('current', current); params.set('hourly', hourly); params.set('forecast_hours', '48'); }
    await upstream(res, `weather:${params}`, 600000, new URL(`https://api.open-meteo.com/v1/forecast?${params}`), view === 'daily' ? 'api-daily.json' : 'api-weather.json');
  });
  app.get('/api/v1/geocode', async (req, res) => {
    const q = param(req, 'q').trim();
    if (Array.from(q).length < 2 || Array.from(q).length > 80) return void fail(res, 400, 'INVALID_INPUT', 'q must contain 2 to 80 characters.', 'q');
    const countryCode = param(req, 'countryCode');
    if (countryCode && !/^[A-Za-z]{2}$/.test(countryCode)) return void fail(res, 400, 'INVALID_INPUT', 'countryCode must contain two letters.', 'countryCode');
    const params = new URLSearchParams({ name: q, count: '5', language: 'en', format: 'json' });
    if (countryCode) params.set('countryCode', countryCode.toUpperCase());
    await upstream(res, `geocode:${params}`, 86400000, new URL(`https://geocoding-api.open-meteo.com/v1/search?${params}`), 'api-geocode.json');
  });
  app.get('/api/v1/news', async (_req, res) => {
    try {
      const data = JSON.parse(await readFile(newsPath, 'utf8'));
      if (!Array.isArray(data.items) || !Number.isFinite(Date.parse(data.lastUpdated)) || !data.items.every((item: any) => {
        try { return ['headline', 'snippet', 'source', 'url', 'publishedAt'].every(key => typeof item[key] === 'string') && item.snippet.length <= 200 && new URL(item.url).protocol === 'https:' && Number.isFinite(Date.parse(item.publishedAt)); } catch { return false; }
      })) throw new Error('Invalid news file');
      res.json(data);
    } catch { fail(res, 502, 'INVALID_NEWS', 'News is unavailable.'); }
  });
  if (env === 'test' || env === 'development') {
    app.use('/api/v1/test-lab', createTestLab(env));
    app.get('/test-lab', (_req, res) => res.sendFile(file('test-lab.html')));
  }
  app.use('/api/v1', (req, _res, next) => {
    if (/^\/(auth|account|favorites)(\/|$)/.test(req.path) || (/^\/journeys\//.test(req.path) && req.path !== '/journeys/time-machine')) {
      void waitForDatabaseWarmup().then(() => next()); return;
    }
    next();
  });
  app.use('/api/v1', express.json({ limit: '3mb' }), createFeatures(env));
  app.use('/api/v1/journeys', createJourneys(env, fetcher, fixtureMode, options.historicalApiKey ?? process.env.OPEN_METEO_API_KEY));
  app.get('/api/v1/{*path}', (_req, res) => { fail(res, 404, 'NOT_FOUND', 'API route not found.'); });
  app.get('/api/v1', (_req, res) => { fail(res, 404, 'NOT_FOUND', 'API route not found.'); });
  app.get('/openapi.json', async (_req, res) => res.type('json').send(await readFile(file('api/openapi.json'))));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerOptions: { url: '/openapi.json' } }));
  if (env === 'production') {
    const dist = file('dist'); app.use(express.static(dist));
    app.get('/journeys', (_req, res) => res.sendFile(path.join(dist, 'journeys.html')));
    app.get('/geoguess', (_req, res) => res.sendFile(path.join(dist, 'geoguess.html')));
    app.get('/{*path}', (_req, res) => res.status(404).sendFile(path.join(dist, '404.html')));
  }
  return app;
}


