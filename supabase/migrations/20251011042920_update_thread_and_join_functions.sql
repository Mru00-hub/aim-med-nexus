-- Migration to fix the get_threads and request_to_join_space functions

-- Fix 1: Correct the get_threads function
-- Changes p.email to p.full_name and ensures all columns for the ThreadWithDetails type are selected.
CREATE OR REPLACE FUNCTION "public"."get_threads"("p_space_id" "uuid" DEFAULT NULL::"uuid") 
RETURNS TABLE(
    "id" "uuid", 
    "title" "text", 
    "creator_id" "uuid", 
    "creator_full_name" "text", -- Renamed from creator_email
    "created_at" timestamp with time zone, 
    "last_activity_at" timestamp with time zone, 
    "message_count" integer,
    "space_id" "uuid" -- Added for consistency
)
LANGUAGE "sql" STABLE
AS $$
  SELECT
    t.id,
    t.title,
    t.creator_id,
    p.full_name AS creator_full_name, -- FIX: Select full_name, which exists
    t.created_at,
    t.last_activity_at,
    t.message_count,
    t.space_id
  FROM
    public.threads t
  JOIN
    public.profiles p ON t.creator_id = p.id
  WHERE
    -- If p_space_id is provided, use it. Otherwise, find the ID of the public space.
    t.space_id = COALESCE(p_space_id, (SELECT pub.id FROM public.spaces pub WHERE pub.space_type = 'PUBLIC' LIMIT 1));
$$;

-- Fix 2: Correct the request_to_join_space function
-- Removes the p_space_type parameter and the attempt to insert into the non-existent space_type column.
CREATE OR REPLACE FUNCTION "public"."request_to_join_space"("p_space_id" "uuid") 
RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$                           
DECLARE
    v_membership_id UUID;
BEGIN
    -- Insert the user with a 'PENDING' status.
    -- The incorrect "space_type" column has been removed from this INSERT statement
    INSERT INTO public.memberships (user_id, space_id, status, "role")
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
$$;
