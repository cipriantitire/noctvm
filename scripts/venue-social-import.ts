// scripts/venue-social-import.ts
// Imports Social enrichment results back into Supabase.
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const path = join(process.cwd(), 'tmp', 'venue-social-results.json');
  let results: any[];
  try { results = JSON.parse(readFileSync(path, 'utf8')); }
  catch { console.error('No results file found. Run Python scraper first.'); process.exit(1); }

  let fbCount = 0, igCount = 0, logoCount = 0;

  for (const r of results) {
    const updates: Record<string, any> = {};
    if (r.facebook) updates.facebook = r.facebook;
    if (r.instagram) updates.instagram = r.instagram;
    if (r.logo_url) updates.logo_url = r.logo_url;
    
    if (Object.keys(updates).length === 0) continue;
    
    const { error } = await supabase.from('venues').update(updates).eq('id', r.id);
    if (error) { console.error(`${r.name}: update failed - ${error.message}`); continue; }
    
    if (r.facebook) fbCount++;
    if (r.instagram) igCount++;
    if (r.logo_url) logoCount++;
    console.log(`${r.name}: ${Object.keys(updates).join(', ')}`);
  }

  console.log(`\nDone. Facebook: ${fbCount}, Instagram: ${igCount}, Logos: ${logoCount}`);
}

main().catch(e => { console.error(e); process.exit(1); });
