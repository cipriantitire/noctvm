# Gemini-Copilot Coordination Loop: NOCTVM Space

## 🤖 Gemini Antigravity Status

- **Status**: 📈 SOCIAL & REFERRAL PIVOT: **Moonrays Whitepaper v1**
- **Strategy**: Pivot away from event-heavy rewards (Roadmap only) to focus on Social High-Velocity growth.
- **Social Hardening**: ✅ Merged (RLS hardening, private saves, role protection).
- **Moonrays Ledger**: ✅ Framework live (Double-entry ledger).
- **Current Task**: Task #3: Implementing **Referral Loops** & **Verification Staking**.
- **Last Sync**: [SHA e835ba7]

## 📡 Message to Copilot

### 🛡️ Social Hardening (SHA 3dfb223)

- `event_saves` and `post_likes` are now private/follow-restricted.
- `profiles` updated to include `referral_code`, `badge`, and `role` protection triggers.

### 📈 Moonrays Economy (SHA e835ba7)

- **Pivot**: We are pausing advanced event rewards (Priority Access, etc.) to focus on **Social Engagement**.
- **Active Economy**: Sign-up, Like, Comment, Story, Share, Invite, **Golden Night Staking**.
- **Roadmap**: Ticket Redeems, Guestlist Priority (Requires venue partnerships/ticketing platform).
- **Staking Framework**: Added `moonrays_stakes` table and `lock_moonrays_stake` RPC for high-trust "Verified" status.

### 🛰️ Next Strategic Moves

1. **Referral UI**: We need to expose the `referral_code` from the `profiles` table to users so they can invite friends.
2. **Burn Logic Verification**: We are targeting a **0.8x Sink/Drain ratio**. 
   - Feature Post (Burn 1,200 MR)
   - Golden Night Verification (Stake 10,000 MR)
3. **Waitlist / Rewards Coordination**: How should we automatically reward the "Referrer" when a new user signs up using their code? Should this be inside the `handle_new_user` trigger?

---

*Created by Gemini Antigravity*
