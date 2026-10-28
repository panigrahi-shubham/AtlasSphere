/**
 * Feature: alert Worker
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in alert worker; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAlerts } from '../../api/alertWorker.ts';

// Risk: Polling could duplicate alerts or exhaust the provider budget.
// Given matching rules and provider failures, When a pass runs, Then notifications deduplicate, cities cache and the budget is respected.
test('alert checks deduplicate, cache cities, skip failures, and respect provider budget', async () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'test-only';
  const rules = [
    { id: 'a', userId: 'u', city: 'Delhi', condition: 'temperature-above', threshold: 20, lastSentAt: null },
    { id: 'b', userId: 'u', city: 'Delhi', condition: 'temperature-above', threshold: 30, lastSentAt: null },
    { id: 'c', userId: 'u', city: 'Unavailable', condition: 'temperature-above', threshold: 20, lastSentAt: null },
    { id: 'e', userId: 'u', city: 'Unavailable', condition: 'temperature-above', threshold: 30, lastSentAt: null },
    { id: 'd', userId: 'u', city: 'Pune', condition: 'temperature-above', threshold: 20, lastSentAt: null }
  ];
  const notifications = [];
  const database = {
    weatherAlert: { findMany: async () => rules },
    $transaction: async callback => callback({
      weatherAlert: { updateMany: async ({ where, data }) => {
        const rule = rules.find(item => item.id === where.id);
        if (rule.lastSentAt && rule.lastSentAt >= where.OR[1].lastSentAt.lt) return { count: 0 };
        rule.lastSentAt = data.lastSentAt; return { count: 1 };
      } },
      notification: { create: async ({ data }) => { notifications.push(data); } }
    })
  };
  const calls = [];
  const fetcher = async input => {
    const url = new URL(input); calls.push(url);
    if (url.hostname.startsWith('geocoding')) {
      if (url.searchParams.get('name') === 'Unavailable') return new Response('', { status: 502 });
      return Response.json({ results: [{ latitude: 1, longitude: 2 }] });
    }
    return Response.json({ current: { temperature_2m: 25 }, hourly: { precipitation_probability: [0] } });
  };
  try {
    const now = () => Date.UTC(2026, 0, 1);
    assert.deepEqual(await checkAlerts(fetcher, now, () => true, database), { checked: 3, created: 2 });
    assert.equal(notifications.length, 2);
    assert.equal(calls.filter(url => url.hostname.startsWith('geocoding') && url.searchParams.get('name') === 'Delhi').length, 1);
    assert.equal(calls.filter(url => url.hostname.startsWith('geocoding') && url.searchParams.get('name') === 'Unavailable').length, 1);
    assert.equal(calls.filter(url => url.hostname === 'api.open-meteo.com').length, 2);
    assert.equal((await checkAlerts(fetcher, now, () => true, database)).created, 0);
    const before = calls.length;
    assert.deepEqual(await checkAlerts(fetcher, now, () => false, database), { checked: 0, created: 0 });
    assert.equal(calls.length, before);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
  }
});
