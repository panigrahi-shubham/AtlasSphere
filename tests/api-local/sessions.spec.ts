/**
 * Feature: Refresh sessions, lockout and safe retries
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
import { db } from '../../api/database.ts';
import { proxy } from '../../shared/pagesProxy.ts';
const enabled = databaseEnabled;
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
    const registered = await test.step("Register a temporary account", async () => await request.post(app.origin + '/api/v1/auth/register', { data: { email: testUserEmail(test.info()), password } }));
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


// Risk: A stolen refresh token could be replayed or lockout bypassed.
// Given rotated tokens and failed logins, When old credentials are reused, Then replay and locked sign-in are rejected.
test('refresh rotation rejects replay and lockout blocks correct password', { tag: ['@db'] }, async ({ request }) => {
  test.skip(!enabled, 'PostgreSQL and AUTH_SECRET are required for account integration');
  const app = await startTestServer();
  try {
    const email = testUserEmail(test.info()), password = 'Strong!23';
    const registered = await test.step("Register a temporary account", async () => await request.post(app.origin + '/api/v1/auth/register', { data: { email, password } }));
    expect(registered.status()).toBe(201);
    const oldCookie = registered.headers()['set-cookie'].split(';')[0];
    const refreshed = await test.step("Refresh the session", async () => await request.post(app.origin + '/api/v1/auth/refresh', { headers: { cookie: oldCookie } }));
    expect(refreshed.status()).toBe(200);
    const newCookie = refreshed.headers()['set-cookie'].split(';')[0];
    expect((await request.post(app.origin + '/api/v1/auth/refresh', { headers: { cookie: oldCookie } })).status()).toBe(401);
    expect((await request.post(app.origin + '/api/v1/auth/refresh', { headers: { cookie: newCookie } })).status()).toBe(401);
    for (let i = 0; i < 5; i++) expect((await request.post(app.origin + '/api/v1/auth/login', { data: { email, password: 'Wrong!23' } })).status()).toBe(401);
    expect((await request.post(app.origin + '/api/v1/auth/login', { data: { email, password } })).status()).toBe(401);
    expect((await request.post(app.origin + '/api/v1/auth/reset/request', { data: { email } })).status()).toBe(200);
    const code = (await (await test.step("Read the isolated test inbox", async () => await request.get(app.origin + `/api/v1/test/inbox/${email}`))).json()).code;
    expect((await request.post(app.origin + '/api/v1/auth/reset/confirm', { data: { email, code, password } })).status()).toBe(204);
    expect((await request.post(app.origin + '/api/v1/auth/login', { data: { email, password } })).status()).toBe(200);
  } finally { await app.close(); }
});