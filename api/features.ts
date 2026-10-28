import express, { type Request, type Response } from 'express';
import { db } from './database.ts';
import bcrypt from 'bcryptjs';
import { createHmac, createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { isAllowedOrigin } from './origin.ts';
import { isAccountConfigured } from './accountConfig.ts';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters');
  return value;
};
const emailOf = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = (s: unknown) => typeof s === 'string' && s.length >= 8 && s.length <= 128 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s) && /[^\w\s]/.test(s);
const sign = (input: string) => createHmac('sha256', secret()).update(input).digest('base64url');
const tokenFor = (id: string) => {
  const body = Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 900 })).toString('base64url');
  return `${body}.${sign(body)}`;
};
function tokenUser(token: string) {
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra || signature.length !== 43) return null;
  const expected = sign(body);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof payload.sub === 'string' && payload.sub.length < 100 && Number.isInteger(payload.exp) && payload.exp > Date.now() / 1000 ? payload.sub as string : null;
  } catch { return null; }
}
export function authenticate(req: Request) {
  try { const match = /^Bearer (\S+)$/.exec(req.get('authorization') || ''); return match ? tokenUser(match[1]) : null; } catch { return null; }
}
function reply(res: Response, status: number, message: string) { res.status(status).json({ error: { message } }); }
const cookieName = 'skyatlas_refresh';
const cookieOptions = (req: Request) => ({ httpOnly: true, sameSite: 'lax' as const, secure: req.secure || process.env.APP_ENV === 'production', path: '/api/v1/auth', maxAge: 30 * 86400000 });
function cookieValue(req: Request) {
  const part = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`));
  return part?.slice(cookieName.length + 1) || '';
}
async function newSession(userId: string, req: Request, res: Response) {
  const value = randomBytes(32).toString('base64url');
  await db.refreshToken.create({ data: { userId, hash: sha(value), expiresAt: new Date(Date.now() + 30 * 86400000) } });
  res.cookie(cookieName, value, cookieOptions(req));
  return tokenFor(userId);
}
function safeAccount(user: { id: string; email: string; theme: string; displayName?: string | null }) { return { id: user.id, email: user.email, theme: user.theme, displayName: user.displayName ?? null }; }
const attempts = new Map<string, { count: number; until: number }>();
function attemptLimit(key: string, max = 5, windowMs = 600000) {
  const item = attempts.get(key);
  if (!item || item.until < Date.now()) { attempts.set(key, { count: 1, until: Date.now() + windowMs }); return true; }
  if (item.count >= max) return false;
  item.count++; return true;
}
function protectedUser(req: Request, res: Response) {
  try {
    const match = /^Bearer (\S+)$/.exec(req.get('authorization') || '');
    const id = match && tokenUser(match[1]);
    if (id) return id;
  } catch { /* missing server secret */ }
  reply(res, 401, 'Sign in to continue.'); return null;
}
function unavailable(res: Response) { reply(res, 503, 'Account service is not configured.'); }
const location = (x: any) => {
  if (!x || typeof x !== 'object' || typeof x.name !== 'string' || !x.name.trim() || x.name.length > 100 || !Number.isFinite(x.latitude) || !Number.isFinite(x.longitude) || Math.abs(x.latitude) > 90 || Math.abs(x.longitude) > 180) return null;
  const country = typeof x.country === 'string' ? x.country.slice(0, 100) : null;
  const region = typeof x.region === 'string' ? x.region.slice(0, 100) : null;
  const key = `${x.name.trim().toLowerCase()}:${x.latitude.toFixed(4)}:${x.longitude.toFixed(4)}`;
  return { key, name: x.name.trim(), country, region, latitude: x.latitude, longitude: x.longitude };
};
export function createFeatures(env: string) {
  const api = express.Router();
  api.use(['/auth', '/account', '/favorites'], (req, res, next) => {
    if (!isAccountConfigured()) return unavailable(res);
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !isAllowedOrigin(req)) return reply(res, 403, 'Request origin is not allowed.');
    next();
  });
  api.post('/auth/register', async (req, res) => {
    const email = emailOf(req.body?.email), password = req.body?.password;
    if (!validEmail(email) || !validPassword(password)) return reply(res, 400, 'Enter a valid email and a strong password.');
    if (!attemptLimit(`register:${req.ip}`, 10)) return reply(res, 429, 'Please try again later.');
    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const user = await db.user.create({ data: { email, passwordHash } });
      res.status(201).json({ user: safeAccount(user), accessToken: await newSession(user.id, req, res) });
    } catch (error: any) { if (error?.code === 'P2002') return reply(res, 409, 'Account could not be created with this email.'); throw error; }
  });
  api.post('/auth/login', async (req, res) => {
    const email = emailOf(req.body?.email);
    if (!validEmail(email) || typeof req.body?.password !== 'string') return reply(res, 400, 'Enter your email and password.');
    if (!attemptLimit(`login:${req.ip}:${email}`, 20)) return reply(res, 429, 'Please try again later.');
    const user = await db.user.findUnique({ where: { email } });
    const locked = user?.lockedUntil && user.lockedUntil.getTime() > Date.now();
    const correct = user && !locked && await bcrypt.compare(req.body.password, user.passwordHash);
    if (!correct) {
      if (user && !locked) {
        const failed = user.failedLogins + 1;
        await db.user.update({ where: { id: user.id }, data: { failedLogins: failed >= 5 ? 0 : failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 900000) : null } });
      }
      return reply(res, 401, 'Invalid credentials or account temporarily unavailable.');
    }
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    res.json({ user: safeAccount(user), accessToken: await newSession(user.id, req, res) });
  });
  api.post('/auth/refresh', async (req, res) => {
    const value = cookieValue(req);
    if (!value || value.length !== 43) return reply(res, 401, 'Session expired.');
    const old = await db.refreshToken.findUnique({ where: { hash: sha(value) } });
    if (!old) return reply(res, 401, 'Session expired.');
    if (old.usedAt) {
      await db.refreshToken.updateMany({ where: { userId: old.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      res.clearCookie(cookieName, cookieOptions(req));
      return reply(res, 401, 'Session expired.');
    }
    if (old.revokedAt || old.expiresAt.getTime() <= Date.now()) return reply(res, 401, 'Session expired.');
    const next = randomBytes(32).toString('base64url');
    const rotated = await db.refreshToken.updateMany({ where: { hash: old.hash, usedAt: null, revokedAt: null }, data: { usedAt: new Date() } });
    if (rotated.count !== 1) return reply(res, 401, 'Session expired.');
    await db.refreshToken.create({ data: { hash: sha(next), userId: old.userId, expiresAt: new Date(Date.now() + 30 * 86400000) } });
    const user = await db.user.findUnique({ where: { id: old.userId } });
    if (!user) return reply(res, 401, 'Session expired.');
    res.cookie(cookieName, next, cookieOptions(req));
    res.json({ user: safeAccount(user), accessToken: tokenFor(old.userId) });
  });
  api.post('/auth/logout', async (req, res) => {
    const value = cookieValue(req);
    if (value) await db.refreshToken.updateMany({ where: { hash: sha(value) }, data: { revokedAt: new Date() } });
    res.clearCookie(cookieName, cookieOptions(req)); res.status(204).end();
  });
  const inbox = new Map<string, string>();
  api.post('/auth/reset/request', async (req, res) => {
    if (!attemptLimit(`reset:${req.ip}`, 5, 3600000)) return reply(res, 429, 'Please try later.');
    if (env !== 'test' && (!process.env.RESET_EMAIL_PROVIDER_URL || !process.env.RESET_EMAIL_PROVIDER_TOKEN)) return reply(res, 503, 'Password reset is currently unavailable.');
    const user = await db.user.findUnique({ where: { email: emailOf(req.body?.email) } });
    if (user) {
      const code = String(randomInt(0, 1000000)).padStart(6, '0');
      await db.resetCode.create({ data: { userId: user.id, hash: sha(`${user.id}:${code}`), expiresAt: new Date(Date.now() + 600000) } });
      if (env === 'test') inbox.set(user.email, code);
      else if (process.env.RESET_EMAIL_PROVIDER_URL && process.env.RESET_EMAIL_PROVIDER_TOKEN && process.env.RESET_EMAIL_PROVIDER_URL.startsWith('https://')) {
        await fetch(process.env.RESET_EMAIL_PROVIDER_URL, { method: 'POST', headers: { authorization: `Bearer ${process.env.RESET_EMAIL_PROVIDER_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ to: user.email, code }) });
      }
    }
    res.json({ message: 'If the account exists, reset instructions will be sent.' });
  });
  api.post('/auth/reset/confirm', async (req, res) => {
    if (!attemptLimit(`confirm:${req.ip}`, 10) || !validPassword(req.body?.password)) return reply(res, 400, 'Invalid or expired reset code or password.');
    const user = await db.user.findUnique({ where: { email: emailOf(req.body?.email) } });
    if (!user || !/^\d{6}$/.test(req.body?.code)) return reply(res, 400, 'Invalid or expired reset code or password.');
    const code = await db.resetCode.findFirst({ where: { userId: user.id, hash: sha(`${user.id}:${req.body.code}`), usedAt: null, expiresAt: { gt: new Date() } } });
    if (!code) return reply(res, 400, 'Invalid or expired reset code or password.');
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await db.$transaction([db.resetCode.update({ where: { id: code.id }, data: { usedAt: new Date() } }), db.user.update({ where: { id: user.id }, data: { passwordHash, failedLogins: 0, lockedUntil: null } }), db.refreshToken.updateMany({ where: { userId: user.id }, data: { revokedAt: new Date() } })]);
    res.status(204).end();
  });
  if (env === 'test') api.get('/test/inbox/:email', (req, res) => res.json({ code: inbox.get(emailOf(req.params.email)) ?? null }));
  api.get('/account', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return reply(res, 401, 'Session expired.');
    res.json({ user: safeAccount(user) });
  });
  api.put('/account/profile', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    if (!attemptLimit(`profile:${id}`, 30, 3600000)) return reply(res, 429, 'Please try again later.');
    const name = req.body?.displayName;
    if (typeof name !== 'string' || name.trim().length > 40 || /[<>]/.test(name)) return reply(res, 400, 'Enter a display name of up to 40 characters without HTML.');
    const user = await db.user.update({ where: { id }, data: { displayName: name.trim() || null }, select: { displayName: true } });
    res.json({ displayName: user.displayName });
  });
  api.get('/account/export', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    const user = await db.user.findUnique({ where: { id }, select: { email: true, displayName: true, theme: true, createdAt: true } });
    if (!user) return reply(res, 401, 'Session expired.');
    const [favorites, trips, alerts, notifications, reviews] = await Promise.all([
      db.favorite.findMany({ where: { userId: id }, select: { key: true, name: true, country: true, region: true, latitude: true, longitude: true, createdAt: true } }),
      db.trip.findMany({ where: { userId: id }, select: { name: true, city: true, startDate: true, endDate: true, createdAt: true } }),
      db.weatherAlert.findMany({ where: { userId: id }, select: { city: true, condition: true, threshold: true, lastSentAt: true, createdAt: true } }),
      db.notification.findMany({ where: { userId: id }, select: { message: true, createdAt: true } }),
      db.review.findMany({ where: { userId: id }, select: { id: true, landmarkId: true, rating: true, body: true, imageType: true, createdAt: true } })
    ]);
    const exportedReviews = reviews.map(({ id: reviewId, imageType, ...review }) => ({ ...review, imageUrl: imageType ? `/api/v1/journeys/reviews/image/${reviewId}` : null }));
    res.set('Content-Disposition', `attachment; filename="skyatlas-export-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({ account: user, favorites, trips, alerts, notifications, reviews: exportedReviews });
  });
  api.delete('/account', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    if (!attemptLimit(`delete-account:${id}`, 5, 3600000)) return reply(res, 429, 'Please try again later.');
    if (typeof req.body?.password !== 'string' || req.body.password.length > 128) return reply(res, 400, 'Enter your current password.');
    const user = await db.user.findUnique({ where: { id }, select: { passwordHash: true } });
    if (!user || !await bcrypt.compare(req.body.password, user.passwordHash)) return reply(res, 401, 'Incorrect password or expired session.');
    await db.user.delete({ where: { id } });
    res.clearCookie(cookieName, cookieOptions(req));
    res.status(204).end();
  });
  api.put('/account/theme', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    if (!['light', 'dark'].includes(req.body?.theme)) return reply(res, 400, 'Invalid theme.');
    const user = await db.user.update({ where: { id }, data: { theme: req.body.theme } });
    res.json({ theme: user.theme });
  });
  api.get('/favorites', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    res.json({ favorites: await db.favorite.findMany({ where: { userId: id }, orderBy: { createdAt: 'asc' }, select: { key: true, name: true, country: true, region: true, latitude: true, longitude: true } }) });
  });
  api.post('/favorites/sync', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    if (!Array.isArray(req.body?.favorites) || req.body.favorites.length > 20) return reply(res, 400, 'Send at most 20 favorites.');
    const incoming = req.body.favorites.map(location);
    if (incoming.includes(null)) return reply(res, 400, 'Invalid favorite.');
    await db.$transaction(async tx => {
      let remaining = 20 - await tx.favorite.count({ where: { userId: id } });
      for (const item of incoming) {
        const exists = await tx.favorite.findUnique({ where: { userId_key: { userId: id, key: item.key } } });
        if (!exists && remaining > 0) {
          await tx.favorite.create({ data: { ...item, userId: id } });
          remaining--;
        }
      }
    });
    const favorites = await db.favorite.findMany({ where: { userId: id }, orderBy: { createdAt: 'asc' }, take: 20, select: { key: true, name: true, country: true, region: true, latitude: true, longitude: true } });
    res.json({ favorites });
  });
  api.put('/favorites', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    if (!Array.isArray(req.body?.favorites) || req.body.favorites.length > 20) return reply(res, 400, 'Send at most 20 favorites.');
    const incoming = req.body.favorites.map(location);
    if (incoming.includes(null)) return reply(res, 400, 'Invalid favorite.');
    const unique = [...new Map<string, NonNullable<ReturnType<typeof location>>>(incoming.map((item: NonNullable<ReturnType<typeof location>>) => [item.key, item])).values()];
    await db.$transaction(async tx => {
      await tx.favorite.deleteMany({ where: { userId: id, key: { notIn: unique.map(item => item.key) } } });
      for (const item of unique) await tx.favorite.upsert({ where: { userId_key: { userId: id, key: item.key } }, update: { name: item.name, country: item.country, region: item.region }, create: { ...item, userId: id } });
    });
    res.json({ favorites: await db.favorite.findMany({ where: { userId: id }, orderBy: { createdAt: 'asc' } }) });
  });  api.post('/favorites', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    const city = location(req.body); if (!city) return reply(res, 400, 'Invalid favorite.');
    const existing = await db.favorite.findUnique({ where: { userId_key: { userId: id, key: city.key } } });
    if (existing) return res.json({ favorite: existing });
    const count = await db.favorite.count({ where: { userId: id } });
    if (count >= 20) return reply(res, 400, 'Maximum of 20 favorites reached.');
    const favorite = await db.favorite.create({ data: { ...city, userId: id } });
    res.status(201).json({ favorite });
  });
  api.delete('/favorites/:key', async (req, res) => {
    const id = protectedUser(req, res); if (!id) return;
    await db.favorite.deleteMany({ where: { userId: id, key: req.params.key as string } }); res.status(204).end();
  });
  return api;
}




