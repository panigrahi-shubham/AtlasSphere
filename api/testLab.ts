import express from 'express';
export function createTestLab(env: string) {
  const lab = express.Router();
  if (!['development', 'test'].includes(env)) return lab;
  const normal = { units: 'celsius', news: ['Sample headline'], cache: 'fresh', favorites: ['Tokyo'], forecastDay: 1 };
  lab.get('/scenario', async (req, res) => {
    const flags = String(req.get('x-skyatlas-defects') || '').split(',').map(s => s.trim());
    const failure = String(req.query.failure || '');
    if (failure === 'delay') await new Promise(done => setTimeout(done, 250));
    if (failure === 'timeout') await new Promise(done => setTimeout(done, 2500));
    if (failure === 'upstream-500') return res.status(502).json({ error: { message: 'Simulated upstream failure. Retry.' } });
    if (failure === 'offline') return res.status(503).json({ error: { message: 'Simulated offline state. Retry.' } });
    if (failure === 'malformed-json') return res.type('json').send('{bad');
    res.json({ units: flags.includes('wrong-units') ? 'fahrenheit' : normal.units,
      news: flags.includes('missing-news') ? [] : normal.news,
      cache: flags.includes('stale-cache') ? 'stale' : normal.cache,
      favorites: flags.includes('duplicate-favorite') ? ['Tokyo', 'Tokyo'] : normal.favorites,
      forecastDay: flags.includes('day-offset') ? 2 : normal.forecastDay });
  });
  lab.get('/status', (_req, res) => res.json({ deployment: 'Test deployment', isolated: true }));
  return lab;
}
