/** Weather news from the AtlasSphere API. */
export function initNews() {
  const status = document.querySelector('#news-status');
  const list = document.querySelector('#news-list');
  const load = document.querySelector('#news-retry');
  const panel = document.querySelector('#news-section');
  let controller, version = 0;
  async function refresh() {
    controller?.abort(); controller = new AbortController(); const token = ++version;
    list.replaceChildren(); panel.setAttribute('aria-busy', 'true'); load.disabled = true;
    status.textContent = 'Loading sample weather news…'; document.querySelector('#news-skeleton').hidden = false;
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/v1/news', { signal: controller.signal });
      if (!response.ok) throw new Error('Sample news is unavailable. Please retry.');
      const data = await response.json();
      if (!Array.isArray(data?.items) || !Number.isFinite(Date.parse(data.lastUpdated))) throw new Error('Sample news data is invalid. Please retry.');
      const items = data.items.map(item => {
        if (!item || !['headline', 'snippet', 'source', 'url', 'publishedAt'].every(key => typeof item[key] === 'string') || !Number.isFinite(Date.parse(item.publishedAt))) throw new Error('Sample news data is invalid. Please retry.');
        const url = new URL(item.url); if (url.protocol !== 'https:') throw new Error('Sample news contains an invalid link. Please retry.');
        return { ...item, snippet: item.snippet.slice(0, 200), url: url.href };
      });
      if (token !== version) return;
      const sample = items.every(item => item.headline.startsWith('Sample:'));
      document.querySelector('[data-testid="news-fixture-label"]').textContent = sample ? 'Fixture data — demonstration entries, not live news or current headlines.' : 'Weather headlines from source feeds. Open a headline to read the original article.';
      document.querySelector('#news-section .eyebrow').textContent = sample ? 'Weather reading — sample content' : 'Weather reading — source feeds';
      document.querySelector('#news-list').setAttribute('aria-label', sample ? 'Sample weather news' : 'Weather news');
      document.querySelector('#news-retry').textContent = sample ? 'Reload sample news' : 'Reload weather news';
      const stale = Date.now() - Date.parse(data.lastUpdated) > 12 * 3600000;
      status.textContent = `${items.length ? `${items.length} ${sample ? 'sample news' : 'weather news'} items.` : `No ${sample ? 'sample news' : 'weather news'} items available.`} ${sample ? 'Fixture' : 'News snapshot'} updated ${new Date(data.lastUpdated).toLocaleString('en')}.${stale ? ` This ${sample ? 'sample data' : 'news snapshot'} is more than 12 hours old.` : ''}${sample ? ' These are demonstration entries, not a live news feed.' : ''}`;
      for (const item of items) {
        const row = document.createElement('li'); row.dataset.testid = 'news-item';
        const heading = document.createElement('h3'), link = document.createElement('a');
        link.textContent = item.headline; link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.dataset.testid = 'news-headline'; heading.append(link);
        const snippet = document.createElement('p'); snippet.textContent = item.snippet; snippet.dataset.testid = 'news-snippet';
        const meta = document.createElement('p'); meta.className = 'detail-caption';
        const source = document.createElement('span'); source.textContent = item.source; source.dataset.testid = 'news-source';
        const time = document.createElement('time'); time.dateTime = item.publishedAt; time.textContent = new Date(item.publishedAt).toLocaleString('en'); time.dataset.testid = 'news-time';
        meta.append(source, ' · ', time); row.append(heading, snippet, meta); list.append(row);
      }
    } catch (error) { if (token === version) status.textContent = error.name === 'AbortError' ? 'Sample news request timed out. Please retry.' : error.message || 'Sample news could not load. Please retry.'; }
    finally { clearTimeout(timeout); if (token === version) { load.disabled = false; panel.setAttribute('aria-busy', 'false'); document.querySelector('#news-skeleton').hidden = true; } }
  }
  load.addEventListener('click', refresh); void refresh();
}
