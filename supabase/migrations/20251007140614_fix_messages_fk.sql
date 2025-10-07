-- Drop the existing foreign key that links messages to auth.users
ALTER TABLE "public"."messages"
DROP CONSTRAINT IF EXISTS "messages_user_id_fkey";

-- Add the new, correct foreign key that links messages directly to profiles
ALTER TABLE "public"."messages"
ADD CONSTRAINT "messages_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;