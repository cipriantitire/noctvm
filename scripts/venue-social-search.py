"""
scripts/venue-social-search.py
Uses Playwright to search Google for venue Facebook, Instagram, and logo.
Produces JSON that the TypeScript enrichment script imports.
Usage: python scripts/venue-social-search.py [--dry-run]
Install: pip install playwright && playwright install chromium
"""
import json, sys, time, os, asyncio, re
from playwright.async_api import async_playwright

DRY_RUN = '--dry-run' in sys.argv
BATCH_NUM = '0'
OUTPUT = 'tmp/venue-social-results.json'

# Parse --start and --count and --batch for batching
BATCH_START = 0
BATCH_COUNT = 0
for i, arg in enumerate(sys.argv):
    if arg == '--start' and i + 1 < len(sys.argv):
        BATCH_START = int(sys.argv[i + 1])
    if arg == '--count' and i + 1 < len(sys.argv):
        BATCH_COUNT = int(sys.argv[i + 1])
    if arg == '--batch' and i + 1 < len(sys.argv):
        BATCH_NUM = sys.argv[i + 1]

OUTPUT = f'tmp/venue-social-results-{BATCH_NUM}.json'

MAX_VENUES = int(os.environ.get('VENUE_LIMIT', '0')) or None

async def search_google(page, query):
    """Search Google and return result links."""
    await page.goto(f'https://www.google.com/search?q={query}&hl=en', wait_until='domcontentloaded')
    await page.wait_for_timeout(3000)
    
    try:
        btn = page.locator('button:has-text("Accept all"), button:has-text("Accepta toate"), button:has-text("Accept"), button:has-text("I agree")')
        if await btn.count() > 0:
            await btn.first.click()
            await page.wait_for_timeout(1500)
    except: pass
    
    links = []
    results = page.locator('#search a[href^="http"]')
    count = await results.count()
    for i in range(min(count, 10)):
        href = await results.nth(i).get_attribute('href')
        if href and 'google.com' not in href:
            links.append(href)
    return links

async def search_images(page, query):
    """Search Google Images and return image URLs."""
    await page.goto(f'https://www.google.com/search?q={query}&tbm=isch&hl=en', wait_until='domcontentloaded')
    await page.wait_for_timeout(3000)
    
    try:
        btn = page.locator('button:has-text("Accept all"), button:has-text("Accepta toate"), button:has-text("Accept")')
        if await btn.count() > 0:
            await btn.first.click()
            await page.wait_for_timeout(1500)
    except: pass
    
    # Click first image to get full-res version
    first_img = page.locator('img[src^="http"]').first
    try:
        await first_img.click()
        await page.wait_for_timeout(2000)
        # Full-res image in the sidebar
        sidebar_img = page.locator('img[src^="http"]').last
        src = await sidebar_img.get_attribute('src')
        if src and 'google' not in src and src.startswith('http') and not src.endswith('.svg'):
            return [src]
    except: pass
    
    # Fallback: get first few thumbnails
    images = page.locator('img[src^="http"]')
    count = await images.count()
    urls = []
    for i in range(min(count, 5)):
        src = await images.nth(i).get_attribute('src')
        if src and 'google' not in src and src.startswith('http') and not src.endswith('.svg'):
            urls.append(src)
    return urls

def extract_fb_page(urls):
    for u in urls:
        if 'facebook.com' in u and '/events/' not in u and '/groups/' not in u and '/share' not in u and '/photo' not in u:
            m = re.match(r'(https?://(?:www\.)?facebook\.com/[a-zA-Z0-9._-]+)', u)
            if m: return m.group(1)
    return None

def extract_ig_page(urls):
    for u in urls:
        if 'instagram.com' in u and '/p/' not in u and '/reel/' not in u:
            m = re.match(r'(https?://(?:www\.)?instagram\.com/[a-zA-Z0-9._-]+)', u)
            if m: return m.group(1)
    return None

async def process_venue(context, venue):
    name, city = venue['name'], venue.get('city') or 'Bucuresti'
    city_short = 'Bucuresti' if 'bucharest' in city.lower() or 'bucuresti' in city.lower() else 'Constanta'
    result = {'id': venue['id'], 'name': name}
    
    # Search Facebook
    try:
        page = await context.new_page()
        fb_urls = await search_google(page, f'{name} {city_short} facebook site:facebook.com')
        fb = extract_fb_page(fb_urls)
        if fb: result['facebook'] = fb
        await page.close()
    except Exception as e:
        print(f'  FB error: {e}')
    
    await asyncio.sleep(2)  # avoid rate limiting
    
    # Search Instagram
    try:
        page = await context.new_page()
        ig_urls = await search_google(page, f'{name} {city_short} instagram site:instagram.com')
        ig = extract_ig_page(ig_urls)
        if ig: result['instagram'] = ig
        await page.close()
    except Exception as e:
        print(f'  IG error: {e}')
    
    await asyncio.sleep(2)
    
    # Search Logo
    try:
        page = await context.new_page()
        img_urls = await search_images(page, f'{name} {city_short} logo')
        if img_urls:
            result['logo_url'] = img_urls[0]
        await page.close()
    except Exception as e:
        print(f'  Logo error: {e}')
    
    return result

async def main():
    # Read venues from Supabase via a JSON file produced by TS script
    venues_file = 'tmp/venues-to-enrich.json'
    if not os.path.exists(venues_file):
        print(f'ERROR: {venues_file} not found. Run: npx tsx -e "import... createClient... select... writeFile" first')
        return
    
    with open(venues_file) as f:
        venues = json.load(f)
    
    if MAX_VENUES:
        venues = venues[:MAX_VENUES]
    elif BATCH_COUNT > 0:
        venues = venues[BATCH_START:BATCH_START + BATCH_COUNT]
    
    print(f'Processing {len(venues)} venues (batch start={BATCH_START})...')
    
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-dev-shm-usage',
            ]
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 800},
            locale='en-US',
        )

        for i, venue in enumerate(venues):
            pct = (i + 1) / len(venues) * 100
            fields = []
            try:
                result = await process_venue(context, venue)
                if 'facebook' in result: fields.append('FB')
                if 'instagram' in result: fields.append('IG')
                if 'logo_url' in result: fields.append('logo')
                results.append(result)
            except Exception as e:
                result = {'id': venue['id'], 'name': venue['name'], 'error': str(e)}
                results.append(result)
            
            print(f'[{pct:.0f}%] {venue["name"]} -> {", ".join(fields) if fields else "nothing"}')
            await asyncio.sleep(3)
        
        await browser.close()
    
    if not DRY_RUN:
        with open(OUTPUT, 'w') as f:
            json.dump(results, f, indent=2)
        print(f'\nSaved {len(results)} results to {OUTPUT}')
    
    # Summary
    fb_count = sum(1 for r in results if 'facebook' in r)
    ig_count = sum(1 for r in results if 'instagram' in r)
    logo_count = sum(1 for r in results if 'logo_url' in r)
    print(f'Facebook: {fb_count}, Instagram: {ig_count}, Logos: {logo_count}')

if __name__ == '__main__':
    asyncio.run(main())
