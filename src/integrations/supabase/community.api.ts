// src/integrations/supabase/community.api.ts

import { supabase } from './client';
import { Database } from './types';

// =================================================================
// Modern, Type-Safe Definitions
// =================================================================

// Aliases for our new database tables
export type Space = Database['public']['Tables']['spaces']['Row'];
export type Thread = Database['public']['Tables']['threads']['row'];
export type Message = Database['public']['Tables']['messages']['row'];
export type Membership = Database['public']['Tables']['memberships']['row'];
export type MessageReaction = Database['public']['Tables']['message_reactions']['row'];
export type MessageAttachment = Database['public']['Tables']['message_attachments']['Row'];
export type Profile = Database['public']['Tables']['profiles']['row'];

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
export type MessageWithAuthor = {
  id: number;
  body: string;
  created_at: string;
  is_edited: boolean;
  user_id: string;
  author: {
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
  // We keep the email here for the mock data, but the live data will use the author object.
  email?: string;
};
// =================================================================
// CHANGE END
// =================================================================


// =================================================================
// Rich Mock Data for Logged-Out Users
// NOTE: Mock data will not have the new 'author' object structure.
// This is acceptable as it's only for logged-out users.
// =================================================================
const MOCK_SPACES: (Forum | CommunitySpace)[] = [
  { id: 'mock-forum-1', name: 'AI in Healthcare (Example)', description: 'Exploring AI in medical imaging...', type: 'PUBLIC', creator_id: 'user-abc', created_at: '2025-09-30T10:00:00Z' },
  { id: 'mock-forum-2', name: 'USMLE 2026 Prep (Example)', description: 'Preparing for USMLE exams...', type: 'PRIVATE', creator_id: 'user-def', created_at: '2025-09-29T11:00:00Z' },
  { id: 'mock-space-1', name: 'Global Cardiology (Example)', description: 'Connect with cardiologists worldwide...', creator_id: 'user-ghi', created_at: '2025-09-28T12:00:00Z' },
];

const MOCK_PUBLIC_THREADS: ThreadWithDetails[] = [
  { id: 'mock-pub-thread-1', title: 'Best guidelines for AFib in 2025? (Example)', creator_id: 'user-123', creator_email: 'dr.chen@example.com', created_at: '2025-09-28T10:19:02Z', last_activity_at: '2025-09-30T14:12:00Z', message_count: 23 },
  { id: 'mock-pub-thread-2', title: 'Hospital EHR vendor comparison (Example)', creator_id: 'user-456', creator_email: 'dr.patel@example.com', created_at: '2025-09-28T08:45:10Z', last_activity_at: '2025-09-30T11:30:00Z', message_count: 18 },
];

const MOCK_MESSAGES: MessageWithAuthor[] = [
    { id: 9901, user_id: 'user-123', email: 'dr.chen@example.com', body: 'Has anyone seen the new ESC update? The NOAC dosing recommendations are interesting.', created_at: '2025-09-28T10:19:02Z', is_edited: false, author: null },
    { id: 9902, user_id: 'user-456', email: 'dr.patel@example.com', body: 'Yes, I was just reading it. It could change our standard practice for high-risk patients.', created_at: '2025-09-28T10:25:15Z', is_edited: false, author: null },
    { id: 9903, user_id: 'user-123', email: 'dr.chen@example.com', body: 'Exactly. I\'m drafting a summary for our department.', created_at: '2025-09-28T10:31:45Z', is_edited: true, author: null },
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
export const getDiscoverySpaces = async (): Promise<Space[]> => {
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
    description: string;
    space_type: 'FORUM' | 'COMMUNITY_SPACE';
    join_level: 'OPEN' | 'INVITE_ONLY'; // Only relevant for FORUM
  }
): Promise<Space> => {
    const session = await getSessionOrThrow();
    
    // NOTE: This inserts into the unified 'spaces' table
    const { data: newSpace, error } = await supabase.from('spaces').insert({
      ...payload,
      creator_id: session.user.id
    }).select().single();

    if (error) throw error;

    // Automatically make the creator an ADMIN of their new space
    await supabase.from('memberships').insert({
        user_id: session.user.id,
        space_id: newSpace.id,
        role: 'ADMIN',
        status: 'ACTIVE' // Use 'ACTIVE' not 'APPROVED'
    });

    return newSpace;
}

/** Creates a new thread. User must be logged in. */
export const createThread = async (
  payload: { title: string; body: string; spaceId: string | null; spaceType: 'FORUM' | 'COMMUNITY_SPACE' | null }
): Promise<string> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('create_thread', {
        p_title: payload.title,
        p_initial_message_body: payload.body,
        p_space_id: payload.spaceId,
        p_space_type: payload.spaceType,
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
export const getMessages = async (threadId: string): Promise<MessageWithAuthor[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_MESSAGES;

    // This query now fetches messages and the author's profile details in one go.
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        body,
        created_at,
        is_edited,
        user_id,
        author:profiles (
          full_name,
          profile_picture_url
        )
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // The 'data' returned by the query already matches our new MessageWithAuthor type.
    return data;
};
// =================================================================
// CHANGE END
// =================================================================


// --- Chat Interaction ---

/** Posts a new message to a thread. User must be logged in. */
export const postMessage = async (threadId: string, body: string): Promise<Message> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('post_message', {
        p_thread_id: threadId,
        p_body: body,
    });

    if (error) throw error;
    return data;
};

/** Adds a reaction to a message. User must be logged in. */
export const addReaction = async (messageId: number, emoji: string): Promise<Reaction> => {
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

/** Requests to join a private space. User must be logged in. */
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


