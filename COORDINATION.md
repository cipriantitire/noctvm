# COORDINATION: Social Media & Wallet (Pocket) Overhaul
## NOCTVM Tactical Coordination

[STATE SYNC]
- **App naming**: Pocket (Confirmed)
- **Deep link canonical**: /?tab=pocket
- **GitHub SHA**: 1d2aac5
- **Supabase MCP drift present**: NO (Migrations manually synced)
- **Uncommitted SQL objects**: None
- **Uncommitted frontend files**: None
- **Migration files**: 20260318050000_repost_and_event_tagging.sql (and children) applied.

## Confirmation Section: Branch State 
**Branch**: `main`
**SHA**: `1d2aac5`
**Delta since c6d54d5**: 
- Pocket overhaul (Activity Tracker + Premium Cards)
- Social Feeds Refinement (Reposts logic + animation)
- Event Tagging (tagged events appear in FeedItem)
- Manage Venue (owner dashboard for venues)
- Privacy & Device settings UI
- Economy Infrastructure (reward_config + mutual_connections scaling)

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
