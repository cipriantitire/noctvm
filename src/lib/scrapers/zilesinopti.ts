// ─────────────────────────────────────────────────────────────────────────────
// Zilesinopti.ro scraper
// Site: WordPress + The Events Calendar plugin
// Strategy: JSON-LD extraction from listing page, fallback to HTML article cards
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const BASE_URL = 'https://zilesinopti.ro';
const LIST_URL = `${BASE_URL}/evenimente/`;

/** Try to extract events from JSON-LD blocks embedded in the page. */
function fromJsonLd(html: string): ScrapedEvent[] {
  const blocks = extractJsonLd(html);
  const events: ScrapedEvent[] = [];

  for (const block of blocks) {
    const b = block as Record<string, unknown>;
    const type = (b['@type'] as string) ?? '';
    if (type !== 'Event' && !type.includes('Event')) continue;

    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (!date) continue;

    // Skip past events
    if (date < new Date().toISOString().split('T')[0]) continue;

    const location = (b.location as Record<string, unknown>) ?? {};
    const venue = clean(
      (location.name as string) ??
      (location.address as string) ??
      'Venue TBC'
    );

    const title = clean(b.name as string);
    if (!title) continue;

    const description = clean(b.description as string);
    const image = (() => {
      const img = b.image;
      if (typeof img === 'string') return img;
      if (Array.isArray(img)) return (img[0] as Record<string, unknown>)?.url as string ?? '';
      if (typeof img === 'object' && img) return (img as Record<string, unknown>).url as string ?? '';
      return '';
    })();

    const eventUrl = String(b.url ?? b['@id'] ?? '');
    const offers = (b.offers as Record<string, unknown>) ?? {};
    const priceSpec = offers.price;
    const price = priceSpec != null
      ? (String(priceSpec) === '0' ? 'Free' : `${priceSpec} RON`)
      : null;

    events.push({
      title,
      venue,
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url: image,
      event_url: eventUrl || LIST_URL,
      genres: guessGenres(title, description),
      price,
    });
  }

  return events;
}

/** Fallback: parse event article cards from The Events Calendar HTML. */
function fromHtml(html: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];

  // Each event is wrapped in <article class="type-tribe_events ...">
  const articleRegex = /<article[^>]*class="[^"]*tribe_events[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  let art: RegExpExecArray | null;

  while ((art = articleRegex.exec(html)) !== null) {
    const block = art[1];

    // Title + URL
    const titleMatch = block.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*url[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
      ?? block.match(/<h[23][^>]*class="[^"]*tribe-event[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    const eventUrl = titleMatch[1];
    const title = clean(titleMatch[2].replace(/<[^>]+>/g, ''));
    if (!title) continue;

    // Date
    const dateMatch = block.match(/datetime="([^"]+)"/);
    const rawDate = dateMatch?.[1] ?? '';
    const date = parseDate(rawDate);
    if (!date || date < new Date().toISOString().split('T')[0]) continue;

    // Venue
    const venueMatch = block.match(/<address[^>]*>([\s\S]*?)<\/address>/i)
      ?? block.match(/class="[^"]*venue[^"]*"[^>]*>([\s\S]*?)<\//i);
    const venue = clean(venueMatch?.[1]?.replace(/<[^>]+>/g, '') ?? 'Venue TBC');

    // Image
    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/i);
    const image_url = imgMatch?.[1] ?? '';

    events.push({
      title,
      venue,
      date,
      time: extractTime(rawDate),
      description: null,
      image_url,
      event_url: eventUrl,
      genres: guessGenres(title, ''),
      price: null,
    });
  }

  return events;
}

export async function scrapeZilesinopti(): Promise<ScrapedEvent[]> {
  try {
    const html = await fetchHtml(LIST_URL);
    const jsonLdEvents = fromJsonLd(html);
    if (jsonLdEvents.length > 0) return jsonLdEvents;
    return fromHtml(html);
  } catch (err) {
    console.warn('[zilesinopti] scrape failed:', err);
    return [];
  }
}
