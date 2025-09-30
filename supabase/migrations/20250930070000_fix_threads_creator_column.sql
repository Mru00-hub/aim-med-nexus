-- Rename the inconsistent column in the 'threads' table to match other tables like 'forums'
ALTER TABLE public.threads
RENAME COLUMN created_by TO creator_id;
