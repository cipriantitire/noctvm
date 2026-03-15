// ─────────────────────────────────────────────────────────────────────────────
// Resident Advisor (ra.co) scraper
// Uses the official RA GraphQL API — most reliable source
// Bucharest area ID: 381 (Bucharest, Romania)
// Romania area ID: 50 (All Romania — parent area)
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { parseDate, clean, guessGenres, splitTitleVenue, batchFetch } from './utils';

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
          'User-Agent': USER_AGENT,
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

      const urls = listings
        .map((l: any) => l.event?.contentUrl ? `https://ra.co${l.event.contentUrl}` : null)
        .filter(Boolean) as string[];

      // Deep-fetch RA detail pages to get descriptions, ticket links, and prices
      // RA detail pages often have better info than the GraphQL summary
      const events = await batchFetch(urls, cityLabel, { limit: 50, batchSize: 5 });
      
      console.log(`[ra] ${cityLabel}: Deep-fetched ${events.length} events from detail pages`);
      return events;
    } catch (e) {
      console.warn(`[ra] failed for ${cityLabel}:`, e);
      return [];
    }
  };

  const [bucharest, romania] = await Promise.all([
    fetchForArea(BUCHAREST_AREA_ID, 'Bucharest'),
    fetchForArea(ROMANIA_AREA_ID, 'Constanta')
  ]);

  // Filter romania events for only those that mention Constanta in venue or description
  const combined = [...bucharest, ...romania.filter(e => 
    e.venue.toLowerCase().includes('constanta') || 
    e.venue.toLowerCase().includes('mamaia') ||
    (e.description?.toLowerCase().includes('constanta') || false)
  )];

  return combined;
}
