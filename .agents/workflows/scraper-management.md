---
description: Workflow for managing NOCTVM scrapers and data quality.
---
# Scraper Management Workflow

Use this workflow when working on data acquisition, adding new event/venue sources, or debugging data quality issues.

1. **Research Source**: Identify the target website (e.g., `onevent.ro`) and analyze its structure.
2. **Setup Scraper**: Create a new scraper in `src/lib/scrapers/`. Use existing scrapers as templates.
3. **Test Scraper**: Run the scraper locally and verify the output.
// turbo
4. **Data Sync**: Use `scripts/real-data-init.ts` or a specialized sync script to push data to Supabase.
5. **Verify Quality**: Run `scripts/check-events-quality.ts` to ensure data meets standards.
6. **Deploy**: Once verified, ensure the scraper is integrated into the scheduled scanning job.

## Troubleshooting
- If encountering blocks, adjust the scraping delay or user-agent.
- If data is missing fields, update the parser in the scraper script.
