/**
 * Feature: pages Proxy
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in pages proxy; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proxy } from '../../shared/pagesProxy.ts';

test('Pages proxy forwards request cookies, body, query and response cookies', async () => {
  const request = new Request('https://sky.pages.dev/api/v1/auth/refresh?x=1', { method: 'POST', headers: { cookie: 'skyatlas_refresh=abc', 'cf-connecting-ip': '203.0.113.1', 'x-skyatlas-proxy-secret': 'attacker-value' }, body: 'payload' });
  const result = await proxy({ request, env: { API_ORIGIN: 'https://api.example.com', PROXY_SHARED_SECRET: 'proxy-test-secret' } }, async forwarded => {
    if (new URL(forwarded.url).pathname === '/api/v1/health/db') {
      assert.equal(forwarded.method, 'GET');
      assert.equal(forwarded.headers.get('cookie'), null);
      assert.equal(forwarded.headers.get('cache-control'), 'no-cache');
      return Response.json({ status: 'ok', db: 'ok' });
    }
    assert.equal(forwarded.url, 'https://api.example.com/api/v1/auth/refresh?x=1');
    assert.equal(forwarded.headers.get('cookie'), 'skyatlas_refresh=abc');
    assert.equal(forwarded.headers.get('x-forwarded-host'), 'sky.pages.dev');
    assert.equal(forwarded.headers.get('x-forwarded-for'), '203.0.113.1');
    assert.equal(forwarded.headers.get('x-skyatlas-proxy-secret'), 'proxy-test-secret');
    assert.equal(await forwarded.text(), 'payload');
    return new Response('ok', { status: 201, headers: { 'Set-Cookie': 'skyatlas_refresh=next; HttpOnly; Secure; Path=/api/v1/auth' } });
  });
  assert.equal(result.status, 201);
  assert.match(result.headers.get('set-cookie'), /skyatlas_refresh=next/);
});

test('Pages proxy reports upstream failure without exposing details', async () => {
  const request = new Request('https://sky.pages.dev/api/v1/health');
  const result = await proxy({ request, env: { API_ORIGIN: 'https://api.example.com' } }, async () => { throw new Error('private error'); });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('Retry-After'), '20');
  assert.equal(result.headers.get('X-SkyAtlas-Retry-Safe'), '1');
  assert.deepEqual(await result.json(), { error: { message: 'Server is waking up. Try again in a moment.' } });
});

test('unready database prevents forwarding a mutation and permits a safe retry', async () => {
  const requests = [];
  const result = await proxy({ request: new Request('https://sky.pages.dev/api/v1/journeys/alerts', { method: 'POST', body: '{}' }), env: { API_ORIGIN: 'https://api.example.com' } }, async request => {
    requests.push(request);
    return Response.json({ status: 'ok', db: 'unavailable' });
  });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('X-SkyAtlas-Retry-Safe'), '1');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'GET');
});

test('a lost response after forwarding a mutation is never marked safe to replay', async () => {
  let writes = 0;
  const result = await proxy({ request: new Request('https://sky.pages.dev/api/v1/journeys/alerts', { method: 'POST', body: '{}' }), env: { API_ORIGIN: 'https://api.example.com' } }, async request => {
    if (request.method === 'GET') return Response.json({ status: 'ok', db: 'ok' });
    writes++;
    throw new Error('Response lost after commit');
  });
  assert.equal(writes, 1);
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('X-SkyAtlas-Retry-Safe'), '0');
});

test('proxy aborts a timed-out readiness check before forwarding its mutation', async () => {
  let writes = 0;
  const result = await proxy({ request: new Request('https://sky.pages.dev/api/v1/journeys/alerts', { method: 'POST', body: '{}' }), env: { API_ORIGIN: 'https://api.example.com' } }, request => {
    if (request.method !== 'GET') writes++;
    return new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError'))));
  }, 5);
  assert.equal(writes, 0);
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('X-SkyAtlas-Retry-Safe'), '1');
});

test('Pages proxy rejects an invalid origin without making an upstream request', async () => {
  const request = new Request('https://sky.pages.dev/api/v1/health');
  let called = false;
  const result = await proxy({ request, env: { API_ORIGIN: 'http://api.example.com' } }, async () => { called = true; return new Response(); });
  assert.equal(result.status, 503); assert.equal(called, false);
});
