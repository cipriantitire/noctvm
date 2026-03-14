// ─────────────────────────────────────────────────────────────────────────────
// ambilet.ro scraper
// Site: Romanian ticketing platform
// Strategy: JSON-LD extraction + HTML card parsing
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const LIST_URLS = [
  { url: 'https://www.ambilet.ro/orase/bucuresti/', city: 'Bucharest' },
  { url: 'https://www.ambilet.ro/orase/constanta/', city: 'Constanta' },
];
const BASE_URL  = 'https://www.ambilet.ro';

function fromJsonLd(html: string, city: string): ScrapedEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const events: ScrapedEvent[] = [];

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    if (String(b['@type'] ?? '') !== 'Event' && !String(b['@type'] ?? '').includes('Event')) continue;

    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (!date || date < today) continue;

    const location = (b.location as Record<string, unknown>) ?? {};
    const venue = clean(String(location.name ?? 'Venue TBC'));
    const title = clean(b.name as string);
    if (!title) continue;

    const description = clean(b.description as string);
    const img = b.image;
    const image_url = typeof img === 'string' ? img
      : Array.isArray(img) ? (img[0]?.url || img[0] || '')
      : (img as any)?.url ?? '';

    const offers = b.offers as Record<string, unknown> | undefined;
    const price = offers?.price != null
      ? (Number(offers.price) === 0 ? 'Free' : `${offers.price} RON`)
      : null;

    const genres = guessGenres(title, description || '');
    if (!genres) continue;

    events.push({
      title,
      venue,
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url,
      event_url: String(b.url ?? ''),
      genres,
      price,
      city,
    });
  }

  return events;
}

function fromHtml(html: string, city: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Search for the Start of an event div and capture up to the title (h3)
  const cardRegex = /<div[^>]*class="[^"]*\bevent\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[1];
    
    // 1. Extract Event URL
    const linkMatch = block.match(/href="([^"]+)"/i);
    if (!linkMatch) continue;
    let eventUrl = linkMatch[1];
    if (!eventUrl.startsWith('http')) eventUrl = `${BASE_URL}${eventUrl}`;
    if (seen.has(eventUrl)) continue;
    seen.add(eventUrl);

    // 2. Extract Title
    const title = clean(block.split('<h3')[1]?.replace(/<[^>]+>/g, '') || block.replace(/<[^>]+>/g, '').trim().split('\n')[0]);
    if (!title || title.length < 3) continue;

    // 3. Extract Image
    const imgMatch = block.match(/background-image:\s*url\(([^)]+)\)/i) || block.match(/<img[^>]+src="([^"]+)"/i);
    const image_url = clean(imgMatch?.[1]?.replace(/['"]/g, '') ?? '');

    // 4. Extract Date and Venue
    const dateBoxMatch = block.match(/class="[^"]*bg-ab-red[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const dateStr = clean(dateBoxMatch?.[1]?.replace(/<[^>]+>/g, ''));
    
    const date = dateStr ? parseDate(dateStr) : null;
    if (!date || date < today) continue;

    const textMatch = block.match(/class="[^"]*text-gray-500[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || 
                      block.match(/class="[^"]*text-slate-800[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const rawText = clean(textMatch?.[1]?.replace(/<[^>]+>/g, '') ?? '');

    const genres = guessGenres(title, '');
    if (!genres) continue;

    events.push({
      title,
      venue: rawText.split(',')[0] || 'Venue TBC',
      date,
      time: null,
      description: null,
      image_url,
      event_url: eventUrl,
      genres,
      price: null,
      city,
    });
  }

  return events;
}

export async function scrapeAmbilet(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  for (const { url, city } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);
      const fromLd = fromJsonLd(html, city);
      const fromH = fromHtml(html, city);
      
      // Merge results, preferring LD if URL matches
      const seen = new Set(fromLd.map(e => e.event_url));
      const cityBatch = [...fromLd];
      for (const h of fromH) {
        if (!seen.has(h.event_url)) {
          cityBatch.push(h);
        }
      }
      allEvents.push(...cityBatch);
    } catch (err) {
      console.warn(`[ambilet] failed for ${url}:`, err);
    }
  }
  return allEvents;
}
