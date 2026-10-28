/**
 * Feature: database Retry
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in database retry; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retryDatabase } from '../../api/database.ts';

test('database warmup retries with bounded exponential delays', async () => {
  let attempts = 0;
  const waits = [];
  const success = await retryDatabase(async () => { if (++attempts < 3) throw new Error('resuming'); }, async ms => { waits.push(ms); });
  assert.equal(success, true); assert.equal(attempts, 3); assert.deepEqual(waits, [500, 1000]);
  attempts = 0; waits.length = 0;
  const failure = await retryDatabase(async () => { attempts++; throw new Error('unavailable'); }, async ms => { waits.push(ms); });
  assert.equal(failure, false); assert.equal(attempts, 6); assert.deepEqual(waits, [500, 1000, 2000, 4000, 8000]);
});
