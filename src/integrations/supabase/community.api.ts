// src/integrations/supabase/api.ts
import { supabase } from './client';
import { Database } from './types';

// =================================================================
// Step 1: Modern, Type-Safe Definitions
// =================================================================
// Using types generated from your new DB schema
export type Forum = Database['public']['Tables']['forums']['Row'];
export type CommunitySpace = Database['public']['Tables']['community_spaces']['Row'];
export type Thread = Database['public']['Tables']['threads']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Membership = Database['public']['Tables']['memberships']['Row'];
export type Reaction = Database['public']['Tables']['message_reactions']['Row'];
export type Attachment = Database['public']['Tables']['message_attachments']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Custom types for function return values that include joined data
export type ThreadWithDetails = Awaited<ReturnType<typeof getThreadsForSpace>>[0];
export type MessageWithAuthor = Awaited<ReturnType<typeof getMessages>>[0];
export type SpaceForDiscovery = {
  id: string;
  name: string;
  description: string | null;
  type: 'FORUM' | 'COMMUNITY_SPACE';
  member_count: number;
};

// =================================================================
// Step 2: Rich Mock Data for Logged-Out Users
// =================================================================

const MOCK_FORUMS: Forum[] = [
  { id: 'mock-forum-1', creator_id: 'mock-user', name: 'AI in Healthcare (Example)', description: 'Exploring AI in medical imaging and healthcare delivery systems.', type: 'PUBLIC', created_at: new Date('2025-09-29T10:00:00Z').toISOString() },
  { id: 'mock-forum-2', creator_id: 'mock-user', name: 'USMLE 2026 Prep (Example)', description: 'Preparing for USMLE exams. Share resources, study tips, and mock tests.', type: 'PRIVATE', created_at: new Date('2025-09-28T11:00:00Z').toISOString() },
];

const MOCK_COMMUNITY_SPACES: CommunitySpace[] = [
    { id: 'mock-space-1', creator_id: 'mock-user', name: 'Global Cardiology (Example)', description: 'Connect with cardiologists worldwide. Share cases, discuss latest research, and collaborate.', created_at: new Date('2025-09-27T12:00:00Z').toISOString() },
];

const MOCK_PUBLIC_THREADS: Thread[] = [
    { id: 'mock-pub-thread-1', creator_id: 'mock-user-1', title: 'Best guidelines for AFib in 2025? (Example)', space_id: null, space_type: null, created_at: new Date('2025-09-28T10:19:02Z').toISOString(), updated_at: new Date('2025-09-28T10:19:02Z').toISOString() },
    { id: 'mock-pub-thread-2', creator_id: 'mock-user-2', title: 'Hospital EHR vendor comparison (Example)', space_id: null, space_type: null, created_at: new Date('2025-09-28T08:45:10Z').toISOString(), updated_at: new Date('2025-09-28T08:45:10Z').toISOString() },
];

const MOCK_MESSAGES: MessageWithAuthor[] = [
    { id: 9901, thread_id: 'mock-pub-thread-1', user_id: 'mock-user-1', body: 'Has anyone seen the new ESC update? The NOAC dosing recommendations are interesting.', is_edited: false, created_at: '2025-09-28T10:19:02Z', updated_at: '2025-09-28T10:19:02Z', email: 'dr.chen@example.com' },
    { id: 9902, thread_id: 'mock-pub-thread-1', user_id: 'mock-user-3', body: 'Yes, I was just reading it. It could change our standard practice for high-risk patients.', is_edited: false, created_at: '2025-09-28T10:25:15Z', updated_at: '2025-09-28T10:25:15Z', email: 'dr.patel@example.com' },
    { id: 9903, thread_id: 'mock-pub-thread-1', user_id: 'mock-user-1', body: 'Exactly. I\'m drafting a summary for our department. I\'ll share it here when it\'s ready.', is_edited: true, created_at: '2025-09-28T10:31:45Z', updated_at: '2025-09-28T10:32:00Z', email: 'dr.chen@example.com' },
];


// =================================================================
// Step 3: API Implementation with Conditional Logic
// =================================================================

// --- Authentication Helper ---
const getSessionOrThrow = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) throw new Error("User not authenticated. Please log in.");
  return session;
};


// --- Discovery & Public Views ---

/**
 * Fetches all forums and community spaces for discovery.
 * Logged-out users see mock data.
 */
export const getDiscoverySpaces = async (): Promise<(Forum | CommunitySpace)[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [...MOCK_FORUMS, ...MOCK_COMMUNITY_SPACES];
    
    const [forums, spaces] = await Promise.all([
        supabase.from('forums').select('*'),
        supabase.from('community_spaces').select('*')
    ]);

    if (forums.error) throw forums.error;
    if (spaces.error) throw spaces.error;

    return [...forums.data, ...spaces.data];
}

/**
 * Fetches all global public threads.
 * Logged-out users see mock data.
 */
export const getPublicThreads = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Manually shape mock data to match the return type of get_threads
      return MOCK_PUBLIC_THREADS.map(t => ({
        ...t,
        creator_email: 'author@example.com',
        last_activity_at: t.updated_at,
        message_count: Math.floor(Math.random() * 20) + 5
      }));
    }

    const { data, error } = await supabase.rpc('get_threads');
    if (error) throw error;
    return data;
};


// --- Space & Thread Creation ---

/**
 * Creates a new Forum. User must be logged in.
 * Also creates a membership record, making the creator an ADMIN.
 */
export const createForum = async (payload: { name: string; description?: string; type: 'PUBLIC' | 'PRIVATE' }): Promise<Forum> => {
    const session = await getSessionOrThrow();
    
    // Create the forum
    const { data: newForum, error: forumError } = await supabase
        .from('forums')
        .insert({
            name: payload.name,
            description: payload.description,
            type: payload.type,
            creator_id: session.user.id
        })
        .select()
        .single();
    
    if (forumError) throw forumError;

    // Make the creator an ADMIN of their new forum
    const { error: membershipError } = await supabase.from('memberships').insert({
        user_id: session.user.id,
        space_id: newForum.id,
        space_type: 'FORUM',
        role: 'ADMIN',
        status: 'APPROVED'
    });

    if (membershipError) throw membershipError;

    return newForum;
}
// Note: A createCommunitySpace function would be nearly identical to the above.

/**
 * Creates a new thread within a space or as a global public thread.
 */
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
    return data; // Returns the new thread's UUID
};


// --- Viewing Spaces, Threads, and Messages ---

/**
 * Fetches all threads for a specific space.
 * Logged-out users get mock data. RLS handles access for logged-in users.
 */
export const getThreadsForSpace = async (spaceId: string, spaceType: 'FORUM' | 'COMMUNITY_SPACE') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return []; // In a real app, you could return mock threads for this space

    const { data, error } = await supabase.rpc('get_threads', {
        p_space_id: spaceId,
        p_space_type: spaceType,
    });

    if (error) throw error;
    return data;
};

/**
 * Fetches all messages for a single thread.
 * Logged-out users get mock data. RLS handles access for logged-in users.
 */
export const getMessages = async (threadId: string): Promise<MessageWithAuthor[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return MOCK_MESSAGES.filter(m => m.thread_id === threadId);

    const { data, error } = await supabase.rpc('get_messages', { p_thread_id: threadId });
    if (error) throw error;
    return data;
};


// --- Chat Interaction ---

/**
 * Posts a new message to a thread. User must be logged in.
 */
export const postMessage = async (threadId: string, body: string): Promise<Message> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('post_message', {
        p_thread_id: threadId,
        p_body: body,
    });

    if (error) throw error;
    return data;
};

/**
 * Adds a reaction to a message. User must be logged in.
 */
export const addReaction = async (messageId: number, emoji: string): Promise<Reaction> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('message_reactions')
        .insert({
            message_id: messageId,
            reaction_emoji: emoji,
            user_id: session.user.id
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

/**
 * Removes a reaction from a message. User must be logged in.
 */
export const removeReaction = async (messageId: number, emoji: string) => {
    const session = await getSessionOrThrow();
    const { error } = await supabase
        .from('message_reactions')
        .delete()
        .match({
            message_id: messageId,
            reaction_emoji: emoji,
            user_id: session.user.id
        });

    if (error) throw error;
    return { success: true };
};
// Note: Attaching files would involve Supabase Storage `upload` and then calling an `insert` on `message_attachments`.


// --- Membership Management ---

/**
 * Allows a user to join a public forum.
 */
export const joinPublicForum = async (spaceId: string): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('join_public_forum', { p_space_id: spaceId });
    if (error) throw error;
    return data;
}

/**
 * Allows a user to request to join a private space.
 */
export const requestToJoinSpace = async (spaceId: string, spaceType: 'FORUM' | 'COMMUNITY_SPACE'): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('request_to_join_space', {
        p_space_id: spaceId,
        p_space_type: spaceType,
    });
    if (error) throw error;
    return data;
}

/**
 * Fetches pending join requests for a space. Must be an admin/mod.
 */
export const getPendingRequests = async (spaceId: string, spaceType: 'FORUM' | 'COMMUNITY_SPACE') => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('get_pending_requests', {
        p_space_id: spaceId,
        p_space_type: spaceType,
    });

    if (error) throw error;
    return data;
};

/**
 * Updates the status of a membership. Must be an admin/mod.
 */
export const updateMembershipStatus = async (membershipId: string, newStatus: 'APPROVED' | 'DENIED' | 'BANNED'): Promise<Membership> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('update_membership_status', {
        p_membership_id: membershipId,
        p_new_status: newStatus,
    });
    if (error) throw error;
    return data;
};
