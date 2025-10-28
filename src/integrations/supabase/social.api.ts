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
import {
  encryptFile,
  encryptMessage,
  decryptConversationKey,
  generateConversationKey,
  exportConversationKey,
  importConversationKey,
  encryptConversationKey
} from '@/lib/crypto';
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

// CHANGED: This type now points to the return type of our new RPC function.
export type Conversation =
  Database["public"]["Functions"]["get_my_inbox_conversations"]["Returns"][number];

// Matches the return type of get_pending_connection_requests() from types.ts
export type ConnectionRequest =
  Database["public"]["Functions"]["get_pending_connection_requests"]["Returns"][number];

// Matches the return type of get_my_connections() from types.ts
export type Connection =
  Database["public"]["Functions"]["get_my_connections"]["Returns"][number];

// Matches the return type of get_my_blocked_users() from types.ts
export type BlockedUser =
  Database["public"]["Functions"]["get_my_blocked_users"]["Returns"][number];

// CHANGED: Added a type for the data returned by getSentPendingRequests
export type SentPendingRequest = {
  addressee_id: string;
  request_date: string;
  full_name: string | null;
  profile_picture_url: string | null;
  current_position: string | null;
  organization: string | null;
};

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
export const getPendingRequests = async (): Promise<ConnectionRequest[]> => {
    const { data, error } = await supabase.rpc('get_pending_connection_requests');
    if (error) throw error;
    return data || [];
};

export const getMyConnections = async (): Promise<Connection[]> => {
    const { data, error } = await supabase.rpc('get_my_connections_with_status');
    if (error) throw error;
    // We cast to 'any' then back to the specific type to satisfy TypeScript
    return (data as any) || []; 
};

export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
    const { data, error } = await supabase.rpc('get_my_blocked_users');
    if (error) throw error;
    return data || [];
};

export const getUserRecommendations = async (targetUserId: string): Promise<ApiResponse<Database['public']['Functions']['get_user_recommendations']['Returns']>> => {
    const response = await supabase.rpc('get_user_recommendations', { target_user_id: targetUserId });
    return handleResponse(response);
};

// CHANGED: This function now queries the 'user_connections' table directly.
// Our RLS policy (auth.uid() = requester_id) secures this query.
// I've also switched it to the "throw error" pattern to match your other functions.
export const getSentPendingRequests = async (): Promise<SentPendingRequest[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('user_connections')
        .select(`
            addressee_id,
            created_at,
            profiles!user_connections_addressee_id_fkey (
                full_name,
                profile_picture_url,
                current_position,
                organization
            )
        `)
        .eq('requester_id', session.user.id)
        .eq('status', 'pending');

    if (error) throw error;
    if (!data) return [];

    // Flatten the data to match the old view's structure, preventing breaking changes in your UI.
    const flattenedData = data.map(req => ({
        addressee_id: req.addressee_id,
        request_date: req.created_at,
        full_name: req.profiles?.full_name ?? null,
        profile_picture_url: req.profiles?.profile_picture_url ?? null,
        current_position: req.profiles?.current_position ?? null,
        organization: req.profiles?.organization ?? null,
    }));
    return flattenedData;
};

export const getConnectionStatus = async (otherUserId: string): Promise<'connected' | 'pending_sent' | 'pending_received' | 'not_connected'> => {
  try {
    const session = await getSessionOrThrow();
    // Check for a row where the viewer and target are the two parties
    const { data, error } = await supabase
      .from('user_connections')
      .select('status, requester_id')
      .or(`(requester_id.eq.${session.user.id},addressee_id.eq.${otherUserId}),(requester_id.eq.${otherUserId},addressee_id.eq.${session.user.id})`)
      .limit(1) // Ensure only one row
      .maybeSingle(); // .maybeSingle() is key, returns null if no row

    if (error) throw error;
    if (!data) return 'not_connected';
    
    if (data.status === 'accepted') return 'connected';
    
    if (data.status === 'pending') {
      // If I was the requester, the status is 'pending_sent'
      return data.requester_id === session.user.id ? 'pending_sent' : 'pending_received';
    }

    // Any other status (ignored, blocked) is treated as not connected
    return 'not_connected';
  } catch (e) {
    // User not logged in or other error
    return 'not_connected';
  }
};

export const getMutualConnections = async (otherUserId: string): Promise<Database['public']['Functions']['get_mutual_connections']['Returns']> => {
    const { data, error } = await supabase.rpc("get_mutual_connections", { other_user_id: otherUserId });
    if (error) throw error;
    return (data as any) || [];
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

export const setupConversationEncryption = async (
  conversationId: string,
  userMasterKey: CryptoKey
): Promise<CryptoKey> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const myUserId = session.user.id;

  // Step 1: Check if I already have an encrypted key for this conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('encrypted_conversation_key')
    .eq('conversation_id', conversationId)
    .eq('user_id', myUserId)
    .single();

  if (participant?.encrypted_conversation_key) {
    // Yes, decrypt and return it.
    console.log('DEBUG: Found encrypted key in DB:', participant.encrypted_conversation_key);
    return decryptConversationKey(participant.encrypted_conversation_key, userMasterKey);
  }

  // Step 2: No key for me. Let's establish the master key using our atomic RPC.
  // We'll optimistically generate a key. The RPC function decides if we use this one or an existing one.
  const newKeyCandidate = await generateConversationKey();
  const newKeyJwk = await exportConversationKey(newKeyCandidate);

  const { data: officialKeyJwk, error: rpcError } = await supabase.rpc(
    'set_conversation_master_key_if_null',
    { p_conversation_id: conversationId, p_new_key_jwk: newKeyJwk }
  );

  if (rpcError) throw rpcError;

  const masterKey = await importConversationKey(officialKeyJwk);

  // Step 3: Now that we have the official masterKey, encrypt a copy for myself and store it.
  const myEncryptedCopy = await encryptConversationKey(masterKey, userMasterKey);
  await supabase
    .from('conversation_participants')
    .update({ encrypted_conversation_key: myEncryptedCopy })
    .eq('conversation_id', conversationId)
    .eq('user_id', myUserId);

  return masterKey;
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
// CHANGED: This now calls your new 'get_my_inbox_conversations' function
// instead of querying the 'inbox_conversations' view.
export const getInbox = async (): Promise<Conversation[]> => {
    const { data, error } = await supabase.rpc("get_my_inbox_conversations");

    if (error) throw error;
    return data || [];
};

/**
 * Fetches the count of unread conversations for the
 * currently logged-in user.
 */
// CHANGED: This now calls your new 'get_my_unread_inbox_count' function.
export const getUnreadInboxCount = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('get_my_unread_inbox_count');

  if (error) {
    console.error('Error fetching unread inbox count:', error);
    return 0;
  }

  return data || 0;
};

/**
 * Checks if the current user is allowed to send a message to another user (i.e., they are connected).
 * @param otherUserId - The UUID of the message recipient.
 */
export const canSendMessage = async (otherUserId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('can_send_direct_message', { other_user_id: otherUserId });
  if (error) {
    console.error("Error checking send permission:", error);
    return false; // Fail safely
  }
  return data;
};

// --- Message Actions ---

/**
 * Posts a new message or a reply to a conversation. This function requires a
 * new RPC function in your Supabase project to handle replies correctly.
 *
 * @param conversationId - The conversation to post to.
 * @param content - The text of the message.
 *m * @param parentMessageId - The ID of the message being replied to (optional).
 * @returns The newly created message object.
 */
export const postDirectMessage = async (
    conversationId: string,
    plaintext: string, 
    conversationKey: CryptoKey,
    parentMessageId: number | null = null
): Promise<DirectMessage> => {
    await getSessionOrThrow();
    if (!conversationKey) throw new Error("Encryption key is required to post a message.");

    // 4. Encrypt the message content
    const encryptedContent = await encryptMessage(plaintext, conversationKey);

    const { data, error } = await supabase.rpc('post_direct_message', {
        p_conversation_id: conversationId,
        p_content: encryptedContent, // 👈 5. Send the encrypted content
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
export const editDirectMessage = async (
    messageId: number, 
    newPlaintext: string, // 👈 6. Changed to 'newPlaintext'
    conversationKey: CryptoKey, // 👈 7. Accept the encryption key
): Promise<DirectMessage> => {
    await getSessionOrThrow();
    if (!conversationKey) throw new Error("Encryption key is required to edit a message."); 
    // 8. Encrypt the new content
    const encryptedNewContent = await encryptMessage(newPlaintext, conversationKey);

    const { data, error } = await supabase
        .from('direct_messages')
        .update({ 
            content: encryptedNewContent, // 👈 9. Update with encrypted content
            is_edited: true, 
            updated_at: new Date().toISOString() 
        })
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
  file: File,
  conversationKey: CryptoKey
): Promise<DirectMessageAttachment> => {
    const session = await getSessionOrThrow();
    const userId = session.user.id;
    const { encryptedBlob, ivString } = await encryptFile(file, conversationKey);
    const encryptedFileName = await encryptMessage(file.name, conversationKey);

    // 2. Create a unique path (file name is now anonymous)
    const filePath = `${userId}/${messageId}/${Date.now()}-encrypted-file`;

    const { error: uploadError } = await supabase.storage
        .from('direct_message_attachments')
        .upload(filePath, encryptedBlob, {
           contentType: file.type // Set content type for the encrypted blob
        });
    if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
  
    const { data: { publicUrl } } = supabase.storage
        .from('direct_message_attachments')
        .getPublicUrl(filePath);
    if (!publicUrl) throw new Error("Could not get public URL for attachment.");

    const attachmentRecord = {
        message_id: messageId,
        uploaded_by: userId,
        file_name: encryptedFileName, 
        file_url: publicUrl,
        file_type: file.type,
        file_size_bytes: file.size,
        iv: ivString,
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
    // We cast to \`any\` then \`DirectMessageWithDetails[]\` because the Supabase
    // client library's generated types don't always understand custom aliases like \`author\`.
    // Our custom \`DirectMessageWithDetails\` type ensures type safety in the app.
    return data as any as DirectMessageWithDetails[];
};
