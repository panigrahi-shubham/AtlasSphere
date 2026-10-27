import { test, expect } from '@playwright/test';
import { createApp } from '../../api/app.ts';
import type { Server } from 'node:http';
const enabled = Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
async function serve() {
  const app = createApp({ env: 'test', fixtures: true });
  const server = await new Promise<Server>(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  return { origin: `http://127.0.0.1:${(server.address() as any).port}`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
test('accounts, reset, favorites and trips isolate users', async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await serve();
  try {
    expect(await (await request.get(app.origin + '/api/v1/health/db')).json()).toEqual({ status: 'ok', db: 'ok' });
    const firstEmail = `skyatlas-${test.info().workerIndex}-${crypto.randomUUID()}@example.test`, secondEmail = `skyatlas-${crypto.randomUUID()}@example.test`;
    const pass = 'Strong!23';
    const register = async (email: string) => request.post(app.origin + '/api/v1/auth/register', { data: { email, password: pass } });
    const a = await register(firstEmail), b = await register(secondEmail);
    expect(a.status()).toBe(201); expect(b.status()).toBe(201);
    const at = (await a.json()).accessToken, bt = (await b.json()).accessToken;
    expect((await register(firstEmail)).status()).toBe(409);
    expect((await request.post(app.origin + '/api/v1/auth/register', { data: { email: 'bad', password: 'short' } })).status()).toBe(400);
    const headers = { authorization: `Bearer ${at}` };
    expect((await request.post(app.origin + '/api/v1/favorites', { headers, data: { name: 'Tokyo', latitude: 35.68, longitude: 139.69 } })).status()).toBe(201);
    expect((await (await request.get(app.origin + '/api/v1/favorites', { headers: { authorization: `Bearer ${bt}` } })).json()).favorites).toHaveLength(0);
    expect((await request.post(app.origin + '/api/v1/journeys/trips', { headers, data: { name: 'Bad', city: 'Tokyo', startDate: '2000-01-01', endDate: '2000-01-02' } })).status()).toBe(400);
    const date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0,10);
    const trip = await request.post(app.origin + '/api/v1/journeys/trips', { headers, data: { name: 'Japan', city: 'Tokyo', startDate: date, endDate: date } });
    expect(trip.status()).toBe(201);
    const id = (await trip.json()).trip.id;
    expect((await request.delete(app.origin + `/api/v1/journeys/trips/${id}`, { headers: { authorization: `Bearer ${bt}` } })).status()).toBe(404);
    expect((await request.post(app.origin + '/api/v1/auth/reset/request', { data: { email: firstEmail } })).status()).toBe(200);
    const code = (await (await request.get(app.origin + `/api/v1/test/inbox/${firstEmail}`)).json()).code;
    expect(code).toMatch(/^\d{6}$/);
    expect((await request.post(app.origin + '/api/v1/auth/reset/confirm', { data: { email: firstEmail, code, password: 'Newpass!23' } })).status()).toBe(204);
    expect((await request.post(app.origin + '/api/v1/auth/reset/confirm', { data: { email: firstEmail, code, password: 'Newpass!23' } })).status()).toBe(400);
  } finally { await app.close(); }
});

test('refresh rotation rejects replay and lockout blocks correct password', async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await serve();
  try {
    const email = `session-${crypto.randomUUID()}@example.test`, password = 'Strong!23';
    const registered = await request.post(app.origin + '/api/v1/auth/register', { data: { email, password } });
    expect(registered.status()).toBe(201);
    const oldCookie = registered.headers()['set-cookie'].split(';')[0];
    const refreshed = await request.post(app.origin + '/api/v1/auth/refresh', { headers: { cookie: oldCookie } });
    expect(refreshed.status()).toBe(200);
    const newCookie = refreshed.headers()['set-cookie'].split(';')[0];
    expect((await request.post(app.origin + '/api/v1/auth/refresh', { headers: { cookie: oldCookie } })).status()).toBe(401);
    expect((await request.post(app.origin + '/api/v1/auth/refresh', { headers: { cookie: newCookie } })).status()).toBe(401);
    for (let i = 0; i < 5; i++) expect((await request.post(app.origin + '/api/v1/auth/login', { data: { email, password: 'Wrong!23' } })).status()).toBe(401);
    expect((await request.post(app.origin + '/api/v1/auth/login', { data: { email, password } })).status()).toBe(401);
    expect((await request.post(app.origin + '/api/v1/auth/reset/request', { data: { email } })).status()).toBe(200);
    const code = (await (await request.get(app.origin + `/api/v1/test/inbox/${email}`)).json()).code;
    expect((await request.post(app.origin + '/api/v1/auth/reset/confirm', { data: { email, code, password } })).status()).toBe(204);
    expect((await request.post(app.origin + '/api/v1/auth/login', { data: { email, password } })).status()).toBe(200);
  } finally { await app.close(); }
});

test('favorites cap, alert deduplication and review ownership', async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await serve();
  try {
    const register = async () => (await (await request.post(app.origin + '/api/v1/auth/register', { data: { email: `ownership-${crypto.randomUUID()}@example.test`, password: 'Strong!23' } })).json()).accessToken;
    const first = { authorization: `Bearer ${await register()}` }, second = { authorization: `Bearer ${await register()}` };
    const places = Array.from({ length: 20 }, (_, i) => ({ name: `Place ${i}`, latitude: i, longitude: i }));
    expect((await request.post(app.origin + '/api/v1/favorites/sync', { headers: first, data: { favorites: places } })).status()).toBe(200);
    expect((await (await request.get(app.origin + '/api/v1/favorites', { headers: first })).json()).favorites).toHaveLength(20);
    expect((await request.post(app.origin + '/api/v1/favorites', { headers: first, data: { name: 'Extra', latitude: -1, longitude: 2 } })).status()).toBe(400);
    expect((await request.post(app.origin + '/api/v1/favorites/sync', { headers: first, data: { favorites: [{ name: 'Extra', latitude: -1, longitude: 2 }] } })).status()).toBe(200);
    expect((await (await request.get(app.origin + '/api/v1/favorites', { headers: first })).json()).favorites).toHaveLength(20);
    const alert = await request.post(app.origin + '/api/v1/journeys/alerts', { headers: first, data: { city: 'Tokyo', condition: 'temperature-above', threshold: 20 } });
    expect(alert.status()).toBe(201);
    expect((await (await request.post(app.origin + '/api/v1/journeys/alerts/evaluate', { headers: first, data: { temperature: 25, rainProbability: 0 } })).json()).created).toBe(1);
    expect((await (await request.post(app.origin + '/api/v1/journeys/alerts/evaluate', { headers: first, data: { temperature: 25, rainProbability: 0 } })).json()).created).toBe(0);
    const reviewLandmark = `test-${crypto.randomUUID()}`;
    expect((await request.put(app.origin + `/api/v1/journeys/reviews/${reviewLandmark}`, { headers: first, data: { rating: 5, body: 'Beautiful', image: 'data:image/png;base64,aW52YWxpZA==' } })).status()).toBe(400);
    expect((await request.put(app.origin + `/api/v1/journeys/reviews/${reviewLandmark}`, { headers: first, data: { rating: 5, body: 'Beautiful' } })).status()).toBe(200);
    expect((await request.delete(app.origin + `/api/v1/journeys/reviews/${reviewLandmark}`, { headers: second })).status()).toBe(404);
    expect((await (await request.get(app.origin + `/api/v1/journeys/reviews/${reviewLandmark}`)).json()).reviews).toHaveLength(1);
  } finally { await app.close(); }
});
