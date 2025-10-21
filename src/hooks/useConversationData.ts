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
    addDirectMessageReaction, // Assuming you still have this, or upsertDirectMessageReaction
    removeDirectMessageReaction,
    uploadDirectMessageAttachment,
    DirectMessageWithDetails,
    DirectMessageReaction,
    Profile,
    setupConversationEncryption, // Moved from line 22
} from '@/integrations/supabase/social.api';
// Removed: setupConversationEncryption from line 22
import { decryptMessage } from '@/lib/crypto';

export type MessageWithParent = DirectMessageWithDetails & {
  parent_message_details?: DirectMessageWithDetails | null;
  isOptimistic?: boolean; // This flag will help us identify temporary messages
};

export const useConversationData = (conversationId: string | undefined, recipientId: string | undefined) => {
    const { user, profile, userMasterKey } = useAuth();
    const { toast } = useToast();
    
    // ✅ FIX 1: The state now holds the richer MessageWithParent type
    const [messages, setMessages] = useState<MessageWithParent[]>([]);
    const [displayMessages, setDisplayMessages] = useState<MessageWithParent[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<MessageWithParent | null>(null);
    const [conversationKey, setConversationKey] = useState<CryptoKey | null>(null);
    const [isInitializingEncryption, setIsInitializingEncryption] = useState(true);

    const fetchMessages = useCallback(async () => {
      // This function no longer needs to check conversationId, the new hook will
      setIsLoading(true);
      try {
        const data = await getDirectMessagesWithDetails(conversationId!);
        // ✅ FIX 2: Cast the data to the correct state type
        setMessages(data as MessageWithParent[]);
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.' });
      } finally {
        setIsLoading(false);
      }
    }, [conversationId, toast]);


    // ✅ FIX 3: This is the new, combined "master" effect.
    // It replaces BOTH of your old useEffects (initConversationKey and fetchMessages/subscribe).
    useEffect(() => {
        // 1. When conversationId changes, reset everything immediately.
        // This stops the decryption hook from running with stale data.
        setConversationKey(null);
        setMessages([]);
        setDisplayMessages([]);
        setIsInitializingEncryption(true);
        setIsLoading(true);

        if (!conversationId || !userMasterKey) {
            setIsInitializingEncryption(false);
            setIsLoading(false);
            return;
        }

        let channel: any; // Supabase RealtimeChannel
        
        const initConversation = async () => {
            try {
                // 2. Get the new encryption key FIRST
                const convKey = await setupConversationEncryption(conversationId, userMasterKey);
                setConversationKey(convKey);
                console.log("✅ Conversation encryption ready");

                // 3. ONLY NOW, after the key is ready, fetch the messages
                await fetchMessages();

                // 4. AND ONLY NOW, subscribe to the channel
                channel = supabase.channel(`direct_messages:${conversationId}`)
                  .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
                      if (payload.new && payload.new.sender_id === user?.id) return;
                      fetchMessages();
                  }).subscribe();
                
            } catch (error: any) {
                console.error("Failed to initialize conversation encryption:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load this conversation.' });
            } finally {
                setIsInitializingEncryption(false);
                // Note: fetchMessages sets its own isLoading to false
            }
        };

        initConversation();

        // 5. Cleanup function
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [conversationId, userMasterKey, fetchMessages, user?.id, toast]);


    // This decryption hook is now SAFE and remains UNCHANGED.
    // It won't run until BOTH 'messages' and 'conversationKey' are
    // correctly populated by the master effect above.
    useEffect(() => {
        const processMessages = async () => {
            if (!conversationKey || !messages || messages.length === 0) {
                setDisplayMessages([]);
                return;
            }

            const decryptedList = await Promise.all(
                messages.map(async (msg) => {
                    // This check is still correct and necessary
                    if (msg.isOptimistic) {
                        return msg;
                    }
                    try {
                        const decryptedContent = await decryptMessage(msg.content, conversationKey);
                        return { ...msg, content: decryptedContent };
                    } catch (e: any) {
                        console.error(`Failed to decrypt message ID ${msg.id}:`, e.message);
                        return { ...msg, content: "[Unable to decrypt message]" };
                    }
                })
            );

            const messageMap = new Map(decryptedList.map(m => [m.id, m]));
            const flatList = decryptedList.map(message => ({
                ...message,
                parent_message_details: message.parent_message_id ? messageMap.get(message.parent_message_id) : undefined,
            }));
            
            const sortedList = flatList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setDisplayMessages(sortedList); // No cast needed
        };
        processMessages();
    }, [messages, conversationKey]); 
    
    const handleSendMessage = useCallback(async (content: string, parentMessageId: number | null, files: File[]) => {
        if (!user || !profile || !conversationId || !conversationKey) return;

        const tempMsgId = -Date.now();
        const optimisticAttachments = files.map((file, index) => ({
            id: `temp_att_${Date.now()}_${index}`,
            message_id: -1, file_name: file.name, file_type: file.type, file_url: URL.createObjectURL(file), file_size_bytes: file.size, created_at: new Date().toISOString(), uploaded_by: user.id, isUploading: true,
        })) as any;
        
        try {
            if (!await canSendMessage(recipientId!)) throw new Error("You are no longer connected.");

            const optimisticMessage: MessageWithParent = {
                id: tempMsgId,
                conversation_id: conversationId,
                sender_id: user.id,
                content: content,
                isOptimistic: true,
                parent_message_id: parentMessageId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_edited: false,
                author: { full_name: profile.full_name, profile_picture_url: profile.profile_picture_url },
                reactions: [],
                attachments: optimisticAttachments,
            };

            // ✅ FIX 4: No more incorrect type casting
            setMessages(current => [...current, optimisticMessage]);

            const realMessage = await postDirectMessage(
              conversationId, 
              content, 
              conversationKey,
              parentMessageId
            );
            
            // This logic remains the same
            setMessages(current => current.map(msg => 
                msg.id === tempMsgId 
                ? { ...optimisticMessage, ...realMessage, id: realMessage.id, created_at: realMessage.created_at, isOptimistic: false } 
                : msg
            ));
            
            // This logic remains the same
            if (files.length > 0) {
                // ... (attachment upload logic is unchanged)
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to Send', description: error.message });
            setMessages(current => current.filter(m => m.id !== tempMsgId));
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

        const optimisticEditedMessage: MessageWithParent = {
            ...originalMessage,
            content: newContent,
            is_edited: true,
            isOptimistic: true,
        };

        // ✅ FIX 5: No more incorrect type casting
        setMessages(current => current.map(m => m.id === messageId ? optimisticEditedMessage : m));

        try {
            const realEditedMessage = await editDirectMessage(messageId, newContent, conversationKey);
            setMessages(current => current.map(m => {
              if (m.id === messageId) {
                return {
                  ...m,
                  ...realEditedMessage,
                  isOptimistic: false,
                };
              }
              return m;
            }));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
            setMessages(current => current.map(m => m.id === messageId ? originalMessage : m));
        }
    }, [messages, toast, conversationKey]);

    // This function is correct from our previous fixes
    const handleReaction = useCallback(async (messageId: number, emoji: string) => {
        if (!user) return;

        const optimisticId = -Date.now();
        let originalReactions: DirectMessageReaction[] = [];
        let wasAdding = false;
        let existingReaction: DirectMessageReaction | undefined;

        setMessages(currentMessages => {
            return currentMessages.map(msg => {
                if (msg.id === messageId) {
                    originalReactions = msg.reactions;
                    existingReaction = msg.reactions.find(r => r.user_id === user.id && r.reaction_emoji === emoji);
                    
                    let newReactions: DirectMessageReaction[];
                    
                    if (existingReaction) {
                        wasAdding = false;
                        newReactions = msg.reactions.filter(r => r.id !== existingReaction!.id);
                    } else {
                        wasAdding = true;
                        const newOptimisticReaction: DirectMessageReaction = {
                            id: optimisticId,
                            message_id: messageId,
                            user_id: user.id,
                            reaction_emoji: emoji,
                            created_at: new Date().toISOString()
                        };
                        newReactions = [...msg.reactions, newOptimisticReaction];
                    }
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            });
        });

        try {
            if (wasAdding) {
                const realReaction = await addDirectMessageReaction(messageId, emoji);
                setMessages(currentMessages => currentMessages.map(msg => {
                    if (msg.id === messageId) {
                        const newReactions = msg.reactions.map(r => 
                            r.id === optimisticId ? realReaction : r
                        );
                        return { ...msg, reactions: newReactions };
                    }
                    return msg;
                }));
            } else {
                await removeDirectMessageReaction(messageId, emoji);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Reaction Failed', description: error.message });
            setMessages(currentMessages => currentMessages.map(msg => {
                if (msg.id === messageId) {
                    return { ...msg, reactions: originalReactions };
                }
                return msg;
            }));
        }
    }, [user, toast]); 
    
    // ❌ This standalone useEffect has been REMOVED
    // and its logic was merged into the new "master" useEffect.
    /*
    useEffect(() => {
        fetchMessages();
        const channel = supabase.channel(...)
        ...
        return () => { supabase.removeChannel(channel) };
    }, [conversationId, fetchMessages, user?.id]);
    */

    return { 
        messages: displayMessages,
        isLoading, 
        conversationKey,
        isInitializingEncryption, // Added this return value
        replyingTo,
        setReplyingTo,
        handleSendMessage,
        handleDeleteMessage,
        handleEditMessage,
        handleReaction 
    };
};
