// src/integrations/supabase/community.api.ts

import { supabase } from './client';
import { Database, Tables, Enums } from './types';

// =================================================================
// Modern, Type-Safe Definitions
// =================================================================

// Aliases for our new database tables
export type Space = Tables<'spaces'>; // Assumes 'spaces' table is now defined
export type Thread = Tables<'threads'>;
export type Message = Tables<'messages'>;
export type Membership = Tables<'memberships'>;
export type MessageReaction = Tables<'message_reactions'>;
export type MessageAttachment = Tables<'message_attachments'>;
export type Profiles = Tables<'profiles'>;

export type MemberProfile = {
    id: string;
    full_name: string;
    profile_picture_url: string | null;
    role: Enums<'membership_role'>;
    // Add any other profile details needed for a member list display
};
// Custom types for function return values that include joined data
// This mirrors the `RETURNS TABLE(...)` from our get_threads function
export type ThreadWithDetails = {
  id: string;
  title: string;
  creator_id: string;
  creator_email: string;
  created_at: string;
  last_activity_at: string;
  message_count: number;
};

// =================================================================
// CHANGE START: Updated MessageWithAuthor type
// We are enriching this type to include the author's profile information.
// =================================================================
export type MessageWithDetails = {
Message & {
  author: {
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
};
// =================================================================
// CHANGE END
// =================================================================


// =================================================================
// Rich Mock Data for Logged-Out Users
// NOTE: Mock data will not have the new 'author' object structure.
// This is acceptable as it's only for logged-out users.
// =================================================================
const MOCK_SPACES: Space[] = [
  { id: 'mock-forum-1', name: 'AI in Healthcare (Example)', description: 'Exploring AI in medical imaging...', space_type: 'FORUM', join_level:'OPEN', creator_id: 'user-abc', created_at: '2025-09-30T10:00:00Z' },
  { id: 'mock-forum-2', name: 'USMLE 2026 Prep (Example)', description: 'Preparing for USMLE exams...', space_type: 'FORUM', join_level: 'INVITE_ONLY', creator_id: 'user-def', created_at: '2025-09-29T11:00:00Z' },
  { id: 'mock-comm-1', name: 'Global Cardiology (Example)', description: 'Connect with cardiologists worldwide...', space_type: 'COMMUNITY_SPACE', join_level: 'INVITE_ONLY', creator_id: 'user-ghi', created_at: '2025-09-28T12:00:00Z' },
];

const MOCK_PUBLIC_THREADS: ThreadWithDetails[] = [
  { id: 'mock-pub-thread-1', title: 'Best guidelines for AFib in 2025? (Example)', creator_id: 'user-123', creator_email: 'dr.chen@example.com', created_at: '2025-09-28T10:19:02Z', space_type: 'PUBLIC', last_activity_at: '2025-09-30T14:12:00Z', message_count: 23 },
  { id: 'mock-pub-thread-2', title: 'Hospital EHR vendor comparison (Example)', creator_id: 'user-456', creator_email: 'dr.patel@example.com', created_at: '2025-09-28T08:45:10Z', space_type: 'PUBLIC', last_activity_at: '2025-09-30T11:30:00Z', message_count: 18 },
];

const MOCK_MESSAGES: MessageWithDetails[] = [
    { id: 9901, user_id: 'user-123', body: 'Has anyone seen the new ESC update? The NOAC dosing recommendations are interesting.', created_at: '2025-09-28T10:19:02Z', is_edited: false, updated_at: '2025-09-28T10:19:02Z', thread_id: 'mock-pub-thread-1', parent_message_id: null, author: { full_name: 'Dr. Chen', profile_picture_url: null }, reactions: [], attachments: [] },
    { id: 9902, user_id: 'user-456', body: 'Yes, I was just reading it. It could change our standard practice for high-risk patients.', created_at: '2025-09-28T10:25:15Z', is_edited: false, updated_at: '2025-09-28T10:25:15Z', thread_id: 'mock-pub-thread-1', parent_message_id: 9901, author: { full_name: 'Dr. Patel', profile_picture_url: null }, reactions: [], attachments: [] },
    { id: 9903, user_id: 'user-123', body: 'Exactly. I\'m drafting a summary for our department.', created_at: '2025-09-28T10:31:45Z', is_edited: true, updated_at: '2025-09-28T10:40:15Z', thread_id: 'mock-pub-thread-2', parent_message_id: 9901, author: { full_name: 'Dr. Brown', profile_picture_url: null }, reactions: [], attachments: [] },
];

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

/** Fetches all forums and community spaces. Returns mock data for guests. */
export const getUserSpaces = async (): Promise<Space[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_SPACES;

    const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .neq('space_type', 'PUBLIC') // Public is usually fetched separately/implicitly
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
}

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

export const getSpaceMemberCount = async (spaceId: string): Promise<number> => {
    // This relies on RLS ensuring the user has SELECT permission on 'memberships' 
    // (at least for the count, which should be public for all members of the space).
    const { count, error } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceId)
        .eq('status', 'ACTIVE'); // Only count approved members

    if (error) throw error;
    // Note: count can be null if the query fails, but we expect a number or 0.
    return count || 0; 
};

export const getThreadsCountForSpace = async (spaceId: string): Promise<number> => {
    // RLS will ensure the user can only count threads they are permitted to view.
    const { count, error } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceId);

    if (error) throw error;
    return count || 0;
};

export const getSpaceMemberList = async (spaceId: string): Promise<MemberProfile[]> => {
    const { data, error } = await supabase
        .from('memberships')
        .select(`
            id,
            role,
            user_id,
            profiles (full_name, profile_picture_url)
        `)
        .eq('space_id', spaceId)
        .eq('status', 'ACTIVE'); // Only fetch active members

    if (error) throw error;
    
    // Transform the data to match the MemberProfile type
    const members: MemberProfile[] = data.map(m => ({
        id: m.user_id,
        role: m.role,
        full_name: m.profiles?.full_name || 'Anonymous User',
        profile_picture_url: m.profiles?.profile_picture_url || null,
    }));
    
    return members;
};

/** Fetches all global public threads. Returns mock data for guests. */
export const getPublicThreads = async (): Promise<ThreadWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_PUBLIC_THREADS;

    const { data, error } = await supabase.rpc('get_threads'); // Calling with no args gets public threads
    if (error) throw error;
    return data;
};

// --- Space & Thread Creation ---

export const createSpace = async (
  payload: {
    name: string;
    description?: string;
    space_type: 'FORUM' | 'COMMUNITY_SPACE';
    join_level: Enums<'join_level'>; // Only relevant for FORUM
  }
): Promise<Space> => {
    const session = await getSessionOrThrow();
    
    // NOTE: This inserts into the unified 'spaces' table
    const { data: newSpace, error } = await supabase.from('spaces').insert({
      ...payload,
      creator_id: session.user.id
    }).select().single();

    if (spaceError) throw spaceError;

    // Automatically make the creator an ADMIN of their new space
    const { error: memberError } = await supabase.from('memberships').insert({
        user_id: session.user.id,
        space_id: newSpace.id,
        role: 'ADMIN',
        status: 'ACTIVE'
    });
    if (memberError) throw memberError;

    return newSpace;
}

/** Creates a new thread. User must be logged in. */
export const createThread = async (
  payload: { title: string; body: string; spaceId: string }
): Promise<string> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('create_thread', {
        p_title: payload.title,
        p_initial_message_body: payload.body,
        p_space_id: payload.spaceId,
    });

    if (error) throw error;
    return data;
};

// --- Viewing Spaces, Threads, and Messages ---

/** Fetches details for a single space. Returns mock data for guests. */
export const getSpaceDetails = async(spaceId: string): Promise<Space | undefined> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_SPACES.find(s => s.id === spaceId);

    // This now hits the unified 'spaces' table, allowing RLS to validate membership
    const { data, error } = await supabase.from('spaces').select('*').eq('id', spaceId).single();
    
    // RLS will return null data if the user is not a member of a private space.
    if(error) throw error;
    return data;
}

/** Fetches threads for a specific space. Returns mock data for guests. */
export const getThreadsForSpace = async (spaceId: string): Promise<ThreadWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_PUBLIC_THREADS.slice(0, 2);

    // Call the RPC with the space_id. RLS handles the thread access check.
    const { data, error } = await supabase.rpc('get_threads', {
        p_space_id: spaceId,
        // p_space_type is no longer required as the function can infer from p_space_id
    });

    if (error) throw error;
    return data;
};
// =================================================================
// CHANGE START: Updated getMessages function
// Replaced the RPC call with a standard .select() to join profile data.
// =================================================================
/** Fetches messages for a single thread. Returns mock data for guests. */
export const getMessagesWithDetails = async (threadId: string): Promise<MessageWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_MESSAGES;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *, // Fetch all message columns (including parent_message_id)
        author:profiles (full_name, profile_picture_url),
        reactions:message_reactions (*),
        attachments:message_attachments (*)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // The query structure should automatically match MessageWithDetails type
    return data as MessageWithDetails[];
};
// =================================================================
// CHANGE END
// =================================================================


// --- Chat Interaction ---

/** Posts a new message to a thread. User must be logged in. */
export const postMessage = async (
    threadId: string, 
    body: string, 
    parentMessageId: number | null = null
): Promise<Message> => {
    await getSessionOrThrow();
    // Assuming the RPC is updated to accept parent_message_id, 
    // or we use a direct insert to leverage RLS on the messages table.
    
    const { data, error } = await supabase.rpc('post_message_with_reply', {
        p_thread_id: threadId,
        p_body: body,
        p_parent_message_id: parentMessageId // New argument for replies
    }).returns<Message>().single();

    if (error) throw error;
    return data;
};

/** Adds a reaction to a message. User must be logged in. */
export const addReaction = async (messageId: number, emoji: string): Promise<MessageReaction> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase.from('message_reactions').insert({
      message_id: messageId,
      reaction_emoji: emoji,
      user_id: session.user.id
    }).select().single();
    if (error) throw error;
    return data;
};

/** Removes a reaction from a message. User must be logged in. */
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

// --- Membership Management ---

/** Joins a public forum. User must be logged in. */
export const joinPublicForum = async (spaceId: string): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('join_public_forum', { p_space_id: spaceId });
    if (error) throw error;
    return data;
}

export const addAttachmentToMessage = async (messageId: number, file: File): Promise<MessageAttachment> => {
    await getSessionOrThrow();
    // Implementation would involve:
    // 1. Uploading 'file' to Supabase Storage bucket (e.g., 'community-attachments')
    // 2. Getting the public file URL
    // 3. Inserting a row into 'message_attachments' with the URL, messageId, etc.
    console.log(`Attachment upload placeholder: ${file.name} for message ${messageId}`);
    // Replace this with your actual storage/insert logic
    return { created_at: new Date().toISOString(), file_name: file.name, file_url: '/mock/url', id: 'uuid', message_id: messageId, uploaded_by: 'user-id', file_size_bytes: file.size, file_type: file.type };
};

/** Requests to join a private space. User must be logged in. */
export const joinPublicForum = async (spaceId: string): Promise<Membership> => {
    await getSessionOrThrow();
    // Since all space logic is unified, this function should be generic
    const { data, error } = await supabase.rpc('join_space_as_member', { p_space_id: spaceId });
    if (error) throw error;
    return data;
}

export const requestToJoinSpace = async (spaceId: string, spaceType: 'FORUM' | 'COMMUNITY_SPACE'): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('request_to_join_space', {
        p_space_id: spaceId,
        p_space_type: spaceType,
    });
    if (error) throw error;
    return data;
}

/** Fetches pending join requests for a space. Must be an admin/mod. */
export const getPendingRequests = async (spaceId: string, spaceType: 'FORUM' | 'COMMUNITY_SPACE'): Promise<any[] | null> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('get_pending_requests', {
        p_space_id: spaceId,
        p_space_type: spaceType,
    });

    if (error) throw error;
    return data;
};

/** Updates a membership status. Must be an admin/mod. */
export const updateMembershipStatus = async (membershipId: string, newStatus: 'APPROVED' | 'DENIED' | 'BANNED'): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('update_membership_status', {
        p_membership_id: membershipId,
        p_new_status: newStatus,
    });
    if (error) throw error;
    return data;
};
