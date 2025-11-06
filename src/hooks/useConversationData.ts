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
    const [encryptionError, setEncryptionError] = useState(false);

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
    }, [toast]);

    // Main initialization effect
    useEffect(() => {
        // Reset state when conversation changes
        setConversationKey(null);
        setMessages([]);
        setDisplayMessages([]);
        setIsInitializingEncryption(true);
        setIsLoading(true);
        setEncryptionError(false); 

        // Early return if prerequisites aren't met
        if (!conversationId) {
            console.log('⏸️ No conversationId provided');
            setIsInitializingEncryption(false);
            setIsLoading(false);
            return;
        }

        if (!userMasterKey) {
            console.log('⏸️ User master key not available yet');
            setIsInitializingEncryption(false);
            setIsLoading(false);
            return;
        }

        console.log('🔐 Initializing conversation:', conversationId);

        let channel: any;
        
        const initConversation = async () => {
            try {
                console.log('⚙️ Setting up conversation encryption...');
                const convKey = await setupConversationEncryption(conversationId, userMasterKey);
                
                if (!convKey) {
                    throw new Error('Failed to get conversation key');
                }
                
                setConversationKey(convKey);
                console.log('✅ Conversation encryption ready');

                console.log('⚙️ Fetching messages...');
                await fetchMessages(conversationId);
                console.log('✅ Messages fetched');

                console.log('⚙️ Setting up realtime subscription...');
                channel = supabase.channel(`direct_messages:${conversationId}`)
                  .on('postgres_changes', { 
                      event: '*', 
                      schema: 'public', 
                      table: 'direct_messages', 
                      filter: `conversation_id=eq.${conversationId}` 
                  }, (payload) => {
                      // Skip if this is our own message (optimistic updates handle it)
                      if (payload.new && payload.new.sender_id === user?.id) {
                          console.log('📤 Skipping own message from subscription');
                          return;
                      }
                      console.log('📨 New message from subscription, refetching...');
                      fetchMessages(conversationId);
                  })
                  .subscribe((status) => {
                      console.log('📡 Subscription status:', status);
                  });
                
                console.log('✅ Realtime subscription active');
                
            } catch (error: any) {
                console.error('❌ Failed to initialize conversation encryption:', error);
                toast({ 
                    variant: 'destructive', 
                    title: 'Encryption Error', 
                    description: 'Could not decrypt this conversation. It was likely secured with an old password.'
                });
                setEncryptionError(true); // Tell the UI it failed
                setIsLoading(false)
            } finally {
                setIsInitializingEncryption(false);
            }
        };

        initConversation();

        return () => {
            if (channel) {
                console.log('🧹 Cleaning up subscription');
                supabase.removeChannel(channel);
            }
        };
    }, [conversationId, userMasterKey, fetchMessages, user?.id, toast]);

    // Decryption effect
    useEffect(() => {
        const processMessages = async () => {
            if (!conversationKey) {
                console.log('⏸️ No conversation key, skipping decryption');
                setDisplayMessages([]);
                return;
            }

            if (!messages || messages.length === 0) {
                console.log('⏸️ No messages to decrypt');
                setDisplayMessages([]);
                return;
            }

            console.log(`🔓 Decrypting ${messages.length} messages...`);

            const decryptedList = await Promise.all(
                messages.map(async (msg) => {
                    // Skip decryption for optimistic messages (they're already plaintext)
                    if (msg.isOptimistic) {
                        return msg;
                    }
                    
                    try {
                        const decryptedContent = await decryptMessage(msg.content, conversationKey);
                        return { ...msg, content: decryptedContent };
                    } catch (e: any) {
                        console.error(`❌ Failed to decrypt message ID ${msg.id}:`, e.message);
                        return { ...msg, content: "[Unable to decrypt message]" };
                    }
                })
            );

            // Build parent message references
            const messageMap = new Map(decryptedList.map(m => [m.id, m]));
            const flatList = decryptedList.map(message => ({
                ...message,
                parent_message_details: message.parent_message_id 
                    ? messageMap.get(message.parent_message_id) 
                    : undefined,
            }));
            
            // Sort by creation time
            const sortedList = flatList.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            setDisplayMessages(sortedList);
            console.log(`✅ ${sortedList.length} messages decrypted and ready`);
        };
        
        processMessages();
    }, [messages, conversationKey]); 
    
    const handleSendMessage = useCallback(async (content: string, parentMessageId: number | null, files: File[]) => {
        if (!user || !profile || !conversationId || !conversationKey) {
            console.error('❌ Cannot send message: missing required data');
            toast({ 
                variant: 'destructive', 
                title: 'Cannot Send', 
                description: 'Required data is missing. Please refresh and try again.' 
            });
            return;
        }

        const tempMsgId = -Date.now();
        const optimisticAttachments = files.map((file, index) => ({
            id: `temp_att_${Date.now()}_${index}`,
            message_id: -1, 
            file_name: file.name, 
            file_type: file.type, 
            file_url: URL.createObjectURL(file), 
            file_size_bytes: file.size, 
            created_at: new Date().toISOString(), 
            uploaded_by: user.id, 
            isUploading: true,
        })) as any;
        
        try {
            if (!await canSendMessage(recipientId!)) {
                throw new Error("You are no longer connected.");
            }

            // Create optimistic message
            const optimisticMessage: MessageWithParent = {
                id: tempMsgId,
                conversation_id: conversationId,
                sender_id: user.id,
                content: content, // Already plaintext for optimistic display
                isOptimistic: true,
                parent_message_id: parentMessageId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_edited: false,
                author: { 
                    full_name: profile.full_name, 
                    profile_picture_url: profile.profile_picture_url 
                },
                reactions: [],
                attachments: optimisticAttachments,
            };

            setMessages(current => [...current, optimisticMessage]);
            console.log('📤 Optimistic message added');

            // Send the real message (encrypted)
            const realMessage = await postDirectMessage(
              conversationId, 
              content, 
              conversationKey,
              parentMessageId
            );
            
            console.log('✅ Real message sent, ID:', realMessage.id);

            // Replace optimistic message with real one
            setMessages(current => current.map(msg => 
                msg.id === tempMsgId 
                ? { 
                    ...optimisticMessage, 
                    ...realMessage, 
                    id: realMessage.id, 
                    created_at: realMessage.created_at, 
                    isOptimistic: false 
                } 
                : msg
            ));
            
            // Handle file uploads
            if (files.length > 0) {
                console.log(`📎 Uploading ${files.length} attachments...`);
                
                const uploadedAttachments = await Promise.all(files.map(async (file, index) => {
                    try {
                        const realAttachment = await uploadDirectMessageAttachment(
                            realMessage.id, 
                            file, 
                            conversationKey
                        );
                        console.log(`✅ Uploaded: ${file.name}`);
                        return { 
                            tempId: optimisticAttachments[index].id, 
                            realAttachment: { ...realAttachment, isUploading: false } 
                        };
                    } catch (uploadError) {
                        console.error(`❌ Upload failed for ${file.name}:`, uploadError);
                        return { 
                            tempId: optimisticAttachments[index].id, 
                            realAttachment: { 
                                ...optimisticAttachments[index], 
                                isUploading: false, 
                                file_url: 'upload-failed' 
                            } 
                        };
                    }
                }));

                // Update message with real attachment data
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
            console.error('❌ Send message failed:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Failed to Send', 
                description: error.message 
            });
            setMessages(current => current.filter(m => m.id !== tempMsgId));
        }
    }, [user, profile, conversationId, recipientId, toast, conversationKey]);

    const handleDeleteMessage = useCallback(async (messageId: number) => {
        const previousMessages = messages;
        setMessages(current => current.filter(m => m.id !== messageId));
        
        try { 
            await deleteDirectMessage(messageId);
            console.log('✅ Message deleted:', messageId);
        } catch (error: any) { 
            console.error('❌ Delete failed:', error);
            setMessages(previousMessages);
            toast({ 
                variant: 'destructive', 
                title: 'Delete Failed', 
                description: error.message 
            });
        }
    }, [messages, toast]);
    
    const handleEditMessage = useCallback(async (messageId: number, newContent: string) => {
        if (!conversationKey) {
            console.error('❌ Cannot edit: no conversation key');
            return;
        }

        const originalMessage = messages.find(m => m.id === messageId);
        if (!originalMessage) return;

        const optimisticEditedMessage: MessageWithParent = {
            ...originalMessage,
            content: newContent,
            is_edited: true,
            isOptimistic: true,
        };

        setMessages(current => current.map(m => m.id === messageId ? optimisticEditedMessage : m));
        console.log('✏️ Optimistic edit applied');

        try {
            const realEditedMessage = await editDirectMessage(messageId, newContent, conversationKey);
            console.log('✅ Message edited:', messageId);
            
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
            console.error('❌ Edit failed:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Edit Failed', 
                description: error.message 
            });
            setMessages(current => current.map(m => m.id === messageId ? originalMessage : m));
        }
    }, [messages, toast, conversationKey]);

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
                    existingReaction = msg.reactions.find(
                        r => r.user_id === user.id && r.reaction_emoji === emoji
                    );
                    
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
                console.log('✅ Reaction added:', emoji);
            } else {
                await removeDirectMessageReaction(messageId, emoji);
                console.log('✅ Reaction removed:', emoji);
            }
        } catch (error: any) {
            console.error('❌ Reaction failed:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Reaction Failed', 
                description: error.message 
            });
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
        isInitializingEncryption,
        encryptionError,
        replyingTo,
        setReplyingTo,
        handleSendMessage,
        handleDeleteMessage,
        handleEditMessage,
        handleReaction 
    };
};
