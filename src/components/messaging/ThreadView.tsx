import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  postMessage, 
  getMessagesWithDetails,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  MessageWithDetails,
  MessageReaction,
  uploadAttachment,
} from '@/integrations/supabase/community.api'; 

import { Message } from './Message'; 
import { MessageInput } from './MessageInput'; 

// NEW: Define the structure for a message in our flat list
type FlatMessage = MessageWithDetails & {
    // This will contain the details of the message being replied to
    replyTo?: {
        author: string;
        body: string;
    } | null;
};

interface ThreadViewProps {
  threadId: string;
}

// ======================================================================
// CENTRALIZED HOOK: Handles all Data, Real-Time, and Logic
// ======================================================================
const useThreadData = (threadId: string, currentUserId: string | undefined, profile: Profile | null) => {
    const { toast } = useToast();
    const [messages, setMessages] = useState<MessageWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<MessageWithDetails | null>(null);
    
    const fetchAndSyncMessages = useCallback(async () => {
      if (!threadId) return;
      setIsLoading(true);
      try {
        const data = await getMessagesWithDetails(threadId);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.' });
      } finally {
        setIsLoading(false);
      }
    }, [threadId, toast]);

    const handleSendMessage = useCallback(async (body: string, parentMessageId: number | null = null) => {
    const handleSendMessage = useCallback(async (body: string, parentMessageId: number | null, files: File[]) => {
        if (!currentUserId || !profile) {
            throw new Error('User is not authenticated or profile is not available.');
        }

        // Step 1: Create a temporary ID and optimistic version of the message.
        const tempMsgId = `temp_${Date.now()}`;
        const optimisticAttachments = files.map((file, index) => ({
            id: `temp_att_${Date.now()}_${index}`,
            message_id: -1,
            file_name: file.name,
            file_type: file.type,
            file_url: URL.createObjectURL(file), // Local URL for instant preview
            file_size_bytes: file.size,
            created_at: new Date().toISOString(),
            uploaded_by: currentUserId,
            isUploading: true, // Custom flag for the UI
        }));

        const optimisticMessage: MessageWithDetails = {
            id: tempMsgId as any,
            thread_id: threadId,
            user_id: currentUserId,
            body,
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
            parent_message: parentMessageId ? messages.find(m => m.id === parentMessageId) : null,
        };

        // Step 2: Immediately update the UI with the optimistic message.
        setMessages(current => [...current, optimisticMessage]);

        try {
            // Step 3A: Post the text part of the message to get a real message ID.
            const realMessage = await postMessage(threadId, body, parentMessageId);

            // Step 3B: Upload attachments now that we have a real message ID.
            if (files.length > 0) {
                await Promise.all(
                    files.map(async (file, index) => {
                        try {
                            const realAttachment = await uploadAttachment(realMessage.id, file);
                            // Update the specific attachment in state from "uploading" to "complete"
                            setMessages(current => current.map(msg => 
                                msg.id === tempMsgId ? {
                                    ...msg,
                                    attachments: msg.attachments.map(att => 
                                        att.id === optimisticAttachments[index].id 
                                        ? { ...realAttachment, isUploading: false } 
                                        : att
                                    )
                                } : msg
                            ));
                        } catch (uploadError) {
                            console.error(`Upload failed for ${file.name}:`, uploadError);
                            // Update the specific attachment to show an error state
                            setMessages(current => current.map(msg => 
                                msg.id === tempMsgId ? {
                                    ...msg,
                                    attachments: msg.attachments.map(att => 
                                        att.id === optimisticAttachments[index].id 
                                        ? { ...att, isUploading: false, file_url: 'upload-failed' } 
                                        : att
                                    )
                                } : msg
                            ));
                        }
                    })
                );
            }

            // Step 4: Finalize the message state by replacing the temp ID with the real one.
            setMessages(current => current.map(msg => 
                msg.id === tempMsgId ? { ...optimisticMessage, ...realMessage, id: realMessage.id } : msg
            ));
        } catch (error: any) {
            // Step 5: On critical failure (e.g., text message fails), remove the optimistic message.
            toast({ variant: 'destructive', title: 'Failed to Send Message', description: error.message });
            setMessages(current => current.filter(m => m.id !== tempMsgId));
            throw error;
        }
    }, [currentUserId, threadId, profile, messages, toast]);

    const handleDeleteMessage = useCallback(async (messageId: number) => {
        const previousMessages = messages;
        setMessages(currentMessages => currentMessages.filter(m => m.id !== messageId));
        try {
            await deleteMessage(messageId);
            toast({ title: 'Deleted', description: 'Message removed successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
            setMessages(previousMessages); // Revert UI on failure
        }
    }, [messages, toast]);

    const handleEditMessage = useCallback(async (messageId: number, newBody: string) => {
        const previousMessages = messages;
        setMessages(current => current.map(m => m.id === messageId ? { ...m, body: newBody, is_edited: true } : m));
        try {
            await editMessage(messageId, newBody);
            toast({ title: 'Updated', description: 'Message edited successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Edit Failed', description: error.message });
            setMessages(previousMessages);
        }
    }, [messages, toast]);

    const handleReaction = useCallback(async (messageId: number, emoji: string) => {
        if (!currentUserId) return;

        const previousMessages = messages;
        const targetMessage = previousMessages.find(m => m.id === messageId);
        if (!targetMessage) return;

        const existingReaction = targetMessage.reactions.find(r => r.user_id === currentUserId);

        // Optimistically update the UI
        setMessages(current => current.map(msg => {
            if (msg.id === messageId) {
                let newReactions = [...msg.reactions];
                if (existingReaction) {
                    // User has an existing reaction, remove it first
                    newReactions = newReactions.filter(r => r.user_id !== currentUserId);
                    if (existingReaction.reaction_emoji !== emoji) {
                        // If the new emoji is different, add it
                        const newOptimisticReaction: MessageReaction = { id: `temp-${Date.now()}`, message_id: messageId, user_id: currentUserId, reaction_emoji: emoji, created_at: new Date().toISOString() };
                        newReactions.push(newOptimisticReaction);
                    }
                } else {
                    // User has no reaction, just add the new one
                    const newOptimisticReaction: MessageReaction = { id: `temp-${Date.now()}`, message_id: messageId, user_id: currentUserId, reaction_emoji: emoji, created_at: new Date().toISOString() };
                    newReactions.push(newOptimisticReaction);
                }
                return { ...msg, reactions: newReactions };
            }
            return msg;
        }));

        // Make the real API call(s) in the background
        try {
            if (existingReaction) {
                await removeReaction(messageId, existingReaction.reaction_emoji);
                if (existingReaction.reaction_emoji !== emoji) {
                    await addReaction(messageId, emoji);
                }
            } else {
                await addReaction(messageId, emoji);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Reaction Failed', description: error.message });
            setMessages(previousMessages); // Revert UI on failure
        }
    }, [messages, currentUserId, toast]);;
  
    useEffect(() => { fetchAndSyncMessages(); }, [fetchAndSyncMessages]);

    useEffect(() => {
        if (!threadId) return;
        const handleRealtimeEvent = (payload: any) => {
            console.log('Realtime event received, refetching messages:', payload);
            fetchAndSyncMessages(); 
        };
        const channel = supabase.channel(`thread_chat_${threadId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, handleRealtimeEvent)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, handleRealtimeEvent)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [threadId, fetchAndSyncMessages]);
    
    const flatMessages = useMemo(() => {
        const messageMap = new Map(messages.map(m => [m.id, m]));
        return messages
            .map(message => ({
                ...message,
                // If this is a reply, find the parent and attach it.
                parent_message: message.parent_message_id ? messageMap.get(message.parent_message_id) : null,
            }))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [messages]);

    return { 
        flatMessages, 
        isLoading, 
        setMessages,
        refetchMessages: fetchAndSyncMessages,
        replyingTo,
        setReplyingTo,
        handleSendMessage,
        handleDeleteMessage,
        handleReaction 
    };
};
// ======================================================================
// THREAD VIEW COMPONENT (Renderer)
// ======================================================================
export const ThreadView: React.FC<ThreadViewProps> = ({ threadId }) => {
  const { user, profile } = useAuth(); 
  const { toast } = useToast();
  
  const { 
    flatMessages, 
    setMessages,
    isLoading, 
    refetchMessages, 
    replyingTo, 
    setReplyingTo,
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleReaction
  } = useThreadData(threadId, user?.id, profile);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);
  
  useEffect(() => { scrollToBottom(); }, [flatMessages, scrollToBottom]); 
    
  const handleReplyClick = (message: MessageWithDetails) => { setReplyingTo(message); };

  if (!threadId) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a thread to start chatting.</div>;
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card shadow-lg">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-xl font-bold">Discussion Stream</CardTitle>
        <p className="text-sm text-muted-foreground">Thread ID: {threadId.substring(0, 8)}...</p>
      </CardHeader>

      <div className="flex-1 overflow-y-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-2/3 ml-auto" />
                <Skeleton className="h-16 w-3/4" />
              </div>
            ) : (
              <div className="space-y-4">
                {flatMessages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No messages yet. Start the conversation!</div>
                ) : (
                  flatMessages.map((msg) => (
                    <Message 
                        key={msg.id} 
                        message={msg} 
                        currentUserId={user?.id || ''}
                        onDelete={handleDeleteMessage}
                        onReplyClick={handleReplyClick}
                        onReaction={handleReaction}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="mt-4 p-4 border-t bg-background">
        <MessageInput 
            threadId={threadId} 
            onSendMessage={handleSendMessage} 
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
};
