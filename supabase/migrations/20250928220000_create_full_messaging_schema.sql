-- supabase/migrations/20250928220000_create_full_messaging_schema.sql

-- =================================================================
-- Step 1: Create the missing 'threads' table for main posts
-- =================================================================
CREATE TABLE public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) > 3),
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Enable RLS and set policies for the threads table
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public threads are viewable by everyone." ON public.threads FOR SELECT USING (true);
CREATE POLICY "Users can insert their own threads." ON public.threads FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =================================================================
-- Step 2: Create the missing 'public_thread_messages' table
-- NOTE: The primary key 'id' is BIGINT to match your existing tables.
-- =================================================================
CREATE TABLE public.public_thread_messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, -- Use BIGINT to be compatible with your other tables
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    parent_message_id BIGINT REFERENCES public.public_thread_messages(id) ON DELETE CASCADE, -- For nested replies
    body TEXT NOT NULL CHECK (char_length(body) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Enable RLS and set policies for the messages table
ALTER TABLE public.public_thread_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public messages are viewable by everyone." ON public.public_thread_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert their own messages." ON public.public_thread_messages FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =================================================================
-- Step 3: Use your existing schemas and add Foreign Key constraints
-- This links your existing tables to the new 'public_thread_messages' table.
-- =================================================================

-- Create table for message reactions (your schema + Foreign Key)
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id bigint NOT NULL REFERENCES public.public_thread_messages(id) ON DELETE CASCADE, -- Added Foreign Key
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Added Foreign Key
  reaction_emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id, reaction_emoji) -- Added for data integrity
);
-- RLS and Policies for reactions (from your file)
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Message reactions are viewable by all" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add their own reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);


-- Create table for message attachments (your schema + Foreign Key)
CREATE TABLE public.message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id bigint NOT NULL REFERENCES public.public_thread_messages(id) ON DELETE CASCADE, -- Added Foreign Key
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Added Foreign Key
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
-- RLS and Policies for attachments (from your file)
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Message attachments are viewable by all" ON public.message_attachments FOR SELECT USING (true);
CREATE POLICY "Users can upload attachments" ON public.message_attachments FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- =================================================================
-- This section for the global counter seems separate from the messaging
-- feature, but is included for completeness from your file.
-- =================================================================
CREATE TABLE public.global_engagement (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  counter_name text NOT NULL UNIQUE,
  counter_value bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.global_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Global engagement is readable by all" ON public.global_engagement FOR SELECT USING (true);
CREATE POLICY "Global engagement is updatable by all authenticated users" ON public.global_engagement FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
INSERT INTO public.global_engagement (counter_name, counter_value) VALUES ('love_counter', 0);
