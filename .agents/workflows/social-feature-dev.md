---
description: Workflow for social feature implementation and updates.
---
# Social Feature Workflow

Use this workflow when working on feeds, posts, stories, or user profile interactions.

1. **Schema Check**: Ensure the Supabase tables (e.g., `posts`, `stories`, `profiles`) are ready for the feature.
2. **Logic Implementation**: Develop the UI components and hook up the Supabase real-time or REST logic.
3. **Asset Handling**: Implement secure and optimized asset uploads for photos/videos.
4. **Feed Optimization**: Ensure the feed is paginated or virtualized for performance.
5. **Security Review**: Verify that user-generated content is sanitized and RLS policies are active.
6. **Verification**: Test the interaction flow end-to-end (e.g., "Post a Story" -> "View Story").

## Key Files
- `src/components/VerifiedBadge.tsx`
- `src/lib/supabase.ts`
