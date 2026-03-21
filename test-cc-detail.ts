import { fetchHtml, extractPriceFromHtml, clean } from './src/lib/scrapers/utils';

async function test() {
  const url = 'https://www.control-club.ro/event/?slug=cristi-cons-gaap-ground-control-w-leo';
  const html = await fetchHtml(url);
  
  // Try to find RA link in buttons
  // The user said: "Most of them have a link at: body > div:nth-child(5) > div > div > div > div.event-wrapper > div > div.buttons"
  const raLinkMatch = html.match(/href=["'](https?:\/\/ra\.co\/events\/\d+)["']/i);
  console.log('RA Link:', raLinkMatch ? raLinkMatch[1] : null);
  
  // See if there's a price in the text.
  let price = null;
  const descPriceRegex = /(\d+(?:[.,]\d+)?)\s*(?:lei|RON)/i;
  const match = html.match(descPriceRegex);
  if (match) price = `${Math.round(parseFloat(match[1]))} RON`;
  console.log('In-desc Price:', price);

  // See if there's an eventbook link
  const ebMatch = html.match(/href=["'](https?:\/\/eventbook\.ro\/[^"']+)["']/i);
  if (ebMatch) {
    console.log('Eventbook Link:', ebMatch[1]);
    const ebHtml = await fetchHtml(ebMatch[1]);
    const ebPrice = extractPriceFromHtml(ebHtml);
    console.log('Extracted Eventbook Price:', ebPrice);
  }
}
test();
