-- supabase/migrations/20250929214500_create_content_fetching_functions.sql

-- =================================================================
-- API Function 1: get_threads
-- A unified function to fetch threads for the Global space, a Forum, or a Community Space.
-- RLS policies automatically handle security, so we only see threads we have access to.
-- Includes enriched data like author username and last message activity.
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_threads(
    p_container_id UUID DEFAULT NULL,
    p_container_type public.space_type DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    creator_id UUID,
    creator_email TEXT,
    container_id UUID,
    container_type public.space_type,
    created_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    message_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.title,
        t.creator_id,
        u.email as creator_email,
        t.container_id,
        t.container_type,
        t.created_at,
        (SELECT MAX(m.created_at) FROM public.messages m WHERE m.thread_id = t.id) as last_message_at,
        (SELECT COUNT(*) FROM public.messages m WHERE m.thread_id = t.id) as message_count
    FROM
        public.threads t
    JOIN
        auth.users u ON t.creator_id = u.id
    WHERE
        -- This condition handles both cases:
        -- 1. If p_container_id is NULL, it looks for Global threads (where container_id IS NULL).
        -- 2. If p_container_id is provided, it matches both container_id and container_type.
        (t.container_id = p_container_id OR (t.container_id IS NULL AND p_container_id IS NULL)) AND
        (t.container_type = p_container_type OR (t.container_type IS NULL AND p_container_type IS NULL))
    ORDER BY
        last_message_at DESC NULLS LAST; -- Show most active threads first
END;
$$ LANGUAGE plpgsql STABLE;
-- STABLE indicates the function doesn't modify the database and returns the same
-- result for the same arguments within a single transaction.


-- =================================================================
-- API Function 2: get_messages
-- Fetches all messages for a single thread, including user details.
-- Includes a security check to ensure the user has permission to view the thread.
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_messages(p_thread_id UUID)
RETURNS TABLE (
    id BIGINT,
    body TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    email TEXT
) AS $$
BEGIN
    -- Security Check: Use our existing helper function to verify access.
    -- This is the most critical step.
    IF NOT can_view_thread(p_thread_id) THEN
        RAISE EXCEPTION 'Permission denied: You do not have access to this thread.';
    END IF;

    -- If the check passes, return the messages with user details.
    RETURN QUERY
    SELECT
        m.id,
        m.body,
        m.created_at,
        m.user_id,
        u.email
    FROM
        public.messages m
    JOIN
        auth.users u ON m.user_id = u.id
    WHERE
        m.thread_id = p_thread_id
    ORDER BY
        m.created_at ASC; -- Display messages in chronological order
END;
$$ LANGUAGE plpgsql STABLE;

