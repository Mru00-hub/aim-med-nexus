-- supabase/migrations/2025092214200_create_memberships_table.sql

-- Create membership_status enum
CREATE TYPE public.membership_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'BANNED');

-- Create membership_role enum
CREATE TYPE public.membership_role AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

-- Create memberships table
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    space_id UUID NOT NULL,
    space_type public.space_type NOT NULL,
    status public.membership_status NOT NULL DEFAULT 'PENDING',
    role public.membership_role NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure a user can only have one membership per space
    CONSTRAINT unique_user_space UNIQUE (user_id, space_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_space_id ON public.memberships(space_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);
CREATE INDEX idx_memberships_space_type ON public.memberships(space_type);

-- Enable Row Level Security
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
    ON public.memberships FOR SELECT
    USING (auth.uid() = user_id);

-- Moderators/Admins can view all memberships in their spaces
CREATE POLICY "Moderators or Admins can view space memberships"
    ON public.memberships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.user_id = auth.uid()
            AND m.space_id = memberships.space_id
            AND m.status = 'APPROVED'
            AND m.role IN ('MODERATOR', 'ADMIN')
        )
    );

-- Users can insert their own membership requests
CREATE POLICY "Users can request membership"
    ON public.memberships FOR INSERT
    WITH CHECK (auth.uid() = user_id);1
