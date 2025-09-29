-- supabase/migrations/20250928233000_refactor_messaging_with_containers.sql

-- =================================================================
-- Step 0: Clean up old schema if it exists to make this script rerunnable
-- =================================================================
DROP TABLE IF EXISTS public.global_engagement;
DROP TABLE IF EXISTS public.message_attachments;
DROP TABLE IF EXISTS public.message_reactions;
DROP TABLE IF EXISTS public.public_thread_messages;
DROP TABLE IF EXISTS public.threads;
DROP TYPE IF EXISTS public.space_type CASCADE;
DROP TYPE IF EXISTS public.forum_type CASCADE;
DROP TYPE IF EXISTS public.membership_role CASCADE;
DROP TYPE IF EXISTS public.membership_status CASCADE;

-- =================================================================
-- Step 1: Define Custom Types (ENUMs) for clarity and data integrity
-- =================================================================
CREATE TYPE public.space_type AS ENUM ('FORUM', 'COMMUNITY_SPACE');
CREATE TYPE public.forum_type AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE public.membership_role AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');
CREATE TYPE public.membership_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'BANNED');


-- =================================================================
-- Step 2: Create the Container Tables (Forums & Community Spaces)
-- =================================================================

-- Forums Table
CREATE TABLE public.forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 3),
    description TEXT,
    type public.forum_type NOT NULL DEFAULT 'PUBLIC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forums are visible to all authenticated users." ON public.forums FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create forums." ON public.forums FOR INSERT WITH CHECK (auth.uid() = creator_id);
-- NOTE: Add UPDATE/DELETE policies as needed, likely restricted to creator/admins.

-- Community Spaces Table
CREATE TABLE public.community_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 3),
    description TEXT,
    -- You might add columns for application questions, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community Spaces are visible to all authenticated users." ON public.community_spaces FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create community spaces." ON public.community_spaces FOR INSERT WITH CHECK (auth.uid() = creator_id);
-- NOTE: Add UPDATE/DELETE policies as needed.


-- =================================================================
-- Step 3: Create the Unified Membership Table for Access Control
-- =================================================================
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    space_id UUID NOT NULL, -- Points to forums.id or community_spaces.id
    space_type public.space_type NOT NULL,
    role public.membership_role NOT NULL DEFAULT 'MEMBER',
    status public.membership_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, space_id, space_type) -- Ensures a user has only one membership per space
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own memberships." ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins/Mods can see memberships for their space." ON public.memberships FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
        AND m.space_id = memberships.space_id
        AND m.space_type = memberships.space_type
        AND m.role IN ('ADMIN', 'MODERATOR')
    )
);
CREATE POLICY "Users can request to join spaces." ON public.memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
-- NOTE: Policies for updating status (approving members) should be restricted to ADMIN/MODERATOR roles.


-- =================================================================
-- Step 4: Create the Refactored 'threads' Table
-- This table is now polymorphic, able to belong to different containers.
-- =================================================================
CREATE TABLE public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) > 3),
    -- New columns for container logic
    container_id UUID, -- NULL for Global threads
    container_type public.space_type, -- NULL for Global threads
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Ensures that if one container field is set, the other is too
    CONSTRAINT check_container_consistency CHECK ((container_id IS NULL AND container_type IS NULL) OR (container_id IS NOT NULL AND container_type IS NOT NULL))
);


-- =================================================================
-- Step 5: Create the 'messages' Table (replaces public_thread_messages)
-- NOTE: parent_message_id is REMOVED to support continuous chat UI.
-- =================================================================
CREATE TABLE public.messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    body TEXT NOT NULL CHECK (char_length(body) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_container ON public.threads(container_id, container_type);
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- =================================================================
-- Step 6: Create RLS Helper Functions for Complex Permission Checks
-- =================================================================
CREATE OR REPLACE FUNCTION public.is_approved_member(p_user_id UUID, p_space_id UUID, p_space_type public.space_type)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.memberships
        WHERE user_id = p_user_id
          AND space_id = p_space_id
          AND space_type = p_space_type
          AND status = 'APPROVED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_view_thread(p_thread_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_container_id UUID;
    v_container_type public.space_type;
BEGIN
    SELECT container_id, container_type INTO v_container_id, v_container_type
    FROM public.threads
    WHERE id = p_thread_id;

    -- Global threads are visible to all authenticated users
    IF v_container_id IS NULL THEN
        RETURN auth.role() = 'authenticated';
    END IF;

    -- For container threads, check for approved membership
    RETURN is_approved_member(auth.uid(), v_container_id, v_container_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- Step 7: Apply Advanced RLS Policies to Content Tables
-- =================================================================

-- Policies for 'threads'
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads are viewable based on container membership." ON public.threads FOR SELECT USING (can_view_thread(id));
CREATE POLICY "Users can insert threads into spaces they are members of (or global)." ON public.threads FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    (
        -- Case 1: Creating a Global thread
        container_id IS NULL OR
        -- Case 2: Creating a thread in a Forum/Space
        is_approved_member(auth.uid(), container_id, container_type)
    )
);

-- Policies for 'messages'
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages are viewable if the parent thread is viewable." ON public.messages FOR SELECT USING (can_view_thread(thread_id));
CREATE POLICY "Users can insert messages in threads they can view." ON public.messages FOR INSERT WITH CHECK (user_id = auth.uid() AND can_view_thread(thread_id));


-- =================================================================
-- Step 8: Re-create Ancillary Tables with Correct Foreign Keys
-- These now point to the new 'messages' table.
-- =================================================================

-- Message Reactions Table
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id BIGINT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reaction_emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id, reaction_emoji)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable if the parent message is viewable." ON public.message_reactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.messages WHERE id = message_id) -- RLS on messages table will handle the rest
);
CREATE POLICY "Users can add reactions to messages they can view." ON public.message_reactions FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages WHERE id = message_id)
);
CREATE POLICY "Users can delete their own reactions." ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- Message Attachments Table
CREATE TABLE public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id BIGINT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attachments are viewable if the parent message is viewable." ON public.message_attachments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.messages WHERE id = message_id)
);
CREATE POLICY "Users can upload attachments to messages they can view." ON public.message_attachments FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.messages WHERE id = message_id)
);


-- =================================================================
-- Step 9: Re-add the Global Engagement Table (for completeness)
-- =================================================================
CREATE TABLE public.global_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_name TEXT NOT NULL UNIQUE,
  counter_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.global_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global engagement is readable by all" ON public.global_engagement FOR SELECT USING (true);
CREATE POLICY "Global engagement is updatable by authenticated users" ON public.global_engagement FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
INSERT INTO public.global_engagement (counter_name, counter_value) VALUES ('love_counter', 0);

-- =================================================================
-- Step 10: Create API Functions for Space Joining
-- =================================================================

CREATE OR REPLACE FUNCTION public.join_public_forum(p_space_id UUID)
RETURNS UUID AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.forums WHERE id = p_space_id AND type = 'PUBLIC') THEN
        RAISE EXCEPTION 'Forum is not public or does not exist.';
    END IF;

    INSERT INTO public.memberships (user_id, space_id, space_type, status, role)
    VALUES (auth.uid(), p_space_id, 'FORUM', 'APPROVED', 'MEMBER')
    ON CONFLICT (user_id, space_id)
    DO UPDATE SET status = 'APPROVED', role = 'MEMBER'
    RETURNING id INTO v_membership_id;

    RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.request_to_join_space(p_space_id UUID, p_space_type public.space_type)
RETURNS UUID AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    INSERT INTO public.memberships (user_id, space_id, space_type, status, role)
    VALUES (auth.uid(), p_space_id, p_space_type, 'PENDING', 'MEMBER')
    ON CONFLICT (user_id, space_id) DO NOTHING;

    SELECT id INTO v_membership_id
    FROM public.memberships
    WHERE user_id = auth.uid() AND space_id = p_space_id;

    RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- Step 11: Create Membership Management Functions
-- =================================================================

CREATE OR REPLACE FUNCTION public.is_space_moderator_or_admin(p_space_id UUID, p_space_type public.space_type)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = auth.uid()
          AND space_id = p_space_id
          AND space_type = p_space_type
          AND status = 'APPROVED'
          AND role IN ('MODERATOR', 'ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_pending_requests(p_space_id UUID, p_space_type public.space_type)
RETURNS TABLE (
    membership_id UUID,
    user_id UUID,
    email TEXT,
    requested_at TIMESTAMPTZ
) AS $$
BEGIN
    IF NOT is_space_moderator_or_admin(p_space_id, p_space_type) THEN
        RAISE EXCEPTION 'Permission denied: You must be a moderator or admin of this space.';
    END IF;

    RETURN QUERY
    SELECT m.id, m.user_id, u.email, m.created_at
    FROM public.memberships m
    JOIN auth.users u ON m.user_id = u.id
    WHERE m.space_id = p_space_id
      AND m.space_type = p_space_type
      AND m.status = 'PENDING'
    ORDER BY m.created_at;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_membership_status(p_membership_id UUID, p_new_status public.membership_status)
RETURNS SETOF public.memberships AS $$
DECLARE
    v_membership RECORD;
BEGIN
    SELECT * INTO v_membership FROM public.memberships WHERE id = p_membership_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membership not found.';
    END IF;

    IF NOT is_space_moderator_or_admin(v_membership.space_id, v_membership.space_type) THEN
        RAISE EXCEPTION 'Permission denied: You must be a moderator or admin of this space.';
    END IF;

    UPDATE public.memberships
    SET status = p_new_status, updated_at = now()
    WHERE id = p_membership_id
    RETURNING * INTO v_membership;

    RETURN NEXT v_membership;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Step 12: Add performance indexes
-- =================================================================
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_space_id ON public.memberships(space_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);
CREATE INDEX idx_memberships_space_type ON public.memberships(space_type);
