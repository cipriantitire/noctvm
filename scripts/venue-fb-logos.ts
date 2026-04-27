// ─────────────────────────────────────────────────────────────────────────────
// scripts/venue-fb-logos.ts
// Fetches Facebook page profile pictures as venue logos.
// Usage: npx tsx scripts/venue-fb-logos.ts [--dry-run]
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function extractUsername(fbUrl: string): string | null {
  const m = fbUrl.match(/(?:facebook\.com\/)([a-zA-Z0-9._-]+)/);
  if (!m) return null;
  const username = m[1];
  // Skip non-page paths
  if (/^(events|groups|pages|plugins|sharer|share|permalink|photo|video|watch|reel|profile|hashtag|messages|settings|help|login|recover|policies|privacy|legal)/.test(username)) return null;
  // Skip pure numeric IDs (these are profiles, not pages)
  if (/^\d+$/.test(username) && username.length < 10) return null;
  return username;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data: venues } = await supabase
    .from('venues')
    .select('id,name,facebook,logo_url')
    .not('facebook', 'is', null);
  
  if (!venues || venues.length === 0) {
    console.log('No venues with Facebook links found');
    return;
  }
  
  console.log(`Found ${venues.length} venues with Facebook links`);
  
  let updated = 0;
  const skipped: string[] = [];
  
  for (const venue of venues) {
    const username = extractUsername(venue.facebook!);
    if (!username) {
      skipped.push(`${venue.name} (no username)`);
      continue;
    }
    
    try {
      const res = await fetch(`https://graph.facebook.com/${username}/picture?type=large&redirect=false`);
      const data = await res.json();
      
      if (data.data?.url && !data.data?.is_silhouette) {
        if (!dryRun) {
          await supabase.from('venues').update({ logo_url: data.data.url }).eq('id', venue.id);
        }
        console.log(`  ${venue.name} → logo updated`);
        updated++;
      } else {
        skipped.push(`${venue.name} (silhouette/no image)`);
      }
    } catch {
      skipped.push(`${venue.name} (fetch failed)`);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped.length}`);
  if (skipped.length > 0) console.log('Skipped:', skipped.join(', '));
}

main().catch(e => { console.error(e); process.exit(1); });
