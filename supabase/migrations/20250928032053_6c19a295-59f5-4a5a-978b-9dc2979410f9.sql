-- Fix function search path issues for security compliance

-- Update increment_global_counter function with proper search path
CREATE OR REPLACE FUNCTION public.increment_global_counter(counter_name_param text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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