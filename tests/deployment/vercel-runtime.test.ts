/**
 * Feature: Vercel's emitted Node function
 * Layer: Deployment integration — node:test
 * Real: TypeScript emit, the production entry point and Express routing
 * Mocked: No providers are called; database credentials are cleared in this test process
 * Guards: TypeScript imports surviving JavaScript emit and crashing function startup
 * Run: npm run test:vercel
 * Needs: Node.js 24, generated Prisma client and npm run build
 */
/* eslint playwright/expect-expect: ["error", {"assertFunctionNames": ["equal", "ok", "match"]}] */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, copyFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Server } from 'node:http';
import ts from 'typescript';

// Risk: Source-mode API tests pass while Vercel's emitted JavaScript imports missing .ts files.
// Given the deployment compiler settings, When the emitted function starts, Then health and production route isolation work.
await test('emitted Vercel function boots without TypeScript source files', async () => {
  const root = process.cwd();
  await mkdir(path.join(root, 'test-results'), { recursive: true });
  // Keeping the output under the repository lets Node resolve installed packages;
  // only emitted application files exist inside this disposable function root.
  const output = await mkdtemp(path.join(root, 'test-results', 'vercel-runtime-'));
  let server: Server | undefined;
  const previous = { DATABASE_URL: process.env.DATABASE_URL, AUTH_SECRET: process.env.AUTH_SECRET };
  process.env.DATABASE_URL = '';
  process.env.AUTH_SECRET = '';
  try {
    const configPath = path.join(root, 'deployment', 'tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    assert.equal(config.error, undefined);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
    const program = ts.createProgram(parsed.fileNames, { ...parsed.options, rootDir: root, outDir: output, noEmit: false });
    const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: file => file, getCurrentDirectory: () => root, getNewLine: () => '\n',
    }));
    assert.equal(program.emit().emitSkipped, false);
    const entry = path.join(output, 'deployment', 'vercel.js');
    assert.match(await readFile(entry, 'utf8'), /from ['"]\.\.\/api\/app\.js['"]/);
    await mkdir(path.join(output, 'dist'), { recursive: true });
    await copyFile(path.join(root, 'dist', '404.html'), path.join(output, 'dist', '404.html'));
    const { default: app } = await import(pathToFileURL(entry).href);
    server = await new Promise<Server>((resolve, reject) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
      listener.once('error', reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const origin = `http://127.0.0.1:${address.port}`;
    const health = await fetch(origin + '/api/v1/health');
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');
    assert.equal((await fetch(origin + '/test-lab')).status, 404);
    assert.equal((await fetch(origin + '/api/v1/test-lab/weather')).status, 404);
  } finally {
    try {
      if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    } finally {
      for (const key of ['DATABASE_URL', 'AUTH_SECRET'] as const) {
        if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
      }
      assert.equal(path.dirname(path.resolve(output)), path.join(root, 'test-results'));
      await rm(output, { recursive: true, force: true });
    }
  }
});
