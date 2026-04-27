// ─────────────────────────────────────────────────────────────────────────────
// scripts/venue-social-enrich.ts
// Searches DuckDuckGo to find Facebook & Instagram pages for venues.
// Usage: npx tsx scripts/venue-social-enrich.ts [--dry-run]
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const DDG_URL = 'https://lite.duckduckgo.com/lite/';
const DDG_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'en,ro;q=0.9' };

interface VenueRow { id: string; name: string; city: string | null; facebook: string | null; instagram: string | null; }

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function searchDDG(query: string): Promise<string[]> {
  const url = `${DDG_URL}?${new URLSearchParams({ q: query })}`;
  const res = await fetch(url, { headers: DDG_HEADERS, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const links: string[] = [];
  const re = /uddg=([^'"&]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { links.push(decodeURIComponent(m[1])); } catch { /* skip malformed */ }
  }
  return links;
}

function extractFbUsername(url: string): string | null {
  const m = url.match(/facebook\.com\/([a-zA-Z0-9._-]+)/i);
  if (!m) return null;
  const slug = m[1];
  // Skip non-page paths
  if (/^(events|groups|share|permalink|photo|video|watch|reel|hashtag|profile|login|help|settings|policies|privacy|pages|plugins)/.test(slug)) return null;
  // Skip pages with ugly params
  if (url.includes('?') && slug.length > 40) return null;
  return `https://www.facebook.com/${slug}/`;
}

function extractIgUsername(url: string): string | null {
  const m = url.match(/instagram\.com\/([a-zA-Z0-9._-]+)/i);
  if (!m) return null;
  const slug = m[1];
  if (/^(p|reel|stories|explore|accounts|about|developer|help)/.test(slug)) return null;
  return `https://www.instagram.com/${slug}/`;
}

async function findFbLink(venueName: string, city: string): Promise<string | null> {
  const query = `site:facebook.com "${venueName}" ${city}`;
  const links = await searchDDG(query);
  
  for (const link of links) {
    const username = extractFbUsername(link);
    if (username) {
      // Verify it's likely the right page by checking the link text / URL context
      const normUrl = normalize(username);
      const normName = normalize(venueName);
      if (normUrl.includes(normName.slice(0, 5)) || normName.split(' ').every(w => normUrl.includes(w.slice(0, 3)))) {
        return username;
      }
    }
  }
  return null;
}

async function findIgLink(venueName: string, city: string): Promise<string | null> {
  const query = `site:instagram.com "${venueName}" ${city}`;
  const links = await searchDDG(query);
  
  for (const link of links) {
    const username = extractIgUsername(link);
    if (username) return username;
  }
  return null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Get venues that need social links
  const { data: venues } = await supabase
    .from('venues')
    .select('id,name,city,facebook,instagram')
    .or('facebook.is.null,instagram.is.null');
  
  if (!venues || venues.length === 0) {
    console.log('All venues already have social links');
    return;
  }
  
  console.log(`${venues.length} venues need social links`);
  
  let fbUpdated = 0, igUpdated = 0;
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i] as VenueRow;
    const city = venue.city || 'Bucuresti';
    const pct = ((i + 1) / venues.length * 100).toFixed(0);
    
    const updates: Record<string, string | null> = {};
    
    // Search Facebook if missing
    if (!venue.facebook) {
      try {
        const fb = await findFbLink(venue.name, city);
        if (fb) { updates.facebook = fb; fbUpdated++; }
      } catch { /* skip */ }
    }
    
    // Search Instagram if missing  
    if (!venue.instagram) {
      try {
        const ig = await findIgLink(venue.name, city);
        if (ig) { updates.instagram = ig; igUpdated++; }
      } catch { /* skip */ }
    }
    
    if (Object.keys(updates).length > 0) {
      const label = Object.keys(updates).map(k => updates[k] ? k : '').filter(Boolean).join('+');
      console.log(`[${pct}%] ${venue.name} → ${label}`);
      
      if (!dryRun) {
        await supabase.from('venues').update(updates).eq('id', venue.id);
      }
    }
    
    // Respect DDG rate limits (1 req/sec)
    await new Promise(r => setTimeout(r, 1200));
  }
  
  console.log(`\nDone. Facebook: ${fbUpdated}, Instagram: ${igUpdated}`);
}

main().catch(e => { console.error(e); process.exit(1); });
