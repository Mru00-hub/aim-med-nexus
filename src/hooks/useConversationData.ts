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
import { decryptMessage } from '@/lib/crypto';

export type MessageWithParent = DirectMessageWithDetails & {
  parent_message_details?: DirectMessageWithDetails | null;
};

export const useConversationData = (conversationId: string | undefined, recipientId: string | undefined) => {
    const { user, profile, encryptionKey} = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<DirectMessageWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<DirectMessageWithDetails | null>(null);

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

    const handleSendMessage = useCallback(async (content: string, parentMessageId: number | null, files: File[]) => {
        if (!user || !profile || !conversationId || !encryptionKey) {
            toast({ variant: 'destructive', title: 'Cannot Send', description: 'Your secure session is not ready.' });
            return;
        }

        if (!recipientId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Recipient not found.' });
            return;
        }
        
        // We need the temporary ID outside the try block for the catch block to access it.
        const tempMsgId = -Date.now();

        try {
            // STEP 1: Check connection status first.
            const isConnected = await canSendMessage(recipientId);
            if (!isConnected) {
                throw new Error("You are no longer connected with this user.");
            }

            // STEP 2: Optimistic UI update.
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
            }));

            const optimisticMessage: DirectMessageWithDetails = {
                id: tempMsgId,
                conversation_id: conversationId,
                sender_id: user.id,
                content,
                parent_message_id: parentMessageId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_edited: false,
                author: {
                    full_name: profile.full_name,
                    profile_picture_url: profile.profile_picture_url,
                },
                reactions: [],
                attachments: optimisticAttachments as any,
            };

            setMessages(current => [...current, optimisticMessage]);

            // STEP 3: Call the real API.
            const realMessage = await postDirectMessage(
              conversationId, 
              content, 
              encryptionKey, // Pass the key for encryption
              parentMessageId
            );
            const decryptedContent = await decryptMessage(realMessage.content, encryptionKey);
            const finalMessage = {
              ...optimisticMessage, // Use the structure of our optimistic message
              ...realMessage,       // Overwrite with real data from DB (like ID, created_at)
              content: decryptedContent, // Use the decrypted content
            };
            
            setMessages(current => current.map(msg => msg.id === tempMsgId ? finalMessage : msg));

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
    }, [user, profile, conversationId, recipientId, toast, encryptionKey]);

    const handleDeleteMessage = useCallback(async (messageId: number) => {
        const previousMessages = messages;
        setMessages(current => current.filter(m => m.id !== messageId));
        try {
            await deleteDirectMessage(messageId);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
            setMessages(previousMessages);
        }
    }, [messages, toast]);
    
    const handleEditMessage = useCallback(async (messageId: number, newContent: string) => {
        const previousMessages = messages;
        setMessages(current => current.map(m => m.id === messageId ? { ...m, content: newContent, is_edited: true } : m));
        try {
            await editDirectMessage(messageId, newContent);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
            setMessages(previousMessages);
        }
    }, [messages, toast]);

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
      // Setup Supabase real-time subscription
      const channel = supabase
        .channel(`direct_messages:${conversationId}`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, 
            (payload) => {
              // If the new message is from the current user, do nothing.
              // The optimistic update has already handled it.
                if (payload.new && payload.new.sender_id === user?.id) {
                return; 
                }
                  // Otherwise, fetch messages because it's a new message from someone else.
                fetchMessages();
            })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_message_reactions' }, () => {
              fetchMessages();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }, [conversationId, fetchMessages, user?.id]);
    
    const decryptedAndFlatMessages = useMemo((): MessageWithParent[] => {
        const [decrypted, setDecrypted] = useState<DirectMessageWithDetails[]>([]);

        useEffect(() => {
            const decryptAll = async () => {
                if (!encryptionKey || messages.length === 0) {
                    setDecrypted(messages); // Show raw (likely blank) if no key
                    return;
                }
                const decryptedList = await Promise.all(
                    messages.map(async msg => {
                        try {
                            const decryptedContent = await decryptMessage(msg.content, encryptionKey);
                            return { ...msg, content: decryptedContent };
                        } catch (e) {
                            return { ...msg, content: "[Unable to decrypt]" };
                        }
                    })
                );
                setDecrypted(decryptedList as DirectMessageWithDetails[]);
            };
            decryptAll();
        }, [messages, encryptionKey]);

        // Now, build the parent details from the DECRYPTED list
        const messageMap = new Map(decrypted.map(m => [m.id, m]));
        return decrypted
            .map(message => ({
                ...message,
                parent_message_details: message.parent_message_id ? messageMap.get(message.parent_message_id) : null,
            }))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [messages, encryptionKey]);

    return { 
        messages: decryptedAndFlatMessages,
        isLoading, 
        replyingTo,
        setReplyingTo,
        handleSendMessage,
        handleDeleteMessage,
        handleEditMessage,
        handleReaction 
    };
};
