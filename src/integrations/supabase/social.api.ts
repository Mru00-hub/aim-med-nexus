/**
 * @file social.api.ts
 * @description This file serves as the API layer for all social networking and
 * direct messaging features. It encapsulates all Supabase RPC calls and table queries,
 * providing a clean and type-safe interface for the frontend.
 *
 * REFACTORED: This version aligns with the patterns established in community.api.ts,
 * using standalone async functions that throw errors, and providing rich data types
 * for a better developer experience and more robust optimistic UI updates.
 */

import { supabase } from "./client";
import type { Database, Enums, Tables, TablesInsert } from "./types";

//================================================================================
//  Type Definitions
//================================================================================

type ApiError = { message: string; details: any; };
type ApiResponse<T> = { data: T | null; error: ApiError | null; };
const handleResponse = <T>(response: { data: T | null; error: any; }): ApiResponse<T> => {
  if (response.error) {
    console.error("Supabase API Error:", response.error);
    return { data: null, error: { message: response.error.message, details: response.error }};
  }
  return { data: response.data, error: null };
};

export type DirectMessage = Tables<'direct_messages'>;
export type DirectMessageReaction = Tables<'direct_message_reactions'>;
export type DirectMessageAttachment = Tables<'direct_message_attachments'>;
export type Profile = Tables<'profiles'>;
export type ConnectionRequest = Tables<"pending_connection_requests">;
export type Connection = Tables<"my_connections">;
export type BlockedUser = Tables<"blocked_members">;
export type Conversation = Tables<"inbox_conversations">;

/**
 * A rich type for a direct message, including details about the author,
 * reactions, and attachments. This is crucial for rendering messages in the UI.
 */
export type DirectMessageWithDetails = DirectMessage & {
  author: {
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
  reactions: DirectMessageReaction[];
  attachments: DirectMessageAttachment[];
};

//================================================================================
//  Helper Functions
//================================================================================

/**
 * A standardized helper to ensure a user session exists before making an API call.
 * Throws an error if the user is not authenticated.
 */
const getSessionOrThrow = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!session) throw new Error("Authentication required. Please log in.");
  return session;
};

//================================================================================
//  System 1: User Connections & Social Graph API
//================================================================================

// --- Connection Actions ---

/**
 * Sends a connection request to another user.
 * @param addresseeId - The UUID of the user to send the request to.
 */
export const sendConnectionRequest = async (addresseeId: string): Promise<void> => {
    const { error } = await supabase.rpc("send_connection_request", { addressee_uuid: addresseeId });
    if (error) throw error;
};

/**
 * Responds to a pending connection request.
 * @param requesterId - The UUID of the user who sent the request.
 * @param responseStatus - The response, either 'accepted' or 'ignored'.
 */
export const respondToRequest = async (requesterId: string, responseStatus: "accepted" | "ignored"): Promise<void> => {
    const status: Enums<"connection_status"> = responseStatus;
    const { error } = await supabase.rpc("respond_to_connection_request", { requester_uuid: requesterId, response: status });
    if (error) throw error;
};

/**
 * Removes an existing 'accepted' connection (unfriends a user).
 * @param userIdToRemove - The UUID of the user to remove.
 */
export const removeConnection = async (userIdToRemove: string): Promise<void> => {
    const { error } = await supabase.rpc("remove_connection", { user_to_remove_id: userIdToRemove });
    if (error) throw error;
};

/**
 * Blocks another user, preventing all interactions.
 * @param userIdToBlock - The UUID of the user to block.
 */
export const blockUser = async (userIdToBlock: string): Promise<void> => {
    const { error } = await supabase.rpc("block_user", { blocked_user_id: userIdToBlock });
    if (error) throw error;
};

/**
 * Unblocks a user, allowing interactions again.
 * @param userIdToUnblock - The UUID of the user to unblock.
 */
export const unblockUser = async (userIdToUnblock: string): Promise<void> => {
    const { error } = await supabase.rpc("unblock_user", { unblocked_user_id: userIdToUnblock });
    if (error) throw error;
};

// --- Data Fetching ---

/**
 * Fetches all incoming pending connection requests for the current user.
 */
export const getPendingRequests = async (): Promise<ApiResponse<ConnectionRequest[]>> => {
    const response = await supabase.from("pending_connection_requests").select("*");
    return handleResponse(response);
};

export const getMyConnections = async (): Promise<ApiResponse<Connection[]>> => {
    const response = await supabase.from("my_connections").select("*");
    return handleResponse(response);
};

export const getBlockedUsers = async (): Promise<ApiResponse<BlockedUser[]>> => {
    const response = await supabase.from("blocked_members").select("*");
    return handleResponse(response);
};

export const getUserRecommendations = async (targetUserId: string): Promise<ApiResponse<Database['public']['Functions']['get_user_recommendations']['Returns']>> => {
    const response = await supabase.rpc('get_user_recommendations', { target_user_id: targetUserId });
    return handleResponse(response);
};

export const getSentPendingRequests = async (): Promise<ApiResponse<any[]>> => {
    const response = await supabase.from("sent_pending_requests").select("*");
    return handleResponse(response);
};

export const getMutualConnections = async (otherUserId: string): Promise<Database['public']['Functions']['get_mutual_connections']['Returns']> => {
    const { data, error } = await supabase.rpc("get_mutual_connections", { other_user_id: otherUserId });
    if (error) throw error; // Mutual connections can still throw as it's called individually
    return data;
};

//================================================================================
//  System 2: Direct Messaging API (REFACTORED)
//================================================================================

// --- Conversation Management ---

/**
 * Gets an existing 1-on-1 conversation or creates a new one.
 * @param otherUserId - The UUID of the other participant.
 * @returns The conversation_id.
 */
export const createOrGetConversation = async (otherUserId: string): Promise<string> => {
    const { data, error } = await supabase.rpc("create_or_get_conversation", { other_user_id: otherUserId });
    if (error) throw error;
    if (!data) throw new Error("Could not create or get conversation.");
    return data;
};

/**
 * Marks all unread messages in a conversation as read.
 * @param conversationId - The ID of the conversation to mark as read.
 */
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
    const { error } = await supabase.rpc("mark_conversation_as_read", { p_conversation_id: conversationId });
    if (error) throw error;
};

/**
 * Fetches the complete list of conversations for the user's inbox.
 */
export const getInbox = async (): Promise<Conversation[]> => {
    const { data, error } = await supabase
        .from("inbox_conversations")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data;
};

// --- Message Actions ---

/**
 * Posts a new message or a reply to a conversation. This function requires a
 * new RPC function in your Supabase project to handle replies correctly.
 *
 * @param conversationId - The conversation to post to.
 * @param content - The text of the message.
 * @param parentMessageId - The ID of the message being replied to (optional).
 * @returns The newly created message object.
 */
export const postDirectMessage = async (
    conversationId: string,
    content: string,
    parentMessageId: number | null = null
): Promise<DirectMessage> => {
    await getSessionOrThrow();
    const { data, error } = await supabase.rpc('post_direct_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_parent_message_id: parentMessageId
    }).select().single();

    if (error) throw error;
    if (!data) throw new Error("Failed to post message: No data returned.");
    return data;
};

/**
 * Edits an existing direct message.
 * @param messageId - The ID of the message to edit.
 * @param newContent - The new text content for the message.
 */
export const editDirectMessage = async (messageId: number, newContent: string): Promise<DirectMessage> => {
    await getSessionOrThrow();
    const { data, error } = await supabase
        .from('direct_messages')
        .update({ content: newContent, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();
    if (error) throw error;
    if (!data) throw new Error("Failed to edit message: No data returned.");
    return data;
};

/**
 * Deletes a direct message. RLS policies ensure a user can only delete their own messages.
 * @param messageId - The ID of the message to delete.
 */
export const deleteDirectMessage = async (messageId: number): Promise<void> => {
    await getSessionOrThrow();
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) throw error;
};

// --- Reaction Actions ---

/**
 * Adds a reaction to a direct message.
 * @param messageId - The ID of the message to react to.
 * @param emoji - The emoji to add.
 */
export const addDirectMessageReaction = async (messageId: number, emoji: string): Promise<DirectMessageReaction> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase.from('direct_message_reactions').insert({
      message_id: messageId,
      reaction_emoji: emoji,
      user_id: session.user.id
    }).select().single();
    if (error) throw error;
    if (!data) throw new Error("Failed to add reaction.");
    return data;
};

/**
 * Removes a reaction from a direct message.
 * @param messageId - The ID of the message to react to.
 * @param emoji - The emoji to remove.
 */
export const removeDirectMessageReaction = async (messageId: number, emoji: string): Promise<{ success: boolean }> => {
    const session = await getSessionOrThrow();
    const { error } = await supabase.from('direct_message_reactions').delete().match({
      message_id: messageId,
      reaction_emoji: emoji,
      user_id: session.user.id
    });
    if (error) throw error;
    return { success: true };
};

// --- Attachment Actions ---

/**
 * Uploads a file, gets its public URL, and creates a corresponding record
 * in the `direct_message_attachments` table.
 * @param messageId - The message to associate the attachment with.
 * @param file - The file to upload.
 * @returns The newly created attachment database record.
 */
export const uploadDirectMessageAttachment = async (
  messageId: number,
  file: File
): Promise<DirectMessageAttachment> => {
    const session = await getSessionOrThrow();
    const userId = session.user.id;
    const filePath = `public/${userId}/${messageId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('direct_message_attachments')
        .upload(filePath, file);
    if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
        .from('direct_message_attachments')
        .getPublicUrl(filePath);
    if (!publicUrl) throw new Error("Could not get public URL for attachment.");

    const attachmentRecord = {
        message_id: messageId,
        uploaded_by: userId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size_bytes: file.size,
    };

    const { data: newAttachment, error: insertError } = await supabase
        .from('direct_message_attachments')
        .insert(attachmentRecord)
        .select()
        .single();
    if (insertError) throw new Error(`Database Error: ${insertError.message}`);
    if (!newAttachment) throw new Error("Failed to create attachment record in database.");

    return newAttachment;
};

// --- Message Data Fetching ---

/**
 * Fetches all messages for a specific conversation, including author profiles,
 * reactions, and attachments for a rich chat experience.
 * @param conversationId - The ID of the conversation.
 */
export const getDirectMessagesWithDetails = async (conversationId: string): Promise<DirectMessageWithDetails[]> => {
    const { data, error } = await supabase
        .from('direct_messages')
        .select(`
            *,
            author:profiles!sender_id (
              full_name,
              profile_picture_url
            ),
            reactions:direct_message_reactions (*),
            attachments:direct_message_attachments (*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    // We cast to `any` then `DirectMessageWithDetails[]` because the Supabase
    // client library's generated types don't always understand custom aliases like `author`.
    // Our custom `DirectMessageWithDetails` type ensures type safety in the app.
    return data as any as DirectMessageWithDetails[];
};
