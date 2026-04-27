// scripts/venue-social-export.ts
// Exports venues to JSON for the Python Playwright scraper.
// After Python runs, run: npx tsx scripts/venue-social-import.ts
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Export venues that need any social enrichment
  const { data: venues } = await supabase
    .from('venues')
    .select('id,name,city')
    .or('facebook.is.null,instagram.is.null,logo_url.is.null');
  
  if (!venues || venues.length === 0) {
    console.log('No venues need enrichment');
    return;
  }

  mkdirSync(join(process.cwd(), 'tmp'), { recursive: true });
  const path = join(process.cwd(), 'tmp', 'venues-to-enrich.json');
  writeFileSync(path, JSON.stringify(venues, null, 2));
  console.log(`Exported ${venues.length} venues to ${path}`);
  console.log('\nNow run: python scripts/venue-social-search.py');
}

main().catch(e => { console.error(e); process.exit(1); });
