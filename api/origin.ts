import type { Request } from 'express';

/** Allow same-host browser writes and explicitly configured HTTPS origins. */
export function isAllowedOrigin(req: Request) {
  const value = req.get('origin');
  if (!value) return true;
  try {
    const origin = new URL(value);
    if (origin.origin !== value || !['http:', 'https:'].includes(origin.protocol)) return false;
    if (origin.host === req.get('host')) return true;
    return (process.env.ALLOWED_ORIGINS || '').split(',').some(item => {
      try { const allowed = new URL(item.trim()); return allowed.protocol === 'https:' && allowed.origin === item.trim() && allowed.origin === origin.origin; }
      catch { return false; }
    });
  } catch { return false; }
}
