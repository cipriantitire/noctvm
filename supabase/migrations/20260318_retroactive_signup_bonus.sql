-- ============================================================================
-- NOCTVM: Retroactive Moonrays Sign-up Bonus
-- This awards 500 MR to existing users who haven't received it yet.
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Loop through all users who don't have a SIGNUP_BONUS in the ledger
    FOR r IN 
        SELECT p.id, p.display_name 
        FROM profiles p
        WHERE NOT EXISTS (
            SELECT 1 FROM moonrays_ledger_transactions 
            WHERE user_id = p.id AND txn_ref ILIKE 'SIGNUP_BONUS%'
        )
    LOOP
        -- 2. Award the 500 MR bonus
        PERFORM award_moonrays(
            r.id, 
            500, 
            'Sign-up Bonus', 
            'SIGNUP_BONUS_' || r.id -- Idempotent ref
        );
        RAISE NOTICE 'Awarded retroactive bonus to: % (%)', r.display_name, r.id;
    END LOOP;
END $$;
