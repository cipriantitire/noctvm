// ─────────────────────────────────────────────────────────────────────────────
// eventbook.ro scraper
// Site: Romanian ticketing platform
// Strategy: HTML search results + JSON-LD extraction
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const LIST_URLS = [
  { url: 'https://eventbook.ro/event/search?term=Bucuresti', city: 'Bucharest' },
  { url: 'https://eventbook.ro/event/search?term=Constanta', city: 'Constanta' },
];
const BASE_URL = 'https://eventbook.ro';

export async function scrapeEventbook(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const { url, city } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);
      
      // 1. Find event links in search results - more robust regex
      // Eventbook links look like /music/event-name or /other/event-name
      const linkRegex = /href="\/([a-z-]+)\/([^"]+)"/gi;
      const seenLinks = new Set<string>();
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(html)) !== null) {
        const category = match[1];
        const slug = match[2];
        
        // Filter out obvious noise
        if (['about', 'contact', 'terms', 'privacy', 'blog', 'help'].includes(category)) continue;
        
        const link = `/${category}/${slug}`;
        if (!seenLinks.has(link)) {
          seenLinks.add(link);
        }
      }

      // 2. Fetch first 15 event pages to get rich JSON-LD
      const linksToFetch = Array.from(seenLinks).slice(0, 15);
      for (const link of linksToFetch) {
        try {
          const detailUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
          const detailHtml = await fetchHtml(detailUrl, 10_000);
          const fromLd = fromJsonLd(detailHtml, city);
          
          for (const ev of fromLd) {
            // Only add if it's music or guestures genres suggest its music
            if (link.includes('/music/') || ev.genres.length > 0) {
              ev.event_url = detailUrl;
              allEvents.push(ev);
            }
          }
        } catch (err) {
          console.warn(`[eventbook] detail failed for ${link}:`, err);
        }
      }

    } catch (err) {
      console.warn(`[eventbook] list failed for ${url}:`, err);
    }
  }
  return allEvents;
}

function fromJsonLd(html: string, city: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    const type = String(b['@type'] ?? '');
    if (!type.includes('Event')) continue;

    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (!date || date < today) continue;

    const title = clean(b.name as string);
    if (!title) continue;

    const description = clean(b.description as string);
    const location = (b.location as any)?.name ?? 'Venue TBC';
    const image = (b.image as any)?.url ?? b.image;
    
    // Genre filtering
    const genres = guessGenres(title, description || '');
    if (!genres) continue;

    events.push({
      title,
      venue: clean(location),
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url: typeof image === 'string' ? image : '',
      event_url: String(b.url ?? ''),
      genres,
      price: null,
      city,
    });
  }
  return events;
}
