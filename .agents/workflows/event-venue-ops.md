---
description: Workflow for managing event and venue operations.
---
# Event & Venue Operations Workflow

Use this workflow for data hygiene, venue metadata updates, and large-scale event processing.

1. **Data Identification**: Identify the venues or events that need updates (e.g., missing logos, incorrect categories).
2. **Script Preparation**: Use or create a script in `scripts/` (e.g., `check-venues.ts`).
3. **Run Hygiene Jobs**:
// turbo
    - `npm run check-today-events` to verify landing page data.
    - `npm run cleanup-events` to remove expired or duplicate events.
4. **Metadata Management**: Update `src/lib/venue-logos.ts` or similar metadata files.
5. **Database Sync**: Ensure production Supabase reflects the latest local data changes.
6. **Final Check**: Open the dashboard and verify the changes are live and correct.
