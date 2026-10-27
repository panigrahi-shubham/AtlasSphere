type Context = { request: Request; env: { API_ORIGIN?: string; PROXY_SHARED_SECRET?: string } };

/** Forward same-origin Pages requests to the configured Render service. */
export async function proxy({ request, env }: Context, fetcher: typeof fetch = fetch) {
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
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const forwarded = new Request(new Request(target, request), { headers, redirect: 'manual', signal: controller.signal });
      return await fetcher(forwarded);
    } finally { clearTimeout(timeout); }
  } catch {
    return Response.json({ error: { message: 'Server is waking up. Try again in a moment.' } }, { status: 503, headers: { 'Retry-After': '20' } });
  }
}
