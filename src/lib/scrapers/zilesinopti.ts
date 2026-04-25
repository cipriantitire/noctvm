// ─────────────────────────────────────────────────────────────────────────────
// Zilesinopti.ro scraper
// Site: WordPress + The Events Calendar plugin + custom "kzn" widget
// Strategy:
//   Use curated city/music listing pages instead of the generic mixed feed —
//   this avoids garbage dates and off-topic events.
//   Listing-page JSON-LD is intentionally SKIPPED — it injects similar-events
//   blocks from other pages, causing wrong titles and crazy years (2647, 3049).
//   Instead: collect /evenimente/ URLs from HTML cards → deep-fetch detail pages.
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, parseDetailPage, parseDate, clean, containsUnexpectedCitySignal, guessGenres, isArtifactRiddenText } from './utils';

const BASE_URL = 'https://zilesinopti.ro';

// Music-specific category page — clean, curated signal
const LIST_URLS = [
  {
    url: 'https://zilesinopti.ro/program-concerte-bucuresti/',
    city: 'Bucharest',
    allowedCities: ['bucuresti', 'bucharest', 'ilfov', 'sector'],
  },
  {
    url: 'https://zilesinopti.ro/program-party-bucuresti/',
    city: 'Bucharest',
    allowedCities: ['bucuresti', 'bucharest', 'ilfov', 'sector'],
  },
  {
    url: 'https://zilesinopti.ro/evenimente-constanta-weekend/',
    city: 'Constanta',
    allowedCities: ['constanta', 'mamaia', 'corbu', 'culmea', 'costinesti', 'eforie', 'mangalia', 'navodari', 'vama veche', '2 mai'],
  },
  {
    url: 'https://zilesinopti.ro/evenimente-constanta/',
    city: 'Constanta',
    allowedCities: ['constanta', 'mamaia', 'corbu', 'culmea', 'costinesti', 'eforie', 'mangalia', 'navodari', 'vama veche', '2 mai'],
    timeOnlyDate: 'today',
  },
  {
    url: 'https://zilesinopti.ro/evenimente-constanta-2026/',
    city: 'Constanta',
    allowedCities: ['constanta', 'mamaia', 'corbu', 'culmea', 'costinesti', 'eforie', 'mangalia', 'navodari', 'vama veche', '2 mai'],
  },
];

const TITLE_BLOCK_TERMS = [
  'priscene',
  'caritabil de priscene',
  'pentru copii',
  'teatru',
  'familie',
  'festival',
  'elrow',
];

const TEXT_BLOCK_RE = /\b(?:stand\s*-?\s*up|standup|comedy|comedie|comedian|improv|biserica)\b/i;

type ZileSiNoptiStub = {
  title: string;
  url: string;
  rawDate: string;
  rawTime: string;
  badge: string;
  summary: string;
  venue: string;
  image: string;
};

type QueuedZileSiNoptiStub = ZileSiNoptiStub & {
  city: string;
  allowedCities?: string[];
};

type ZileSiNoptiDetail = {
  description: string | null;
  image_url: string | null;
};

function isCityOnlyVenue(venue: string, allowedCities?: string[]): boolean {
  const normalizedVenue = clean(venue)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!normalizedVenue) return true;

  const cityTerms = ['constanta', 'constanţa', 'bucuresti', 'bucharest', ...(allowedCities ?? [])]
    .map(city => clean(city).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, ''))
    .filter(Boolean);

  return cityTerms.some(city => normalizedVenue === city);
}

function extractVenueFromTitle(title: string): string | null {
  const parts = clean(title).split(/\s+@\s+/);
  if (parts.length < 2) return null;
  return clean(parts[parts.length - 1]) || null;
}

function extractTitleFromListing(title: string): string {
  return clean(title).split(/\s+@\s+/)[0]?.trim() || clean(title);
}

function resolveListingVenue(stub: ZileSiNoptiStub, allowedCities?: string[]): string | null {
  const cardVenue = clean(stub.venue);
  if (cardVenue && !isCityOnlyVenue(cardVenue, allowedCities)) return cardVenue;
  return extractVenueFromTitle(stub.title);
}

function inferGenresFromZileSiNoptiCard(stub: ZileSiNoptiStub): string[] | null {
  const text = [stub.badge, stub.summary, stub.title]
    .join(' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/\bparty\b|\bnights?\b/.test(text)) return ['Party'];
  if (/concerte|concert|greek music|pop-rock|rock|muzica|music|band/.test(text)) return ['Live Music'];
  if (/\bdj set\b|electronic|club|dance/.test(text)) return ['Electronic'];
  return null;
}

function hasBlockedZileSiNoptiSignal(stub: Pick<ZileSiNoptiStub, 'title' | 'badge' | 'summary' | 'venue'>): boolean {
  const text = [stub.title, stub.badge, stub.summary, stub.venue]
    .join(' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  return TEXT_BLOCK_RE.test(text);
}

function toAbsoluteUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl, BASE_URL).toString();
  } catch {
    return rawUrl;
  }
}

function extractImageFromCardHtml(block: string): string {
  const srcset = block.match(/<img[^>]+srcset=["']([^"']+)["']/i)?.[1] || '';
  const largestSrcsetCandidate = srcset
    .split(',')
    .map(part => part.trim().split(/\s+/)[0])
    .filter(Boolean)
    .pop();
  const src = largestSrcsetCandidate
    || block.match(/<img[^>]+data-src=["']([^"']+)["']/i)?.[1]
    || block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
    || block.match(/url\((['"]?)(.*?)\1\)/i)?.[2]
    || '';

  return src ? toAbsoluteUrl(src) : '';
}

function extractZileSiNoptiDetail(html: string): ZileSiNoptiDetail {
  let description: string | null = null;

  const contentStart = html.indexOf('id="kzn-continut-articol"');
  if (contentStart >= 0) {
    const contentBodyStart = html.indexOf('>', contentStart);
    const contentEndCandidates = [
      html.indexOf('elementor-element-f25d1f1', contentStart),
      html.indexOf('elementor-element-3903e800', contentStart),
      html.indexOf('class="elementor-section elementor-inner-section', contentStart),
    ].filter(index => index > contentStart);
    const contentEnd = contentEndCandidates.length > 0 ? Math.min(...contentEndCandidates) : contentStart + 12_000;
    const contentHtml = html
      .slice(contentBodyStart >= 0 ? contentBodyStart + 1 : contentStart, contentEnd)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
      .replace(/<div[^>]+(?:id|class)=["'][^"']*ziles-[^"']*["'][^>]*><\/div>/gi, ' ');

    const visibleText = clean(contentHtml)
      .split(/Vrei s[ăa] fii la curent/i)[0]
      .split(/Calendar Evenimente/i)[0]
      .trim();

    description = visibleText.length >= 20 && !isArtifactRiddenText(visibleText) ? visibleText : null;
  }

  const imageStart = html.indexOf('elementor-widget-theme-post-featured-image');
  const imageHtml = imageStart >= 0 ? html.slice(imageStart, imageStart + 5_000) : '';

  return {
    description,
    image_url: imageHtml ? extractImageFromCardHtml(imageHtml) || null : null,
  };
}

function buildFallbackEventFromStub(
  stub: ZileSiNoptiStub,
  city: string,
  allowedCities?: string[],
): ScrapedEvent | null {
  if (hasBlockedZileSiNoptiSignal(stub)) return null;

  const nightlifeException = /\b(?:party|dj set|nights?|dance|club|concert|live)\b/i
    .test([stub.title, stub.summary].join(' '));
  if (
    /\b(?:culinar|t[âa]rg|expozi[țt]ii|alte evenimente|junior|teatru|spectacole)\b/i.test(stub.badge)
    && !nightlifeException
  ) {
    return null;
  }

  const date = parseDate(stub.rawDate);
  const venue = resolveListingVenue(stub, allowedCities);
  if (!date || !venue) return null;

  const title = extractTitleFromListing(stub.title);
  const genreText = [stub.badge, stub.summary, stub.title].join(' ');
  const genres = inferGenresFromZileSiNoptiCard(stub) || guessGenres(title, genreText);
  if (!genres) return null;

  return {
    title,
    venue,
    date,
    time: stub.rawTime || null,
    description: isArtifactRiddenText(stub.summary) ? null : clean(stub.summary) || null,
    image_url: stub.image,
    event_url: stub.url,
    ticket_url: null,
    genres,
    price: null,
    city,
  };
}

/** Collect event stubs from the listing-page HTML kzn-sw-item cards. */
function collectStubsFromHtml(html: string, allowedCities?: string[], timeOnlyDate?: string): ZileSiNoptiStub[] {
  const stubs: ZileSiNoptiStub[] = [];
  const seen = new Set<string>();

  // kzn-sw-item — The Events Calendar superwidget card
  // Parent: class='kzn-sw-item' (exact, single or double quotes in raw HTML)
  // Children: class="kzn-sw-item-imagine ...", class="kzn-sw-item-text ..." etc.
  // Lookahead must be EXACT match (no suffix) so it doesn't stop at child divs
  const cardRe = /<div\s+class=["']kzn-sw-item["'][^>]*>([\s\S]*?)(?=<div\s+class=["']kzn-sw-item["']|$)/gi;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const block = m[1];

    // Only accept /evenimente/ detail page URLs — hard-reject everything else
    const linkM = block.match(/href=["'](https?:\/\/zilesinopti\.ro\/evenimente\/[^"'?#]+)["']/i)
      ?? block.match(/href=["'](\/evenimente\/[^"'?#]+)["']/i);
    if (!linkM) continue;
    const url = linkM[1].startsWith('http') ? linkM[1] : `${BASE_URL}${linkM[1]}`;
    if (!/\/evenimente\//.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    // Title
    const titleM = block.match(/class=["'][^"']*kzn-sw-item-titlu[^"']*["'][^>]*>([\s\S]*?)<\/\w+>/i)
      ?? block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = clean(titleM?.[1] ?? '');
    if (!title || title.length < 3) continue;
    const lowTitle = title.toLowerCase();
    if (TITLE_BLOCK_TERMS.some(term => lowTitle.includes(term))) continue;

    const badge = clean(block.match(/class=["'][^"']*kzn-sw-item-textsus[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '');
    if (/\bfestival\b/i.test(badge)) continue;

    const summary = clean(block.match(/class=["'][^"']*kzn-sw-item-sumar[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '');
    const venue = clean(block.match(/class=["'][^"']*kzn-sw-item-adresa-eveniment[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '');
    const image = extractImageFromCardHtml(block);
    if (hasBlockedZileSiNoptiSignal({ title, badge, summary, venue })) continue;
    if (containsUnexpectedCitySignal([title, badge, summary, venue].join(' '), allowedCities)) continue;

    // Raw date from card (refined later by the detail page JSON-LD)
    const dateM = block.match(/class=["'][^"']*kzn-one-event-date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const rawDateText = clean(dateM?.[1] ?? '');
    const clockM = block.match(/eicon-clock-o[^>]*><\/i>\s*(\d{1,2}:\d{2})/i);
    const rawTime = clean(clockM?.[1] ?? (/^\d{1,2}:\d{2}$/.test(rawDateText) ? rawDateText : ''));
    const rawDate = /^\d{1,2}:\d{2}$/.test(rawDateText) ? timeOnlyDate ?? '' : rawDateText;

    stubs.push({ title, url, rawDate, rawTime, badge, summary, venue, image });
  }

  return stubs;
}

function mergeStub(existing: QueuedZileSiNoptiStub, incoming: QueuedZileSiNoptiStub): QueuedZileSiNoptiStub {
  const existingVenue = resolveListingVenue(existing, existing.allowedCities);
  const incomingVenue = resolveListingVenue(incoming, incoming.allowedCities);

  return {
    ...existing,
    title: existing.title || incoming.title,
    badge: existing.badge || incoming.badge,
    summary: existing.summary.length >= incoming.summary.length ? existing.summary : incoming.summary,
    venue: existingVenue ? existing.venue : incomingVenue ? incoming.venue : existing.venue || incoming.venue,
    image: existing.image || incoming.image,
    rawDate: existing.rawDate || incoming.rawDate,
    rawTime: existing.rawTime || incoming.rawTime,
  };
}

export async function scrapeZilesinopti(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const queued = new Map<string, QueuedZileSiNoptiStub>();
  const today = new Date().toISOString().split('T')[0];

  for (const { url, city, allowedCities, timeOnlyDate } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);

      // HTML cards only — skip listing JSON-LD (unreliable dates, stale blocks)
      const stubs = collectStubsFromHtml(html, allowedCities, timeOnlyDate === 'today' ? today : undefined);
      console.log(`[zilesinopti] ${city}: ${stubs.length} card stubs from configured pages`);
      if (stubs.length === 0) continue;

      // Rough future-event pre-filter
      const futureStubs = stubs.filter(s => {
        if (!s.rawDate) return true;
        const d = parseDate(s.rawDate);
        return !d || d >= today;
      });

      for (const stub of futureStubs) {
        const queuedStub: QueuedZileSiNoptiStub = { ...stub, city, allowedCities };
        const existing = queued.get(stub.url);
        queued.set(stub.url, existing ? mergeStub(existing, queuedStub) : queuedStub);
      }

      console.log(`[zilesinopti] ${city}: queued ${queued.size} unique future event URLs`);
    } catch (err) {
      console.warn(`[zilesinopti] failed for ${url}:`, err);
    }
  }

  const stubsToFetch = Array.from(queued.values());
  for (let i = 0; i < stubsToFetch.length; i += 5) {
    const chunk = stubsToFetch.slice(i, i + 5);
    const results = await Promise.allSettled(
      chunk.map(async (s) => {
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
        let detailHtml: string | null = null;
        try {
          detailHtml = await fetchHtml(s.url, 15_000);
        } catch {
          // Fall back to listing data if the detail page is temporarily unreachable.
        }

        const sourceDetail = detailHtml ? extractZileSiNoptiDetail(detailHtml) : null;
        const event = await parseDetailPage(s.url, s.city, 15_000, s.allowedCities, detailHtml ?? undefined);
        const fallbackEvent = buildFallbackEventFromStub(s, s.city, s.allowedCities);
        if (!event) {
          return fallbackEvent && sourceDetail
            ? {
                ...fallbackEvent,
                description: sourceDetail.description || fallbackEvent.description,
                image_url: sourceDetail.image_url || fallbackEvent.image_url,
              }
            : fallbackEvent;
        }

        const listingDate = parseDate(s.rawDate);
        const listingVenue = resolveListingVenue(s, s.allowedCities);
        const listingGenres = inferGenresFromZileSiNoptiCard(s);

        return {
          ...event,
          title: extractTitleFromListing(s.title) || event.title,
          venue: listingVenue || event.venue,
          date: listingDate && listingDate >= today ? listingDate : event.date,
          time: s.rawTime || event.time,
          description: sourceDetail?.description || event.description,
          image_url: sourceDetail?.image_url || event.image_url,
          genres: listingGenres ?? (event.genres.length > 0 ? event.genres : fallbackEvent?.genres ?? event.genres),
        };
      }),
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) allEvents.push(r.value);
    }
  }

  console.log(`[zilesinopti] kept ${allEvents.length} music events`);

  return allEvents;
}
