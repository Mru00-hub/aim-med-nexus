/**
 * @file social.api.ts
 * @description This file serves as the API layer for all social networking and
 * direct messaging features. It encapsulates all Supabase RPC calls, table queries,
 * and view selections related to user connections and private chats, providing a
 * clean and type-safe interface for the frontend.
 *
 * @see Backend Documentation- Social & Messaging Features.docx
 * @see types.ts
 */

import { supabase } from "./client";
import type { Database, Enums, Tables, TablesInsert } from "./types";

// Define a consistent error handling structure
type ApiError = {
  message: string;
  details: any;
};

type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

/**
 * A helper function to handle Supabase responses and format them consistently.
 * @param response - The response object from a Supabase query.
 * @returns A formatted ApiResponse object.
 */
const handleResponse = <T>(response: {
  data: T | null;
  error: any;
}): ApiResponse<T> => {
  if (response.error) {
    console.error("Supabase API Error:", response.error);
    return {
      data: null,
      error: { message: response.error.message, details: response.error },
    };
  }
  return { data: response.data, error: null };
};

export const socialApi = {
  //================================================================================
  // System 1: User Connections & Social Graph API
  //================================================================================
  connections: {
    /**
     * [span_0](start_span)Sends a connection request to another user[span_0](end_span).
     * @param addresseeId - The UUID of the user to send the request to.
     */
    sendRequest: async (
      addresseeId: string
    ): Promise<ApiResponse<undefined>> => {
      const response = await supabase
        .rpc("send_connection_request", {
          addressee_uuid: addresseeId,
        });
      return handleResponse(response);
    },

    /**
     * [span_1](start_span)Responds to a pending connection request[span_1](end_span).
     * @param requesterId - The UUID of the user who sent the request.
     * @param responseStatus - The response, either 'accepted' or 'ignored'.
     */
    respondToRequest: async (
      requesterId: string,
      responseStatus: "accepted" | "ignored"
    ): Promise<ApiResponse<undefined>> => {
      const status: Enums<"connection_status"> = responseStatus;
      const response = await supabase
        .rpc("respond_to_connection_request", {
          requester_uuid: requesterId,
          response: status,
        });
      return handleResponse(response);
    },

    /**
     * [span_2](start_span)Removes an existing 'accepted' connection (unfriends a user)[span_2](end_span).
     * @param userIdToRemove - The UUID of the user to remove.
     */
    removeConnection: async (
      userIdToRemove: string
    ): Promise<ApiResponse<undefined>> => {
      const response = await supabase
        .rpc("remove_connection", {
          user_to_remove_id: userIdToRemove,
        });
      return handleResponse(response);
    },

    /**
     * [span_3](start_span)Blocks another user, preventing all interactions[span_3](end_span).
     * @param userIdToBlock - The UUID of the user to block.
     */
    blockUser: async (
      userIdToBlock: string
    ): Promise<ApiResponse<undefined>> => {
      const response = await supabase
        .rpc("block_user", {
          blocked_user_id: userIdToBlock,
        });
      return handleResponse(response);
    },

    /**
     * [span_4](start_span)Unblocks a user, allowing interactions again[span_4](end_span).
     * @param userIdToUnblock - The UUID of the user to unblock.
     */
    unblockUser: async (
      userIdToUnblock: string
    ): Promise<ApiResponse<undefined>> => {
      const response = await supabase
        .rpc("unblock_user", {
          unblocked_user_id: userIdToUnblock,
        });
      return handleResponse(response);
    },
    
    /**
     * [span_5](start_span)Fetches a list of recommended users to connect with[span_5](end_span).
     * @param targetUserId - The ID of the user for whom to get recommendations.
     */
    getUserRecommendations: async (
        targetUserId: string
    ): Promise<ApiResponse<Database['public']['Functions']['get_user_recommendations']['Returns']>> => {
        const response = await supabase.rpc('get_user_recommendations', { target_user_id: targetUserId });
        return handleResponse(response);
    },

    /**
     * [span_6](start_span)Fetches a list of mutual connections with another user[span_6](end_span).
     * @param otherUserId - The UUID of the other user.
     */
    getMutualConnections: async (
      otherUserId: string
    ): Promise<ApiResponse<Database['public']['Functions']['get_mutual_connections']['Returns']>> => {
      const response = await supabase
        .rpc("get_mutual_connections", {
          other_user_id: otherUserId,
        });
      return handleResponse(response);
    },
    
    // --- Data Fetching from Helper Views ---

    /**
     * [span_7](start_span)Fetches all incoming pending connection requests for the current user[span_7](end_span).
     */
    getPendingRequests: async (): Promise<
      ApiResponse<Tables<"pending_connection_requests">[]>
    > => {
      const response = await supabase
        .from("pending_connection_requests")
        .select("*");
      return handleResponse(response);
    },

    getSentPendingRequests: async (): Promise<
      ApiResponse<Tables<"sent_pending_requests">[]>
    > => {
      // NOTE: You must generate new types for the 'sent_pending_requests' view
      // For now, we cast to 'any' to avoid typescript errors.
      const response = await supabase.from("sent_pending_requests").select("*");
      return handleResponse(response as any);
    },

    /**
     * [span_8](start_span)Fetches a list of all accepted connections ("friends") for the current user[span_8](end_span).
     */
    getMyConnections: async (): Promise<
      ApiResponse<Tables<"my_connections">[]>
    > => {
      const response = await supabase.from("my_connections").select("*");
      return handleResponse(response);
    },

    /**
     * Fetches the details for a single conversation by its ID.
     * @param conversationId - The ID of the conversation to fetch.
     */
    getConversationById: async (
      conversationId: string
    ): Promise<ApiResponse<Tables<"inbox_conversations">>> => {
      const response = await supabase
        .from("inbox_conversations")
        .select("*")
        .eq("conversation_id", conversationId)
        .single();
      return handleResponse(response);
    },

    /**
     * [span_9](start_span)Fetches a list of all users blocked by the current user[span_9](end_span).
     */
    getBlockedUsers: async (): Promise<
      ApiResponse<Tables<"blocked_members">[]>
    > => {
      const response = await supabase.from("blocked_members").select("*");
      return handleResponse(response);
    },
  },

  //================================================================================
  // System 2: Direct Messaging API
  //================================================================================
  messaging: {
    /**
     * [span_10](start_span)Gets an existing 1-on-1 conversation or creates a new one[span_10](end_span).
     * @param otherUserId - The UUID of the other participant.
     * @returns The conversation_id.
     */
    createOrGetConversation: async (
      otherUserId: string
    ): Promise<ApiResponse<string>> => {
      const response = await supabase
        .rpc("create_or_get_conversation", {
          other_user_id: otherUserId,
        });
      return handleResponse(response);
    },

    /**
     * [span_11](start_span)Marks all unread messages in a conversation as read[span_11](end_span).
     * @param conversationId - The ID of the conversation to mark as read.
     */
    markConversationAsRead: async (
      conversationId: string
    ): Promise<ApiResponse<undefined>> => {
      const response = await supabase
        .rpc("mark_conversation_as_read", {
          p_conversation_id: conversationId,
        });
      return handleResponse(response);
    },

    /**
     * [span_12](start_span)Adds, updates, or removes an emoji reaction on a direct message[span_12](end_span).
     * @param messageId - The ID of the message to react to.
     * @param emoji - The emoji to use for the reaction.
     */
    toggleReaction: async (
      messageId: number,
      emoji: string
    ): Promise<ApiResponse<any>> => {
      const response = await supabase
        .rpc("toggle_reaction_dm", {
          p_message_id: messageId,
          p_emoji: emoji,
        });
      return handleResponse(response);
    },

    /**
     * Sends a new message to a conversation.
     * @param messageData - The data for the new message.
     */
    sendMessage: async (
        messageData: TablesInsert<'direct_messages'>
    ): Promise<ApiResponse<Tables<'direct_messages'>>> => {
        const response = await supabase
            .from('direct_messages')
            .insert(messageData)
            .select()
            .single();
        return handleResponse(response);
    },
    
    /**
     * Edits an existing message. [span_13](start_span)RLS policies ensure a user can only edit their own messages[span_13](end_span).
     * [span_14](start_span)The `on_message_edit` trigger will automatically handle the `updated_at` timestamp[span_14](end_span).
     * @param messageId - The ID of the message to edit.
     * @param newContent - The new text content for the message.
     */
    editMessage: async (
        messageId: number,
        newContent: string
    ): Promise<ApiResponse<Tables<'direct_messages'>>> => {
        const response = await supabase
            .from('direct_messages')
            .update({ content: newContent, is_edited: true })
            .eq('id', messageId)
            .select()
            .single();
        return handleResponse(response);
    },

    /**
     * Deletes a message. [span_15](start_span)RLS policies ensure a user can only delete their own messages[span_15](end_span).
     * @param messageId - The ID of the message to delete.
     */
    deleteMessage: async (
        messageId: number
    ): Promise<ApiResponse<null>> => {
        const response = await supabase
            .from('direct_messages')
            .delete()
            .eq('id', messageId);
        // The delete operation doesn't return the deleted record, so we just check for errors.
        return handleResponse({ data: null, error: response.error });
    },

    /**
     * Uploads a file to Supabase Storage for use as a message attachment.
     * @param file - The file to upload.
     * @param conversationId - Used to create a unique path for the file.
     * @returns The public URL of the uploaded file.
     */
    uploadAttachment: async (
      file: File,
      conversationId: string
    ): Promise<ApiResponse<{ publicUrl: string }>> => {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExtension}`;
      const filePath = `${conversationId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('direct_message_attachments') // Assuming a bucket with this name exists
        .upload(filePath, file);

      if (error) {
        return handleResponse({ data: null, error });
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('direct_message_attachments')
        .getPublicUrl(data.path);

      return handleResponse({ data: { publicUrl: urlData.publicUrl }, error: null });
    },

    /**
     * [span_16](start_span)Adds an attachment record to the database after the file has been uploaded[span_16](end_span).
     * @param attachmentData - The metadata for the attachment.
     */
    addAttachmentToMessage: async (
        attachmentData: TablesInsert<'direct_message_attachments'>
    ): Promise<ApiResponse<Tables<'direct_message_attachments'>>> => {
        const response = await supabase
            .from('direct_message_attachments')
            .insert(attachmentData)
            .select()
            .single();
        return handleResponse(response);
    },

    // --- Data Fetching from Helper Views & Tables ---

    /**
     * Fetches the complete list of conversations for the user's inbox.
     * [span_17](start_span)This view includes participant details, the last message, and unread counts[span_17](end_span).
     */
    getInbox: async (): Promise<
      ApiResponse<Tables<"inbox_conversations">[]>
    > => {
      const response = await supabase
        .from("inbox_conversations")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });
      return handleResponse(response);
    },

    /**
     * Fetches all messages for a specific conversation.
     * @param conversationId - The ID of the conversation.
     */
    getMessagesForConversation: async (
      conversationId: string
    ): Promise<ApiResponse<Tables<"direct_messages">[]>> => {
      const response = await supabase
        .from("direct_messages")
        .select("*, direct_message_attachments(*), direct_message_reactions(*)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return handleResponse(response);
    },
  },
};
