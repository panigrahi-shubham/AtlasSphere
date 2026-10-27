import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proxy } from '../../shared/pagesProxy.ts';

test('Pages proxy forwards request cookies, body, query and response cookies', async () => {
  const request = new Request('https://sky.pages.dev/api/v1/auth/refresh?x=1', { method: 'POST', headers: { cookie: 'skyatlas_refresh=abc', 'cf-connecting-ip': '203.0.113.1', 'x-skyatlas-proxy-secret': 'attacker-value' }, body: 'payload' });
  const result = await proxy({ request, env: { API_ORIGIN: 'https://api.example.com', PROXY_SHARED_SECRET: 'proxy-test-secret' } }, async forwarded => {
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
  assert.deepEqual(await result.json(), { error: { message: 'Server is waking up. Try again in a moment.' } });
});

test('Pages proxy rejects an invalid origin without making an upstream request', async () => {
  const request = new Request('https://sky.pages.dev/api/v1/health');
  let called = false;
  const result = await proxy({ request, env: { API_ORIGIN: 'http://api.example.com' } }, async () => { called = true; return new Response(); });
  assert.equal(result.status, 503); assert.equal(called, false);
});
