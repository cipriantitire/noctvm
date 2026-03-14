// ─────────────────────────────────────────────────────────────────────────────
// onevent.ro scraper
// Site: Romanian event listing platform
// Strategy: JSON-LD → HTML event cards → Open Graph meta
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const LIST_URLS = [
  { url: 'https://www.onevent.ro/orase/bucuresti/', city: 'Bucharest' },
  { url: 'https://www.onevent.ro/orase/constanta/', city: 'Constanta' },
];
const BASE_URL  = 'https://www.onevent.ro';

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
    const img = (b.image as any)?.url ?? b.image;
    const image_url = typeof img === 'string' ? img : '';

    events.push({
      title,
      venue: clean(((b.location as any)?.name as string) ?? 'Venue TBC'),
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url,
      event_url: String(b.url ?? ''),
      genres: guessGenres(title, description || ''),
      price: null,
      city,
    });
  }
  return events;
}

function fromHtml(html: string, city: string): ScrapedEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const events: ScrapedEvent[] = [];
  
  const cardRegex = /<a[^>]*class="[^"]*evcal_list_a[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(html)) !== null) {
    const outer = match[0];
    const inner = match[1];

    const titleMatch = inner.match(/<span[^>]*class="evcal_desc2"[^>]*>([\s\S]*?)<\/span>/i);
    const title = clean(titleMatch?.[1]?.replace(/<[^>]+>/g, '') ?? '');
    if (!title || title.length < 3) continue;

    const imgMatch = outer.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
    const image_url = imgMatch?.[1] ?? '';

    const dataDateMatch = outer.match(/data-event_start_date="([^"]+)"/);
    const parsedDate = (dataDateMatch ? parseDate(dataDateMatch[1]) : today) || today;
    if (parsedDate < today) continue;

    const eventUrlMatch = outer.match(/href="([^"]+)"/i);
    const event_url = eventUrlMatch?.[1] ?? '';

    events.push({
      title,
      venue: 'Venue TBC',
      date: parsedDate,
      time: null,
      description: null,
      image_url,
      event_url: event_url.startsWith('http') ? event_url : `${BASE_URL}${event_url}`,
      genres: guessGenres(title, ''),
      price: null,
      city,
    });
  }
  return events;
}

export async function scrapeOnevent(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  for (const { url, city } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 20_000); // Massive pages
      const fromLd = fromJsonLd(html, city);
      const fromH = fromHtml(html, city);
      
      // If LD gave us results, use them as they are richer; else fallback to HTML
      const cityBatch = fromLd.length > 5 ? fromLd : fromH;
      allEvents.push(...cityBatch);
    } catch (err) {
      console.warn(`[onevent] failed for ${url}:`, err);
    }
  }
  return allEvents;
}
