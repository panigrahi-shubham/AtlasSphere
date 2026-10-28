/**
 * Feature: provider Budget
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in provider budget; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { clearOpenMeteoBudgetForTest, reserveOpenMeteoCall } from '../../api/providerBudget.ts';

test('Open-Meteo budget stops at 550 calls per minute and frees the window', () => {
  clearOpenMeteoBudgetForTest();
  for (let i = 0; i < 550; i++) assert.equal(reserveOpenMeteoCall(1_000), true);
  assert.equal(reserveOpenMeteoCall(1_000), false);
  assert.equal(reserveOpenMeteoCall(61_000), true);
  clearOpenMeteoBudgetForTest();
});

test('Open-Meteo budget caps each process below 10,000 calls per day', () => {
  clearOpenMeteoBudgetForTest();
  for (const offset of [0, 68 * 60_000]) {
    for (let minute = 0; minute < 9; minute++) {
      for (let call = 0; call < 500; call++) assert.equal(reserveOpenMeteoCall(offset + minute * 60_000), true);
    }
  }
  assert.equal(reserveOpenMeteoCall(136 * 60_000), false);
  assert.equal(reserveOpenMeteoCall(24 * 60 * 60_000 + 9 * 60_000), true);
  clearOpenMeteoBudgetForTest();
});
