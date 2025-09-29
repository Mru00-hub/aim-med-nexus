-- supabase/migrations/20250928214500_create_core_api_functions.sql

-- =================================================================
-- API Function 1: join_public_forum
-- Allows a user to instantly join a forum that is 'PUBLIC'.
-- =================================================================
CREATE OR REPLACE FUNCTION public.join_public_forum(p_space_id UUID)
RETURNS UUID AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    -- First, verify the forum is actually public to prevent misuse
    IF NOT EXISTS (SELECT 1 FROM public.forums WHERE id = p_space_id AND type = 'FORUM' AND forum_type = 'PUBLIC') THEN
        RAISE EXCEPTION 'Forum is not public or does not exist.';
    END IF;

    -- Insert the user into the memberships table with 'APPROVED' status.
    -- If they already have a record (e.g., were previously denied or pending),
    -- this will update their status to 'APPROVED'.
    INSERT INTO public.memberships (user_id, space_id, space_type, status, role)
    VALUES (auth.uid(), p_space_id, 'FORUM', 'APPROVED', 'MEMBER')
    ON CONFLICT (user_id, space_id)
    DO UPDATE SET
        status = 'APPROVED',
        role = 'MEMBER'
    RETURNING id INTO v_membership_id;

    RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER is used to bypass RLS for this specific, controlled action.
-- The function's internal logic provides the necessary security checks.


-- =================================================================
-- API Function 2: request_to_join_space
-- Allows a user to request access to a 'PRIVATE' forum or a 'COMMUNITY_SPACE'.
-- =================================================================
CREATE OR REPLACE FUNCTION public.request_to_join_space(p_space_id UUID, p_space_type TEXT)
RETURNS UUID AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    -- Insert the user with a 'PENDING' status.
    -- ON CONFLICT DO NOTHING prevents creating duplicate pending requests.
    INSERT INTO public.memberships (user_id, space_id, space_type, status, role)
    VALUES (auth.uid(), p_space_id, 'PENDING', 'MEMBER')
    ON CONFLICT (user_id, space_id)
    DO NOTHING;

    -- If the insert was skipped (due to conflict), v_membership_id will be NULL.
    -- We can select the existing ID to return a consistent value.
    SELECT id INTO v_membership_id
    FROM public.memberships
    WHERE user_id = auth.uid()
        AND space_id = p_space_id;

    RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- API Function 3: create_thread
-- Creates a new thread and its first message in a single transaction.
-- Works for Global, Forum, and Community Space threads.
-- =================================================================
CREATE OR REPLACE FUNCTION public.create_thread(
    p_title TEXT,
    p_body TEXT,
    p_space_id UUID DEFAULT NULL -- NULL for Global threads
)
RETURNS UUID AS $$
DECLARE
    v_new_thread_id UUID;
BEGIN
    -- The RLS policy on the 'threads' table already checks if the user is an
    -- approved member of the container space, so we don't need to re-check here.
    -- The INSERT will fail automatically if they don't have permission.

    -- Step 1: Insert the new thread and capture its generated ID.
    INSERT INTO public.threads (creator_id, title, space_id)
    VALUES (auth.uid(), p_title, p_space_id)
    RETURNING id INTO v_new_thread_id;

    -- Step 2: Insert the initial message for this new thread.
    -- The RLS policy on 'messages' will also succeed because it checks
    -- permissions on the parent thread, which we just created.
    IF p_body IS NOT NULL AND char_length(p_body) > 0 THEN
        INSERT INTO public.messages (user_id, thread_id, body)
        VALUES (auth.uid(), v_new_thread_id, p_body);
    END IF;

    -- Return the ID of the newly created thread.
    RETURN v_new_thread_id;
END;
$$ LANGUAGE plpgsql;
-- SECURITY INVOKER is fine here as this function relies on the user's
-- RLS policies to perform its security checks.

