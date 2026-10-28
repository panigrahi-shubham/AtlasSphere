/**
 * Feature: Alert worker persistence and deduplication
 * Layer: API integration — Playwright
 * Real: Express API and configured PostgreSQL persistence
 * Mocked: Upstream responses or injected dependencies where supplied by the scenario
 * Guards: Regressions in account security and persistence; negative cases remain explicit below
 * Run: npm run test:accounts:local
 * Needs: Isolated DATABASE_URL and AUTH_SECRET, or the disposable local PostgreSQL wrapper
 */
import { test, expect } from '@playwright/test';
import { databaseEnabled, createTestUser, deleteTestUser } from '../support/database';
import { db } from '../../api/database.ts';
import { checkAlerts } from '../../api/alertWorker.ts';
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