// ─────────────────────────────────────────────────────────────────────────────
// Zilesinopti.ro scraper
// Site: WordPress + The Events Calendar plugin
// Strategy: JSON-LD extraction from listing page, fallback to HTML article cards
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const BASE_URL = 'https://zilesinopti.ro';
const LIST_URLS = [
  { url: 'https://zilesinopti.ro/evenimente-bucuresti/', city: 'Bucharest' },
  { url: 'https://zilesinopti.ro/evenimente-constanta/', city: 'Constanta' },
];

/** Try to extract events from JSON-LD blocks embedded in the page. */
function fromJsonLd(html: string, city: string): ScrapedEvent[] {
  const blocks = extractJsonLd(html);
  const events: ScrapedEvent[] = [];

  for (const block of blocks) {
    const b = block as Record<string, unknown>;
    const type = (b['@type'] as string) ?? '';
    if (type !== 'Event' && !type.includes('Event')) continue;

    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (!date) continue;

    const location = (b.location as Record<string, unknown>) ?? {};
    const venue = clean(
      (location.name as string) ??
      ((location.address as any)?.streetAddress as string) ??
      'Venue TBC'
    );

    const title = clean(b.name as string);
    if (!title) continue;

    const description = clean(b.description as string);
    const image = (() => {
      const img = b.image;
      if (typeof img === 'string') return img;
      if (Array.isArray(img)) return (img[0] as Record<string, unknown>)?.url as string ?? '';
      return (img as any)?.url as string ?? '';
    })();

    const genres = guessGenres(title, description);
    if (!genres) continue;

    events.push({
      title,
      venue,
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url: image,
      event_url: String(b.url ?? ''),
      genres,
      price: null,
      city,
    });
  }

  return events;
}

/** Fallback: parse event cards from HTML. */
async function fromHtml(html: string, city: string): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Specific container for Zile și Nopți "superwidgets"
  const cardRegex = /<div[^>]*class="[^"]*kzn-sw-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<h3[^>]*class="[^"]*kzn-sw-item-titlu[^"]*"[^>]*>([\s\S]*?)<\/h3>/i) || 
                       block.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    // Use link from h3 if available
    const linkMatch = titleMatch[0].match(/href="([^"]+)"/i);
    const eventUrl = linkMatch?.[1] ?? '';
    if (!eventUrl) continue;

    const title = clean(titleMatch[0].replace(/<[^>]+>/g, ''));
    if (!title || title.length < 3) continue;

    const dateMatch = block.match(/class="[^"]*kzn-one-event-date[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const rawDate = clean(dateMatch?.[1]?.replace(/<[^>]+>/g, '') ?? '');
    const date = parseDate(rawDate);
    if (!date || date < today) continue;

    const venueMatch = block.match(/class="[^"]*kzn-one-event-locatie[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                        block.match(/class="[^"]*kzn-loc-name[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const venue = clean(venueMatch?.[1]?.replace(/<[^>]+>/g, '') ?? 'Venue TBC');

    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/i);

    const genres = guessGenres(title, '');
    if (!genres) continue;

    let image = imgMatch?.[1] ?? '';
    // If no image in listing, try to fetch from detail page
    if (!image && eventUrl) {
      try {
        const detailHtml = await fetchHtml(eventUrl.startsWith('http') ? eventUrl : `${BASE_URL}${eventUrl}`, 5000);
        const ogImage = detailHtml.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
        image = ogImage?.[1] ?? '';
      } catch { /* skip */ }
    }

    events.push({
      title,
      venue,
      date,
      time: extractTime(rawDate),
      description: null,
      image_url: image,
      event_url: eventUrl.startsWith('http') ? eventUrl : `${BASE_URL}${eventUrl}`,
      genres,
      price: null,
      city,
    });
  }

  return events;
}

export async function scrapeZilesinopti(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  for (const { url, city } of LIST_URLS) {
    try {
      const html = await fetchHtml(url);
      const fromLd = fromJsonLd(html, city);
      const fromH = await fromHtml(html, city);
      allEvents.push(...(fromLd.length > 0 ? fromLd : fromH));
    } catch (err) {
      console.warn(`[zilesinopti] failed for ${url}:`, err);
    }
  }
  return allEvents;
}
