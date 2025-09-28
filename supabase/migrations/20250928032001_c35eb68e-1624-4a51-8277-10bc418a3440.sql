-- Create global engagement counter table
CREATE TABLE public.global_engagement (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  counter_name text NOT NULL UNIQUE,
  counter_value bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_engagement ENABLE ROW LEVEL SECURITY;

-- Create policies for global engagement counter
CREATE POLICY "Global engagement is readable by all" 
ON public.global_engagement 
FOR SELECT 
USING (true);

CREATE POLICY "Global engagement is updatable by all authenticated users" 
ON public.global_engagement 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Insert the initial love counter
INSERT INTO public.global_engagement (counter_name, counter_value)
VALUES ('love_counter', 0);

-- Create function to increment global counter safely
CREATE OR REPLACE FUNCTION public.increment_global_counter(counter_name_param text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.global_engagement 
  SET counter_value = counter_value + 1,
      updated_at = now()
  WHERE counter_name = counter_name_param
  RETURNING counter_value INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Create table for message reactions
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id bigint NOT NULL,
  user_id uuid,
  reaction_emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for message reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for message reactions
CREATE POLICY "Message reactions are viewable by all" 
ON public.message_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can add their own reactions" 
ON public.message_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own reactions" 
ON public.message_reactions 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create table for message attachments
CREATE TABLE public.message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id bigint NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for message attachments
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for message attachments
CREATE POLICY "Message attachments are viewable by all" 
ON public.message_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can upload attachments" 
ON public.message_attachments 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by OR uploaded_by IS NULL);

-- Add trigger for updated_at on global_engagement
CREATE TRIGGER update_global_engagement_updated_at
  BEFORE UPDATE ON public.global_engagement
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();