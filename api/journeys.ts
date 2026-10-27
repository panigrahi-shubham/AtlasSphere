import express, { type Request, type Response } from 'express';
import { db } from './database.ts';
import { reserveOpenMeteoCall } from './providerBudget.ts';
const error = (res: Response, code: number, message: string) => res.status(code).json({ error: { message } });
const dateOnly = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const day = 86400000;
const today = () => new Date().toISOString().slice(0, 10);
const tokenId = (req: Request) => {
  // Token validation lives in features.ts; this router relies on the same export.
  return authenticate(req);
};
import { authenticate } from './features.ts';
function guard(req: Request, res: Response) { const id = tokenId(req); if (!id) error(res, 401, 'Sign in to continue.'); return id; }
function origin(req: Request) { try { return !req.headers.origin || new URL(req.headers.origin).host === req.get('host'); } catch { return false; } }
function tripInput(body: any) {
  if (typeof body?.name !== 'string' || !body.name.trim() || body.name.length > 100 || typeof body.city !== 'string' || !body.city.trim() || body.city.length > 100 || !dateOnly(body.startDate) || !dateOnly(body.endDate)) return null;
  const start = Date.parse(`${body.startDate}T00:00:00Z`), end = Date.parse(`${body.endDate}T00:00:00Z`);
  if (start < Date.parse(`${today()}T00:00:00Z`) || end < start || end - start >= 14 * day) return null;
  return { name: body.name.trim(), city: body.city.trim(), startDate: new Date(start), endDate: new Date(end) };
}
export function createJourneys(env: string, fetcher: typeof fetch = fetch, fixtures = false, historicalApiKey = process.env.OPEN_METEO_API_KEY) {
  const router = express.Router();
  const historicalCache = new Map<string, { date: string; label: string; kind: string; source: string; maximum: number; minimum: number; note: string }>();
  router.use(express.json({ limit: '3mb' }));
  router.use((req, res, next) => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !origin(req)) return error(res, 403, 'Request origin is not allowed.'); next(); });
  router.get('/time-machine', async (req, res) => {
    const date = req.query.date;
    const lat = Number(req.query.lat), lon = Number(req.query.lon);
    if (!dateOnly(date) || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || req.query.lat === undefined || req.query.lon === undefined) return error(res, 400, 'Enter a valid date and coordinates.');
    if (String(date) < '1940-01-01' || String(date) > new Date(Date.now() - 7 * day).toISOString().slice(0, 10)) return error(res, 400, 'Historical reanalysis is available from 1940 until seven days ago.');
    try {
      if (env === 'test' && fixtures) return res.json({ date, label: 'Real data', kind: 'Historical reanalysis', source: 'Open-Meteo ERA5', maximum: 21, minimum: 12, note: 'Modelled historical weather, not a direct station measurement.' });
      const cacheKey = `${date}:${lat.toFixed(2)}:${lon.toFixed(2)}`;
      const cached = historicalCache.get(cacheKey);
      if (cached) {
        historicalCache.delete(cacheKey); historicalCache.set(cacheKey, cached);
        return res.set('Cache-Control', 'public, max-age=86400').json(cached);
      }
      const query = new URLSearchParams({ latitude: String(lat), longitude: String(lon), start_date: date as string, end_date: date as string, daily: 'temperature_2m_max,temperature_2m_min', timezone: 'auto', models: 'era5' });
      if (historicalApiKey) query.set('apikey', historicalApiKey);
      if (!reserveOpenMeteoCall()) return error(res, 429, 'Weather provider usage limit reached. Try again later.');
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 5000);
      try {
        const host = historicalApiKey ? 'customer-archive-api.open-meteo.com' : 'archive-api.open-meteo.com';
        const result = await fetcher(`https://${host}/v1/archive?${query}`, { signal: controller.signal });
        if (!result.ok) throw new Error('Upstream failed');
        const json: any = await result.json();
        const maximum = json?.daily?.temperature_2m_max?.[0], minimum = json?.daily?.temperature_2m_min?.[0];
        if (!Number.isFinite(maximum) || !Number.isFinite(minimum)) throw new Error('Missing historical data');
        const data = { date: date as string, label: 'Real data', kind: 'Historical reanalysis', source: 'Open-Meteo ERA5', maximum, minimum, note: 'Modelled historical weather, not a direct station measurement.' };
        historicalCache.set(cacheKey, data);
        if (historicalCache.size > 2000) historicalCache.delete(historicalCache.keys().next().value!);
        res.set('Cache-Control', 'public, max-age=86400').json(data);
      } finally { clearTimeout(timer); }
    } catch { error(res, 502, 'Historical weather is unavailable.'); }
  });
  router.use((req, res, next) => { if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) return error(res, 503, 'Account service is not configured.'); next(); });
  router.get('/trips', async (req, res) => { const id = guard(req, res); if (id) res.json({ trips: await db.trip.findMany({ where: { userId: id }, orderBy: { startDate: 'asc' } }) }); });
  router.post('/trips', async (req, res) => {
    const id = guard(req, res); if (!id) return;
    const input = tripInput(req.body); if (!input) return error(res, 400, 'Trip needs a name, city and one to fourteen future days.');
    res.status(201).json({ trip: await db.trip.create({ data: { ...input, userId: id } }) });
  });
  router.put('/trips/:tripId', async (req, res) => {
    const id = guard(req, res); if (!id) return;
    const input = tripInput(req.body); if (!input) return error(res, 400, 'Invalid trip.');
    const updated = await db.trip.updateMany({ where: { id: req.params.tripId as string, userId: id }, data: input });
    if (!updated.count) return error(res, 404, 'Trip not found.');
    res.json({ trip: await db.trip.findFirst({ where: { id: req.params.tripId as string, userId: id } }) });
  });
  router.delete('/trips/:tripId', async (req, res) => { const id = guard(req, res); if (!id) return; const result = await db.trip.deleteMany({ where: { id: req.params.tripId as string, userId: id } }); if (!result.count) return error(res, 404, 'Trip not found.'); res.status(204).end(); });
  router.get('/alerts', async (req, res) => { const id = guard(req, res); if (id) res.json({ alerts: await db.weatherAlert.findMany({ where: { userId: id } }), notifications: await db.notification.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 30 }) }); });
  function alertInput(body: any) {
    if (typeof body?.city !== 'string' || !body.city.trim() || body.city.length > 100 || !['temperature-above', 'temperature-below', 'rain-probability-above'].includes(body.condition) || !Number.isFinite(body.threshold) || body.threshold < -100 || body.threshold > 100) return null;
    return { city: body.city.trim(), condition: body.condition as string, threshold: body.threshold as number };
  }
  router.post('/alerts', async (req, res) => { const id = guard(req, res); if (!id) return; const input = alertInput(req.body); if (!input) return error(res, 400, 'Invalid alert.'); res.status(201).json({ alert: await db.weatherAlert.create({ data: { ...input, userId: id } }) }); });
  router.put('/alerts/:alertId', async (req, res) => { const id = guard(req, res); if (!id) return; const input = alertInput(req.body); if (!input) return error(res, 400, 'Invalid alert.'); const updated = await db.weatherAlert.updateMany({ where: { id: req.params.alertId as string, userId: id }, data: input }); if (!updated.count) return error(res, 404, 'Alert not found.'); res.json({ alert: await db.weatherAlert.findFirst({ where: { id: req.params.alertId as string, userId: id } }) }); });
  router.delete('/alerts/:alertId', async (req, res) => { const id = guard(req, res); if (!id) return; const result = await db.weatherAlert.deleteMany({ where: { id: req.params.alertId as string, userId: id } }); if (!result.count) return error(res, 404, 'Alert not found.'); res.status(204).end(); });
  router.post('/alerts/evaluate', async (req, res) => {
    const id = guard(req, res); if (!id) return;
    if (env !== 'test') return error(res, 404, 'Test evaluation is unavailable.');
    const temperature = req.body?.temperature, rainProbability = req.body?.rainProbability;
    if (!Number.isFinite(temperature) || !Number.isFinite(rainProbability)) return error(res, 400, 'Invalid fixture.');
    const alerts = await db.weatherAlert.findMany({ where: { userId: id } });
    let created = 0;
    for (const alert of alerts) {
      const match = alert.condition === 'temperature-above' ? temperature > alert.threshold : alert.condition === 'temperature-below' ? temperature < alert.threshold : rainProbability > alert.threshold;
      if (match && (!alert.lastSentAt || Date.now() - alert.lastSentAt.getTime() > day)) {
        await db.$transaction([db.notification.create({ data: { userId: id, message: `${alert.city}: ${alert.condition} ${alert.threshold}` } }), db.weatherAlert.update({ where: { id: alert.id }, data: { lastSentAt: new Date() } })]); created++;
      }
    }
    res.json({ created });
  });
  router.get('/reviews/:landmarkId', async (req, res) => {
    const landmarkId = String(req.params.landmarkId || '').slice(0, 100);
    const reviews = await db.review.findMany({ where: { landmarkId }, orderBy: { createdAt: 'desc' }, select: { id: true, userId: true, rating: true, body: true, createdAt: true, imageType: true } });
    res.json({ reviews: reviews.map(review => ({ ...review, imageUrl: review.imageType ? `/api/v1/journeys/reviews/image/${review.id}` : null })) });
  });
  router.put('/reviews/:landmarkId', async (req, res) => {
    const id = guard(req, res); if (!id) return;
    const landmarkId = req.params.landmarkId as string, rating = req.body?.rating, body = req.body?.body;
    if (!/^[a-z0-9-]{1,100}$/.test(landmarkId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || typeof body !== 'string' || body.length > 500) return error(res, 400, 'Invalid review.');
    let imageData: Uint8Array<ArrayBuffer> | null = null, imageType: string | null = null;
    if (req.body?.image) {
      if (typeof req.body.image !== 'string' || req.body.image.length > 2800000) return error(res, 400, 'Image is too large.');
      const match = /^data:image\/(png|jpeg);base64,([a-zA-Z0-9+/=]+)$/.exec(req.body.image);
      if (!match) return error(res, 400, 'Only JPG and PNG are supported.');
      imageData = Uint8Array.from(Buffer.from(match[2], 'base64')); imageType = match[1] === 'png' ? 'image/png' : 'image/jpeg';
      if (imageData.length > 2 * 1024 * 1024 || !(imageType === 'image/png' ? Buffer.from(imageData).subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : Buffer.from(imageData).subarray(0, 3).equals(Buffer.from([255,216,255])))) return error(res, 400, 'Invalid image content or size.');
    }
    const review = await db.review.upsert({ where: { userId_landmarkId: { userId: id, landmarkId } }, create: { userId: id, landmarkId, rating, body, imageData, imageType }, update: { rating, body, imageData, imageType } });
    res.json({ review: { id: review.id, rating: review.rating, body: review.body } });
  });
  router.delete('/reviews/:landmarkId', async (req, res) => { const id = guard(req, res); if (!id) return; const result = await db.review.deleteMany({ where: { userId: id, landmarkId: req.params.landmarkId as string } }); if (!result.count) return error(res, 404, 'Review not found.'); res.status(204).end(); });
  router.get('/reviews/image/:reviewId', async (req, res) => { const review = await db.review.findUnique({ where: { id: req.params.reviewId as string } }); if (!review?.imageData || !review.imageType) return error(res, 404, 'Image not found.'); res.set('X-Content-Type-Options', 'nosniff').type(review.imageType).send(Buffer.from(review.imageData)); });
  return router;
}
