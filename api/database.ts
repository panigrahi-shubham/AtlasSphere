import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();

/** Warm the database connection after startup when a hosted database is resuming. */
let warming: Promise<void> | undefined;
export function warmDatabase() {
  if (!process.env.DATABASE_URL) return Promise.resolve();
  warming ??= (async () => {
    for (const delay of [500, 1000, 2000, 4000, 8000]) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([db.$queryRaw`SELECT 1`, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Database timeout')), 5000); })]);
        return;
      }
      catch { await new Promise(resolve => setTimeout(resolve, delay)); }
      finally { if (timer) clearTimeout(timer); }
    }
  })().finally(() => { warming = undefined; });
  return warming;
}
export function waitForDatabaseWarmup() { return warming ?? Promise.resolve(); }
