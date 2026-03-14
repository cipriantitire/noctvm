// ─────────────────────────────────────────────────────────────────────────────
// Resident Advisor (ra.co) scraper
// Uses the official RA GraphQL API — most reliable source
// Bucharest area ID: 381 (Bucharest, Romania)
// Romania area ID: 50 (All Romania — parent area)
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { parseDate, clean, guessGenres, splitTitleVenue } from './utils';

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
          queueItEnabled
          newEventForm
          images {
            id
            filename
            alt
            type
            crop
            __typename
          }
          venue {
            id
            name
            contentUrl
            live
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

interface RAEvent {
  id: string;
  title: string;
  date: string;
  contentUrl: string;
  images: { filename: string; type: string }[];
  venue: { name: string; contentUrl: string } | null;
  cost?: string;
}

export async function scrapeRA(): Promise<ScrapedEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const oneMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const fetchForArea = async (areaId: number, cityLabel: string): Promise<ScrapedEvent[]> => {
    try {
      const res = await fetch(RA_GRAPHQL, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'ro,en;q=0.9,en-US;q=0.8',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Content-Type': 'application/json',
          'Referer': 'https://ra.co/',
        },
        body: JSON.stringify({
          query: QUERY,
          variables: {
            filters: {
              areas: { eq: areaId },
              listingDate: { gte: today, lte: oneMonthFromNow },
            },
            pageSize: 50,
          },
        }),
      });

      if (!res.ok) return [];
      const json = await res.json();
      const listings = json.data?.eventListings?.data ?? [];

      return listings.map((l: any) => {
        const ev = l.event;
        const { title: rawTitle, venueHint } = splitTitleVenue(clean(ev.title));
        // Pass venue name as a genre hint — RA titles are cryptic (e.g. "GH 14.03 - Cap, Christian AB")
        // so venue names like "Control Club", "Club Guesthouse" carry the genre signal.
        const raVenueName = clean(ev.venue?.name || '');
        const genres = guessGenres(rawTitle, raVenueName || venueHint || 'electronic club party');
        if (!genres) return null;

        const date = parseDate(ev.date) || today;
        const img = ev.images?.find((i: any) => i.type === 'landscape') || ev.images?.[0];
        const image_url = img?.filename ? (img.filename.startsWith('http') ? img.filename : `https://img.ra.co/events/${img.filename}`) : '';

        return {
          title: rawTitle,
          venue: raVenueName || venueHint || 'Venue TBC',
          date,
          time: null,
          description: null,
          image_url,
          event_url: `https://ra.co${ev.contentUrl}`,
          genres,
          price: null,
          city: cityLabel
        };
      }).filter(Boolean) as ScrapedEvent[];
    } catch (e) {
      console.warn(`[ra] failed for ${cityLabel}:`, e);
      return [];
    }
  };

  const [bucharest, romania] = await Promise.all([
    fetchForArea(BUCHAREST_AREA_ID, 'Bucharest'),
    fetchForArea(ROMANIA_AREA_ID, 'Constanta') // We'll label all non-Bucharest RA events as Constanta for now if found under general Romania, or filter them
  ]);

  // Filter romania events for only those that mention Constanta in venue or description if needed, 
  // but for now let's just combine. Actually, Sunwaves is on RA.
  return [...bucharest, ...romania.filter(e => e.venue.toLowerCase().includes('constanta') || e.venue.toLowerCase().includes('mamaia'))];
}
