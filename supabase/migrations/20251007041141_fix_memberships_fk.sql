-- Drop the existing foreign key that links memberships to auth.users
ALTER TABLE "public"."memberships"
DROP CONSTRAINT IF EXISTS "memberships_user_id_fkey";

-- Add the new, correct foreign key that links memberships directly to profiles
ALTER TABLE "public"."memberships"
ADD CONSTRAINT "memberships_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;