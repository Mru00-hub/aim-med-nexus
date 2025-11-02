// src/integrations/supabase/community.api.ts
import { supabase } from './client';
import { Database, Tables, Enums } from './types';
import { getMyConnections } from './social.api'; 
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
export type AcademicAchievement = Tables<'academic_achievements'>;
export type Publication = Tables<'publications'>;
export type Certification = Tables<'certifications'>;
export type Award = Tables<'awards'>;
export type CareerTransition = Tables<'career_transitions'>;
export type Venture = Tables<'ventures'>;
export type ContentPortfolio = Tables<'content_portfolio'>;
export type ProfileAnalytics = Tables<'profile_analytics'>;
export type Cocurricular = Tables<'cocurriculars'>;
export type WorkExperience = Tables<'work_experiences'>;
export type EducationHistory = Tables<'education_history'>;

export type SpaceWithDetails = Space & {
  creator_full_name: string | null;
  creator_position: string | null;
  creator_organization: string | null;
  creator_specialization: string | null;
  moderators: {
    full_name: string;
    role: Enums<'membership_role'>;
    specialization: string | null;
  }[] | null;
  member_count?: number;
  thread_count?: number;
  last_activity_at?: string;
};

export type MemberProfile = {
    id: string; // This is the user's ID (from profiles table)
    membership_id: string; // This is the ID of the membership row itself
    full_name: string;
    profile_picture_url: string | null;
    role: Enums<'membership_role'>;
};

// Custom type for function return values that include joined data (for Threads list)
export type PostOrThreadSummary = {
  id: string;
  title: string;
  creator_id: string;
  creator_full_name: string;
  creator_position: string | null;
  creator_organization: string | null;
  creator_profile_picture_url: string | null;
  creator_specialization: string | null;
  created_at: string;
  last_activity_at: string;
  space_id: string;
  space_type: string; // NEW
  total_message_count: number; // NEW
  comment_count: number; // NEW
  
  // Post-style fields
  first_message_id: number | null;
  first_message_body: string | null;
  first_message_reaction_count: number | null;
  first_message_user_reaction: string | null;
  
  // Thread-style fields
  last_message_body: string | null;
  attachments: SimpleAttachment[] | null;
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
  current_position: string | null;
  organization: string | null;
  location_name: string | null;
  specialization_name: string | null;
};

export type AttachmentInput = {
  file_url: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
};

export type SimpleAttachment = {
  file_url: string;
  file_name: string;
  file_type: string;
};

export type PublicPost = {
  thread_id: string;
  title: string;
  first_message_id: number;
  first_message_body: string | null;
  author: PublicPostAuthor;
  created_at: string;
  last_activity_at: string;
  comment_count: number;
  first_message_id: number;
  total_reaction_count: number;
  first_message_user_reaction: string | null;
  first_message_body: string | null;
  attachments: SimpleAttachment[] | null;
  preview_title: string | null;
  preview_description: string | null;
  preview_image_url: string | null;
};

export type PublicPostAuthor = {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  current_position: string | null; // <-- We added this
};

export type FullProfile = {
  profile: ProfileData; // This is the ProfileData type defined at the bottom
  posts: PublicPost[];
  spaces: Space[];
  academic_achievements: AcademicAchievement[];
  publications: Publication[];
  certifications: Certification[];
  awards: Award[];
  analytics: ProfileAnalytics | null; // Can be null if no views yet
  // These counts now come directly from the 'profiles' table
  followers_count: number; 
  following_count: number;
  connection_count: number;
  is_followed_by_viewer: boolean; // This we still check separately
  career_transition: CareerTransition | null;
  work_experiences: WorkExperience[];     // <-- ADDED
  education_history: EducationHistory[];
  ventures: Venture[];
  content_portfolio: ContentPortfolio[];
  cocurriculars: Cocurricular[];
};

export type ProfileWithStatus = {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  current_position: string | null;
  organization: string | null;
  specialization_name: string | null;
  location_name: string | null;
  connection_status: 'connected' | 'pending_sent' | 'pending_received' | 'not_connected';
  is_viewer_following: boolean;
};

type ModeratorDetails = {
  role: Enums<'membership_role'>;
  user_id: string;
  full_name: string;
  current_position: string | null;
  organization: string | null;
  specialization: string | null;
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

const MOCK_PUBLIC_POSTS: PublicPost[] = [
  {
    thread_id: 'mock-pub-thread-1',
    title: 'Best guidelines for AFib in 2025? (Example)',
    // --- THIS IS THE FIX ---
    author: {
      id: 'user-123',
      full_name: 'Dr. Chen (Example)',
      profile_picture_url: null,
      current_position: 'Cardiologist',
    },
    // --- END FIX ---
    created_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    comment_count: 23,
    first_message_id: 1,
    total_reaction_count: 58,
    first_message_user_reaction: null,
    first_message_body: 'This is an example post body for the AFib guidelines discussion. It can be a bit longer to test the "Show More" functionality.',
    attachments: null,
    preview_title: null,
    preview_description: null,
    preview_image_url: null,
  },
  {
    thread_id: 'mock-pub-thread-2',
    title: 'Hospital EHR vendor comparison (Example)',
    // --- THIS IS THE FIX ---
    author: {
      id: 'user-456',
      full_name: 'Dr. Patel (Example)',
      profile_picture_url: null,
      current_position: 'CMIO',
    },
    // --- END FIX ---
    created_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    comment_count: 18,
    first_message_id: 2,
    total_reaction_count: 42,
    first_message_user_reaction: null,
    first_message_body: 'We are comparing Epic, Cerner, and Meditech. What are your experiences? Attaching our internal comparison sheet.',
    attachments: [
      { file_url: 'mock_url.pdf', file_name: 'EHR-Comparison.pdf', file_type: 'application/pdf' }
    ],
    preview_title: null,
    preview_description: null,
    preview_image_url: null,
  },
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

export interface GetSpacesProps {
  page: number;
  limit: number;
  searchQuery?: string; // 🚀 ADDED
  filter?: string; 
}

export const getSpacesWithDetails = async ({ page, limit, searchQuery = '', filter = 'ALL' }: GetSpacesProps): Promise<SpaceWithDetails[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    if (!session) {
        // 🚀 FIX: Return the same mapped mock data your context expects
        console.log('[getSpacesWithDetails] No session, returning MOCK_SPACES.');
        const mockSlice = MOCK_SPACES
          .filter(space => filter === 'ALL' || space.space_type === filter)
          .filter(space => 
            searchQuery === '' || 
            space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (space.description && space.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .slice(from, to + 1);
        return mockSlice.map((space, index) => {
          const mockCounts = [
            { members: 125, threads: 42 },
            { members: 88, threads: 19 },
            { members: 302, threads: 76 },
            { members: 45, threads: 12 }
          ];
          
          return {
            ...space,
            creator_full_name: 'Community Member',
            moderators: [],
            creator_position: null,
            creator_organization: null,
            creator_specialization: null,
            // Add the mock numbers
            member_count: mockCounts[index].members,
            thread_count: mockCounts[index].threads,
          };
        });
    }
    const { data, error } = await supabase.rpc('get_spaces_with_details', {
        p_limit: limit, // Pass the limit
        p_offset: from, // Optional: Pass offset if your RPC expects it instead of page
        p_search_query: searchQuery, // 🚀 PASSED
        p_filter_type: filter
    });

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
export const getSpaceDetails = async (spaceId: string): Promise<SpaceWithDetails | undefined> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Mock data logic for logged-out users remains the same
    const mock = MOCK_SPACES.find(s => s.id === spaceId);
    return mock ? {
      ...mock,
      creator_full_name: 'Mock User',
      creator_position: 'Mock Position',
      creator_organization: 'Mock Org',
      creator_specialization: 'Mock Spec',
      moderators: [],
      member_count: 1,
      thread_count: 1,
    } : undefined;
  }

  // --- This is the new implementation ---

  // 1. Call the new RPC function
  const { data, error } = await supabase
    .rpc('get_space_details_by_id', {
      p_space_id: spaceId
    })
    .single(); // We expect only one row

  // 2. Handle errors
  if (error) {
    console.error("Error fetching space details from RPC:", error);
    throw error;
  }
  if (!data) return undefined;

  // 3. Return the data directly
  // No client-side mapping is needed because the SQL function
  // already formats the data to match the SpaceWithDetails type.
  return data as SpaceWithDetails;
};

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
        if (error.code === 'PGRST116' || (error as any).status === 406) {
            return null; 
        }
        
        // It's some other unexpected database error
        console.error("Unexpected error fetching user role:", error);
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

export const incrementProfileView = async (userId: string): Promise<void> => {
  // 🚀 FIX: Await the call so we can properly catch errors
  const { error } = await supabase.rpc('increment_profile_view', { p_profile_id: userId });

  if (error) {
    // This will now be a red error in your browser console
    console.error("Error incrementing profile view:", error);
  } else {
    // You can optionally add this to confirm it worked
    console.log("Profile view incremented successfully.");
  }
};

interface GetPublicThreadsProps {
  page: number;
  limit: number;
  searchQuery?: string;
}
/** Fetches all global public threads using the new DB function. */
export const getPublicThreads = async ({ page, limit, searchQuery = '' }: GetPublicThreadsProps): Promise<PublicPost[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        console.log('[getPublicThreads] No session, returning MOCK_PUBLIC_POSTS.');
        const start = (page - 1) * limit;
        const end = start + limit;
        const filteredMocks = MOCK_PUBLIC_POSTS.filter(post => 
          searchQuery === '' ||
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (post.first_message_body && post.first_message_body.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return (filteredMocks as any).slice(start, end); 
    }

    const { data, error } = await supabase.rpc('get_threads', {
        p_space_id: null, // This will default to the 'PUBLIC' space per your SQL
        p_limit: limit,
        p_page: page,
        p_search_query: searchQuery // 🚀 PASSED
    });
        
    if (error) throw error;
    
    // 🚀 ADDED MAPPER: Convert RPC response (PostOrThreadSummary) to component type (PublicPost)
    const rpcData = (data || []) as PostOrThreadSummary[];
    const posts: PublicPost[] = rpcData.map(post => ({
      thread_id: post.id,
      title: post.title,
      author: {
        id: post.creator_id,
        full_name: post.creator_full_name,
        profile_picture_url: post.creator_profile_picture_url,
        current_position: post.creator_position,
      },
      created_at: post.created_at,
      last_activity_at: post.last_activity_at,
      comment_count: post.comment_count,
      // The RPC returns bigint, which JS receives as number. Cast to be safe.
      first_message_id: Number(post.first_message_id), 
      total_reaction_count: Number(post.first_message_reaction_count),
      first_message_user_reaction: post.first_message_user_reaction,
      first_message_body: post.first_message_body,
      attachments: post.attachments,
      // These fields are not in the 'get_threads' RPC, default to null
      preview_title: null, 
      preview_description: null,
      preview_image_url: null,
    }));

    return posts;
};

export const getPostDetails = async (threadId: string) => {
  // 1. Get thread/author details
  const { data: threadData, error: threadError } = await supabase
    .from('threads')
    .select('*') // Just get thread columns
    .eq('id', threadId)
    .single();

  if (threadError) throw threadError;
  if (!threadData) throw new Error("Post not found.");

  // 2. Get the first message (the "post" content)
  const { data: authorData, error: authorError } = await supabase
    .from('profiles')
    .select('id, full_name, profile_picture_url, current_position')
    .eq('id', threadData.creator_id) // Use the creator_id to find the profile
    .single();

  if (authorError) {
    console.warn("Could not fetch post author profile:", authorError.message);
  }
  const { data: firstMessage, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  if (messageError) throw messageError;
  if (!firstMessage) throw new Error("Post content not found.");

  // 3. Get attachments for the first message
  const { data: postAttachments, error: attachmentsError } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('message_id', firstMessage.id);
  
  if (attachmentsError) throw attachmentsError;

  // 4. Get reactions for the first message
  const { data: postReactions, error: reactionsError } = await supabase
    .from('message_reactions')
    .select('reaction_emoji, user_id, id') // Added 'id' for optimistic updates
    .eq('message_id', firstMessage.id);

  if (reactionsError) throw reactionsError;

  // 5. Get all comments (messages EXCEPT the first one)
  const { data: comments, error: commentsError } = await supabase
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
    .neq('id', firstMessage.id) // Exclude the "post" message
    .order('created_at', { ascending: true });

  if (commentsError) throw commentsError;
  
  // 6. Assemble the 'post' object to match the 'PublicPost' type, plus new fields
  const postObject: PublicPost & { body: string; attachments: any[]; reactions: any[] } = {
    thread_id: threadData.id,
    title: threadData.title,
    created_at: firstMessage.created_at, 
    last_activity_at: threadData.last_activity_at,
    author_id: threadData.creator_id,
    author_name: authorData?.full_name || null, // Use the new authorData
    author_avatar: authorData?.profile_picture_url || null, // Use the new authorData
    author_position: authorData?.current_position || null, // Use the new authorData
    first_message_id: firstMessage.id,
    first_message_body: firstMessage.body,
    body: firstMessage.body,   
    attachments: postAttachments || [], // (assuming postAttachments is from your unchanged step 3)
    reactions: postReactions || [], // (assuming postReactions is from your unchanged step 4)
    comment_count: comments.length, // (assuming comments is from your unchanged step 5)
    total_reaction_count: (postReactions || []).length, 
  };

  return {
    post: postObject,
    comments: (comments || []) as MessageWithDetails[],
  };
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

    return newSpace;
}

/** Creates a new thread. User must be logged in. */
export const createThread = async (
  payload: { title: string; body: string; spaceId: string | null; description?: string; attachments?: AttachmentInput[]; preview?: {title?: string; description?: string; image?: string; }}
): Promise<string> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('create_thread', {
        p_title: payload.title,
        p_body: payload.body, 
        p_space_id: payload.spaceId,
        p_description: payload.description,
        p_attachments: payload.attachments || null,
        p_preview_title: payload.preview?.title || null,
        p_preview_description: payload.preview?.description || null,
        p_preview_image_url: payload.preview?.image || null
    });

    if (error) throw error;
    return data;
};

// --- Viewing Threads ---

/** Fetches threads for a specific space using the new DB function. */
export const getThreadsForSpace = async (props: {
  spaceId: string;
  page: number;
  limit: number;
  searchQuery?: string;
}): Promise<PostOrThreadSummary[]> => {
  
  const { data, error } = await supabase.rpc('get_threads', {
    p_space_id: props.spaceId,
    p_page: props.page,
    p_limit: props.limit,
    p_search_query: props.searchQuery || ''
  });

  if (error) throw error;
  return (data || []) as PostOrThreadSummary[];
};

export const getThreadDetails = async (
  threadId: string
): Promise<
  (Thread & { spaces: { name: string; space_type: string } | null }) | null // <-- 1. Update the return type
> => {
  const { data, error } = await supabase
    .from('threads')
    .select('*, spaces (name, space_type)') // <-- 2. Update the query
    .eq('id', threadId)
    .single();
  if (error) throw error;
  return data;
};

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
    const { error: rpcError } = await supabase.rpc('update_thread', {
        p_thread_id: threadId,
        p_new_title: payload.title,
        p_new_description: payload.description || null
    });

    if (rpcError) throw rpcError;

    // 2. Select the updated row to maintain the function's return signature
    const { data, error: selectError } = await supabase
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single();

    if (selectError) throw selectError;
    if (!data) throw new Error("Could not find thread after update.");
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
    const { error } = await supabase.rpc('delete_message', {
        p_message_id: messageId 
    });
    if (error) throw error;
};

export const editMessage = async (messageId: number, newBody: string): Promise<Message> => {
    await getSessionOrThrow();
    const { error: rpcError } = await supabase.rpc('update_message', {
        p_message_id: messageId,
        p_new_body: newBody
    });

    if (rpcError) throw rpcError;

    // 2. Select the updated row to maintain the function's return signature
    const { data, error: selectError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (selectError) throw selectError;
    if (!data) {
        throw new Error("Failed to find message after edit.");
    }
    return data;
};

/** Adds a reaction to a message. */
export const toggleReaction = async (messageId: number, emoji: string): Promise<void> => {
    await getSessionOrThrow();
    const { error } = await supabase.rpc('toggle_reaction', {
        p_message_id: messageId,
        p_new_emoji: emoji, // CHANGED: Must be 'p_new_emoji' to match your SQL
    });
    if (error) throw error;
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

export const uploadFilesForPost = async (
  files: File[]
): Promise<AttachmentInput[]> => {
  const session = await getSessionOrThrow();
  const userId = session.user.id;
  const newThreadId = crypto.randomUUID(); // Create a temp UUID for grouping

  const uploadPromises = files.map(async (file) => {
    // We create a temp path. The final path will be determined by storage policies
    // This path helps group files before the post is created.
    const filePath = `public/${userId}/${newThreadId}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('message_attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('message_attachments')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error("Could not get public URL for the uploaded file.");
    }

    return {
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size_bytes: file.size,
    };
  });

  return Promise.all(uploadPromises);
};

export const updatePost = async (
  threadId: string,
  payload: { title: string }
): Promise<void> => {
  await getSessionOrThrow();
  const { error } = await supabase.rpc('update_post', {
    p_thread_id: threadId,
    p_title: payload.title,
  });
  if (error) throw error;
};

export const deletePost = async (threadId: string): Promise<void> => {
  await getSessionOrThrow();
  const { error } = await supabase.rpc('delete_post', {
    p_thread_id: threadId,
  });
  if (error) throw error;
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
    await getSessionOrThrow();
    const { error } = await supabase.rpc('leave_space', { 
        p_space_id: spaceId 
    });
    if (error) throw error;
};

/** Deletes a space. Must be admin/creator. */
export const deleteSpace = async (spaceId: string): Promise<void> => {
    await getSessionOrThrow();
    const { error } = await supabase.rpc('delete_space', { 
        p_space_id: spaceId 
    });
    if (error) throw error;
};

/** Transfers space ownership. Must be creator. */
export const transferSpaceOwnership = async (spaceId: string, newOwnerId: string): Promise<void> => {
    await getSessionOrThrow();
    const { error } = await supabase.rpc('transfer_space_ownership', {
        p_space_id: spaceId,
        p_new_owner_id: newOwnerId
    });
    if (error) throw error;
};

/** Deletes a thread. Must be creator or mod/admin. */
export const deleteThread = async (threadId: string): Promise<void> => {
    await getSessionOrThrow();
    const { error } = await supabase.rpc('delete_thread', { 
        p_thread_id: threadId 
    });
    if (error) throw error;
};

export type SummaryResponse = {
  thread_id: string;
  message_count: number;
  latest_message_at: string | null;
  ai_summary: string;
};

// Add this function to call your edge function
export const getThreadSummary = async (threadId: string, limit: number): Promise<SummaryResponse> => {
  // 1. Get the current user's auth token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) throw new Error("User is not authenticated.");

  const token = session.access_token;
  
  // 2. Construct the full function URL (as provided by you)
  const functionUrl = `https://kkghalgyuxgzktcaxzht.supabase.co/functions/v1/summarize-last`;
  const urlWithParams = `${functionUrl}?thread_id=${encodeURIComponent(threadId)}&limit=${limit}`;

  // 3. Make a GET request using fetch
  const response = await fetch(urlWithParams, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // Pass the auth token
      'Content-Type': 'application/json'
    }
  });

  // 4. Handle the response
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Summarize function error response:", errorData);
    throw new Error(errorData.details || errorData.error || `Request failed with status ${response.status}`);
  }

  const data: SummaryResponse = await response.json();
  return data;
};

export const toggleFollow = async (userId: string): Promise<void> => {
  await getSessionOrThrow();
  const { error } = await supabase.rpc('toggle_follow', {
    p_followed_id: userId,
  });
  if (error) throw error;
};

export const getProfileDetails = async (userId: string): Promise<FullProfile> => {
  const session = await getSessionOrThrow();
  const currentUserId = session.user.id;

  // 1. Get main profile info (using the privacy-aware RPC)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_profile_with_privacy',
    {
      profile_id: userId,
      viewer_id: currentUserId,
    }
  );

  if (rpcError) throw rpcError;
  const profile = rpcData?.[0];
  
  if (!profile) throw new Error("Profile not found or you do not have permission.");
  
  // 2. In parallel, fetch all related data
  const [
    { data: posts, error: postsError },
    { data: spaces, error: spacesError },
    { data: isFollowingData, error: isFollowingError },
    { data: achievements, error: achError },
    { data: publications, error: pubError },
    { data: certifications, error: certError },
    { data: awards, error: awardError },
    { data: analytics, error: analyticsError },
    { data: transitionData, error: transitionError },
    { data: ventures, error: ventureError },
    { data: contentData, error: contentError },
    { data: cocurricularData, error: cocurricularError },
    { data: workData, error: workError },
    { data: educationData, error: educationError },
  ] = await Promise.all([
    // Activity
    supabase.from('public_posts_feed').select('*').eq('thread_creator_id', userId).order('created_at', { ascending: false }),
    supabase.from('spaces').select('*').eq('creator_id', userId),
    // Follow Status (only check if not viewing own profile)
    currentUserId === userId 
      ? Promise.resolve({ data: false, error: null }) 
      : supabase.from('user_follows').select('follower_id').eq('follower_id', currentUserId).eq('followed_id', userId).maybeSingle(),
    // New Data Tables (RLS handles privacy)
    supabase.from('academic_achievements').select('*').eq('profile_id', userId).order('year', { ascending: false, nulls: 'last' }),
    supabase.from('publications').select('*').eq('profile_id', userId).order('publication_date', { ascending: false, nulls: 'last' }),
    supabase.from('certifications').select('*').eq('profile_id', userId).order('issue_date', { ascending: false, nulls: 'last' }),
    supabase.from('awards').select('*').eq('profile_id', userId).order('date', { ascending: false, nulls: 'last' }),
    supabase.from('profile_analytics').select('view_count').eq('profile_id', userId).maybeSingle(),
    supabase.from('career_transitions').select('*').eq('profile_id', userId).maybeSingle(),
    supabase.from('ventures').select('*').eq('profile_id', userId).order('start_date', { ascending: false, nulls: 'last' }),
    supabase.from('content_portfolio').select('*').eq('profile_id', userId).order('created_at', { ascending: false }),
    supabase.from('cocurriculars').select('*').eq('profile_id', userId).order('activity_date', { ascending: false, nulls: 'last' }),
    supabase.from('work_experiences').select('*').eq('profile_id', userId).order('start_date', { ascending: false, nulls: 'last' }),
    supabase.from('education_history').select('*').eq('profile_id', userId).order('start_year', { ascending: false, nulls: 'last' }),
  ]);

  // Optional: Log errors if any query failed
  const allErrors = { postsError, spacesError, isFollowingError, achError, pubError, certError, awardError, analyticsError, transitionError, ventureError, contentError, workError, educationError };
  if (Object.values(allErrors).some(Boolean)) {
    console.warn("One or more profile detail queries failed.", allErrors);
  }

  // 3. Return the comprehensive object
  return {
    profile: profile as ProfileData,
    posts: posts || [],
    spaces: spaces || [],
    // Get counts directly from the profile table (updated by triggers)
    followers_count: profile.follower_count || 0,
    following_count: profile.following_count || 0,
    connection_count: profile.connection_count || 0,
    is_followed_by_viewer: !!isFollowingData, // Check if the follow relationship exists
    academic_achievements: achievements || [],
    publications: publications || [],
    certifications: certifications || [],
    awards: awards || [],
    analytics: analytics || { profile_id: userId, view_count: 0 }, // Default to 0 views
    career_transition: transitionData || null,
    ventures: ventures || [],
    content_portfolio: contentData || [],
    cocurriculars: cocurricularData || [],
    work_experiences: workData || [],
    education_history: educationData || [],
  };
};

/**
 * Fetches the list of users who follow the target user,
 * including the viewer's status relative to them.
 * @param userId - The user whose followers to fetch.
 */
export const getFollowersWithStatus = async (userId: string): Promise<ProfileWithStatus[]> => {
  const { data, error } = await supabase.rpc('get_followers_with_status', {
    p_profile_id: userId,
  });
  if (error) throw error;
  return (data as ProfileWithStatus[]) || [];
};

/**
 * Fetches the list of users the target user is following,
 * including the viewer's status relative to them.
 * @param userId - The user whose followees to fetch.
 */
export const getFollowingWithStatus = async (userId: string): Promise<ProfileWithStatus[]> => {
  const { data, error } = await supabase.rpc('get_following_with_status', {
    p_profile_id: userId,
  });
  if (error) throw error;
  return (data as ProfileWithStatus[]) || [];
};

type ProfileData = Tables<'profiles'> & {
  age?: number;
  current_location: string | null;
  institution: string | null;
  course: string | null;
  specialization: string | null;
  year_of_study: string | null;
  years_experience: string | null;
  // Add trigger-based counts from profile table
  follower_count?: number;
  following_count?: number;
  connection_count?: number;
  profile_mode?: string;
};
