-- This migration updates the can_view_thread function to be compatible
-- with the new schema where 'threads.space_type' no longer exists.
-- It now correctly joins with the 'spaces' table to get the space_type.

CREATE OR REPLACE FUNCTION public.can_view_thread(p_thread_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_space_id UUID;
    v_space_type public.space_type;
BEGIN
    -- Step 1: Find the space_id and space_type for the given thread
    -- by joining threads with spaces.
SELECT
    t.space_id,
    s.space_type
INTO
    v_space_id,
    v_space_type
FROM
    public.threads t
JOIN
    public.spaces s ON t.space_id = s.id
WHERE
    t.id = p_thread_id;

    -- If the query returned no rows (e.g., bad thread_id), deny access.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Step 2: Check permissions based on the space type.
    -- If the space type is 'PUBLIC', any authenticated user can view.
    IF v_space_type = 'PUBLIC' THEN
        RETURN auth.role() = 'authenticated';
    END IF;
    -- For any other type ('FORUM', 'COMMUNITY_SPACE'),
    -- check if the user is a member of that space.
    RETURN public.is_space_member(v_space_id);
END;
$$;