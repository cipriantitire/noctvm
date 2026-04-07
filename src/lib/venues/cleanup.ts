import { SupabaseClient } from '@supabase/supabase-js';

type BadgeValue = string | null | undefined;

type VenueRow = {
  id: string;
  name: string;
  city: string;
  address?: string | null;
  genres?: string[] | null;
  capacity?: number | null;
  rating?: number | null;
  review_count?: number | null;
  description?: string | null;
  followers?: number | null;
  lat?: number | null;
  lng?: number | null;
  owner_id?: string | null;
  badge?: BadgeValue;
  is_verified?: boolean | null;
  featured?: boolean | null;
  view_count?: number | null;
  save_count?: number | null;
  logo_url?: string | null;
  created_at?: string | null;
};

type EventRow = {
  id: string;
  title: string;
  venue: string;
  date: string;
  source: string;
  time?: string | null;
  description?: string | null;
  image_url?: string | null;
  ticket_url?: string | null;
  event_url?: string | null;
  price?: string | null;
};

type FollowerRow = {
  id: string;
  follower_id: string;
  target_id: string;
  target_type: string;
};

type StoryRow = {
  id: string;
  venue_name: string | null;
};

type VenueReviewRow = {
  id: string;
  venue_name: string | null;
};

type VenueIdRow = {
  id: string;
  venue_id: string;
};

export type VenueReferenceCounts = {
  events: number;
  follows: number;
  stories: number;
  venueReviews: number;
  venueManagers: number;
  venueClaims: number;
  total: number;
};

export type VenueCleanupEntry = {
  id: string;
  name: string;
  city: string;
  references: VenueReferenceCounts;
  suggestedScore: number;
  owner_id?: string | null;
  badge?: BadgeValue;
  is_verified?: boolean | null;
  featured?: boolean | null;
};

export type VenueCleanupCandidate = {
  key: string;
  city: string;
  normalizedName: string;
  canonical: VenueCleanupEntry;
  duplicates: VenueCleanupEntry[];
  all: VenueCleanupEntry[];
};

export type VenueCleanupPreview = {
  generatedAt: string;
  candidateCount: number;
  candidates: VenueCleanupCandidate[];
};

export type VenueCleanupMergeResult = {
  canonicalVenueId: string;
  canonicalVenueName: string;
  mergedVenueIds: string[];
  mergedVenueNames: string[];
  affected: {
    eventsRenamed: number;
    eventsDeleted: number;
    followsUpdated: number;
    followsDeleted: number;
    storiesUpdated: number;
    venueReviewsUpdated: number;
    venueManagersUpdated: number;
    venueClaimsUpdated: number;
    venuesDeleted: number;
  };
};

const OPTIONAL_TABLE_ERRORS = /Could not find the table|relation .* does not exist|schema cache/i;

function normalizeVenueCleanupKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(bucharest|bucuresti|constanta)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMapFromNames(rows: Array<{ name: string | null | undefined }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = (row.name || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function countMapFromIds(rows: Array<{ id: string | null | undefined }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = (row.id || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function badgeStrength(badge: BadgeValue): number {
  switch ((badge || '').toLowerCase()) {
    case 'gold':
      return 4;
    case 'verified':
    case 'blue':
      return 3;
    case 'admin':
      return 2;
    case 'owner':
      return 1;
    default:
      return 0;
  }
}

function scoreVenue(row: VenueRow, references: VenueReferenceCounts): number {
  return (
    references.total * 1000 +
    (row.is_verified ? 150 : 0) +
    (row.featured ? 100 : 0) +
    (row.owner_id ? 50 : 0) +
    badgeStrength(row.badge) * 25 +
    ((row.logo_url || '').trim() ? 10 : 0) +
    ((row.description || '').trim() ? 5 : 0) +
    ((row.address || '').trim() ? 5 : 0)
  );
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (value || '').trim())
        .filter(Boolean),
    ),
  );
}

function pickLongerString(current?: string | null, candidate?: string | null): string {
  const currentValue = (current || '').trim();
  const candidateValue = (candidate || '').trim();
  return candidateValue.length > currentValue.length ? candidateValue : currentValue;
}

function pickStrongerPrice(current?: string | null, candidate?: string | null): string | null {
  const a = (current || '').trim();
  const b = (candidate || '').trim();
  if (!a) return b || null;
  if (!b) return a;

  const score = (value: string) => {
    const lower = value.toLowerCase();
    if (!value) return 0;
    if (lower.includes('free')) return 1;
    if (/\d/.test(value)) return 3 + value.length / 1000;
    return 2;
  };

  return score(b) > score(a) ? b : a;
}

function mergeEventRows(canonical: EventRow, duplicate: EventRow): Partial<EventRow> {
  return {
    time: canonical.time || duplicate.time || null,
    description: pickLongerString(canonical.description, duplicate.description) || null,
    image_url: canonical.image_url || duplicate.image_url || null,
    ticket_url: canonical.ticket_url || duplicate.ticket_url || null,
    event_url: canonical.event_url || duplicate.event_url || null,
    price: pickStrongerPrice(canonical.price, duplicate.price),
  };
}

function mergeVenueRows(canonical: VenueRow, duplicates: VenueRow[]): VenueRow {
  const merged: VenueRow = { ...canonical };

  for (const duplicate of duplicates) {
    merged.address = merged.address || duplicate.address || '';
    merged.description = pickLongerString(merged.description, duplicate.description);
    merged.logo_url = merged.logo_url || duplicate.logo_url || null;
    merged.owner_id = merged.owner_id || duplicate.owner_id || null;
    merged.badge =
      badgeStrength(duplicate.badge) > badgeStrength(merged.badge) ? duplicate.badge : merged.badge;
    merged.is_verified = Boolean(merged.is_verified || duplicate.is_verified);
    merged.featured = Boolean(merged.featured || duplicate.featured);
    merged.capacity = Math.max(merged.capacity || 0, duplicate.capacity || 0);
    merged.view_count = (merged.view_count || 0) + (duplicate.view_count || 0);
    merged.save_count = (merged.save_count || 0) + (duplicate.save_count || 0);
    merged.followers = Math.max(merged.followers || 0, duplicate.followers || 0);

    const mergedReviewCount = Math.max(merged.review_count || 0, duplicate.review_count || 0);
    if ((duplicate.review_count || 0) > (merged.review_count || 0) && (duplicate.rating || 0) > 0) {
      merged.rating = duplicate.rating || merged.rating || 0;
    }
    merged.review_count = mergedReviewCount;

    if (merged.lat == null && duplicate.lat != null) merged.lat = duplicate.lat;
    if (merged.lng == null && duplicate.lng != null) merged.lng = duplicate.lng;
    merged.genres = uniqueStrings([...(merged.genres || []), ...(duplicate.genres || [])]);
  }

  return merged;
}

async function tableExists(client: SupabaseClient<any>, table: string): Promise<boolean> {
  const { error } = await client.from(table).select('*', { head: true, count: 'exact' });
  if (!error) return true;
  if (OPTIONAL_TABLE_ERRORS.test(error.message)) return false;
  throw new Error(`Failed to inspect ${table}: ${error.message}`);
}

async function loadOptionalNameRows(
  client: SupabaseClient<any>,
  table: string,
  column: string,
): Promise<Array<{ name: string }>> {
  if (!(await tableExists(client, table))) return [];
  const { data, error } = await client.from(table).select(column).not(column, 'is', null);
  if (error) {
    if (OPTIONAL_TABLE_ERRORS.test(error.message)) return [];
    throw new Error(`Failed to load ${table}: ${error.message}`);
  }
  const rows = ((data || []) as unknown) as Array<Record<string, unknown>>;
  return rows.map((row) => ({ name: String(row[column] || '') }));
}

async function loadOptionalVenueIdRows(
  client: SupabaseClient<any>,
  table: string,
): Promise<Array<{ id: string }>> {
  if (!(await tableExists(client, table))) return [];
  const { data, error } = await client.from(table).select('venue_id').not('venue_id', 'is', null);
  if (error) {
    if (OPTIONAL_TABLE_ERRORS.test(error.message)) return [];
    throw new Error(`Failed to load ${table}: ${error.message}`);
  }
  const rows = ((data || []) as unknown) as Array<Record<string, unknown>>;
  return rows.map((row) => ({ id: String(row.venue_id || '') }));
}

export async function previewVenueCleanup(client: SupabaseClient<any>): Promise<VenueCleanupPreview> {
  const { data: venues, error: venuesError } = await client
    .from('venues')
    .select(
      'id, name, city, address, genres, capacity, rating, review_count, description, followers, lat, lng, owner_id, badge, is_verified, featured, view_count, save_count, logo_url, created_at',
    )
    .order('name');

  if (venuesError) throw new Error(`Failed to load venues: ${venuesError.message}`);

  const [
    eventsData,
    followsData,
    storiesData,
    venueReviewsData,
    venueManagersData,
    venueClaimsData,
  ] = await Promise.all([
    client.from('events').select('venue'),
    client.from('follows').select('target_id, target_type').eq('target_type', 'venue'),
    loadOptionalNameRows(client, 'stories', 'venue_name'),
    loadOptionalNameRows(client, 'venue_reviews', 'venue_name'),
    loadOptionalVenueIdRows(client, 'venue_managers'),
    loadOptionalVenueIdRows(client, 'venue_claims'),
  ]);

  if (eventsData.error) throw new Error(`Failed to load event references: ${eventsData.error.message}`);
  if (followsData.error) throw new Error(`Failed to load follow references: ${followsData.error.message}`);

  const eventCounts = countMapFromNames((eventsData.data || []).map((row) => ({ name: row.venue })));
  const followCounts = countMapFromNames((followsData.data || []).map((row) => ({ name: row.target_id })));
  const storyCounts = countMapFromNames(storiesData);
  const reviewCounts = countMapFromNames(venueReviewsData);
  const managerCounts = countMapFromIds(venueManagersData);
  const claimCounts = countMapFromIds(venueClaimsData);

  const groups = new Map<string, VenueRow[]>();
  for (const venue of (venues || []) as VenueRow[]) {
    const normalizedName = normalizeVenueCleanupKey(venue.name);
    if (!normalizedName) continue;
    const key = `${venue.city}|${normalizedName}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(venue);
  }

  const candidates: VenueCleanupCandidate[] = [];
  for (const [key, rows] of Array.from(groups.entries())) {
    if (rows.length <= 1) continue;

    const entries = rows.map((row: VenueRow) => {
      const references: VenueReferenceCounts = {
        events: eventCounts.get(row.name) || 0,
        follows: followCounts.get(row.name) || 0,
        stories: storyCounts.get(row.name) || 0,
        venueReviews: reviewCounts.get(row.name) || 0,
        venueManagers: managerCounts.get(row.id) || 0,
        venueClaims: claimCounts.get(row.id) || 0,
        total:
          (eventCounts.get(row.name) || 0) +
          (followCounts.get(row.name) || 0) +
          (storyCounts.get(row.name) || 0) +
          (reviewCounts.get(row.name) || 0) +
          (managerCounts.get(row.id) || 0) +
          (claimCounts.get(row.id) || 0),
      };

      return {
        id: row.id,
        name: row.name,
        city: row.city,
        references,
        suggestedScore: scoreVenue(row, references),
        owner_id: row.owner_id || null,
        badge: row.badge,
        is_verified: row.is_verified || false,
        featured: row.featured || false,
      } satisfies VenueCleanupEntry;
    });

    entries.sort((a: VenueCleanupEntry, b: VenueCleanupEntry) => {
      if (b.suggestedScore !== a.suggestedScore) return b.suggestedScore - a.suggestedScore;
      if (b.references.total !== a.references.total) return b.references.total - a.references.total;
      return a.name.localeCompare(b.name);
    });

    candidates.push({
      key,
      city: rows[0].city,
      normalizedName: normalizeVenueCleanupKey(rows[0].name),
      canonical: entries[0],
      duplicates: entries.slice(1),
      all: entries,
    });
  }

  candidates.sort((a, b) => {
    const aTotal = a.all.reduce((sum, row) => sum + row.references.total, 0);
    const bTotal = b.all.reduce((sum, row) => sum + row.references.total, 0);
    if (bTotal !== aTotal) return bTotal - aTotal;
    return a.canonical.name.localeCompare(b.canonical.name);
  });

  return {
    generatedAt: new Date().toISOString(),
    candidateCount: candidates.length,
    candidates,
  };
}

export async function mergeVenueCleanupCandidate(
  client: SupabaseClient<any>,
  canonicalVenueId: string,
  duplicateVenueIds: string[],
): Promise<VenueCleanupMergeResult> {
  const uniqueDuplicateIds = Array.from(new Set(duplicateVenueIds.filter((id) => id && id !== canonicalVenueId)));
  if (!canonicalVenueId || uniqueDuplicateIds.length === 0) {
    throw new Error('A canonical venue and at least one duplicate venue are required.');
  }

  const allIds = [canonicalVenueId, ...uniqueDuplicateIds];
  const { data: venues, error: venuesError } = await client
    .from('venues')
    .select(
      'id, name, city, address, genres, capacity, rating, review_count, description, followers, lat, lng, owner_id, badge, is_verified, featured, view_count, save_count, logo_url, created_at',
    )
    .in('id', allIds);

  if (venuesError) throw new Error(`Failed to load merge venues: ${venuesError.message}`);

  const venueRows = (venues || []) as VenueRow[];
  const canonical = venueRows.find((row) => row.id === canonicalVenueId);
  if (!canonical) throw new Error('Canonical venue not found.');

  const duplicates = venueRows.filter((row) => uniqueDuplicateIds.includes(row.id));
  if (duplicates.length !== uniqueDuplicateIds.length) {
    throw new Error('One or more duplicate venues could not be loaded.');
  }

  const affected = {
    eventsRenamed: 0,
    eventsDeleted: 0,
    followsUpdated: 0,
    followsDeleted: 0,
    storiesUpdated: 0,
    venueReviewsUpdated: 0,
    venueManagersUpdated: 0,
    venueClaimsUpdated: 0,
    venuesDeleted: 0,
  };

  const mergedVenue = mergeVenueRows(canonical, duplicates);

  for (const duplicate of duplicates) {
    const duplicateName = duplicate.name;

    const { data: eventRows, error: eventError } = await client
      .from('events')
      .select('id, title, venue, date, source, time, description, image_url, ticket_url, event_url, price')
      .in('venue', [canonical.name, duplicateName]);

    if (eventError) throw new Error(`Failed to load event rows for ${duplicateName}: ${eventError.message}`);

    const canonicalEvents = new Map<string, EventRow>();
    for (const row of (eventRows || []) as EventRow[]) {
      if (row.venue !== canonical.name) continue;
      canonicalEvents.set(`${row.title}|${row.date}|${row.source}`, row);
    }

    for (const row of (eventRows || []) as EventRow[]) {
      if (row.venue !== duplicateName) continue;
      const key = `${row.title}|${row.date}|${row.source}`;
      const existing = canonicalEvents.get(key);

      if (existing) {
        const mergedEvent = mergeEventRows(existing, row);
        const { error: updateWinnerError } = await client
          .from('events')
          .update({
            ...mergedEvent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updateWinnerError) {
          throw new Error(`Failed to merge duplicate event into canonical row: ${updateWinnerError.message}`);
        }

        const { error: deleteEventError } = await client.from('events').delete().eq('id', row.id);
        if (deleteEventError) {
          throw new Error(`Failed to delete duplicate event row: ${deleteEventError.message}`);
        }
        affected.eventsDeleted += 1;
      } else {
        const { error: renameEventError } = await client
          .from('events')
          .update({
            venue: canonical.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (renameEventError) {
          throw new Error(`Failed to rename event venue: ${renameEventError.message}`);
        }
        affected.eventsRenamed += 1;
      }
    }

    const { data: followRows, error: followError } = await client
      .from('follows')
      .select('id, follower_id, target_id, target_type')
      .eq('target_type', 'venue')
      .in('target_id', [canonical.name, duplicateName]);

    if (followError) throw new Error(`Failed to load venue follows: ${followError.message}`);

    const canonicalFollowerIds = new Set(
      ((followRows || []) as FollowerRow[])
        .filter((row) => row.target_id === canonical.name)
        .map((row) => row.follower_id),
    );

    for (const row of (followRows || []) as FollowerRow[]) {
      if (row.target_id !== duplicateName) continue;

      if (canonicalFollowerIds.has(row.follower_id)) {
        const { error: deleteFollowError } = await client.from('follows').delete().eq('id', row.id);
        if (deleteFollowError) throw new Error(`Failed to delete duplicate follow row: ${deleteFollowError.message}`);
        affected.followsDeleted += 1;
        continue;
      }

      const { error: updateFollowError } = await client
        .from('follows')
        .update({ target_id: canonical.name })
        .eq('id', row.id);
      if (updateFollowError) throw new Error(`Failed to update venue follow row: ${updateFollowError.message}`);
      affected.followsUpdated += 1;
    }

    if (await tableExists(client, 'stories')) {
      const { data: storyRows, error: storyError } = await client
        .from('stories')
        .select('id, venue_name')
        .eq('venue_name', duplicateName);
      if (storyError) {
        if (!OPTIONAL_TABLE_ERRORS.test(storyError.message)) {
          throw new Error(`Failed to load stories: ${storyError.message}`);
        }
      } else if ((storyRows || []).length > 0) {
        const { error: updateStoriesError } = await client
          .from('stories')
          .update({ venue_name: canonical.name })
          .eq('venue_name', duplicateName);
        if (updateStoriesError) throw new Error(`Failed to update stories: ${updateStoriesError.message}`);
        affected.storiesUpdated += (storyRows || []).length;
      }
    }

    if (await tableExists(client, 'venue_reviews')) {
      const { data: reviewRows, error: reviewError } = await client
        .from('venue_reviews')
        .select('id, venue_name')
        .eq('venue_name', duplicateName);
      if (reviewError) {
        if (!OPTIONAL_TABLE_ERRORS.test(reviewError.message)) {
          throw new Error(`Failed to load venue reviews: ${reviewError.message}`);
        }
      } else if ((reviewRows || []).length > 0) {
        const { error: updateReviewsError } = await client
          .from('venue_reviews')
          .update({ venue_name: canonical.name })
          .eq('venue_name', duplicateName);
        if (updateReviewsError) throw new Error(`Failed to update venue reviews: ${updateReviewsError.message}`);
        affected.venueReviewsUpdated += (reviewRows || []).length;
      }
    }

    if (await tableExists(client, 'venue_managers')) {
      const { data: managerRows, error: managerError } = await client
        .from('venue_managers')
        .select('*')
        .eq('venue_id', duplicate.id);
      if (managerError) {
        if (!OPTIONAL_TABLE_ERRORS.test(managerError.message)) {
          throw new Error(`Failed to load venue managers: ${managerError.message}`);
        }
      } else if ((managerRows || []).length > 0) {
        const { error: updateManagersError } = await client
          .from('venue_managers')
          .update({ venue_id: canonical.id })
          .eq('venue_id', duplicate.id);
        if (updateManagersError) throw new Error(`Failed to update venue managers: ${updateManagersError.message}`);
        affected.venueManagersUpdated += (managerRows || []).length;
      }
    }

    if (await tableExists(client, 'venue_claims')) {
      const { data: claimRows, error: claimError } = await client
        .from('venue_claims')
        .select('id, venue_id')
        .eq('venue_id', duplicate.id);
      if (claimError) {
        if (!OPTIONAL_TABLE_ERRORS.test(claimError.message)) {
          throw new Error(`Failed to load venue claims: ${claimError.message}`);
        }
      } else if ((claimRows || []).length > 0) {
        const { error: updateClaimsError } = await client
          .from('venue_claims')
          .update({ venue_id: canonical.id, updated_at: new Date().toISOString() })
          .eq('venue_id', duplicate.id);
        if (updateClaimsError) throw new Error(`Failed to update venue claims: ${updateClaimsError.message}`);
        affected.venueClaimsUpdated += (claimRows || []).length;
      }
    }
  }

  const { error: updateVenueError } = await client
    .from('venues')
    .update({
      address: mergedVenue.address || '',
      genres: uniqueStrings(mergedVenue.genres || []),
      capacity: mergedVenue.capacity || 0,
      rating: mergedVenue.rating || 0,
      review_count: mergedVenue.review_count || 0,
      description: mergedVenue.description || '',
      followers: mergedVenue.followers || 0,
      lat: mergedVenue.lat ?? null,
      lng: mergedVenue.lng ?? null,
      owner_id: mergedVenue.owner_id || null,
      badge: mergedVenue.badge || 'none',
      is_verified: Boolean(mergedVenue.is_verified),
      featured: Boolean(mergedVenue.featured),
      view_count: mergedVenue.view_count || 0,
      save_count: mergedVenue.save_count || 0,
      logo_url: mergedVenue.logo_url || null,
    })
    .eq('id', canonical.id);

  if (updateVenueError) throw new Error(`Failed to update canonical venue row: ${updateVenueError.message}`);

  for (const duplicate of duplicates) {
    const { error: deleteVenueError } = await client.from('venues').delete().eq('id', duplicate.id);
    if (deleteVenueError) throw new Error(`Failed to delete duplicate venue row: ${deleteVenueError.message}`);
    affected.venuesDeleted += 1;
  }

  return {
    canonicalVenueId: canonical.id,
    canonicalVenueName: canonical.name,
    mergedVenueIds: duplicates.map((row) => row.id),
    mergedVenueNames: duplicates.map((row) => row.name),
    affected,
  };
}
