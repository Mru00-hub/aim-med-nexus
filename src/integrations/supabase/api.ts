// src/integrations/supabase/api.ts
import { supabase } from './client';
import { Database } from './types'; // Import the auto-generated types

// Type aliases for easier use in components
export type Space = Database['public']['Functions']['get_discovery_spaces']['Returns'][number];
export type PublicThread = Database['public']['Tables']['threads']['Row'];
export type ThreadInSpace = Database['public']['Functions']['get_threads_for_space']['Returns'][number];
export type MessageWithAuthor = Database['public']['Functions']['get_messages_for_thread']['Returns'][number];

export const getSpaces = async () => {
  const { data, error } = await supabase.rpc('get_discovery_spaces');
  if (error) {
    console.error('Error fetching spaces:', error);
    throw error;
  }
  return data;
};

/*Fetches the overview of all Public Threads.*/
export const getPublicThreads = async () => {
  const { data, error } = await supabase.rpc('get_public_threads_overview');
  if (error) {
    console.error('Error fetching public threads:', error);
    throw error;
  }
  return data;
};


export const createSpace = async (formData: any) => {
    const { data, error } = await supabase.rpc('create_space', {
        p_name: formData.name,
        p_description: formData.description,
        p_type: formData.type, // 'FORUM' or 'COMMUNITY_SPACE'
        p_forum_type: formData.isPrivate ? 'PRIVATE' : 'PUBLIC',
        p_category: formData.category,
        p_specialty: formData.specialty
    });
    if (error) throw error;
    return data;
}

// --- Space Hub (SpaceDetailPage.tsx) ---

/* Fetches the specific details of a single space.*/
export const getSpaceDetails = async (spaceId: string) => {
  const { data, error } = await supabase
    .rpc('get_space_details', { p_space_id: spaceId })
    .single();
  if (error) throw error;
  return data;
};

/*Fetches the list of all threads within a specific space.*/
export const getThreadsForSpace = async (spaceId: string) => {
  const { data, error } = await supabase.rpc('get_threads_for_space', {
    p_space_id: spaceId,
  });
  if (error) throw error;
  return data;
};

/*Creates a new thread inside a specific space or as a Public Thread.*/
export const createThread = async (title: string, body: string, spaceId: string | null) => {
  const { data, error } = await supabase.rpc('create_thread', {
    p_title: title,
    p_body: body,
    p_container_id: spaceId,
    // This assumes your create_thread RPC can handle a NULL spaceId for public threads
    p_container_type: spaceId ? 'FORUM' : null 
  });
  if (error) throw error;
  return data;
}

// --- Thread Hub (ThreadDetailPage.tsx & ThreadView.tsx) ---

/*Fetches all messages for a single thread.*/
export const getMessages = async (threadId: string) => {
  // This uses a function from an earlier migration. Ensure you have a 'get_messages_for_thread' RPC.
  const { data, error } = await supabase.rpc('get_messages_for_thread', {
    p_thread_id: threadId,
  });
  if (error) throw error;
  return data;
};

/*Posts a new message to a thread.*/
export const postMessage = async (threadId: string, body: string) => {
  const { data, error } = await supabase.rpc('post_message', {
    p_thread_id: threadId,
    p_body: body,
  });
  if (error) throw error;
  return data;
};

export const addAttachmentToMessage = async (
  messageId: number,
  fileUrl: string,
  fileName: string,
  fileType: string,
  fileSize: number
) => {
  const { data, error } = await supabase.rpc('add_attachment_to_message', {
    p_message_id: messageId,
    p_file_url: fileUrl,
    p_file_name: fileName,
    p_file_type: fileType,
    p_file_size: fileSize,
  });
  if (error) throw error;
  return data;
};

/*Adds an emoji reaction to a message.*/
export const addReaction = async (messageId: number, emoji: string) => {
  const { data, error } = await supabase.rpc('add_reaction', {
    p_message_id: messageId,
    p_emoji: emoji,
  });
  if (error) throw error;
  return data;
};

/*Removes an emoji reaction from a message.*/
export const removeReaction = async (messageId: number, emoji: string) => {
  const { data, error } = await supabase.rpc('remove_reaction', {
    p_message_id: messageId,
    p_emoji: emoji,
  });
  if (error) throw error;
  return data;
};

/*Invokes the edge function to get AI summaries for all unread messages.*/
export const getUnreadSummaries = async () => {
  const { data, error } = await supabase.functions.invoke('summarize-unread'); // Use your function name
  if (error) throw error;
  return data.summaries;
};

/* Allows a user to instantly join a PUBLIC forum.*/
export const joinPublicForum = async (spaceId: string) => {
  const { data, error } = await supabase.rpc('join_public_forum', {
    p_forum_id: spaceId
  });
  if (error) throw error;
  return data;
};

/*Allows a user to request to join a PRIVATE forum or community space.*/
export const requestToJoinSpace = async (spaceId: string, spaceType: 'FORUM' | 'COMMUNITY_SPACE') => {
  const { data, error } = await supabase.rpc('request_to_join_space', {
    p_space_id: spaceId,
    p_space_type: spaceType
  });
  if (error) throw error;
  return data;
};

/*Fetches recommended spaces for the current user based on their specialty.*/
export const getRecommendedSpaces = async () => {
  const { data, error } = await supabase.rpc('get_recommended_spaces');
  if (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
  return data;
};

// --- Moderator/Admin Functions ---

/*Fetches the list of pending membership requests for a space.(For use by moderators and admins).*/
export const getPendingRequests = async (spaceId: string, spaceType: 'FORUM' | 'COMMUNITY_SPACE') => {
  const { data, error } = await supabase.rpc('get_pending_requests', {
    p_space_id: spaceId,
    p_space_type: spaceType
  });
  if (error) throw error;
  return data;
}

/*Updates a membership request status (e.g., to 'APPROVED' or 'DENIED').(For use by moderators and admins).*/
export const updateMembershipStatus = async (membershipId: string, newStatus: 'APPROVED' | 'DENIED' | 'BANNED') => {
  const { data, error } = await supabase.rpc('update_membership_status', {
    p_membership_id: membershipId,
    p_new_status: newStatus
  });
  if (error) throw error;
  return data;
}

export const getSpaceMembers = async (spaceId: string) => {
  const { data, error } = await supabase.rpc('get_space_members', { p_space_id: spaceId });
  if (error) throw error;
  return data;
};

export const deleteMessageAsModerator = async (messageId: number) => {
  const { data, error } = await supabase.rpc('delete_message_as_moderator', { p_message_id: messageId });
  if (error) throw error;
  return data;
};
// ... add other functions like join_public_forum, etc. here
