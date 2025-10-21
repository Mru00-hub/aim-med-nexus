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
    addDirectMessageReaction, // Or upsertDirectMessageReaction
    removeDirectMessageReaction,
    uploadDirectMessageAttachment,
    DirectMessageWithDetails,
    DirectMessageReaction,
    Profile,
    setupConversationEncryption,
} from '@/integrations/supabase/social.api';
import { decryptMessage } from '@/lib/crypto';

export type MessageWithParent = DirectMessageWithDetails & {
  parent_message_details?: DirectMessageWithDetails | null;
  isOptimistic?: boolean;
};

export const useConversationData = (conversationId: string | undefined, recipientId: string | undefined) => {
    const { user, profile, userMasterKey } = useAuth();
    const { toast } = useToast();
    
    const [messages, setMessages] = useState<MessageWithParent[]>([]);
    const [displayMessages, setDisplayMessages] = useState<MessageWithParent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<MessageWithParent | null>(null);
    const [conversationKey, setConversationKey] = useState<CryptoKey | null>(null);
    const [isInitializingEncryption, setIsInitializingEncryption] = useState(true);

    // ✅ FIX 2: fetchMessages is now stable and takes 'id' as an argument.
    // This prevents stale closures and race conditions.
    const fetchMessages = useCallback(async (id: string) => {
      setIsLoading(true);
      try {
        const data = await getDirectMessagesWithDetails(id);
        setMessages(data as MessageWithParent[]);
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.' });
      } finally {
        setIsLoading(false);
      }
    }, [toast]); // Now only depends on 'toast' (which is stable)


    // This is the combined "master" effect.
    useEffect(() => {
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
                // 1. Get the new encryption key FIRST
                const convKey = await setupConversationEncryption(conversationId, userMasterKey);
                setConversationKey(convKey);
                console.log("✅ Conversation encryption ready");

                // 2. Fetch messages using the correct conversationId
                // ✅ FIX 3: Pass conversationId to the stable fetchMessages function.
                await fetchMessages(conversationId);

                // 3. Subscribe to the channel
                channel = supabase.channel(`direct_messages:${conversationId}`)
                  .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
                      if (payload.new && payload.new.sender_id === user?.id) return;
                      // ✅ FIX 4: Pass conversationId here too.
                      fetchMessages(conversationId);
                  }).subscribe();
                
            } catch (error: any) {
                console.error("Failed to initialize conversation encryption:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load this conversation.' });
            } finally {
                setIsInitializingEncryption(false);
            }
        };

        initConversation();

        // 5. Cleanup function
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    // ✅ FIX 5: 'fetchMessages' is now a stable dependency.
    }, [conversationId, userMasterKey, fetchMessages, user?.id, toast]);


    // This decryption hook is correct and unchanged.
    useEffect(() => {
        const processMessages = async () => {
            if (!conversationKey || !messages || messages.length === 0) {
                setDisplayMessages([]);
                return;
            }

            const decryptedList = await Promise.all(
                messages.map(async (msg) => {
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
            setDisplayMessages(sortedList);
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

            setMessages(current => [...current, optimisticMessage]);

            const realMessage = await postDirectMessage(
              conversationId, 
              content, 
              conversationKey,
              parentMessageId
            );
            
            setMessages(current => current.map(msg => 
                msg.id === tempMsgId 
                ? { ...optimisticMessage, ...realMessage, id: realMessage.id, created_at: realMessage.created_at, isOptimistic: false } 
                : msg
            ));
            
            // ✅ FIX 1: RESTORED THE ATTACHMENT LOGIC
            if (files.length > 0) {
                const uploadedAttachments = await Promise.all(files.map(async (file, index) => {
                    try {
                        const realAttachment = await uploadDirectMessageAttachment(realMessage.id, file, conversationKey);
                        return { 
                            tempId: optimisticAttachments[index].id, 
                            realAttachment: { ...realAttachment, isUploading: false } 
                        };
                    } catch (uploadError) {
                        console.error(`Upload failed for ${file.name}:`, uploadError);
                        return { 
                            tempId: optimisticAttachments[index].id, 
                            realAttachment: { ...optimisticAttachments[index], isUploading: false, file_url: 'upload-failed' } 
                        };
                    }
                }));

                setMessages(current => current.map(msg => {
                    if (msg.id === realMessage.id) {
                        const attachmentMap = new Map(uploadedAttachments.map(ua => [ua.tempId, ua.realAttachment]));
                        const newAttachments = msg.attachments.map(att => attachmentMap.get(att.id) || att);
                        return { ...msg, attachments: newAttachments };
                    }
                    return msg;
                }));
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
