// ─────────────────────────────────────────────────────────────────────────────
// livetickets.ro scraper
// Site: Romanian ticketing platform (already in NOCTVM as a source)
// ─────────────────────────────────────────────────────────────────────────────
// livetickets.ro scraper
// Site: Romanian ticketing platform (already in NOCTVM as a source)
// Strategy: JSON-LD extraction + HTML card parsing
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const LIST_URLS = [
  { search: 'Bucuresti', city: 'Bucharest' },
  { search: 'Constanta', city: 'Constanta' },
];
const API_BASE = 'https://api.livetickets.ro/public/event-search?spc.numberOfRecords=1000&spc.pageNumber=1&src.search=';
const IMG_BASE = 'https://static.livetickets.ro/event/';
const WEB_BASE = 'https://www.livetickets.ro';

export async function scrapeLivetickets(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const { search, city } of LIST_URLS) {
    try {
      const url = `${API_BASE}${search}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
          'Flow-Language-Code': 'RO'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json() as any;
      const items = data.events?.items ?? [];

      for (const item of items) {
        const startDate = String(item.start_date ?? '');
        const date = parseDate(startDate);
        if (!date || date < today) continue;

        const title = clean(item.name);
        if (!title) continue;

        const description = clean(item.description?.replace(/<[^>]+>/g, ''));
        const image_url = item.image ? `${IMG_BASE}${item.image}` : '';
        const event_url = item.url ? (item.url.startsWith('http') ? item.url : `${WEB_BASE}/bilete/${item.url}`) : '';

        const price = item.price_min != null 
          ? (Number(item.price_min) === 0 ? 'Free' : `${item.price_min} ${item.currency?.symbol ?? 'RON'}`)
          : null;

        const genres = guessGenres(title, description || '');
        if (!genres) continue;

        allEvents.push({
          title,
          venue: clean(item.location ?? 'Venue TBC'),
          date,
          time: extractTime(startDate),
          description: description || null,
          image_url,
          event_url,
          genres,
          price,
          city,
        });
      }
    } catch (err) {
      console.warn(`[livetickets] failed for ${search}:`, err);
    }
  }
  return allEvents;
}
