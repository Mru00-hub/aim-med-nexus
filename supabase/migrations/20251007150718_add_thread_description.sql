-- Step 1: Add a nullable 'description' column to the threads table.
ALTER TABLE public.threads
ADD COLUMN description TEXT NULL;

-- Step 2: Update the create_thread function to accept the new optional description.
CREATE OR REPLACE FUNCTION public.create_thread(
  p_title text,
  p_body text,
  p_space_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL -- New optional parameter
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_thread_id UUID;
    v_target_space_id UUID;
BEGIN
    v_target_space_id := COALESCE(
        p_space_id, 
        (SELECT id FROM public.spaces WHERE space_type = 'PUBLIC' LIMIT 1)
    );

    -- Insert the new thread, now including the description.
    INSERT INTO public.threads (creator_id, title, space_id, description)
    VALUES (auth.uid(), p_title, v_target_space_id, p_description)
    RETURNING id INTO v_new_thread_id;
    IF p_body IS NOT NULL AND char_length(p_body) > 0 THEN
        INSERT INTO public.messages (user_id, thread_id, body)
        VALUES (auth.uid(), v_new_thread_id, p_body);
    END IF;
    RETURN v_new_thread_id;
END;
$$;