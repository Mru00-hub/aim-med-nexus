// src/integrations/supabase/engagement.ts
import { supabase } from './client';

/**
 * Fetches the current value of the love counter from the database.
 */
export const getLoveCount = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('global_engagement')
    .select('counter_value')
    .eq('counter_name', 'love_counter')
    .single();

  if (error) {
    console.error('Error fetching love count:', error);
    return 0;
  }

  return data?.counter_value || 0;
};

/**
 * Calls the PostgreSQL function to increment the love counter and returns the new value.
 */
export const incrementLoveCount = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('increment_global_counter', {
    counter_name_param: 'love_counter',
  });

  if (error) {
    console.error('Error incrementing love count:', error);
    // Return a fallback or handle the error as needed
    return 0;
  }

  return data;
};
