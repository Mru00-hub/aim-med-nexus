-- supabase/migrations/20250928215000_create_membership_management_functions.sql
-- Create membership_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        CREATE TYPE public.membership_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'BANNED');
    END IF;
END $$;

-- First, we need a helper function to check if the current user is a moderator or admin of a given space.
-- This simplifies the logic in our main API functions and makes security checks reusable.
CREATE OR REPLACE FUNCTION public.is_space_moderator_or_admin(p_space_id UUID, p_space_type public.space_type)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.memberships
        WHERE user_id = auth.uid()
          AND space_id = p_space_id
          AND space_type = p_space_type
          AND status = 'APPROVED'
          AND role IN ('MODERATOR', 'ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- API Function 1: get_pending_requests
-- Fetches a list of users whose membership status is 'PENDING' for a specific space.
-- Only callable by an approved Moderator or Admin of that space.
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_pending_requests(p_space_id UUID, p_space_type public.space_type)
RETURNS TABLE (
    membership_id UUID,
    user_id UUID,
    email TEXT,
    requested_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Security Check: Ensure the user calling this function is a mod or admin.
    IF NOT is_space_moderator_or_admin(p_space_id, p_space_type) THEN
        RAISE EXCEPTION 'Permission denied: You must be a moderator or admin of this space.';
    END IF;

    -- If the check passes, return the pending requests.
    -- We join with auth.users to get identifiable info like email.
    RETURN QUERY
    SELECT
        m.id AS membership_id,
        m.user_id,
        u.email,
        m.created_at AS requested_at
    FROM public.memberships m
    JOIN auth.users u ON m.user_id = u.id
    WHERE m.space_id = p_space_id
      AND m.space_type = p_space_type
      AND m.status = 'PENDING'
    ORDER BY m.created_at;
END;
$$ LANGUAGE plpgsql;
-- SECURITY INVOKER is used here. The function's logic relies on our helper
-- function (which is SECURITY DEFINER) to perform the elevated security check.


-- =================================================================
-- API Function 2: update_membership_status
-- Allows a Moderator or Admin to change a user's membership status (e.g., approve, deny, ban).
-- =================================================================
CREATE OR REPLACE FUNCTION public.update_membership_status(p_membership_id UUID, p_new_status public.membership_status)
RETURNS SETOF public.memberships AS $$
DECLARE
    v_membership RECORD;
    v_space_id UUID;
    v_space_type public.space_type;
BEGIN
    -- Step 1: Find the space this membership belongs to.
    SELECT * INTO v_membership FROM public.memberships WHERE id = p_membership_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membership not found.';
    END IF;

    v_space_id := v_membership.space_id;
    v_space_type := v_membership.space_type;

    -- Step 2: Security Check: Ensure the current user is a mod/admin of that space.
    IF NOT is_space_moderator_or_admin(v_space_id, v_space_type) THEN
        RAISE EXCEPTION 'Permission denied: You must be a moderator or admin of this space.';
    END IF;

    -- Step 3: If the check passes, update the status.
    UPDATE public.memberships
    SET status = p_new_status, updated_at = now()
    WHERE id = p_membership_id
    RETURNING * INTO v_membership;

    RETURN v_membership.id;
END;
$$ LANGUAGE plpgsql;

