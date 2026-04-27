// ─────────────────────────────────────────────────────────────────────────────
// scripts/venue-enrichment.ts
// Enriches venue records with Google Places API data:
// address, phone, website, rating, review count, coordinates, logo photo
// Usage: npx tsx scripts/venue-enrichment.ts [--dry-run] [--force]
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDFcufnUYpyjAi7vuA2vgwYhodb3K93UU0';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface VenueRow {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  logo_url: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
}

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location: { lat: number; lng: number } };
  photos?: Array<{ photo_reference: string; width: number; height: number }>;
  reviews?: Array<{ author_name: string; rating: number; text: string; time: number; profile_photo_url: string }>;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function findPlace(venueName: string, city: string): Promise<GooglePlace | null> {
  const searchName = VENUE_SEARCH_OVERRIDES[venueName] || venueName;
  const query = encodeURIComponent(`${searchName} ${city}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_API_KEY}`;
  const data = await fetchJson(url);
  if (!data.candidates?.length) return null;
  return data.candidates[0];
}

async function getPlaceDetails(placeId: string): Promise<GooglePlace> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,photo,review,editorial_summary&key=${GOOGLE_API_KEY}`;
  const data = await fetchJson(url);
  return data.result;
}

async function getLogoUrl(photoRef: string): Promise<string> {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
}

async function getBestLogo(website: string | undefined, photoRef: string | undefined, venueName: string): Promise<string | null> {
  // Strategy 1: Try favicon from venue website
  if (website) {
    try {
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(website).hostname}&sz=128`;
      const res = await fetch(faviconUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength > 500) return faviconUrl;
      }
    } catch { /* ignore */ }
  }
  
  // Strategy 2: Use Google Places first photo
  if (photoRef) return getLogoUrl(photoRef);
  
  return null;
}

const VENUE_SEARCH_OVERRIDES: Record<string, string> = {
  'Club BAMBOO': 'Bamboo Club Mamaia',
  'BAMBOO': 'Bamboo Club Mamaia',  
  'OXYA Club': 'Oxya Club Mamaia Nord',
  'Goblin Constanta': 'Goblin Club Constanta',
  'Breeze Constanta': 'Breeze Beach Bar Mamaia',
  'Eden': 'Eden Club Mamaia',
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Fetch venues that need enrichment
  let query = supabase.from('venues').select('id,name,city,address,rating,review_count,logo_url,lat,lng');
  if (!force) {
    query = query.or('address.is.null,rating.is.null,logo_url.is.null');
  }
  const { data: venues, error } = await query;
  
  if (error || !venues) {
    console.error('Failed to fetch venues:', error?.message);
    process.exit(1);
  }
  
  console.log(`Found ${venues.length} venues to enrich${dryRun ? ' (DRY RUN)' : ''}`);
  
  const updated: any[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i] as VenueRow;
    const city = venue.city || 'Bucuresti';
    const pct = ((i + 1) / venues.length * 100).toFixed(0);
    
    try {
      const place = await findPlace(venue.name, city);
      if (!place) {
        console.log(`[${pct}%] ${venue.name} → not found on Google Maps`);
        skipped.push(venue.name);
        continue;
      }
      
      const details = await getPlaceDetails(place.place_id);
      
      // Normalize diacritics for comparison
      const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      
      // Log a warning if the displayed name differs from DB name
      const placeName = details.name || '';
      if (placeName && norm(placeName) !== norm(venue.name) && norm(placeName).length > 3) {
        console.log(`  [name mismatch: DB="${venue.name}" vs Maps="${placeName}"]`);
      }

      const addrCityN = norm(details.formatted_address || '');
      const venueCityN = norm(venue.city || '');
      const isBuc = venueCityN.includes('bucharest') || venueCityN.includes('bucuresti');
      const isCts = venueCityN.includes('constanta');
      const addrIsBuc = addrCityN.includes('bucuresti') || addrCityN.includes('bucharest');
      const addrIsCts = addrCityN.includes('constanta') || addrCityN.includes('mamaia');
      
      if ((isBuc && !addrIsBuc) || (isCts && !addrIsCts)) {
        console.log(`[${pct}%] ${venue.name} → found but wrong city (${details.formatted_address})`);
        skipped.push(venue.name);
        continue;
      }
      
      const updates: Record<string, any> = {};
      
      // Always store website and place_id
      if (details.website && !venue.address) {} // just check we got it
      if (details.website) updates.website = details.website;
      updates.google_place_id = place.place_id;
      
      if (!venue.address && details.formatted_address) updates.address = details.formatted_address;
      if (!venue.rating && details.rating) updates.rating = details.rating;
      if (!venue.review_count && details.user_ratings_total) updates.review_count = details.user_ratings_total;
      if (details.geometry?.location) {
        if (!venue.lat) updates.lat = details.geometry.location.lat;
        if (!venue.lng) updates.lng = details.geometry.location.lng;
      }
      
      // Get best logo — try website favicon first, then Google photo
      if (!venue.logo_url) {
        const logo = await getBestLogo(details.website, details.photos?.[0]?.photo_reference, venue.name);
        if (logo) updates.logo_url = logo;
      }
      
      // Store Google reviews for display
      const reviews = details.reviews || [];
      if (reviews.length > 0) {
        updates.google_reviews = reviews.slice(0, 5).map((r: any) => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          time: r.time,
          profile_photo_url: r.profile_photo_url,
        }));
      }
      
      // Store up to 10 venue photos for gallery
      if (details.photos?.length) {
        updates.photos = details.photos.slice(0, 10).map((p: any) => p.photo_reference);
      }
      
      // Store editorial summary as description if missing
      if (!venue.description && (details as any).editorial_summary?.overview) {
        updates.description = (details as any).editorial_summary.overview;
      }
      
      const fields = Object.keys(updates).filter(k => updates[k] !== undefined && updates[k] !== null);
      
      if (fields.length === 0) {
        console.log(`[${pct}%] ${venue.name} → already enriched (${details.rating}★, ${details.user_ratings_total} reviews)`);
        skipped.push(venue.name);
        continue;
      }
      
      if (!dryRun) {
        const { error: updateErr } = await supabase.from('venues').update(updates).eq('id', venue.id);
        if (updateErr) {
          console.log(`[${pct}%] ${venue.name} → update ERROR: ${updateErr.message}`);
          failed.push(venue.name);
          continue;
        }
      }
      
      console.log(`[${pct}%] ${venue.name} → updated: ${fields.join(', ')} (${details.rating}★, ${details.user_ratings_total} reviews)`);
      updated.push({ name: venue.name, ...updates });
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
      
    } catch (err: any) {
      console.log(`[${pct}%] ${venue.name} → error: ${err.message}`);
      failed.push(venue.name);
    }
  }
  
  console.log(`\nDone. Updated: ${updated.length}, Skipped: ${skipped.length}, Failed: ${failed.length}`);
  
  if (dryRun && updated.length > 0) {
    const reportPath = join(process.cwd(), 'tmp', 'venue-enrichment-preview.json');
    writeFileSync(reportPath, JSON.stringify(updated, null, 2));
    console.log(`Preview saved to ${reportPath}`);
  }
  
  if (failed.length > 0) {
    console.log('Failed:', failed.join(', '));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
