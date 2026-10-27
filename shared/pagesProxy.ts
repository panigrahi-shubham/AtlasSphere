type Context = { request: Request; env: { API_ORIGIN?: string; PROXY_SHARED_SECRET?: string } };

/** Forward same-origin Pages requests to the configured Render service. */
export async function proxy({ request, env }: Context, fetcher: typeof fetch = fetch, timeoutMs = 30000) {
  const mutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  let forwardedMutation = false;
  const waking = () => Response.json({ error: { message: 'Server is waking up. Try again in a moment.' } }, {
    status: 503,
    headers: { 'Retry-After': '20', 'X-SkyAtlas-Retry-Safe': mutation && forwardedMutation ? '0' : '1', 'Cache-Control': 'no-store' }
  });
  try {
    const origin = new URL(env.API_ORIGIN || '');
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Invalid API origin');
    const incoming = new URL(request.url);
    const target = new URL(origin);
    target.pathname = incoming.pathname;
    target.search = incoming.search;
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('x-skyatlas-proxy-secret');
    if (env.PROXY_SHARED_SECRET) headers.set('x-skyatlas-proxy-secret', env.PROXY_SHARED_SECRET);
    headers.set('x-forwarded-host', incoming.host);
    const clientIp = request.headers.get('cf-connecting-ip');
    if (clientIp) headers.set('x-forwarded-for', clientIp); else headers.delete('x-forwarded-for');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (mutation) {
        // Never replay a write after an ambiguous failure. Probe without sending
        // its body first, and explicitly mark only pre-forward failures as safe.
        const healthHeaders = new Headers();
        healthHeaders.set('Cache-Control', 'no-cache');
        for (const name of ['x-forwarded-host', 'x-forwarded-for', 'x-skyatlas-proxy-secret']) {
          const value = headers.get(name); if (value) healthHeaders.set(name, value);
        }
        const health = await fetcher(new Request(new URL('/api/v1/health/db', origin), { headers: healthHeaders, redirect: 'manual', signal: controller.signal }));
        if (!health.ok) return waking();
        const readiness: unknown = await health.json();
        if (!readiness || typeof readiness !== 'object' || (readiness as { status?: string }).status !== 'ok' || (readiness as { db?: string }).db !== 'ok') return waking();
      }
      const forwarded = new Request(new Request(target, request), { headers, redirect: 'manual', signal: controller.signal });
      forwardedMutation = mutation;
      return await fetcher(forwarded);
    } finally { clearTimeout(timeout); }
  } catch {
    return waking();
  }
}
