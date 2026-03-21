const cheerio = require('cheerio');

async function scrape() {
  const html = await fetch('https://clubguesthouse.ro/program').then(r => r.text());
  const $ = cheerio.load(html);
  
  const links = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('gh-')) {
      links.push(href);
    }
  });
  
  const unique = [...new Set(links)];
  console.log('Found events:', unique);
}
scrape();
