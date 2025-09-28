-- supabase/migrations/20250929220000_create_post_message_function.sql
CREATE OR REPLACE FUNCTION public.post_message(p_thread_id UUID, p_body TEXT)
RETURNS public.messages AS $$
DECLARE
    v_new_message public.messages;
BEGIN
    -- RLS on the 'messages' table already checks if the user can post
    -- in this thread (via the can_view_thread helper), so the INSERT
    -- will fail if they don't have permission.
    INSERT INTO public.messages (thread_id, user_id, body)
    VALUES (p_thread_id, auth.uid(), p_body)
    RETURNING * INTO v_new_message;

    RETURN v_new_message;
END;
$$ LANGUAGE plpgsql;
