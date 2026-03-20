// ─────────────────────────────────────────────────────────────────────────────
// control-club.ro direct scraper
// Site: Custom website with clean event listings at /events/
// Strategy:
//   1. Fetch the events listing page
//   2. Parse event links, dates, and ticket info from the HTML
//   3. Deep-fetch detail pages for images and descriptions
//   All events are at venue "Control Club"
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, clean, guessGenres, parseDate, extractOgMeta, extractTicketsFromHtml } from './utils';

const EVENTS_URL = 'https://www.control-club.ro/events/';
const DETAIL_BASE = 'https://www.control-club.ro/event/';

interface EventStub {
  title: string;
  url: string;
  date: string;        // YYYY-MM-DD
  time: string | null;  // HH:MM (UTC from Google Calendar link)
  ticketUrl: string | null;
}

/**
 * Parse event stubs from the listing page HTML.
 * The page has links like:
 *   [Event Title](https://www.control-club.ro/event/?slug=event-slug)
 * And Google Calendar links with dates:
 *   https://www.google.com/calendar/render?...&dates=20260320T180000Z/...
 * And optional BUY TICKETS links:
 *   [BUY TICKETS](https://www.iabilet.ro/bilete-...)
 */
function parseListingPage(html: string): EventStub[] {
  const stubs: EventStub[] = [];
  const seen = new Set<string>();
  const today = new Date().toISOString().split('T')[0];

  // Strategy: find all event links, then look for their associated calendar/ticket links
  // The page structure groups events by date with links in sequence:
  //   [Event Title](detail_url)
  //   [MORE INFO](detail_url)
  //   [BUY TICKETS](ticket_url)       -- optional
  //   [ADD TO CALENDAR](calendar_url)

  // Extract all event detail links
  const eventLinkRe = /href=["']((?:https?:\/\/www\.control-club\.ro)?\/?event\/\?slug=([^"'&]+))["'][^>]*>([^<]+)</gi;
  let m;
  while ((m = eventLinkRe.exec(html)) !== null) {
    let url = m[1];
    if (url.startsWith('/')) url = `https://www.control-club.ro${url}`;
    const slug = m[2];
    const linkText = m[3];
    const trimmedText = clean(linkText);

    // Skip "MORE INFO" / "ADD TO CALENDAR" links — we only want the event title links
    if (/^(MORE INFO|ADD TO CALENDAR|BUY TICKETS)$/i.test(trimmedText)) continue;

    if (seen.has(slug)) continue;
    seen.add(slug);

    // Try to find the corresponding Google Calendar link nearby for the date
    // Calendar links: dates=YYYYMMDDTHHMMSSZ/...
    const slugEscaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const calendarRe = new RegExp(
      `slug=${slugEscaped}[\\s\\S]{0,2000}?dates=(\\d{4})(\\d{2})(\\d{2})T(\\d{2})(\\d{2})`,
      'i'
    );
    const calMatch = html.match(calendarRe);

    let date: string | null = null;
    let time: string | null = null;
    if (calMatch) {
      date = `${calMatch[1]}-${calMatch[2]}-${calMatch[3]}`;
      time = `${calMatch[4]}:${calMatch[5]}`;
    }

    if (!date || date < today) continue;

    // Check for a ticket link nearby
    // Look for BUY TICKETS href after this event's slug but before the next slug
    let ticketUrl: string | null = null;
    const ticketRe = new RegExp(
      `slug=${slugEscaped}[\\s\\S]{0,1000}?href=["'](https?://[^"']*iabilet[^"']+)["']`,
      'i'
    );
    const ticketMatch = html.match(ticketRe);
    if (ticketMatch) {
      ticketUrl = ticketMatch[1];
    }

    // Skip cancelled/sold-out if title has prefix
    const isCancelled = /^\[cancelled\]/i.test(trimmedText);
    if (isCancelled) continue;

    const isSoldOut = /^\[sold out\]/i.test(trimmedText);
    const displayTitle = trimmedText
      .replace(/^\[(sold out|cancelled)\]\s*/i, '')
      .trim();

    stubs.push({
      title: isSoldOut ? `[SOLD OUT] ${displayTitle}` : displayTitle,
      url,
      date,
      time,
      ticketUrl,
    });
  }

  return stubs;
}

/**
 * Deep-fetch a Control Club event detail page for image, description, and price.
 */
async function fetchDetailPage(stub: EventStub): Promise<ScrapedEvent | null> {
  try {
    const html = await fetchHtml(stub.url, 10_000);
    const og = extractOgMeta(html);

    const description = clean(og['og:description'] || og['description'] || '') || null;
    const image_url = og['og:image'] || '';

    // Genre filter — Control Club is a music venue so most events pass
    const genres = guessGenres(stub.title, description ?? '');
    if (!genres) return null;

    // Price detection inside the HTML description content
    let price: string | null = null;
    const isSoldOut = stub.title.includes('[SOLD OUT]');
    if (isSoldOut) {
      price = 'SOLD OUT';
    } else {
      // Look for standard money strings in the HTML like "50 lei" or "50 RON"
      const descPriceRegex = /(\d+(?:[.,]\d+)?)\s*(?:lei|RON)/i;
      const match = html.match(descPriceRegex);
      if (match) price = `${Math.round(parseFloat(match[1].replace(',', '.')))} RON`;
    }

    // Try to extract ticket link. Prioritize RA link from the .buttons area as requested by user.
    let ticket_url: string | null = null;
    const raLinkMatch = html.match(/href=["'](https?:\/\/ra\.co\/events\/\d+)["']/i);
    if (raLinkMatch) {
      ticket_url = raLinkMatch[1];
    } else if (stub.ticketUrl) {
      ticket_url = stub.ticketUrl;
    } else {
      ticket_url = extractTicketsFromHtml(html);
    }

    // Proactive external price fetching if price is missing
    if (!price && ticket_url) {
      try {
        if (ticket_url.includes('eventbook.ro') || ticket_url.includes('livetickets.ro') || ticket_url.includes('iabilet.ro')) {
          const extHtml = await fetchHtml(ticket_url);
          const { extractPriceFromHtml } = await import('./utils');
          const extPrice = extractPriceFromHtml(extHtml);
          if (extPrice && extPrice !== 'FREE') price = extPrice;
        }
      } catch (e) { /* ignore */ }
    }

    return {
      title: stub.title,
      venue: 'Control Club',
      date: stub.date,
      time: stub.time,
      description,
      image_url,
      event_url: stub.url,
      ticket_url,
      genres,
      price,
      city: 'Bucharest',
    };
  } catch (err) {
    console.warn(`[controlclub] failed to fetch ${stub.url}:`, err);
    return null;
  }
}

export async function scrapeControlClub(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];

  try {
    const html = await fetchHtml(EVENTS_URL, 15_000);
    const stubs = parseListingPage(html);
    console.log(`[controlclub] found ${stubs.length} event stubs on listing page`);

    // Deep-fetch detail pages in batches of 10
    for (let i = 0; i < stubs.length; i += 10) {
      const chunk = stubs.slice(i, i + 10);
      const results = await Promise.allSettled(
        chunk.map(async (s) => {
          // Small jitter delay
          await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
          return fetchDetailPage(s);
        }),
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) allEvents.push(r.value);
      }
    }

    console.log(`[controlclub] kept ${allEvents.length} music events`);
  } catch (err) {
    console.warn('[controlclub] failed:', err);
  }

  return allEvents;
}
