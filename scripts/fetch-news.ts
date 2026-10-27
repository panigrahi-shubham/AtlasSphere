import { XMLParser } from 'fast-xml-parser';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const destination = fileURLToPath(new URL('../api/news.json', import.meta.url));
export const DEFAULT_FEEDS = ['https://www.metoffice.gov.uk/feed/syndication/news-rss.xml'];
const keywords = /\b(monsoon|cyclone|heatwave|heat wave|IMD|forecast|weather|storm|rainfall|flood)\b/i;
const parser = new XMLParser({ ignoreAttributes: false, processEntities: true });
const clean = (value: unknown) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export function parseNews(xml: string, source: string) {
  const rss = parser.parse(xml);
  const records = rss?.rss?.channel?.item ?? rss?.feed?.entry ?? [];
  return (Array.isArray(records) ? records : [records]).flatMap((entry: any) => {
    const headline = clean(entry.title);
    const snippet = clean(entry.description ?? entry.summary ?? entry['content:encoded']).slice(0, 200);
    const rawLink = typeof entry.link === 'object' ? entry.link?.['@_href'] : entry.link;
    try {
      const publishedAt = new Date(entry.pubDate ?? entry.published ?? entry.updated).toISOString();
      const link = new URL(String(rawLink));
      if (link.protocol !== 'https:' || !keywords.test(`${headline} ${snippet}`)) return [];
      return [{ headline, snippet, source, url: link.href, publishedAt }];
    } catch { return []; }
  });
}

export async function fetchNews({ feeds = DEFAULT_FEEDS, fetcher = fetch, output = destination, now = () => new Date() } = {}) {
  const outcomes = await Promise.allSettled(feeds.map(async url => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetcher(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Feed returned ${response.status}`);
      return parseNews(await response.text(), new URL(url).hostname);
    } finally { clearTimeout(timeout); }
  }));
  const successful = outcomes.filter((result): result is PromiseFulfilledResult<ReturnType<typeof parseNews>> => result.status === 'fulfilled');
  if (!successful.length) throw new Error('All weather news feeds failed; keeping the previous news file.');
  const items = [...new Map(successful.flatMap(result => result.value).map(item => [item.url, item])).values()]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 30);
  const data = { lastUpdated: now().toISOString(), items };
  const temporary = `${output}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(temporary, output);
  return data;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  fetchNews().then(data => console.log(`Saved ${data.items.length} weather news items.`)).catch(error => { console.error(error); process.exitCode = 1; });
}
