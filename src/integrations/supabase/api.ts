// src/integrations/supabase/api.ts
import { supabase } from './client';
import { Database } from './types'; // Import the auto-generated types

// Type aliases for easier use in components
export type Thread = Database['public']['Tables']['threads']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Forum = Database['public']['Tables']['forums']['Row'];

// API function to get threads
export const getThreads = async (
  containerId: string | null,
  containerType: 'FORUM' | 'COMMUNITY_SPACE' | null
) => {
  const { data, error } = await supabase.rpc('get_threads', {
    p_container_id: containerId,
    p_container_type: containerType,
  });
  if (error) throw error;
  return data;
};

// API function to get messages for a thread
export const getMessages = async (threadId: string) => {
  const { data, error } = await supabase.rpc('get_messages', {
    p_thread_id: threadId,
  });
  if (error) throw error;
  return data;
};

// API function to post a message
export const postMessage = async (threadId: string, body: string) => {
  const { data, error } = await supabase.rpc('post_message', {
    p_thread_id: threadId,
    p_body: body,
  });
  if (error) throw error;
  return data;
};

// ... add other functions like join_public_forum, etc. here
