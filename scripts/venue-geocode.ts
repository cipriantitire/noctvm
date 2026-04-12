import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

type Mode = 'preview' | 'apply';

type EventRow = {
  venue: string | null;
  city: string | null;
  genres?: string[] | null;
};

type VenueRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  genres?: string[] | null;
  lat: number | null;
  lng: number | null;
};

type GeocodeResult = {
  lat: number;
  lng: number;
  address: string;
  query: string;
};

const mode = (process.argv[2] === 'apply' ? 'apply' : 'preview') as Mode;
const scope = process.argv.includes('--today') ? 'today' : 'upcoming';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function normalizeVenueName(name: string | null | undefined): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(?:constanta|bucuresti|bucharest|romania|club|lounge|bar)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getGeocodeQuery(venueName: string, city: string, existing?: VenueRow): string {
  const key = normalizeVenueName(venueName);
  const hint = [
    { match: 'hotel iaki', query: 'Hotel Iaki Mamaia Romania' },
    { match: 'unique restaurant mamaia', query: 'Hotel Parc Mamaia Romania' },
    { match: 'crazy social house', query: 'Strada Mircea cel Batran 97A Constanta Romania' },
    { match: 'zebrano restaurant and', query: 'Bulevardul Tomis 12 Constanta Romania' },
    { match: 'momo', query: 'Strada Mircea cel Batran 97A Constanta Romania' },
    { match: 'laminor arena', query: 'Bulevardul Basarabia 256 Bucuresti Romania' },
    { match: 'princess', query: 'Princess Club Strada Sergent Constantin Ghercu 14 Bucharest Romania' },
  ].find(item => key === item.match || key.includes(item.match));

  if (hint) return hint.query;
  if (existing?.address) return `${existing.address}, ${city}, Romania`;
  return `${venueName}, ${city}, Romania`;
}

function findExistingVenue(venueName: string, city: string, venues: VenueRow[]): VenueRow | null {
  const key = normalizeVenueName(venueName);
  if (!key) return null;

  const sameCityVenues = venues.filter(venue => venue.city === city);
  const exact = sameCityVenues.find(venue => {
    const venueKey = normalizeVenueName(venue.name);
    return venueKey.length > 0 && venueKey === key;
  });
  if (exact) return exact;

  const aliases: Record<string, string[]> = {
    'pavilionul expozitional': ['exhibitions pavilion'],
  };

  const aliasKeys = aliases[key] || [];
  const alias = sameCityVenues.find(venue => {
    const venueKey = normalizeVenueName(venue.name);
    return aliasKeys.some(aliasKey => venueKey === aliasKey || venueKey.includes(aliasKey));
  });
  if (alias) return alias;

  if (key.length < 4) return null;

  return sameCityVenues.find((venue) => {
    const venueKey = normalizeVenueName(venue.name);
    if (venueKey.length < 4) return false;
    return venueKey.includes(key) || key.includes(venueKey);
  }) || null;
}

async function geocode(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NOCTVM venue coordinate backfill (contact: admin@noctvm.local)',
    },
  });

  if (!response.ok) return null;
  const results = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const first = results[0];
  if (!first?.lat || !first.lon) return null;

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
    address: first.display_name || query,
    query,
  };
}

async function main() {
  const today = new Date().toISOString().split('T')[0];

  const eventQuery = supabase
    .from('events')
    .select('venue, city, genres')
    .not('venue', 'is', null);

  const scopedEventQuery = scope === 'today'
    ? eventQuery.eq('date', today)
    : eventQuery.gte('date', today);

  const [{ data: events, error: eventError }, { data: venues, error: venueError }] = await Promise.all([
    scopedEventQuery,
    supabase
      .from('venues')
      .select('id, name, city, address, genres, lat, lng'),
  ]);

  if (eventError) throw eventError;
  if (venueError) throw venueError;

  const allVenues = (venues || []) as VenueRow[];
  const candidateMap = new Map<string, EventRow>();

  for (const event of (events || []) as EventRow[]) {
    if (!event.venue || event.venue === 'Venue TBC' || !event.city) continue;
    if (/\b(?:tba|to be announced|secret location)\b/i.test(event.venue)) continue;
    const key = `${event.city}:${normalizeVenueName(event.venue)}`;
    if (!candidateMap.has(key)) candidateMap.set(key, event);
  }

  const actions: Array<{
    kind: 'update' | 'insert';
    eventVenue: string;
    targetVenue?: string;
    city: string;
    geocode: GeocodeResult;
  }> = [];

  for (const event of Array.from(candidateMap.values())) {
    const venueName = event.venue || '';
    const city = event.city || '';
    const existing = findExistingVenue(venueName, city, allVenues);
    if (existing?.lat != null && existing.lng != null) continue;

    const query = getGeocodeQuery(venueName, city, existing || undefined);
    const result = await geocode(query);
    await new Promise(resolve => setTimeout(resolve, 1_100));
    if (!result) {
      console.warn(`[venue-geocode] no result: ${venueName} (${city}) via "${query}"`);
      continue;
    }

    actions.push({
      kind: existing ? 'update' : 'insert',
      eventVenue: venueName,
      targetVenue: existing?.name,
      city,
      geocode: result,
    });

    if (mode === 'apply') {
      if (existing) {
        const { error } = await supabase
          .from('venues')
          .update({
            lat: result.lat,
            lng: result.lng,
            address: existing.address || result.address,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('venues')
          .insert({
            name: venueName,
            city,
            address: result.address,
            genres: event.genres || [],
            lat: result.lat,
            lng: result.lng,
            capacity: 0,
            rating: 0,
            review_count: 0,
            description: '',
            followers: 0,
            badge: 'none',
            is_verified: false,
            featured: false,
            view_count: 0,
            save_count: 0,
          });
        if (error) throw error;
      }
    }
  }

  console.log(JSON.stringify({ mode, scope, actions }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
