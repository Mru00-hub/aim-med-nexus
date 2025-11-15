-- Step 1: Create a dedicated bucket in Supabase Storage for message attachments.
-- We make the bucket public for easy file access via URL, but access control will be
-- handled by RLS policies on the storage objects and on the message_attachments table.
SELECT storage.create_bucket(
  'message_attachments',
  '{ "public": true }'::jsonb,
  NULL, -- Use default file size limit
  NULL  -- Use default allowed MIME types
);

-- Step 2: Clean up the message_attachments table by removing the redundant user_id column.
-- The 'uploaded_by' column already correctly tracks the file owner.
ALTER TABLE public.message_attachments
DROP COLUMN IF EXISTS user_id;


-- Step 3: Create Row-Level Security (RLS) policies for the new storage bucket.
-- These policies control who can view, upload, update, and delete files.

-- Policy 1: Allow any authenticated user to view/download files.
-- The URLs are protected by the RLS on the 'message_attachments' table itself,
-- so only users who can see a message can get the file URL in the first place.
CREATE POLICY "Allow authenticated read access on attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'message_attachments');


-- Policy 2: Allow any authenticated user to upload files to this bucket.
-- Supabase automatically sets the 'owner' of the file to the uploader's auth.uid().
CREATE POLICY "Allow authenticated insert on attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message_attachments');


-- Policy 3: Allow users to update only their own files.
CREATE POLICY "Allow individual update on own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner AND bucket_id = 'message_attachments');


-- Policy 4: Allow users to delete only their own files.
CREATE POLICY "Allow individual delete on own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner AND bucket_id = 'message_attachments');
