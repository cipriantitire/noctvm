import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchHtml } from '../src/lib/scrapers/utils';

async function main() {
  const url = 'https://ra.co/events/2403836';
  console.log('Fetching:', url);
  const html = await fetchHtml(url, 15_000);
  console.log('HTML length:', html.length);

  // JSON-LD
  const ld = [...html.matchAll(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  console.log('JSON-LD blocks:', ld.length);
  ld.forEach((m, i) => {
    const desc = m[1].match(/"description"\s*:\s*"([\s\S]*?)(?<!\\)"/)?.[1];
    if (desc) console.log(`JSON-LD[${i}] desc:`, desc.slice(0, 300));
  });

  // All description matches
  const allDesc = [...html.matchAll(/"description"\s*:\s*"([\s\S]{20,}?)(?<!\\)"/g)];
  console.log('\nAll description matches:', allDesc.length);
  allDesc.slice(0, 3).forEach((m, i) => console.log(`desc[${i}]:`, m[1].slice(0, 200)));

  // Spans with substantial text (the XPath target)
  const spans = [...html.matchAll(/<span[^>]*>([^<]{60,})<\/span>/g)];
  console.log('\nSpans with 60+ chars:', spans.length);
  spans.slice(0, 5).forEach((m, i) => console.log(`span[${i}]:`, m[1].slice(0, 150)));

  // Check for Next.js data
  console.log('\nHas __NEXT_DATA__:', html.includes('__NEXT_DATA__'));

  // Dump 2000 chars from middle of HTML to find description area
  const mid = Math.floor(html.length / 2);
  console.log('\nHTML mid sample:', html.slice(mid, mid + 500));
}

main().catch(console.error).finally(() => process.exit(0));
