// ─────────────────────────────────────────────────────────────────────────────
// clubguesthouse.ro direct scraper
// Site: Server-rendered program listing at /program
// Strategy:
//   1. Fetch the listing page
//   2. Parse event blocks from program_item cards
//   3. Extract title/date/artists/price/description/image without deep-fetching
//   All events are mapped to venue "Club Guesthouse" in Bucharest
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { clean, extractPriceRangeFromText, fetchHtml, guessGenres, parseDate } from './utils';

const PROGRAM_URL = 'https://www.clubguesthouse.ro/program';
const BASE_URL = 'https://www.clubguesthouse.ro';

interface ProgramItem {
  title: string;
  eventUrl: string;
  imageUrl: string;
  artists: string[];
  description: string | null;
  price: string | null;
  ticketUrl: string | null;
}

function toAbsoluteUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${BASE_URL}${trimmed}`;
  return `${BASE_URL}/${trimmed.replace(/^\.\//, '')}`;
}

function extractSection(block: string, sectionClass: 'event_artists' | 'event_ticket'): string {
  const re = new RegExp(
    `<div class="col-lg-4 ${sectionClass}">([\\s\\S]*?)<\\/div>\\s*(?=<div class="col-lg-4 event_|<\\/div>\\s*<\\/div>)`,
    'i',
  );
  return re.exec(block)?.[1] ?? '';
}

function extractArtists(artistsHtml: string): string[] {
  if (!artistsHtml) return [];

  const parsed = Array.from(artistsHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => clean(m[1]))
    .map((name) => name.replace(/^[•●◦⚫*\-]+\s*/, '').trim())
    .filter((name) => !!name && !/^artists:?$/i.test(name));

  if (parsed.length > 0) {
    return Array.from(new Set(parsed));
  }

  const fallback = clean(artistsHtml)
    .replace(/^artists:?\s*/i, '')
    .replace(/^[•●◦⚫*\-]+\s*/, '')
    .trim();

  return fallback ? [fallback] : [];
}

function extractTicketUrl(ticketHtml: string): string | null {
  if (!ticketHtml) return null;

  const hrefs = Array.from(ticketHtml.matchAll(/href=["']([^"']+)["']/gi))
    .map((m) => toAbsoluteUrl(m[1]))
    .filter(Boolean)
    .filter((href) => !/facebook\.com\/sharer|twitter\.com\/home|api\.whatsapp\.com/i.test(href));

  if (hrefs.length === 0) return null;

  // Prefer external ticket providers over internal event links.
  return hrefs.find((href) => !/clubguesthouse\.ro\/events\//i.test(href)) ?? hrefs[0];
}

function normalizePrice(ticketHtml: string): string | null {
  const ticketText = clean(ticketHtml);
  if (!ticketText) return null;

  const ranged = extractPriceRangeFromText(ticketText);
  if (ranged) return ranged;

  if (/sold\s*out|epuizat/i.test(ticketText)) return 'SOLD OUT';
  if (/free|gratuit|intrare\s+libera/i.test(ticketText)) return 'Free';
  return null;
}

function parseDateFromDayMonth(dayStr: string, monthStr: string, yearStr?: string): string | null {
  const day = Number(dayStr);
  const month = Number(monthStr);
  if (!Number.isFinite(day) || !Number.isFinite(month) || day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  const now = new Date();
  const year = yearStr
    ? Number(yearStr.length === 2 ? `20${yearStr}` : yearStr)
    : now.getFullYear();

  if (!Number.isFinite(year) || year < 2020 || year > 2100) return null;

  let parsed = parseDate(`${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`);
  if (!parsed) return null;

  // Year rollover handling for listings that only show DD.MM around New Year.
  if (!yearStr) {
    const today = now.toISOString().split('T')[0];
    if (parsed < today && now.getMonth() + 1 >= 11 && month <= 2) {
      parsed = parseDate(`${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year + 1}`);
    }
  }

  return parsed;
}

function parseDateFromTitleOrUrl(title: string, eventUrl: string): string | null {
  const titleMatch = title.match(/\bGH\s*(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/i)
    ?? title.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);

  if (titleMatch) {
    const fromTitle = parseDateFromDayMonth(titleMatch[1], titleMatch[2], titleMatch[3]);
    if (fromTitle) return fromTitle;
  }

  try {
    const slug = new URL(eventUrl).pathname.toLowerCase();
    const slugMatch = slug.match(/\bgh-(\d{1,2})-(\d{1,2})(?:\b|-)/i);
    if (!slugMatch) return null;
    return parseDateFromDayMonth(slugMatch[1], slugMatch[2]);
  } catch {
    return null;
  }
}

function parseProgramPage(html: string): ProgramItem[] {
  const items: ProgramItem[] = [];
  const itemRe = /<div class="col-lg-12 wow fadeIn program_item\b[\s\S]*?(?=<div class="col-lg-12 wow fadeIn program_item\b|<\/section>)/gi;

  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(html)) !== null) {
    const block = match[0];

    const titleMatch = block.match(/<div class="col-lg-12 prog_title[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    const title = clean(titleMatch[2]);
    const eventUrl = toAbsoluteUrl(titleMatch[1]);
    if (!title || !eventUrl) continue;

    const artistsHtml = extractSection(block, 'event_artists');
    const ticketHtml = extractSection(block, 'event_ticket');
    const shortDescriptionHtml = block.match(/<div class="event_short_description">([\s\S]*?)<\/div>/i)?.[1] ?? '';
    const imageUrl = toAbsoluteUrl(block.match(/<div class="col-lg-6 prog_thumb[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1] ?? '');

    items.push({
      title,
      eventUrl,
      imageUrl,
      artists: extractArtists(artistsHtml),
      description: clean(shortDescriptionHtml) || null,
      price: normalizePrice(ticketHtml),
      ticketUrl: extractTicketUrl(ticketHtml),
    });
  }

  return items;
}

export async function scrapeClubGuesthouse(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    const html = await fetchHtml(PROGRAM_URL, 15_000);
    const listingItems = parseProgramPage(html);
    console.log(`[clubguesthouse] found ${listingItems.length} event stubs on listing page`);

    for (const item of listingItems) {
      const date = parseDateFromTitleOrUrl(item.title, item.eventUrl);
      // Events without a date (e.g. AUTECHRE) might still be found by RA/LiveTickets
      // and matched in the orchestrator sweeper. Keep them with a sentinel date.
      const effectiveDate = date || today;
      
      const artistsLine = item.artists.length > 0 ? `Artists: ${item.artists.join(', ')}` : '';
      const description = clean([artistsLine, item.description ?? ''].filter(Boolean).join(' ')) || null;

      const genres = guessGenres(item.title, `${artistsLine} ${item.description ?? ''}`, 'Club Guesthouse') || ['Electronic'];

      events.push({
        title: item.title,
        venue: 'Club Guesthouse',
        date: effectiveDate,
        time: null,
        description,
        image_url: item.imageUrl,
        event_url: item.eventUrl,
        ticket_url: item.ticketUrl,
        genres,
        price: item.price,
        city: 'Bucharest',
      });
    }

    console.log(`[clubguesthouse] kept ${events.length} music events`);
  } catch (err) {
    console.warn('[clubguesthouse] failed:', err);
  }

  return events;
}
