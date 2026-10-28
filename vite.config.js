import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createApp } from './api/app.ts';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { discoveryPages } from './src/pageRoutes.ts';

function notFound(build) {
  return (req, res, next) => {
    const path = (req.url || '/').split('?')[0];
    const page = req.headers.accept?.includes('text/html');
    const discovery = discoveryPages.find(entry => entry.route === path);
    if (page && discovery) { req.url = build ? `/${discovery.file}` : '/index.html'; next(); return; }
    if (page && /^\/(sources|privacy|accessibility)(\.html)?$/.test(path)) { req.url = build ? `${path.replace(/\.html$/, '')}.html` : '/index.html'; next(); return; }
    if (page && path === '/explore') { req.url = '/explore.html'; next(); return; }
    if (page && path === '/journeys') { req.url = '/journeys.html'; next(); return; }
    if (page && path === '/geoguess') { req.url = '/geoguess.html'; next(); return; }
    if (page && !['/', '/index.html', '/explore.html', '/about.html', '/404.html', '/geoguess.html', '/journeys.html', '/test-lab', '/test-lab.html'].includes(path) && !/^\/(src|assets|images|fixtures|@|node_modules)\//.test(path)) {
      res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(readFileSync(new URL(build ? './dist/404.html' : './404.html', import.meta.url))); return;
    }
    next();
  };
}

export default defineConfig({
  optimizeDeps: { include: ['three', 'three/addons/controls/OrbitControls.js'] },
  appType: 'mpa',
  build: { rollupOptions: { input: { main: 'index.html', explore: 'explore.html', about: 'about.html', notFound: '404.html', geoguess: 'geoguess.html', journeys: 'journeys.html' } } },
  plugins: [react(), tailwindcss(), { name: 'skyatlas-api-and-not-found', configureServer(server) { server.middlewares.use(createApp()); server.middlewares.use(notFound(false)); }, configurePreviewServer(server) { server.middlewares.use(createApp()); server.middlewares.use(notFound(true)); } }],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true }
});
