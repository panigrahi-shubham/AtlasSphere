/**
 * Feature: Account security and persistence
 * Layer: API integration — Playwright
 * Real: Express API and configured PostgreSQL persistence
 * Mocked: Upstream responses or injected dependencies where supplied by the scenario
 * Guards: Regressions in account security and persistence; negative cases remain explicit below
 * Run: npm run test:accounts:local
 * Needs: Isolated DATABASE_URL and AUTH_SECRET, or the disposable local PostgreSQL wrapper
 */
import { test, expect } from '@playwright/test';
import { startTestServer } from '../support/apiServer';
import { databaseEnabled, createTestUser, deleteTestUser, testUserEmail } from '../support/database';
import { db } from '../../api/database.ts';
import { checkAlerts } from '../../api/alertWorker.ts';
import { proxy } from '../../shared/pagesProxy.ts';
const enabled = databaseEnabled;
// Risk: Alert polling could create duplicate notifications.
// Given one matching rule, When checks run twice, Then PostgreSQL contains one notification.
test('alert worker persists and deduplicates matching notifications in PostgreSQL', { tag: ['@db'] }, async ({}, testInfo) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const user = await createTestUser(testInfo, 'not-a-login');
  try {
    await db.weatherAlert.create({ data: { userId: user.id, city: 'Delhi', condition: 'temperature-above', threshold: 20 } });
    const database = { weatherAlert: { findMany: () => db.weatherAlert.findMany({ where: { userId: user.id } }) }, $transaction: (callback: any) => db.$transaction(callback) } as unknown as typeof db;
    const fetcher: typeof fetch = async input => String(input).includes('geocoding-api')
      ? Response.json({ results: [{ latitude: 28.6, longitude: 77.2 }] })
      : Response.json({ current: { temperature_2m: 25 }, hourly: { precipitation_probability: [0] } });
    const now = () => Date.UTC(2026, 9, 27);
    expect(await checkAlerts(fetcher, now, () => true, database)).toEqual({ checked: 1, created: 1 });
    expect(await checkAlerts(fetcher, now, () => true, database)).toEqual({ checked: 1, created: 0 });
    expect(await db.notification.count({ where: { userId: user.id } })).toBe(1);
  } finally { await deleteTestUser(user.id); }
});
// Risk: A waking proxy could replay an uncertain mutation.
// Given a delayed backend, When readiness and saves recover, Then refresh succeeds and one record is created.
test('Pages readiness retries preserve sessions and uncertain saves create one record', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const previousOrigin = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = 'https://sky.pages.dev';
  const app = await startTestServer();
  let token = '';
  const password = 'Strong!23';
  try {
    const registered = await request.post(app.origin + '/api/v1/auth/register', { data: { email: testUserEmail(test.info()), password } });
    expect(registered.status()).toBe(201);
    const account = await registered.json(); token = account.accessToken;
    const cookie = registered.headers()['set-cookie'].split(';')[0];
    let ready = false, mutations = 0;
    const fetcher: typeof fetch = async input => {
      const forwarded = input as Request;
      if (!ready && new URL(forwarded.url).pathname === '/api/v1/health/db') return Response.json({ status: 'ok', db: 'unavailable' });
      if (forwarded.method !== 'GET') mutations++;
      const url = new URL(forwarded.url);
      return fetch(new Request(app.origin + url.pathname + url.search, forwarded));
    };
    const refresh = () => proxy({ request: new Request('https://sky.pages.dev/api/v1/auth/refresh', { method: 'POST', headers: { cookie, origin: 'https://sky.pages.dev' } }), env: { API_ORIGIN: 'https://api.example.test' } }, fetcher);
    const waking = await refresh();
    expect(waking.status).toBe(503); expect(waking.headers.get('X-SkyAtlas-Retry-Safe')).toBe('1'); expect(mutations).toBe(0);
    ready = true;
    const refreshed = await refresh();
    expect(refreshed.status).toBe(200); expect(refreshed.headers.get('set-cookie')).toContain('skyatlas_refresh=');
    token = (await refreshed.json()).accessToken;
    expect(mutations).toBe(1);
    const save = await proxy({ request: new Request('https://sky.pages.dev/api/v1/journeys/alerts', { method: 'POST', headers: { authorization: `Bearer ${token}`, origin: 'https://sky.pages.dev', 'content-type': 'application/json' }, body: JSON.stringify({ city: 'Delhi', condition: 'temperature-above', threshold: 30 }) }), env: { API_ORIGIN: 'https://api.example.test' } }, async input => {
      const response = await fetcher(input);
      if ((input as Request).method === 'POST') { expect(response.status).toBe(201); throw new Error('Response lost after save'); }
      return response;
    });
    expect(save.status).toBe(503); expect(save.headers.get('X-SkyAtlas-Retry-Safe')).toBe('0');
    expect(await db.weatherAlert.count({ where: { userId: account.user.id } })).toBe(1);
  } finally {
    if (token) await request.delete(app.origin + '/api/v1/account', { headers: { authorization: `Bearer ${token}` }, data: { password } });
    await app.close();
    if (previousOrigin === undefined) delete process.env.ALLOWED_ORIGINS; else process.env.ALLOWED_ORIGINS = previousOrigin;
  }
});
// Risk: Private account data could survive deletion or leak through public output.
// Given an authenticated account, When profile, export and deletion are exercised, Then private data remains protected.
test('profile, export and account deletion protect private data', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await startTestServer();
  let token = '';
  const password = 'Strong!23', email = testUserEmail(test.info());
  try {
    const registered = await request.post(app.origin + '/api/v1/auth/register', { data: { email, password } });
    expect(registered.status()).toBe(201); token = (await registered.json()).accessToken;
    const headers = { authorization: `Bearer ${token}` };
    expect((await request.put(app.origin + '/api/v1/account/profile', { headers, data: { displayName: '<script>' } })).status()).toBe(400);
    expect((await request.put(app.origin + '/api/v1/account/profile', { headers, data: { displayName: '  Sky traveller  ' } })).status()).toBe(200);
    expect((await request.put(app.origin + '/api/v1/journeys/reviews/taj-mahal', { headers, data: { rating: 5, body: 'Wonderful' } })).status()).toBe(200);
    const oversized = Buffer.alloc(1024 * 1024 + 1); Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(oversized);
    expect((await request.put(app.origin + '/api/v1/journeys/reviews/taj-mahal', { headers, data: { rating: 5, body: 'Must not replace the review', image: `data:image/png;base64,${oversized.toString('base64')}` } })).status()).toBe(400);
    const reviews = (await (await request.get(app.origin + '/api/v1/journeys/reviews/taj-mahal')).json()).reviews;
    const own = reviews.find((review: any) => review.body === 'Wonderful' && review.author === 'Sky traveller');
    expect(own).toBeTruthy(); expect(own.userId).toBeUndefined(); expect(own.id).toBeUndefined();
    const exported = await request.get(app.origin + '/api/v1/account/export', { headers });
    expect(exported.headers()['content-disposition']).toContain('attachment; filename="skyatlas-export-');
    const data = await exported.json();
    expect(data.account.email).toBe(email); expect(data.account.passwordHash).toBeUndefined();
    expect(data.reviews.some((review: any) => review.body === 'Wonderful' && !('imageData' in review))).toBe(true);
    expect((await request.delete(app.origin + '/api/v1/account', { headers, data: { password: 'wrong' } })).status()).toBe(401);
    const deleted = await request.delete(app.origin + '/api/v1/account', { headers, data: { password } });
    expect(deleted.status()).toBe(204); expect(deleted.headers()['set-cookie']).toContain('skyatlas_refresh='); token = '';
    expect((await request.post(app.origin + '/api/v1/auth/login', { data: { email, password } })).status()).toBe(401);
  } finally {
    if (token) await request.delete(app.origin + '/api/v1/account', { headers: { authorization: `Bearer ${token}` }, data: { password } });
    await app.close();
  }
});
// Risk: One user could read or change another user’s saved data.
// Given two accounts, When reset, favorites and trips are exercised, Then ownership boundaries hold.
test('accounts, reset, favorites and trips isolate users', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await startTestServer();
  try {
    const health = await request.get(app.origin + '/api/v1/health/db');
    expect(health.headers()['cache-control']).toBe('no-store');
    expect(await health.json()).toEqual({ status: 'ok', db: 'ok' });
    const firstEmail = testUserEmail(test.info()), secondEmail = testUserEmail(test.info());
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

// Risk: A stolen refresh token could be replayed or lockout bypassed.
// Given rotated tokens and failed logins, When old credentials are reused, Then replay and locked sign-in are rejected.
test('refresh rotation rejects replay and lockout blocks correct password', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await startTestServer();
  try {
    const email = testUserEmail(test.info()), password = 'Strong!23';
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

// Risk: Account-owned data could exceed limits or accept another user’s edits.
// Given separate users and saved records, When limits and ownership are challenged, Then caps and isolation hold.
test('favorites cap, alert deduplication and review ownership', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await startTestServer();
  try {
    const register = async () => (await (await request.post(app.origin + '/api/v1/auth/register', { data: { email: testUserEmail(test.info()), password: 'Strong!23' } })).json()).accessToken;
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
