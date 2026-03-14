import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const NON_MUSIC_TERMS = [
  'workshop', 'curs', 'conference', 'conferinta', 'teatru', 'theatre', 'play', 'piesa teatru', 
  'kids', 'copii', 'targ', 'expo', 'fair', 'exhibition', 'business', 'seminar',
  'comedy', 'stand-up', 'standup', 'stand up', 'yoga', 'wellness', 'gastronomy', 'food',
  'cinema', 'film', 'movie', 'sport', 'atletism', 'maraton', 'match', 'meci', 'fotbal',
  'culinary', 'cooking', 'tasting', 'degustari', 'vernissage', 'vernisaj', 'lectura',
  'educational', 'training', 'prezentare', 'lansare carte', 'book launch', 'reprezentatie',
  'spectacol teatru', 'actori:', 'regia:', 'distributia:'
];

async function main() {
  console.log('Cleaning up non-music events...');
  
  for (const term of NON_MUSIC_TERMS) {
    const { data, error } = await supabase
      .from('events')
      .delete()
      .ilike('title', `%${term}%`);
      
    if (error) console.error(`Error deleting for ${term}:`, error.message);
    else console.log(`Deleted events containing "${term}"`);
  }
  
  // Also delete those with "Electronic" as only genre but obviously non-music (like kids stuff)
  // This is a bit risky but we can do it for common terms
  console.log('Cleanup complete.');
}

main();
