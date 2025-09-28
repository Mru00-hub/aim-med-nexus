-- supabase/migrations/20250929020000_create_discovery_hub_functions.sql

-- Function #1: Gets all Forums and Community Spaces for the discovery page.
-- It includes member counts and a flag to see if the current user has joined.
CREATE OR REPLACE FUNCTION get_discovery_spaces()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    type public.space_type,
    category TEXT,
    specialty TEXT,
    is_public BOOLEAN,
    members BIGINT,
    is_joined BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.name,
        s.description,
        s.type,
        s.category,
        s.specialty,
        (s.forum_type = 'PUBLIC') as is_public,
        (SELECT COUNT(*) FROM public.memberships m WHERE m.space_id = s.id AND m.status = 'APPROVED') as members,
        EXISTS(SELECT 1 FROM public.memberships m WHERE m.space_id = s.id AND m.user_id = auth.uid() AND m.status = 'APPROVED') as is_joined
    FROM
        public.spaces s;
END;
$$ LANGUAGE plpgsql;


-- Function #2: Gets all Public Threads for the discovery page.
-- Includes author details and reply counts.
CREATE OR REPLACE FUNCTION get_public_threads_overview()
RETURNS TABLE (
    id UUID,
    title TEXT,
    author_email TEXT,
    replies BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.title,
        u.email as author_email,
        (SELECT COUNT(*) FROM public.messages m WHERE m.thread_id = t.id) as replies,
        t.created_at
    FROM
        public.threads t
    JOIN
        auth.users u ON t.creator_id = u.id
    WHERE
        t.space_id IS NULL -- This identifies it as a Public Thread
    ORDER BY
        t.created_at DESC;
END;
$$ LANGUAGE plpgsql;
