/** Example credentials must never be mistaken for a configured account service. */
export function isAccountConfigured() {
  const secret = process.env.AUTH_SECRET;
  return Boolean(process.env.DATABASE_URL && secret && secret.length >= 32 && secret !== 'replace-with-a-random-secret-of-at-least-32-characters');
}
