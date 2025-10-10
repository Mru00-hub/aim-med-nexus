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
  Profile, // Assuming Profile type is exported from community.api
} from '@/integrations/supabase/community.api'; 

import { Message } from './Message'; 
import { MessageInput } from './MessageInput'; 

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
    
    // We no longer need the useRefs or the useEffect that updates them. They have been removed.

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

    const handleSendMessage = useCallback(async (body: string, parentMessageId: number | null, files: File[]) => {
        // We now get the profile and messages directly from the hook's scope.
        // The useCallback dependency array ensures they are always up-to-date.
        if (!currentUserId || !profile) {
            toast({ variant: 'destructive', title: 'Not Ready', description: 'User profile is not available yet. Please try again in a moment.' });
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
            uploaded_by: currentUserId,
            isUploading: true,
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

        setMessages(current => [...current, optimisticMessage]);

        try {
            const realMessage = await postMessage(threadId, body, parentMessageId);

            // Update the message's ID from temporary to permanent
            setMessages(current => current.map(msg => 
                msg.id === tempMsgId ? { ...msg, id: realMessage.id } : msg
            ));

            if (files.length > 0) {
                await Promise.all(
                    files.map(async (file, index) => {
                        try {
                            const realAttachment = await uploadAttachment(realMessage.id, file);
                            
                            // --- THIS IS THE FIX for the "stuck loading" state ---
                            // We now find the message using its new, permanent ID (realMessage.id)
                            setMessages(current => current.map(msg => 
                                msg.id === realMessage.id ? {
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
                            setMessages(current => current.map(msg => 
                                msg.id === realMessage.id ? { // Also use the permanent ID for error states
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
        } catch (error: any) {
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
            setMessages(previousMessages);
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

        setMessages(current => current.map(msg => {
            if (msg.id === messageId) {
                let newReactions = [...msg.reactions];
                if (existingReaction) {
                    newReactions = newReactions.filter(r => r.user_id !== currentUserId);
                    if (existingReaction.reaction_emoji !== emoji) {
                        const newOptimisticReaction: MessageReaction = { id: `temp-${Date.now()}`, message_id: messageId, user_id: currentUserId, reaction_emoji: emoji, created_at: new Date().toISOString() };
                        newReactions.push(newOptimisticReaction);
                    }
                } else {
                    const newOptimisticReaction: MessageReaction = { id: `temp-${Date.now()}`, message_id: messageId, user_id: currentUserId, reaction_emoji: emoji, created_at: new Date().toISOString() };
                    newReactions.push(newOptimisticReaction);
                }
                return { ...msg, reactions: newReactions };
            }
            return msg;
        }));

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
            setMessages(previousMessages);
        }
    }, [messages, currentUserId, toast]);
  
    useEffect(() => { fetchAndSyncMessages(); }, [fetchAndSyncMessages]);
    
    const flatMessages = useMemo(() => {
        const messageMap = new Map(messages.map(m => [m.id, m]));
        return messages
            .map(message => ({
                ...message,
                parent_message: message.parent_message_id ? messageMap.get(message.parent_message_id) : null,
            }))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [messages]);

    return { 
        flatMessages, 
        isLoading, 
        setMessages,
        replyingTo,
        setReplyingTo,
        handleSendMessage,
        handleDeleteMessage,
        handleEditMessage,
        handleReaction 
    };
}; // <-- FIX 2: Removed the stray comma that was here.

// ======================================================================
// THREAD VIEW COMPONENT (Renderer)
// ======================================================================
export const ThreadView: React.FC<ThreadViewProps> = ({ threadId }) => {
  const { user, profile } = useAuth(); 
  const { toast } = useToast();
  
  const { 
    flatMessages, 
    isLoading, 
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

  const onCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, [setReplyingTo]); // setReplyingTo is stable and won't cause this to be recreated.

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
            onCancelReply={onCancelReply} 
        />
      </div>
    </div>
  );
};
