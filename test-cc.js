async function scrape() {
  const html = await fetch('https://control-club.ro/events').then(r => r.text());
  console.log('HTML Length:', html.length);
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log('Event links:', links.filter(l => l.includes('/event/')).slice(0, 5));
}
scrape().catch(console.error);
