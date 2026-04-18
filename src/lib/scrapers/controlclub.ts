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

function extractEmbeddedTicketUrl(html: string): string | null {
  const embeddedMatch = html.match(/"ticket_url":"(https:\\\/\\\/[^"]+)"/i);
  return embeddedMatch ? embeddedMatch[1].replace(/\\\//g, '/') : null;
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
      `slug=${slugEscaped}[\\s\\S]{0,1000}?href=["'](https?://[^"']*(?:iabilet|ambilet|eventbook|bilete\\.emagic|livetickets)[^"']+)["']`,
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
    const embeddedTicketUrl = extractEmbeddedTicketUrl(html);

    // Control Club is trusted source; keep events even if generic genre heuristics are uncertain.
    // This prevents valid venue events from being dropped by aggressive global filters.
    const genres = guessGenres(stub.title, description ?? '') || ['Live Music'];

    // Price detection — try sources in priority order
    let price: string | null = null;
    let ticketFromBottom: string | null = null;
    const isSoldOut = stub.title.includes('[SOLD OUT]');
    if (isSoldOut) {
      price = 'SOLD OUT';
    } else {
      // ── 1. FREE ENTRY / DOOR TICKET tags in server HTML ──────────────────────
      // <span class="tag black ">FREE ENTRY</span> is present in raw server HTML
      if (/FREE\s+ENTRY/i.test(html)) {
        price = 'Free';
      } else if (/DOOR\s+TICKET/i.test(html)) {
        price = 'Door';
      } else if (/intrare\s+liber[aă]|intrare\s+gratu[ií]t[aă]?/i.test(html.slice(0, 50000))) {
        price = 'Free';
      }

      // ── 2. buy_tickets.php API — prices are JS-injected, not in server HTML ──
      // Extract data-performance-id and call the API directly
      if (!price) {
        const perfIdMatch = html.match(/data-performance-id=["'](\d+)["']/i);
        if (perfIdMatch) {
          try {
            const perfId = perfIdMatch[1];
            const apiResp = await fetch('https://www.control-club.ro/php/buy_tickets.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `performance_id=${perfId}`,
              signal: AbortSignal.timeout(8000),
            });
            if (apiResp.ok) {
              const data = await apiResp.json() as {
                price?: string;
                display_text?: string;
                price_categories?: Array<{ price?: string; currency?: string }>;
              };

              if (data.price_categories && data.price_categories.length > 0) {
                const prices = data.price_categories
                  .map(c => parseFloat(c.price ?? ''))
                  .filter(p => !isNaN(p) && p > 0 && p < 5000)
                  .sort((a, b) => a - b);
                if (prices.length > 0) {
                  const unique = Array.from(new Set(prices));
                  price = unique.length === 1
                    ? `${unique[0]} RON`
                    : `${unique[0]} - ${unique[unique.length - 1]} RON`;
                }
              } else if (data.price) {
                const p = parseFloat(data.price);
                if (!isNaN(p) && p > 0) price = `${p} RON`;
              }
            }
          } catch { /* ignore API errors */ }
        }
      }

      // ── 3. div.event-top > div.bottom chunk scan (fallback for older pages) ──
      if (!price) {
        const eventTopIdx = html.search(/<div[^>]*class=["'][^"']*\bevent-top\b[^"']*["'][^>]*>/i);
        if (eventTopIdx >= 0) {
          const eventTopChunk = html.slice(eventTopIdx, eventTopIdx + 3000);
          const bottomIdx = eventTopChunk.search(/<div[^>]*class=["'][^"']*\bbottom\b[^"']*["'][^>]*>/i);
          if (bottomIdx >= 0) {
            const bottomChunk = eventTopChunk.slice(bottomIdx, bottomIdx + 1500);

            if (/intrare\s+liber[aă]|intrare\s+gratu[ií]t[aă]?|gratuit[aă]?\s+entry|free\s+entry/i.test(bottomChunk)) {
              price = 'Free';
            } else {
              const priceAmounts = Array.from(
                bottomChunk.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:lei|RON|EUR|€)/gi)
              )
                .map(m => parseFloat(m[1].replace(',', '.')))
                .filter(p => !isNaN(p) && p > 0 && p < 5000)
                .sort((a, b) => a - b);

              if (priceAmounts.length > 0) {
                const unique = Array.from(new Set(priceAmounts));
                price = unique.length === 1
                  ? `${unique[0]} RON`
                  : `${unique[0]} - ${unique[unique.length - 1]} RON`;
              }

              if (!stub.ticketUrl) {
                const linkMatch = bottomChunk.match(
                  /href=["'](https?:\/\/(?:www\.)?(?:ambilet|iabilet|eventbook|bilete\.emagic|livetickets)[^"']+)["']/i
                );
                if (linkMatch) ticketFromBottom = linkMatch[1];
              }
            }
          }
        }
      }

      // ── 4. Generic fallback ───────────────────────────────────────────────────
      if (!price) {
        const { extractPriceFromHtml } = await import('./utils');
        const htmlPrice = extractPriceFromHtml(html);
        if (htmlPrice && htmlPrice !== 'Free') {
          price = htmlPrice;
        } else {
          price = htmlPrice || price;
        }
      }
    }

    // Ticket link priority:
    // 1) explicit external seller links (from listing/detail),
    // 2) generic ticket extraction from page,
    // 3) RA link as fallback.
    let ticket_url: string | null = null;
    const raLinkMatch = html.match(/href=["'](https?:\/\/ra\.co\/events\/\d+)["']/i);
    if (stub.ticketUrl) {
      ticket_url = stub.ticketUrl;
    } else if (embeddedTicketUrl) {
      ticket_url = embeddedTicketUrl;
    } else if (ticketFromBottom) {
      ticket_url = ticketFromBottom;
    } else {
      const extracted = extractTicketsFromHtml(html);
      if (extracted) ticket_url = extracted;
      else if (raLinkMatch) ticket_url = raLinkMatch[1];
    }

    // Proactive external price fetching if price is missing
    if ((!price || /^door$/i.test(price)) && ticket_url) {
      try {
        if (ticket_url.includes('eventbook.ro') || ticket_url.includes('livetickets.ro') || ticket_url.includes('iabilet.ro') || ticket_url.includes('ambilet.ro')) {
          const { extractPriceFromHtml } = await import('./utils');
          for (let attempt = 0; attempt < 2 && !price; attempt++) {
            try {
              const extHtml = await fetchHtml(ticket_url, 12_000);
              const extPrice = extractPriceFromHtml(extHtml, ticket_url);
              if (extPrice && !/^free$/i.test(extPrice) && !/^0(?:\s|$)/.test(extPrice)) {
                price = extPrice;
                break;
              }
            } catch {
              // Retry once on transient external seller failures.
              await new Promise(resolve => setTimeout(resolve, 350));
            }
          }
        }
      } catch { /* ignore */ }
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
