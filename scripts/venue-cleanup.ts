import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  mergeVenueCleanupCandidate,
  previewVenueCleanup,
} from '../src/lib/venues/cleanup';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(url, serviceRoleKey);

function getArgValue(flag: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === flag && process.argv[i + 1]) {
      values.push(process.argv[i + 1]);
    }
  }
  return values;
}

async function main() {
  const command = process.argv[2] || 'preview';

  if (command === 'preview') {
    const preview = await previewVenueCleanup(supabase);
    console.log(JSON.stringify(preview, null, 2));
    return;
  }

  if (command === 'merge') {
    const canonicalVenueId = getArgValue('--canonical')[0] || '';
    const duplicateVenueIds = getArgValue('--duplicate');

    if (!canonicalVenueId || duplicateVenueIds.length === 0) {
      throw new Error('Usage: npx tsx scripts/venue-cleanup.ts merge --canonical <venue-id> --duplicate <venue-id> [--duplicate <venue-id>]');
    }

    const result = await mergeVenueCleanupCandidate(
      supabase,
      canonicalVenueId,
      duplicateVenueIds,
    );
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error('[venue-cleanup]', error);
  process.exit(1);
});
