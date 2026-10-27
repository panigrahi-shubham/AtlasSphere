import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchJSON, fetchJSONWithFallback } from '../../src/services/http.js';

test('HTTP fallback runs once for 502, 503 and 504 only', async () => {
  const saved = globalThis.fetch;
  try {
    for (const status of [502, 503, 504, 400, 401, 404, 429, 500]) {
      const calls = [];
      globalThis.fetch = async url => { calls.push(url); return calls.length === 1 ? new Response('', { status }) : Response.json({ ok: true }); };
      if ([502, 503, 504].includes(status)) {
        assert.deepEqual(await fetchJSONWithFallback('/primary', 'https://provider.example/fallback'), { ok: true });
        assert.deepEqual(calls, ['/primary', 'https://provider.example/fallback']);
      } else {
        await assert.rejects(fetchJSONWithFallback('/primary', 'https://provider.example/fallback'), error => error.status === status);
        assert.deepEqual(calls, ['/primary']);
      }
    }
  } finally { globalThis.fetch = saved; }
});

test('a failed fallback preserves the original HTTP error and message', async () => {
  const saved = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return new Response('', { status: calls.length === 1 ? 502 : 503 }); };
  try {
    await assert.rejects(fetchJSONWithFallback('/primary', 'https://provider.example/fallback', { service: 'Weather' }), error => error.status === 502 && error.message === 'Weather service unavailable (502). Please try again.');
    assert.equal(calls.length, 2);
  } finally { globalThis.fetch = saved; }
});

test('network errors, malformed JSON and cancellation never start a fallback', async () => {
  const saved = globalThis.fetch;
  try {
    for (const kind of ['network', 'json', 'abort']) {
      let calls = 0;
      const controller = new AbortController();
      globalThis.fetch = async () => {
        calls++;
        if (kind === 'network') throw new TypeError('Network down');
        if (kind === 'abort') { controller.abort(); throw new DOMException('Aborted', 'AbortError'); }
        return new Response('{bad-json', { status: 200 });
      };
      await assert.rejects(fetchJSONWithFallback('/primary', 'https://provider.example/fallback', { signal: controller.signal }));
      assert.equal(calls, 1);
    }
  } finally { globalThis.fetch = saved; }
});

test('fetchJSON exposes the HTTP status without including the request URL', async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });
  try { await assert.rejects(fetchJSON('https://provider.example/?private=hidden'), error => error.status === 503 && !error.message.includes('hidden')); }
  finally { globalThis.fetch = saved; }
});
