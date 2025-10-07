-- This migration updates the create_thread function to correctly handle public threads.
-- It ensures a NULL space_id is converted to the official PUBLIC space's ID
-- before insertion, which satisfies the RLS policy.

CREATE OR REPLACE FUNCTION public.create_thread(
  p_title text,
  p_body text,
  p_space_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_thread_id UUID;
    -- Declare a variable to hold the final space ID
    v_target_space_id UUID;
BEGIN
    -- If p_space_id is NULL (meaning it's a public thread),
    -- then use the ID of the official 'PUBLIC' space. Otherwise, use the provided ID.
    v_target_space_id := COALESCE(
        p_space_id, 
        (SELECT id FROM public.spaces WHERE space_type = 'PUBLIC' LIMIT 1)
    );

    -- Step 1: Insert the new thread using the determined space ID.
    INSERT INTO public.threads (creator_id, title, space_id)
    VALUES (auth.uid(), p_title, v_target_space_id)
    RETURNING id INTO v_new_thread_id;

    -- Step 2: Insert the initial message for this new thread.
    IF p_body IS NOT NULL AND char_length(p_body) > 0 THEN
        INSERT INTO public.messages (user_id, thread_id, body)
        VALUES (auth.uid(), v_new_thread_id, p_body);
    END IF;

    -- Return the ID of the newly created thread.
    RETURN v_new_thread_id;
END;
$$;