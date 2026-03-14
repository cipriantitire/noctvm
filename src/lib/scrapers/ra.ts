// ─────────────────────────────────────────────────────────────────────────────
// Resident Advisor (ra.co) scraper
// Uses the official RA GraphQL API — most reliable source
// Bucharest area ID: 34 (Bucharest, Romania)
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { parseDate, clean, guessGenres } from './utils';

const RA_GRAPHQL = 'https://ra.co/graphql';

// RA area ID for Bucharest, Romania
const BUCHAREST_AREA_ID = '34';

const QUERY = `
  query getEventListings($filters: FilterInputDtoInput, $pageSize: Int) {
    eventListings(filters: $filters, pageSize: $pageSize, page: 1) {
      data {
        id
        event {
          id
          title
          date
          startTime
          contentUrl
          queueItEnabled
          images {
            filename
            type
          }
          venue {
            name
            area { name }
          }
          artists {
            displayName
          }
          pick {
            blurb
          }
          cost
          genres {
            name
          }
        }
      }
    }
  }
`;

interface RAEvent {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  contentUrl: string;
  images: { filename: string; type: string }[];
  venue: { name: string; area?: { name: string } } | null;
  artists: { displayName: string }[];
  pick: { blurb: string } | null;
  cost: string | null;
  genres: { name: string }[];
}

export async function scrapeRA(): Promise<ScrapedEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const oneMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(RA_GRAPHQL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://ra.co/',
        'User-Agent': 'Mozilla/5.0 (compatible; NOCTVM-scraper/1.0)',
      },
      body: JSON.stringify({
        operationName: 'getEventListings',
        query: QUERY,
        variables: {
          pageSize: 50,
          filters: {
            areas: { eq: BUCHAREST_AREA_ID },
            listingDate: {
              gte: today,
              lte: oneMonthFromNow,
            },
          },
        },
      }),
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      console.warn(`[ra] GraphQL returned HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as {
      data?: { eventListings?: { data?: { event: RAEvent }[] } };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      console.warn('[ra] GraphQL errors:', json.errors.map(e => e.message).join(', '));
    }

    const listings = json.data?.eventListings?.data ?? [];

    return listings.flatMap(({ event: ev }) => {
      const date = parseDate(ev.date);
      if (!date || date < today) return [];

      const image_url = (() => {
        const img = ev.images?.find(i => i.type === 'landscape') ?? ev.images?.[0];
        if (!img?.filename) return '';
        // RA image URLs: https://img.ra.co/events/...
        return img.filename.startsWith('http')
          ? img.filename
          : `https://img.ra.co/events/${img.filename}`;
      })();

      const title = clean(ev.title);
      const venue = clean(ev.venue?.name ?? 'Venue TBC');
      const description = clean(ev.pick?.blurb ?? '');
      const genres = ev.genres?.map(g => g.name) ?? [];
      if (genres.length === 0) genres.push(...guessGenres(title, description));

      return [{
        title,
        venue,
        date,
        time: ev.startTime ? ev.startTime.slice(0, 5) : null,
        description: description || null,
        image_url,
        event_url: ev.contentUrl
          ? `https://ra.co${ev.contentUrl}`
          : `https://ra.co/events/${ev.id}`,
        genres,
        price: ev.cost ?? null,
      }] satisfies ScrapedEvent[];
    });
  } catch (err) {
    console.warn('[ra] scrape failed:', err);
    return [];
  }
}
