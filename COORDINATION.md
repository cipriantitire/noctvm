# COORDINATION: Social Media & Wallet (Pocket) Overhaul
Last Sync: c6d54d5 (Current Branch Delta)

## [CONFIRMED FROM FILE]
- App naming: Wallet renamed to Pocket (Canonical: `/?tab=pocket`)
- Feed Version: v5 (Optimized for friend/mutual relationships)
- Repost Logic: Dry-run RPC based (Migration `20260318050000`)
- Event Tagging: Partial implementation in CreatePostModal

## [LATEST CHANGES - DELTA SINCE c6d54d5]
- **UserProfilePage Refusal**:
  - Added 'Reposts' tab with full fetch logic.
  - Added 'Manage Venues' section for venue owners.
  - Fixed icon imports and lint errors.
- **ManageVenueModal**:
  - New component for granular venue operations (stats, events, settings).
- **Settings & Privacy**:
  - Expanded SettingsPage with Privacy/Security and Device Permissions.
- **Icon System**:
  - Centralized icons in `src/components/icons.tsx`.
  - Added Repost, Shield, Settings, ChevronRight, and Bookmark icons.

## [PROPOSED NEXT]
- **Reputation System (Social Trust)**: Implement logic to award Moonrays for high-quality posts (using `social_trust` score).
- **Edge Function for Graph**: Implement the async worker for `mutual_connections` maintenance (hybrid Trigger + Edge Function).
- **Boutique Economy**: Link `reward_config` to real-time events (e.g., +50 MR for first venue management action).

## [OPEN QUESTIONS FOR COPILOT]
A) **Verification Tiers**: Should we implement different badge colors for different verification levels (e.g., Bronze for users, Gold for Venues, Platinum for Admin)?
B) **Privacy Default**: Should "Activity Visibility" be ON or OFF by default for new users?

## [GUARDRAILS ACTIVE]
- Dry-run before prod mutation: YES
- Forward + rollback for migrations: YES
- Strict RLS & server-side validation: YES
- Aggregator integrity: YES
