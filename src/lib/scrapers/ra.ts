// ─────────────────────────────────────────────────────────────────────────────
// Resident Advisor (ra.co) scraper
// Uses the official RA GraphQL API — most reliable source
// Bucharest area ID: 381 (Bucharest, Romania)
// Romania area ID: 50 (All Romania — parent area)
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { parseDate, clean, guessGenres, splitTitleVenue, fetchHtml, extractPriceFromHtml, extractDescriptionFromHtml, cleanJsonLdText } from './utils';

/**
 * Extract ticket price(s) from a 2nite.ro event page.
 * The ticket section uses Vue SFC scoped attributes (data-v-d4d38425).
 * Each ticket row has a price div like:  <div data-v-d4d38425="" class="">50 RON </div>
 * We collect all prices and return min-max range (or single price).
 */
async function extract2nitePrice(url: string): Promise<string | null> {
  try {
    const html = await fetchHtml(url, 10_000);
    // Target: price divs in the 2nite ticket section
    // Pattern: <div data-v-d4d38425="" class="">50 RON </div>
    const priceMatches = Array.from(
      html.matchAll(/data-v-d4d38425[^>]*class="[^"]*"[^>]*>\s*(\d+(?:[.,]\d+)?)\s*(RON|lei|EUR|€)\s*<\/div>/gi)
    );
    if (priceMatches.length === 0) {
      // Fallback: generic price pattern in 2nite ticket section scope
      const fallbackMatches = Array.from(
        html.matchAll(/<div[^>]*data-v-d4d38425[^>]*>([^<]{2,30})<\/div>/gi)
      ).filter(m => /\d+\s*(RON|lei|EUR)/i.test(m[1]));
      if (fallbackMatches.length > 0) {
        const nums = fallbackMatches
          .map(m => parseFloat(m[1].match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(',', '.') ?? ''))
          .filter(n => !isNaN(n) && n > 0)
          .sort((a, b) => a - b);
        if (nums.length > 0) {
          return nums.length === 1 ? `${nums[0]} RON` : `${nums[0]} - ${nums[nums.length - 1]} RON`;
        }
      }
      return null;
    }
    const prices = priceMatches
      .map(m => parseFloat(m[1].replace(',', '.')))
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
    if (prices.length === 0) return null;
    const min = prices[0];
    const max = prices[prices.length - 1];
    return min === max ? `${min} RON` : `${min} - ${max} RON`;
  } catch {
    return null;
  }
}

const RA_GRAPHQL = 'https://ra.co/graphql';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36';

// RA area ID for Bucharest, Romania is 381 (verified via GraphQL).
// Romania parent area is 50; subregions: Bucharest=381, Cluj-Napoca=382, Iasi=383, Timisoara=546
// Constanta doesn't have its own RA area — Sunwaves/Mamaia events appear under area 50 (All Romania)
const BUCHAREST_AREA_ID = 381;
const ROMANIA_AREA_ID = 50;

const QUERY = `
  query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) {
    eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: { attending: { priority: 1, order: DESCENDING } }) {
      data {
        id
        listingDate
        event {
          id
          title
          attending
          date
          contentUrl
          flyerFront
          lineup
          images {
            filename
            type
          }
          promotionalLinks {
            title
            url
          }
          ticketing {
            ticketListingItems {
              ... on Ticketing_TicketTierV2 {
                title
                ticketCost {
                  displayPrice
                }
              }
            }
          }
          venue {
            id
            name
            contentUrl
            live
          }
          cost
        }
      }
    }
  }
`;

interface RAEvent {
  id: string;
  title: string;
  date: string;
  contentUrl: string;
  flyerFront?: string;
  images?: { filename: string; type: string }[];
  venue: { name: string; contentUrl: string } | null;
  cost?: string;
  promotionalLinks?: { title: string; url: string }[];
  ticketing?: {
    ticketListingItems?: any[];
  } | null;
}

/**
 * Specialized parser for RA detail pages.
 * Handles promotional links, cost labels, and internal RA ticket iframes.
 */
export async function parseRADetailPage(url: string, city: string): Promise<ScrapedEvent | null> {
  try {
    const html = await fetchHtml(url);
    const today = new Date().toISOString().split('T')[0];

    // 1. Basic Metadata (Title, Date, Venue)
    // RA detail pages often have JSON-LD or we can extract from HTML
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const rawTitle = clean(titleMatch?.[1] || '');
    if (!rawTitle) return null;
    
    const { title, venueHint } = splitTitleVenue(rawTitle);

    // Date/Time
    const dateMatch = html.match(/"startDate"\s*:\s*"([^"]+)"/);
    const startDate = dateMatch?.[1] || '';
    const date = parseDate(startDate);
    if (!date || date < today) return null;
    const time = startDate.includes('T') ? startDate.split('T')[1].slice(0, 5) : null;

    // Venue
    const venueMatch = html.match(/"location"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
    const venue = clean(venueMatch?.[1] || venueHint || 'Venue TBC');

    // Image
    const imageMatch = html.match(/"image"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/) || html.match(/"image"\s*:\s*"([^"]+)"/);
    let image_url = imageMatch?.[1] || '';
    if (image_url) {
      image_url = image_url.replace(/\\u002F/g, '/').replace(/\\/g, '');
    }

    // Description
    const descMatch = html.match(/"description"\s*:\s*"([^"]+)"/);
    const jsonDesc = cleanJsonLdText(descMatch?.[1] || '');
    const htmlDesc = extractDescriptionFromHtml(html) || '';
    const description = htmlDesc.length > jsonDesc.length ? htmlDesc : jsonDesc;

    // CHECK FOR SOLD OUT - Strict word boundary check
    let isSoldOut = false;
    if (/\bSOLD OUT\b/i.test(rawTitle) || /\bSOLD OUT\b/gi.test(description)) {
      isSoldOut = true;
    }

    // 2. Ticket Link Extraction (Promotional Links)
    let ticket_url: string | null = null;
    // Look for links or spans with href containing "Tickets" or known seller names
    // RA renders these as <span href="...">Tickets</span> or <span>2nite</span>
    const promoTicketRegex = /<(?:a|span)[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>(?:Tickets|2nite|iabilet|Eventbook|Livetickets|Control)<\/(?:a|span)>/i;
    const promoMatch = html.match(promoTicketRegex);
    if (promoMatch) {
      ticket_url = promoMatch[1];
    } else {
      // Sometimes it's nested: <a href="..."><span ...>Tickets</span></a>
      const nestedPromoRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>[\s\S]*?(?:Tickets|2nite|iabilet|Eventbook|Livetickets|Control)[\s\S]*?<\/a>/i;
      const nestedMatch = html.match(nestedPromoRegex);
      if (nestedMatch) {
        ticket_url = nestedMatch[1];
      }
    }

    // 3. Price Extraction
    let price: string | null = null;
    
    // Pattern A: Internal RA Tickets (Iframe) - HIGHEST PRIORITY
    // Example: <iframe ... src="/widget/event/2337785/embedtickets??" ...></iframe>
    const iframeRegex = /<iframe[^>]+src=["'](\/widget\/event\/\d+\/embedtickets[^"']+)["']/i;
    const iframeMatch = html.match(iframeRegex);
    if (iframeMatch) {
      const iframeSrc = `https://ra.co${iframeMatch[1]}`;
      try {
        const iframeHtml = await fetchHtml(iframeSrc);
        // Parse prices from the iframe: <div class="type-price">101,70 lei</div>
        const priceMatches = Array.from(iframeHtml.matchAll(/<div class="type-price">([\d.,]+)\s*(?:lei|RON|EUR|€)<\/div>/gi));
        if (priceMatches.length > 0) {
          const numericPrices = priceMatches
            .map(m => parseFloat(m[1].replace(',', '.')))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        
          if (numericPrices.length > 0) {
            const min = Math.round(numericPrices[0]);
            const max = Math.round(numericPrices[numericPrices.length - 1]);
            price = min === max ? `${min} RON` : `${min} - ${max} RON`;
          }
        }
        
        // If internal tickets are on sale, the ticket_url should be the event page itself (where the iframe is)
        if (!ticket_url && iframeHtml.includes('class="onsale')) {
          ticket_url = url;
        }
      } catch (err) {
        console.warn(`[ra] Failed to fetch tickets iframe for ${url}`, err);
      }
    }
    
    // Pattern B: Description Parsing (e.g., "50 lei • door deal")
    if (!price && !isSoldOut) {
      const descPriceRegex = /(\d+(?:[.,]\d+)?)\s*(?:lei|RON|EUR|€)/i;
      const descMatch = description.match(descPriceRegex);
      if (descMatch) {
        const val = parseFloat(descMatch[1].replace(',', '.'));
        price = `${Math.round(val)} RON`;
        if (description.toLowerCase().includes('euro') || description.includes('€')) {
          price = `${Math.round(val)} EUR`;
        }
      }
    }
    
    // REMOVED: Pattern C: External Scraping (Eventbook/Livetickets/2nite)
    // Reason: External site scraping should be handled by dedicated scrapers, not RA scraper
    // The deduplication layer will merge data from RA and venue-specific scrapers
    
    // Pattern D: "Cost" label followed by a value
    if (!price && !isSoldOut) {
      // Example: <span ...>Cost</span></div><span ...>90</span>
      const costRegex = /Cost<\/span><\/div><span[^>]*>(\d+(?:[.,]\d+)?)<\/span>/i;
      const costMatch = html.match(costRegex);
      if (costMatch) {
        const val = parseFloat(costMatch[1].replace(',', '.'));
        price = isNaN(val) ? costMatch[1] : `${Math.round(val)} RON`;
      }
    }
    
    // Pattern E: Fallback price from generic pattern
    if (!price && !isSoldOut) {
      const genericPriceMatch = html.match(/(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI|EUR|€)/i);
      if (genericPriceMatch) {
        price = `${Math.round(parseFloat(genericPriceMatch[1].replace(',', '.')))} RON`;
      }
    }
    
    if (isSoldOut) price = 'SOLD OUT';

    const genres = guessGenres(title, description);
    
    return {
      title,
      venue,
      date: date,
      time,
      description,
      image_url,
      event_url: url,
      ticket_url,
      genres: genres || ['Electronic'],
      price,
      city,
    };
  } catch (e) {
    console.warn(`[ra] failed to parse detail page ${url}:`, e);
    return null;
  }
}

/**
 * Custom batch fetcher for RA to avoid dependency on utils.ts's hardcoded parseDetailPage
 * Uses small batches with delays between them to avoid RA rate-limiting.
 */
async function batchFetchRA(urls: string[], city: string, limit = 60, batchSize = 3): Promise<ScrapedEvent[]> {
  const results: ScrapedEvent[] = [];
  const capped = urls.slice(0, limit);

  for (let i = 0; i < capped.length; i += batchSize) {
    const chunk = capped.slice(i, i + batchSize);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (url) => {
        // Small jitter per-request within chunk
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
        return parseRADetailPage(url, city);
      })
    );
    for (const r of chunkResults) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
    // Respectful delay between batches to avoid rate-limiting
    if (i + batchSize < capped.length) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    }
  }
  return results;
}

export async function scrapeRA(settings?: { scan_depth?: number, limit?: number }): Promise<ScrapedEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const threeMonthsFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const scanDepth = settings?.scan_depth || 100;

  const fetchForArea = async (areaId: number, cityLabel: string, fetchLimit: number): Promise<ScrapedEvent[]> => {
    console.log(`[ra] [DEBUG V2] fetchForArea starting for ${cityLabel} (area: ${areaId})`);
    try {
      const res = await fetch(RA_GRAPHQL, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/json',
          'Referer': 'https://ra.co/',
        },
        body: JSON.stringify({
          query: QUERY,
          variables: {
            filters: {
              areas: { eq: areaId },
              listingDate: { gte: today, lte: threeMonthsFromNow },
            },
            pageSize: scanDepth,
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[ra] ${cityLabel} fetch failed with status: ${res.status}`);
        return [];
      }
      const json = await res.json();
      const listings = json.data?.eventListings?.data ?? [];
      console.log(`[ra] [DEBUG V2] ${cityLabel} decoded JSON, found ${listings.length} listings`);

      const urls = listings
        .map((l: any) => l.event?.contentUrl ? `https://ra.co${l.event.contentUrl}` : null)
        .filter(Boolean) as string[];

      // Deep-fetch RA detail pages to get descriptions
      // Use limit from settings or a safe default (Vercel friendly)
      const detailLimit = settings?.limit || fetchLimit;
      const detailedEvents = await batchFetchRA(urls, cityLabel, detailLimit, 10);

      const urlToListing = new Map(listings.map((l: any) => [`https://ra.co${l.event?.contentUrl}`, l.event]));
      console.log(`[ra] ${cityLabel}: Deep-fetched ${detailedEvents.length} events from detail pages`);

      // Fallback: If deep-fetch returned fewer events than listings, fill in from listings
      const detailedUrls = new Set(detailedEvents.map(e => e.event_url));
      const fallbackEvents: ScrapedEvent[] = listings
        .filter((l: any) => l.event?.contentUrl && !detailedUrls.has(`https://ra.co${l.event.contentUrl}`))
        .map((l: any) => {
          const e = l.event as RAEvent;
          const title = clean(e.title);
          const description = ""; 
          let genres = guessGenres(title, description);
          
          if (!genres || genres.length === 0) {
            genres = ['Electronic'];
          }

          let price: string | null = null;
          let ticket_url: string = `https://ra.co${e.contentUrl}`;

          // Resolve Ticket Link
          const gqlTicketLink = e.promotionalLinks?.find(pl => 
            pl.title.toLowerCase().includes('ticket') || 
            pl.url.toLowerCase().includes('iabilet.ro') ||
            pl.url.toLowerCase().includes('eventbook.ro') ||
            pl.url.toLowerCase().includes('livetickets.ro') ||
            pl.url.toLowerCase().includes('2nite.ro') ||
            pl.url.toLowerCase().includes('control-club.ro')
          );
          if (gqlTicketLink) ticket_url = gqlTicketLink.url;

          // Resolve Price
          const tiers = e.ticketing?.ticketListingItems || [];
          if (tiers.length > 0) {
            const prices = tiers
              .map(t => t.ticketCost?.displayPrice)
              .filter(p => typeof p === 'number')
              .sort((a, b) => a - b);
            if (prices.length > 0) {
              const min = Math.round(prices[0]);
              const max = Math.round(prices[prices.length - 1]);
              price = min === max ? `${min} RON` : `${min} - ${max} RON`;
            }
          }

          if (!price && e.cost) {
            const numeric = parseFloat(e.cost.replace(',', '.'));
            price = isNaN(numeric) ? e.cost : `${Math.round(numeric)} RON`;
            if (e.cost.toLowerCase().includes('euro') || e.cost.includes('€')) {
              price = isNaN(numeric) ? e.cost : `${Math.round(numeric)} EUR`;
            }
          }

          if (title.toUpperCase().includes('SOLD OUT')) {
            price = 'SOLD OUT';
          }

          return {
            title,
            venue: clean(e.venue?.name || 'Venue TBC'),
            date: e.date.split('T')[0],
            time: e.date.includes('T') ? e.date.split('T')[1].slice(0, 5) : null,
            description,
            image_url: e.images?.[0]?.filename || e.flyerFront || '',
            event_url: `https://ra.co${e.contentUrl}`,
            ticket_url,
            genres,
            price,
            city: cityLabel,
          };
        });

      const allEvents = [...detailedEvents, ...fallbackEvents];
      
      // ENRICHMENT: Map GraphQL data to results
      for (let i = 0; i < allEvents.length; i += 10) {
        const chunk = allEvents.slice(i, i + 10);
        await Promise.allSettled(chunk.map(async (dev) => {
          const lEvent = urlToListing.get(dev.event_url) as RAEvent;
          if (!lEvent) return;

          // 1. External Ticket Links from GraphQL (Highly Reliable)
          const gqlTicketLink = lEvent.promotionalLinks?.find(pl => 
            pl.title.toLowerCase().includes('ticket') || 
            pl.url.toLowerCase().includes('iabilet.ro') ||
            pl.url.toLowerCase().includes('eventbook.ro') ||
            pl.url.toLowerCase().includes('livetickets.ro') ||
            pl.url.toLowerCase().includes('entertix.ro') ||
            pl.url.toLowerCase().includes('2nite.ro') ||
            pl.url.toLowerCase().includes('control-club.ro')
          );
          if (gqlTicketLink) dev.ticket_url = gqlTicketLink.url;

          // 2. Price Ranges from GraphQL Tiers (Internal RA)
          const tiers = lEvent.ticketing?.ticketListingItems || [];
          if (tiers.length > 0) {
            const prices = tiers
              .map(t => t.ticketCost?.displayPrice)
              .filter(p => typeof p === 'number')
              .sort((a, b) => a - b);
            
            if (prices.length > 0) {
              const min = Math.round(prices[0]);
              const max = Math.round(prices[prices.length - 1]);
              dev.price = min === max ? `${min} RON` : `${min} - ${max} RON`;
            }
          }

          // 3. Fallback to Listing Cost
          if ((!dev.price || dev.price === 'FREE') && lEvent.cost) {
            const numeric = parseFloat(lEvent.cost.replace(',', '.'));
            let fallbackPrice = isNaN(numeric) ? lEvent.cost : `${Math.round(numeric)} RON`;
            if (lEvent.cost.toLowerCase().includes('euro') || lEvent.cost.includes('€')) {
              fallbackPrice = isNaN(numeric) ? lEvent.cost : `${Math.round(numeric)} EUR`;
            }
            dev.price = fallbackPrice;
          }

          // 4. PROACTIVE WIDGET FETCHING (If internal and price is still simple or missing)
          if ((!dev.price || dev.price.split(' ').length === 2) && dev.ticket_url?.includes('ra.co/events/')) {
            const eventId = dev.event_url.split('/').pop();
            if (eventId) {
              const widgetUrl = `https://ra.co/widget/event/${eventId}/embedtickets`;
              try {
                const widgetHtml = await fetchHtml(widgetUrl);
                const priceMatches = Array.from(widgetHtml.matchAll(/<div class="type-price">([\d.,]+)\s*(?:lei|RON|EUR|€)<\/div>/gi));
                if (priceMatches.length > 0) {
                  const numericPrices = priceMatches
                    .map(m => parseFloat(m[1].replace(',', '.')))
                    .filter(n => !isNaN(n))
                    .sort((a, b) => a - b);
                  if (numericPrices.length > 0) {
                    const min = Math.round(numericPrices[0]);
                    const max = Math.round(numericPrices[numericPrices.length - 1]);
                    dev.price = min === max ? `${min} RON` : `${min} - ${max} RON`;
                  }
                }
              } catch (e) { /* ignore */ }
            }
          }

          // 5. PROACTIVE EXTERNAL SCRAPING (If price is still missing)
          if (!dev.price && dev.ticket_url) {
            const turl = dev.ticket_url;
            if (turl.includes('2nite.ro')) {
              const p = await extract2nitePrice(turl);
              if (p) dev.price = p;
            } else if (turl.includes('eventbook.ro') || turl.includes('livetickets.ro') || turl.includes('control-club.ro')) {
              try {
                const extHtml = await fetchHtml(turl);
                const extPrice = extractPriceFromHtml(extHtml);
                if (extPrice && extPrice !== 'FREE') dev.price = extPrice;
              } catch (e) { /* ignore */ }
            }
          }

          // 6. SOLD OUT check
          if (dev.title.toUpperCase().includes('SOLD OUT')) dev.price = 'SOLD OUT';

          // 7. Image enrichment
          if (lEvent.images && lEvent.images.length > 0) {
            dev.image_url = lEvent.images[0].filename;
          } else if (!dev.image_url && lEvent.flyerFront) {
            dev.image_url = lEvent.flyerFront;
          }
        }));
      }
      
      console.log(`[ra] ${cityLabel}: Enriched ${allEvents.length} events`);
      return allEvents;
    } catch (e) {
      console.warn(`[ra] failed for ${cityLabel}:`, e);
      return [];
    }
  };

  const [bucharest, romania] = await Promise.all([
    fetchForArea(BUCHAREST_AREA_ID, 'Bucharest', 60),
    fetchForArea(ROMANIA_AREA_ID, 'Constanta', 20)
  ]);

  // Filter romania events for only those that mention Constanta in venue or description
  const combined = [...bucharest, ...romania.filter(e => 
    e.venue.toLowerCase().includes('constanta') || 
    e.venue.toLowerCase().includes('mamaia') ||
    (e.description?.toLowerCase().includes('constanta') || false)
  )];

  return combined;
}
