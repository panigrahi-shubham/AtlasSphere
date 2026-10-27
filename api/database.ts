import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();

/** Warm the database connection after startup when a hosted database is resuming. */
let warming: Promise<void> | undefined;
export async function retryDatabase(query: () => Promise<unknown>, wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))) {
  const delays = [500, 1000, 2000, 4000, 8000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([query(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Database timeout')), 5000); })]);
      return true;
    } catch {
      if (attempt === delays.length) return false;
    } finally { if (timer) clearTimeout(timer); }
    await wait(delays[attempt]);
  }
  return false;
}
export function warmDatabase() {
  if (!process.env.DATABASE_URL) return Promise.resolve();
  warming ??= retryDatabase(() => db.$queryRaw`SELECT 1`).then(() => {}).finally(() => { warming = undefined; });
  return warming;
}
export function waitForDatabaseWarmup() { return warming ?? Promise.resolve(); }
