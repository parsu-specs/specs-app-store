-- Retire the self-serve profile-claim RPC.
-- The client merge flow is deleted; leaving a SECURITY DEFINER function
-- that moves anyone's projects on name-equality would keep the takeover
-- reachable by direct RPC call. Duplicate rows are now prevented by
-- migration_unique_names.sql instead. Run in the Supabase SQL editor
-- (main project). Re-runnable.

drop function if exists claim_profile(text);
