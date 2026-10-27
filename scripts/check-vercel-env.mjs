import { pathToFileURL } from 'node:url';

/** Reject an incomplete production setup without logging credential values. */
export function checkVercelEnvironment(env = process.env) {
  if (env.VERCEL_ENV !== 'production') return;
  const issues = [];
  const connection = key => {
    try {
      const url = new URL(env[key]);
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech') || !url.username || !url.password || !['require', 'verify-full'].includes(url.searchParams.get('sslmode'))) throw new Error();
      return url;
    } catch { issues.push(`${key} must be a private Neon PostgreSQL URL with SSL.`); }
  };
  const pooled = connection('DATABASE_URL'), direct = connection('DIRECT_DATABASE_URL');
  if (pooled && !pooled.hostname.includes('-pooler.')) issues.push('DATABASE_URL must use the Neon pooled connection.');
  if (direct && direct.hostname.includes('-pooler.')) issues.push('DIRECT_DATABASE_URL must use the Neon direct connection.');
  if (pooled && direct && (pooled.hostname.replace('-pooler.', '.') !== direct.hostname || pooled.pathname !== direct.pathname)) issues.push('Database URLs must target the same Neon endpoint and database.');
  for (const key of ['AUTH_SECRET', 'CRON_SECRET']) if (!env[key] || env[key].length < 32 || /replace-with|change-me/i.test(env[key])) issues.push(`${key} must be a private random secret of at least 32 characters.`);
  if (env.AUTH_SECRET && env.AUTH_SECRET === env.CRON_SECRET) issues.push('AUTH_SECRET and CRON_SECRET must be different.');
  if (env.APP_ENV !== 'production' || env.FIXTURES !== '0') issues.push('Set APP_ENV=production and FIXTURES=0.');
  if (issues.length) throw new Error(`Production deployment configuration is incomplete:\n${issues.join('\n')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { checkVercelEnvironment(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
