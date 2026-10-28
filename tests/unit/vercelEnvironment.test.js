/**
 * Feature: vercel Environment
 * Layer: Unit — node:test
 * Real: Imported application modules
 * Mocked: Fixture inputs and test-supplied dependencies
 * Guards: Regressions in vercel environment; negative cases remain explicit below
 * Run: npm test
 * Needs: Node.js 24
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkVercelEnvironment } from '../../scripts/check-vercel-env.mjs';

const settings = () => ({ VERCEL_ENV: 'production', APP_ENV: 'production', FIXTURES: '0', DATABASE_URL: 'postgresql://fixture:private-value@ep-fixture-pooler.region.neon.tech/app?sslmode=require', DIRECT_DATABASE_URL: 'postgresql://fixture:private-value@ep-fixture.region.neon.tech/app?sslmode=require', AUTH_SECRET: 'a'.repeat(48), CRON_SECRET: 'b'.repeat(48) });
// Risk: Production could start with mismatched database connections.
// Given paired Neon connections and distinct secrets, When configuration is validated, Then the intended setup is accepted.
test('production deployment accepts paired Neon connections and separate secrets', () => assert.doesNotThrow(() => checkVercelEnvironment(settings())));
// Risk: Configuration errors could leak credentials.
// Given incomplete settings, When validation fails, Then diagnostics identify missing requirements without revealing secret values.
test('production deployment refuses incomplete configuration without exposing credentials', () => {
  const env = { ...settings(), DIRECT_DATABASE_URL: 'postgresql://fixture:private-value@localhost/app' };
  assert.throws(() => checkVercelEnvironment(env), error => error.message.includes('DIRECT_DATABASE_URL') && !error.message.includes('private-value') && !error.message.includes('postgresql://'));
  assert.throws(() => checkVercelEnvironment({ VERCEL_ENV: 'production' }), /AUTH_SECRET/);
});
// Risk: A pooled migration URL or development flag could reach production.
// Given mismatched databases or unsafe settings, When validated, Then production configuration is rejected.
test('production deployment refuses mismatched databases, pooled migration URLs and development flags', () => {
  assert.throws(() => checkVercelEnvironment({ ...settings(), DIRECT_DATABASE_URL: settings().DATABASE_URL }), /direct connection/);
  assert.throws(() => checkVercelEnvironment({ ...settings(), DIRECT_DATABASE_URL: settings().DIRECT_DATABASE_URL.replace('/app?', '/other?') }), /same Neon endpoint and database/);
  assert.throws(() => checkVercelEnvironment({ ...settings(), APP_ENV: 'test', FIXTURES: '1' }), /APP_ENV=production/);
  assert.throws(() => checkVercelEnvironment({ ...settings(), CRON_SECRET: settings().AUTH_SECRET }), /must be different/);
});
// Risk: Local builds could become dependent on production secrets.
// Given local or preview mode, When configuration is checked, Then production credentials are not required.
test('local and preview builds do not require production credentials', () => {
  assert.doesNotThrow(() => checkVercelEnvironment({}));
  assert.doesNotThrow(() => checkVercelEnvironment({ VERCEL_ENV: 'preview' }));
});
