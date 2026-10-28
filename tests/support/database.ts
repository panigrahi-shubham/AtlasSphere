import type { TestInfo } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { db } from '../../api/database.ts';

/** Whether the test process has the database and non-placeholder auth settings required by account checks. */
export const databaseEnabled = Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 && process.env.AUTH_SECRET !== 'replace-with-a-random-secret-of-at-least-32-characters');

/** Return a unique test email scoped to the current Playwright worker. */
export function testUserEmail(testInfo: TestInfo) {
  return `worker-${testInfo.workerIndex}-${randomUUID()}@example.test`;
}

/** Create a uniquely named test user owned by this worker; the caller must delete it in `finally`. */
export async function createTestUser(testInfo: TestInfo, passwordHash: string) {
  return db.user.create({ data: { email: testUserEmail(testInfo), passwordHash } });
}

/** Delete one test user by ID, including records removed through database cascades. */
export async function deleteTestUser(id: string) {
  await db.user.delete({ where: { id } });
}
