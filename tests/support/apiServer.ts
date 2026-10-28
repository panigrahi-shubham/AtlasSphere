import { createApp, type ApiOptions } from '../../api/app.ts';
import type { Server } from 'node:http';

/** Start an isolated API server on an ephemeral loopback port; callers must close it in `finally`. */
export async function startTestServer(options: ApiOptions = {}) {
  const app = createApp({ env: 'test', fixtures: true, ...options });
  const server = await new Promise<Server>((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.once('error', reject);
  });
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  return {
    app, origin, base: origin,
    /** Close the listener and reject if cleanup fails. */
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

/** Run a callback with an isolated API server and always close the listener. */
export async function withTestServer<T>(options: ApiOptions, run: (server: Awaited<ReturnType<typeof startTestServer>>) => Promise<T>): Promise<T> {
  const server = await startTestServer(options);
  try { return await run(server); } finally { await server.close(); }
}
