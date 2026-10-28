import test from 'node:test';
import assert from 'node:assert/strict';
import { checkVercelEnvironment } from '../../scripts/check-vercel-env.mjs';

const settings = () => ({ VERCEL_ENV: 'production', APP_ENV: 'production', FIXTURES: '0', DATABASE_URL: 'postgresql://fixture:private-value@ep-fixture-pooler.region.neon.tech/app?sslmode=require', DIRECT_DATABASE_URL: 'postgresql://fixture:private-value@ep-fixture.region.neon.tech/app?sslmode=require', AUTH_SECRET: 'a'.repeat(48), CRON_SECRET: 'b'.repeat(48) });
test('production deployment accepts paired Neon connections and separate secrets', () => assert.doesNotThrow(() => checkVercelEnvironment(settings())));
test('production deployment refuses incomplete configuration without exposing credentials', () => {
  const env = { ...settings(), DIRECT_DATABASE_URL: 'postgresql://fixture:private-value@localhost/app' };
  assert.throws(() => checkVercelEnvironment(env), error => error.message.includes('DIRECT_DATABASE_URL') && !error.message.includes('private-value') && !error.message.includes('postgresql://'));
  assert.throws(() => checkVercelEnvironment({ VERCEL_ENV: 'production' }), /AUTH_SECRET/);
});
test('production deployment refuses mismatched databases, pooled migration URLs and development flags', () => {
  assert.throws(() => checkVercelEnvironment({ ...settings(), DIRECT_DATABASE_URL: settings().DATABASE_URL }), /direct connection/);
  assert.throws(() => checkVercelEnvironment({ ...settings(), DIRECT_DATABASE_URL: settings().DIRECT_DATABASE_URL.replace('/app?', '/other?') }), /same Neon endpoint and database/);
  assert.throws(() => checkVercelEnvironment({ ...settings(), APP_ENV: 'test', FIXTURES: '1' }), /APP_ENV=production/);
  assert.throws(() => checkVercelEnvironment({ ...settings(), CRON_SECRET: settings().AUTH_SECRET }), /must be different/);
});
test('local and preview builds do not require production credentials', () => {
  assert.doesNotThrow(() => checkVercelEnvironment({}));
  assert.doesNotThrow(() => checkVercelEnvironment({ VERCEL_ENV: 'preview' }));
});
