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
import { databaseEnabled, testUserEmail } from '../support/database';
const enabled = databaseEnabled;
// Risk: Private account data could survive deletion or leak through public output.
// Given an authenticated account, When profile, export and deletion are exercised, Then private data remains protected.
test('profile, export and account deletion protect private data', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await startTestServer();
  let token = '';
  const password = 'Strong!23', email = testUserEmail(test.info());
  try {
    const registered = await test.step("Register a temporary account", async () => await request.post(app.origin + '/api/v1/auth/register', { data: { email, password } }));
    expect(registered.status()).toBe(201); token = (await registered.json()).accessToken;
    const headers = { authorization: `Bearer ${token}` };
    expect((await request.put(app.origin + '/api/v1/account/profile', { headers, data: { displayName: '<script>' } })).status()).toBe(400);
    expect((await request.put(app.origin + '/api/v1/account/profile', { headers, data: { displayName: '  Sky traveller  ' } })).status()).toBe(200);
    expect((await request.put(app.origin + '/api/v1/journeys/reviews/taj-mahal', { headers, data: { rating: 5, body: 'Wonderful' } })).status()).toBe(200);
    const oversized = Buffer.alloc(1024 * 1024 + 1); Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(oversized);
    expect((await request.put(app.origin + '/api/v1/journeys/reviews/taj-mahal', { headers, data: { rating: 5, body: 'Must not replace the review', image: `data:image/png;base64,${oversized.toString('base64')}` } })).status()).toBe(400);
    const reviews = (await (await test.step("Read saved state", async () => await request.get(app.origin + '/api/v1/journeys/reviews/taj-mahal'))).json()).reviews;
    const own = reviews.find((review: any) => review.body === 'Wonderful' && review.author === 'Sky traveller');
    expect(own).toBeTruthy(); expect(own.userId).toBeUndefined(); expect(own.id).toBeUndefined();
    const exported = await test.step("Export account data", async () => await request.get(app.origin + '/api/v1/account/export', { headers }));
    expect(exported.headers()['content-disposition']).toContain('attachment; filename="skyatlas-export-');
    const data = await exported.json();
    expect(data.account.email).toBe(email); expect(data.account.passwordHash).toBeUndefined();
    expect(data.reviews.some((review: any) => review.body === 'Wonderful' && !('imageData' in review))).toBe(true);
    expect((await request.delete(app.origin + '/api/v1/account', { headers, data: { password: 'wrong' } })).status()).toBe(401);
    const deleted = await test.step("Delete temporary account data", async () => await request.delete(app.origin + '/api/v1/account', { headers, data: { password } }));
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
    const health = await test.step("Check database readiness", async () => await request.get(app.origin + '/api/v1/health/db'));
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
    const trip = await test.step("Create a journey", async () => await request.post(app.origin + '/api/v1/journeys/trips', { headers, data: { name: 'Japan', city: 'Tokyo', startDate: date, endDate: date } }));
    expect(trip.status()).toBe(201);
    const id = (await trip.json()).trip.id;
    expect((await request.delete(app.origin + `/api/v1/journeys/trips/${id}`, { headers: { authorization: `Bearer ${bt}` } })).status()).toBe(404);
    expect((await request.post(app.origin + '/api/v1/auth/reset/request', { data: { email: firstEmail } })).status()).toBe(200);
    const code = (await (await test.step("Read the isolated test inbox", async () => await request.get(app.origin + `/api/v1/test/inbox/${firstEmail}`))).json()).code;
    expect(code).toMatch(/^\d{6}$/);
    expect((await request.post(app.origin + '/api/v1/auth/reset/confirm', { data: { email: firstEmail, code, password: 'Newpass!23' } })).status()).toBe(204);
    expect((await request.post(app.origin + '/api/v1/auth/reset/confirm', { data: { email: firstEmail, code, password: 'Newpass!23' } })).status()).toBe(400);
  } finally { await app.close(); }
});


// Risk: Account-owned data could exceed limits or accept another user’s edits.
// Given separate users and saved records, When limits and ownership are challenged, Then caps and isolation hold.
test('favorites cap, alert deduplication and review ownership', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await startTestServer();
  try {
    const register = async () => (await (await test.step("Register a temporary account", async () => await request.post(app.origin + '/api/v1/auth/register', { data: { email: testUserEmail(test.info()), password: 'Strong!23' } }))).json()).accessToken;
    const first = { authorization: `Bearer ${await register()}` }, second = { authorization: `Bearer ${await register()}` };
    const places = Array.from({ length: 20 }, (_, i) => ({ name: `Place ${i}`, latitude: i, longitude: i }));
    expect((await request.post(app.origin + '/api/v1/favorites/sync', { headers: first, data: { favorites: places } })).status()).toBe(200);
    expect((await (await request.get(app.origin + '/api/v1/favorites', { headers: first })).json()).favorites).toHaveLength(20);
    expect((await request.post(app.origin + '/api/v1/favorites', { headers: first, data: { name: 'Extra', latitude: -1, longitude: 2 } })).status()).toBe(400);
    expect((await request.post(app.origin + '/api/v1/favorites/sync', { headers: first, data: { favorites: [{ name: 'Extra', latitude: -1, longitude: 2 }] } })).status()).toBe(200);
    expect((await (await request.get(app.origin + '/api/v1/favorites', { headers: first })).json()).favorites).toHaveLength(20);
    const alert = await test.step("Save account-owned data", async () => await request.post(app.origin + '/api/v1/journeys/alerts', { headers: first, data: { city: 'Tokyo', condition: 'temperature-above', threshold: 20 } }));
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