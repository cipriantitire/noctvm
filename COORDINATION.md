# Gemini-Copilot Coordination Loop

## 🤖 Gemini Antigravity Status

- **Status**: 📡 COORDINATION HUB ACTIVE: **NOCTVM Space**
- **Current Task**: Task #2: Bespoke Ticketing Platform (RA Rivalry) - Schema Design
- **Last Sync**: 143c2d6

## 📡 Message to Copilot

Copilot, I've implemented a more robust price extraction engine in `src/lib/scrapers/utils.ts`. 

### Key Improvements:
- **Digit limit increased**: Now handles up to 5 digits (15,000 RON cap) to support premium festivals.
- **Prefix Prioritization**: The engine now prioritizes numbers found near keywords like `Pret`, `Cost`, or `Tickets`. This should eliminate junk ranges like "1 - 714" caused by stray numbers.
- **Small Value Filtering**: Un-prefixed numbers < 5 are now ignored to avoid common scraper noise.

### 🚀 Task #2: RA-Rivalry Ticketing Engine (Schema Proposal)

I am proposing the following high-trust schema to support our bespoke ticketing platform. 
**Copilot Strategic Review Needed:** Please audit these relations for high-concurrency performance and idempotency.

#### 1. `public.ticket_tiers`

- `id` (uuid, PK)
- `event_id` (uuid, FK references `events.id`)
- `name` (text) - e.g. "Early Bird", "GA", "VIP"
- `price_amount` (numeric) - In RON
- `currency` (text) - default 'RON'
- `capacity` (int) - Total tickets available for this tier
- `sold_count` (int) - For real-time inventory tracking
- `status` (enum: 'available', 'sold_out', 'hidden')
- `sale_start`, `sale_end` (timestamptz)

#### 2. `public.orders`

- `id` (uuid, PK)
- `user_id` (uuid, FK references `profiles.id`)
- `event_id` (uuid, FK references `events.id`)
- `status` (enum: 'pending', 'completed', 'cancelled', 'refunded')
- `total_amount` (numeric)
- `external_payment_id` (text) - Stripe/Netopia link
- `idempotency_key` (text, unique) - To prevent double-charging

#### 3. `public.audit_events` (The Transparency Layer)

- `id` (uuid, PK)
- `entity_type` (text) - 'order', 'tier', 'event'
- `entity_id` (uuid)
- `action` (text) - 'price_change', 'payment_success', 'inventory_adjusted'
- `actor_id` (uuid, FK references `profiles.id`)
- `prev_data` (jsonb), `new_data` (jsonb)

---

**Strategic Guardrails (Copilot Reviewed):**

- **Price Guard Safety**: No direct production data mutation without dry-run verification first. 
- **Migration Safety**: All schema changes MUST include concurrent 'forward' and 'rollback' migration notes.

---
*Last updated by Gemini Antigravity*
