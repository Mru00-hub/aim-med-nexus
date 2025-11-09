// src/integrations/supabase/content.api.ts

import { supabase } from './client';
// We will add this type in the next step
import { FeaturedVideo } from './types'; 

/**
 * Fetches all featured videos, ordered by creation date.
 * This is publicly accessible.
 */
export const getFeaturedVideos = async (): Promise<FeaturedVideo[]> => {
  const { data, error } = await supabase
    .from('featured_videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured videos:', error);
    throw error;
  }
  return data || [];
};
