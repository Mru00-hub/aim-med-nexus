// src/integrations/supabase/community.api.ts
import { supabase } from './client';
import { Database, Tables, Enums } from './types';

// =================================================================
// Modern, Type-Safe Definitions
// =================================================================

// Aliases for our new database tables
export type Space = Tables<'spaces'>;
export type Thread = Tables<'threads'>;
export type Message = Tables<'messages'>;
export type Membership = Tables<'memberships'>;
export type MessageReaction = Tables<'message_reactions'>;
export type MessageAttachment = Tables<'message_attachments'>;
export type Profile = Tables<'profiles'>;

export type SpaceWithDetails = Space & {
  creator_full_name: string | null;
  moderators: {
    full_name: string;
    role: Enums<'membership_role'>;
  }[] | null;
};

export type MemberProfile = {
    id: string; // This is the user's ID (from profiles table)
    membership_id: string; // This is the ID of the membership row itself
    full_name: string;
    profile_picture_url: string | null;
    role: Enums<'membership_role'>;
};

// Custom type for function return values that include joined data (for Threads list)
export type ThreadWithDetails = {
  id: string;
  title: string;
  creator_id: string;
  creator_full_name: string;
  created_at: string;
  last_activity_at: string;
  message_count: number;
  space_id: string;
};

export type MessageWithDetails = Message & {
  author: {
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
};

// Type for the get_pending_requests function return value
export type PendingRequest = {
  membership_id: string;
  user_id: string;
  full_name: string;
  profile_picture_url: string | null;
  requested_at: string;
};


// =================================================================
// Rich Mock Data for Logged-Out Users
// =================================================================
const MOCK_SPACES: Space[] = [
  { id: 'mock-pub-1', name: 'Public Discussions', description: '', space_type: 'PUBLIC', join_level:'OPEN', creator_id: 'sys-user', created_at: new Date().toISOString()},
  { id: 'mock-forum-1', name: 'AI in Healthcare (Example)', description: 'Exploring AI in medical imaging...', space_type: 'FORUM', join_level:'OPEN', creator_id: 'user-abc', created_at: new Date().toISOString() },
  { id: 'mock-forum-2', name: 'USMLE 2026 Prep (Example)', description: 'Preparing for USMLE exams...', space_type: 'FORUM', join_level: 'INVITE_ONLY', creator_id: 'user-def', created_at: new Date().toISOString() },
  { id: 'mock-comm-1', name: 'Global Cardiology (Example)', description: 'Connect with cardiologists worldwide...', space_type: 'COMMUNITY_SPACE', join_level: 'INVITE_ONLY', creator_id: 'user-ghi', created_at: new Date().toISOString() },
];

const MOCK_PUBLIC_THREADS: ThreadWithDetails[] = [
  { id: 'mock-pub-thread-1', title: 'Best guidelines for AFib in 2025? (Example)', creator_id: 'user-123', creator_full_name: 'Dr. Chen (Example)', created_at: new Date().toISOString(), last_activity_at: new Date().toISOString(), message_count: 23, space_id: 'mock-pub-1' },
  { id: 'mock-pub-thread-2', title: 'Hospital EHR vendor comparison (Example)', creator_id: 'user-456', creator_full_name: 'Dr. Patel (Example)', created_at: new Date().toISOString(), last_activity_at: new Date().toISOString(), message_count: 18, space_id: 'mock-pub-1' },
];

const MOCK_MESSAGES: MessageWithDetails[] = [];

// =================================================================
// API Implementation
// =================================================================

// --- Authentication Helper ---
const getSessionOrThrow = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!session) throw new Error("Authentication required. Please log in.");
  return session;
};

// --- Discovery & Public Views ---

/** Fetches spaces the current user is a member of, or public spaces. */
export const getUserSpaces = async (): Promise<Space[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_SPACES;

    const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
}

export const getSpacesWithDetails = async (): Promise<SpaceWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase.rpc('get_spaces_with_details');

    if (error) {
      console.error("Error fetching spaces with details:", error);
      throw error;
    }
    return data || [];
}

export const getUserMemberships = async (): Promise<Membership[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', session.user.id);
        
    if (error) throw error;
    return data || [];
}

/** Fetches details for a single space. RLS will prevent unauthorized access. */
export const getSpaceDetails = async(spaceId: string): Promise<Space | undefined> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_SPACES.find(s => s.id === spaceId);

    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();
    
    if(error) throw error;
    return data || undefined;
}

/** Fetches the count of ACTIVE members for a space. */
export const getSpaceMemberCount = async (spaceId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceId)
        .eq('status', 'ACTIVE'); 

    if (error) throw error;
    return count || 0; 
};

/** Fetches the total count of threads in a space. */
export const getThreadsCountForSpace = async (spaceId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceId);

    if (error) throw error;
    return count || 0;
};

/** Fetches the current user's role for a specific space. */
export const getViewerRoleForSpace = async (spaceId: string): Promise<Enums<'membership_role'> | null> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('memberships')
        .select('role')
        .eq('space_id', spaceId)
        .eq('user_id', session.user.id)
        .single();

    if (error) {
        // .single() throws an error if no rows are found.
        // In our case, no row just means the user is not a member, which is not an application error.
        if (error.code === 'PGRST116') {
            return null; 
        }
        throw error;
    }
    return data?.role || null;
};

/** Fetches the list of active members and their roles for a space. */
export const getSpaceMemberList = async (spaceId: string): Promise<MemberProfile[]> => {
    const { data, error } = await supabase
        .from('memberships')
        .select(`
            id, 
            role,
            user_id,
            profiles!inner (
                full_name,
                profile_picture_url
            )
        `)
        .eq('space_id', spaceId)
        .eq('status', 'ACTIVE');

    if (error) throw error;

    const members: MemberProfile[] = data.map(m => ({
        id: m.user_id,
        membership_id: m.id, // <-- Add the membership_id
        role: m.role,
        full_name: m.profiles.full_name || 'Anonymous User',
        profile_picture_url: m.profiles.profile_picture_url || null,
    }));
    
    return members;
};

export const updateMemberRole = async (membershipId: string, newRole: Enums<'membership_role'>) => {
    await getSessionOrThrow();
    const { error } = await supabase.rpc('update_member_role', {
        p_membership_id: membershipId,
        p_new_role: newRole,
    });
    if (error) throw error;
};

/** Fetches all global public threads using the new DB function. */
export const getPublicThreads = async (): Promise<ThreadWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_PUBLIC_THREADS;

    const { data, error } = await supabase.rpc('get_threads'); 
    if (error) throw error;
    return data;
};

// --- Space & Thread Creation ---

/** Creates a new Space and assigns the appropriate creator role. */
export const createSpace = async (
  payload: { name: string; description?: string; space_type: 'FORUM' | 'COMMUNITY_SPACE'; join_level: Enums<'space_join_level'>; }
): Promise<Space> => {
    const session = await getSessionOrThrow();
    
    const creatorRole: Enums<'membership_role'> = payload.space_type === 'COMMUNITY_SPACE' ? 'ADMIN' : 'MODERATOR';
    
    const { data: newSpace, error } = await supabase.from('spaces').insert({
      ...payload,
      creator_id: session.user.id
    }).select().single();

    if (error) throw error; 

    const { error: memberError } = await supabase.from('memberships').insert({
        user_id: session.user.id,
        space_id: newSpace.id,
        role: creatorRole,
        status: 'ACTIVE'
    });
    if (memberError) throw memberError;

    return newSpace;
}

/** Creates a new thread. User must be logged in. */
export const createThread = async (
  payload: { title: string; body: string; spaceId: string | null; description?: string; }
): Promise<string> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('create_thread', {
        p_title: payload.title,
        p_body: payload.body, 
        p_space_id: payload.spaceId,
        p_description: payload.description,
    });

    if (error) throw error;
    return data;
};

// --- Viewing Threads ---

/** Fetches threads for a specific space using the new DB function. */
export const getThreadsForSpace = async (spaceId: string): Promise<ThreadWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_PUBLIC_THREADS.slice(0, 2);

    const { data, error } = await supabase.rpc('get_threads', { p_space_id: spaceId });
    if (error) throw error;
    return data;
};
export const getThreadDetails = async (threadId: string): Promise<(Thread & { spaces: { name: string } | null }) | null> => {
    // The query is the same, but the 'threads' table now implicitly includes creator_id
    const { data, error } = await supabase
      .from('threads')
      .select('*, spaces (name)')
      .eq('id', threadId)
      .single();
    if (error) throw error;
    return data;
}

export const updateSpaceDetails = async (
  spaceId: string,
  payload: { name: string; description?: string | null; join_level: Enums<'space_join_level'> }
): Promise<Space> => {
    await getSessionOrThrow();
    const { data, error } = await supabase
      .from('spaces')
      .update({
        name: payload.name,
        description: payload.description,
        join_level: payload.join_level,
        updated_at: new Date().toISOString()
      })
      .eq('id', spaceId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
};

export const updateThreadDetails = async (
  threadId: string,
  payload: { title: string; description?: string | null }
): Promise<Thread> => {
    await getSessionOrThrow();
    const { data, error } = await supabase
      .from('threads')
      .update({
        title: payload.title,
        description: payload.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', threadId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
};
/** Fetches messages, including author profile, reactions, and attachments. */
export const getMessagesWithDetails = async (threadId: string): Promise<MessageWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_MESSAGES;

    // UPDATED: This query now uses an explicit inner join and the correct alias for profiles.
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        author:profiles!inner (
          full_name,
          profile_picture_url
        ),
        reactions:message_reactions (*),
        attachments:message_attachments (*)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // The data mapping remains the same because we aliased profiles back to 'author'.
    return data as MessageWithDetails[];
};

// --- Chat Interaction ---

/** Posts a new message or a reply to a thread using the new DB function. */
export const postMessage = async (
    threadId: string, 
    body: string, 
    parentMessageId: number | null = null
): Promise<Message> => {
    await getSessionOrThrow();
    
    const { data, error } = await supabase.rpc('post_message_with_reply', {
        p_thread_id: threadId,
        p_body: body,
        p_parent_message_id: parentMessageId
    }).returns<Message>().single();

    if (error) throw error;
    if (!data) {
        throw new Error("Failed to post message: No data returned.");
    }
    return data;
};

export const deleteMessage = async (messageId: number): Promise<void> => {
    await getSessionOrThrow();
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
};

export const editMessage = async (messageId: number, newBody: string): Promise<Message> => {
    await getSessionOrThrow();
    const { data, error } = await supabase
      .from('messages')
      .update({ body: newBody, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();
    if (error) throw error;
    if (!data) {
        throw new Error("Failed to post message: No data returned.");
    }
    return data;
};
/** Adds a reaction to a message. */
export const addReaction = async (messageId: number, emoji: string): Promise<MessageReaction> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase.from('message_reactions').insert({
      message_id: messageId,
      reaction_emoji: emoji,
      user_id: session.user.id
    }).select().single();
    if (error) throw error;
    if (!data) {
        throw new Error("Failed to post message: No data returned.");
    }
    return data;
};

/** Removes a reaction from a message. */
export const removeReaction = async (messageId: number, emoji: string) => {
    const session = await getSessionOrThrow();
    const { error } = await supabase.from('message_reactions').delete().match({
      message_id: messageId,
      reaction_emoji: emoji,
      user_id: session.user.id
    });
    if (error) throw error;
    return { success: true };
};

export const uploadAttachment = async (
  messageId: number,
  file: File
): Promise<MessageAttachment> => {
  const session = await getSessionOrThrow();
  const userId = session.user.id;

  // 1. Create a unique path for the file to prevent name collisions.
  // Example: public/user-id-abc/message-id-123/my-document.pdf
  const filePath = `public/${userId}/${messageId}/${file.name}`;

  // 2. Upload the file to the 'message_attachments' storage bucket.
  const { error: uploadError } = await supabase.storage
    .from('message_attachments')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // 3. Get the public URL of the file you just uploaded.
  const { data: { publicUrl } } = supabase.storage
    .from('message_attachments')
    .getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error("Could not get public URL for the uploaded file.");
  }

  // 4. Create a record in the 'message_attachments' database table.
  const attachmentRecord = {
    message_id: messageId,
    uploaded_by: userId,
    file_name: file.name,
    file_url: publicUrl,
    file_type: file.type,
    file_size_bytes: file.size,
  };

  const { data: newAttachment, error: insertError } = await supabase
    .from('message_attachments')
    .insert(attachmentRecord)
    .select()
    .single();

  if (insertError) {
    console.error("Attachment insert error:", insertError);
    throw new Error(`Failed to link attachment to message: ${insertError.message}`);
  }

  if (!newAttachment) {
      throw new Error("Failed to create attachment record in database.");
  }

  return newAttachment;
};

// --- Membership Management ---

/** Allows a user to join an open forum using the new standardized DB function. */
export const joinSpaceAsMember = async (spaceId: string): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('join_space_as_member', { p_space_id: spaceId });
    if (error) throw error;
    if (!data) {
        throw new Error("Failed to join space: No data returned.");
    }
    return data;
}

/** Requests to join a private space. */
export const requestToJoinSpace = async (spaceId: string): Promise<string> => {
    await getSessionOrThrow();
    // And it now calls the database with only the one required argument
    const { data, error } = await supabase.rpc('request_to_join_space', {
        p_space_id: spaceId
    });
    if (error) throw error;
    if (!data) {
        throw new Error("Failed to send join request: No membership ID was returned.");
    }
    return data;
}

/** Fetches pending join requests for a space. Must be an admin/mod. */
export const getPendingRequests = async (spaceId: string): Promise<PendingRequest[] | null> => {
    await getSessionOrThrow();
    // This call is now correct and matches the new DB function which only needs p_space_id.
    const { data, error } = await supabase.rpc('get_pending_requests', {
        p_space_id: spaceId,
    });

    if (error) throw error;
    return data;
};

/** Updates a membership status. Must be an admin/mod. */
export const updateMembershipStatus = async (membershipId: string, newStatus: Enums<'membership_status'>): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('update_membership_status', {
        p_membership_id: membershipId,
        p_new_status: newStatus,
    });
    if (error) throw error;
    if (!data) {
        throw new Error("Failed to update membership: No data returned.");
    }
    return data;
};

/** Allows a user to leave a space. */
export const leaveSpace = async (spaceId: string): Promise<void> => {
    const session = await getSessionOrThrow();
    
    // Deletes the membership row where user_id and space_id match.
    // This assumes you have RLS policies that allow a user to delete their own membership.
    const { error } = await supabase
        .from('memberships')
        .delete()
        .match({
            user_id: session.user.id,
            space_id: spaceId
        });

    if (error) {
        // Handle cases where the user might be the creator (if you have backend rules)
        if (error.code === '23503') { // Foreign key violation
             throw new Error("Cannot leave space. You might be the creator or last admin.");
        }
        throw error;
    }
};
