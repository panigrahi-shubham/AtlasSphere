import type { TestInfo } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { db } from '../../api/database.ts';

/** Whether the test process has the database and non-placeholder auth settings required by account checks. */
export const databaseEnabled = Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 && process.env.AUTH_SECRET !== 'replace-with-a-random-secret-of-at-least-32-characters');

/** Return a unique test email scoped to the current Playwright worker. */
export function testUserEmail(testInfo: TestInfo) {
  return `worker-${testInfo.workerIndex}-${randomUUID()}@example.test`;
}

/** Track API-registered users for one test; cleanup deletes only its unique email addresses. */
export function testUserScope(testInfo: TestInfo) {
  const emails: string[] = [];
  return {
    /** Return and remember a unique worker-scoped email for registration through the API. */
    email() {
      const email = testUserEmail(testInfo);
      emails.push(email);
      return email;
    },
    /** Remove this test's registered users and their cascaded records, including after a failed assertion. */
    async close() {
      if (emails.length) await db.user.deleteMany({ where: { email: { in: emails } } });
    },
  };
}

/** Create a uniquely named test user owned by this worker; the caller must delete it in `finally`. */
export async function createTestUser(testInfo: TestInfo, passwordHash: string) {
  return db.user.create({ data: { email: testUserEmail(testInfo), passwordHash } });
}

/** Delete one test user by ID, including records removed through database cascades. */
export async function deleteTestUser(id: string) {
  await db.user.delete({ where: { id } });
}
