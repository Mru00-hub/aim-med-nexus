import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
    canSendMessage, 
    postDirectMessage,
    getDirectMessagesWithDetails,
    deleteDirectMessage,
    editDirectMessage,
    addDirectMessageReaction,
    removeDirectMessageReaction,
    uploadDirectMessageAttachment,
    DirectMessageWithDetails,
    DirectMessageReaction,
    Profile
} from '@/integrations/supabase/social.api';
import { setupConversationEncryption } from '@/integrations/supabase/social.api';
import { decryptMessage } from '@/lib/crypto';

export type MessageWithParent = DirectMessageWithDetails & {
  parent_message_details?: DirectMessageWithDetails | null;
  isOptimistic?: boolean; // This flag will help us identify temporary messages
};

export const useConversationData = (conversationId: string | undefined, recipientId: string | undefined) => {
    const { user, profile, userMasterKey } = useAuth();
    const { toast } = useToast();
    
    // This state holds the raw messages (mostly encrypted) from the database
    const [messages, setMessages] = useState<DirectMessageWithDetails[]>([]);
    // This state holds the final, decrypted messages ready for the UI
    const [displayMessages, setDisplayMessages] = useState<MessageWithParent[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<DirectMessageWithDetails | null>(null);
    const [conversationKey, setConversationKey] = useState<CryptoKey | null>(null);
    const [isInitializingEncryption, setIsInitializingEncryption] = useState(true);

    useEffect(() => {
        const initConversationKey = async () => {
            // We need the conversationId and the user's permanent key
            if (!conversationId || !userMasterKey) {
                setIsInitializingEncryption(false);
                return;
            }

            setIsInitializingEncryption(true);
            try {
                const convKey = await setupConversationEncryption(conversationId, userMasterKey);
                setConversationKey(convKey);
                console.log("✅ Conversation encryption ready");
            } catch (error) {
                console.error("Failed to initialize conversation encryption:", error);
                // ... show toast
            } finally {
                setIsInitializingEncryption(false);
            }
        };

        initConversationKey();
    }, [conversationId, userMasterKey]);

    // --- (This function remains unchanged) ---
    const fetchMessages = useCallback(async () => {
      if (!conversationId) return;
      setIsLoading(true);
      try {
        const data = await getDirectMessagesWithDetails(conversationId);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.' });
      } finally {
        setIsLoading(false);
      }
    }, [conversationId, toast]);

    useEffect(() => {
        const processMessages = async () => {
            if (!conversationKey || !messages || messages.length === 0) {
                setDisplayMessages([]);
                return;
            }

            const decryptedList = await Promise.all(
                messages.map(async (msg) => {
                    try {
                        // Use the SHARED conversation key!
                        const decryptedContent = await decryptMessage(msg.content, conversationKey);
                        return { ...msg, content: decryptedContent };
                    } catch (e) {
                        return { ...msg, content: "[Unable to decrypt]" };
                    }
                })
            );

            const messageMap = new Map(decryptedList.map(m => [m.id, m]));
            const flatList = decryptedList.map(message => ({
                ...message,
                parent_message_details: message.parent_message_id ? messageMap.get(message.parent_message_id) : undefined,
            }));
            
            const sortedList = flatList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setDisplayMessages(sortedList as MessageWithParent[]);
        };
        processMessages();
    }, [messages, conversationKey]); 
    
    const handleSendMessage = useCallback(async (content: string, parentMessageId: number | null, files: File[]) => {
        if (!user || !profile || !conversationId || !conversationKey) return;

        const tempMsgId = -Date.now();
        try {
            if (!await canSendMessage(recipientId!)) throw new Error("You are no longer connected.");

            // STEP 2: Optimistic UI update.
            const optimisticMessage: MessageWithParent = {
                id: tempMsgId,
                conversation_id: conversationId,
                sender_id: user.id,
                content: content,
                isOptimistic: true, // Mark as temporary plaintext
                parent_message_id: parentMessageId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_edited: false,
                author: { full_name: profile.full_name, profile_picture_url: profile.profile_picture_url },
                reactions: [],
                attachments: files.map((file, index) => ({
                    id: `temp_att_${Date.now()}_${index}`,
                    message_id: -1, file_name: file.name, file_type: file.type, file_url: URL.createObjectURL(file), file_size_bytes: file.size, created_at: new Date().toISOString(), uploaded_by: user.id, isUploading: true,
                })) as any,
            };

            setMessages(current => [...current, optimisticMessage as DirectMessageWithDetails]);

            // STEP 3: Call the real API.
            const realMessage = await postDirectMessage(
              conversationId, 
              content, 
              conversationKey, // Pass the key for encryption
              parentMessageId
            );
            
            setMessages(current => current.map(msg => msg.id === tempMsgId ? realMessage : msg));

            // STEP 4: Handle Attachments.
            if (files.length > 0) {
                await Promise.all(files.map(async (file, index) => {
                    try {
                        const realAttachment = await uploadDirectMessageAttachment(realMessage.id, file);
                        setMessages(current => current.map(msg =>
                            msg.id === realMessage.id ? { ...msg, attachments: msg.attachments.map(att => att.id === optimisticAttachments[index].id ? { ...realAttachment, isUploading: false } : att) } : msg
                        ));
                    } catch (uploadError) {
                        console.error(`Upload failed for ${file.name}:`, uploadError);
                        setMessages(current => current.map(msg =>
                            msg.id === realMessage.id ? { ...msg, attachments: msg.attachments.map(att => att.id === optimisticAttachments[index].id ? { ...att, isUploading: false, file_url: 'upload-failed' } : att) } : msg
                        ));
                    }
                }));
            }
        } catch (error: any) {
            // This single catch block will handle any failure from any step.
            toast({ variant: 'destructive', title: 'Failed to Send', description: error.message });
            // Revert the optimistic message on failure.
            setMessages(current => current.filter(m => m.id !== tempMsgId));
            // We can re-throw the error if a parent component needs to know about it.
            // throw error; 
        }
    }, [user, profile, conversationId, recipientId, toast, conversationKey]);

    const handleDeleteMessage = useCallback(async (messageId: number) => {
        const previousMessages = messages;
        setMessages(current => current.filter(m => m.id !== messageId));
        try { await deleteDirectMessage(messageId); } 
        catch (error: any) { setMessages(previousMessages);
            toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
        }
    }, [messages, toast]);
    
    const handleEditMessage = useCallback(async (messageId: number, newContent: string) => {
        if (!conversationKey) return;

        const originalMessage = messages.find(m => m.id === messageId);
        if (!originalMessage) return;

        // Create an optimistic version of the edited message
        const optimisticEditedMessage: MessageWithParent = {
            ...originalMessage,
            content: newContent, // Use the new plaintext content
            is_edited: true,
            isOptimistic: true, // 👈 THE CRITICAL FIX: Mark this as a temporary plaintext version
        };

        // Optimistically update the UI
        setMessages(current => current.map(m => m.id === messageId ? optimisticEditedMessage as DirectMessageWithDetails : m));

        try {
            // Call the API which encrypts and saves the new content
            const realEditedMessage = await editDirectMessage(messageId, newContent, conversationKey);
            // Replace the optimistic version with the real, encrypted version from the server
            setMessages(current => current.map(m => m.id === messageId ? realEditedMessage : m));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
            // Revert to the original message on failure
            setMessages(current => current.map(m => m.id === messageId ? originalMessage : m));
        }
    }, [messages, toast, conversationKey]);

    const handleReaction = useCallback(async (messageId: number, emoji: string) => {
        if (!user) return;
        const previousMessages = messages;
        const targetMessage = messages.find(m => m.id === messageId);
        if (!targetMessage) return;

        const existingReaction = targetMessage.reactions.find(r => r.user_id === user.id && r.reaction_emoji === emoji);

        // Optimistic UI update
        setMessages(current => current.map(msg => {
            if (msg.id === messageId) {
                let newReactions = [...msg.reactions];
                if (existingReaction) {
                    newReactions = newReactions.filter(r => r.id !== existingReaction.id);
                } else {
                    const newOptimisticReaction: DirectMessageReaction = { id: -Date.now(), message_id: messageId, user_id: user.id, reaction_emoji: emoji, created_at: new Date().toISOString() };
                    newReactions.push(newOptimisticReaction);
                }
                return { ...msg, reactions: newReactions };
            }
            return msg;
        }));

        // API call
        try {
            if (existingReaction) {
                await removeDirectMessageReaction(messageId, emoji);
            } else {
                await addDirectMessageReaction(messageId, emoji);
            }
            // Optional: Resync messages to get real reaction IDs
            fetchMessages();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Reaction Failed', description: error.message });
            setMessages(previousMessages);
        }
    }, [messages, user, toast, fetchMessages]);
    
    useEffect(() => {
        fetchMessages();
        const channel = supabase.channel(`direct_messages:${conversationId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
              if (payload.new && payload.new.sender_id === user?.id) return;
              fetchMessages();
          }).subscribe();
        return () => { supabase.removeChannel(channel) };
    }, [conversationId, fetchMessages, user?.id]);

    return { 
        messages: displayMessages,
        isLoading, 
        replyingTo,
        setReplyingTo,
        handleSendMessage,
        handleDeleteMessage,
        handleEditMessage,
        handleReaction 
    };
};
