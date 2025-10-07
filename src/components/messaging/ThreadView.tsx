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
const useThreadData = (threadId: string, currentUserId: string | undefined) => {
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
        if (!currentUserId) return;
        
        // Create a temporary message to display instantly
        const tempId = Date.now();
        const optimisticMessage: MessageWithDetails = {
            id: tempId,
            thread_id: threadId,
            user_id: currentUserId,
            body,
            parent_message_id: parentMessageId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_edited: false,
            author: null, // We'll fetch the real author later
            reactions: [],
            attachments: [],
        };
        setMessages(current => [...current, optimisticMessage]);
        setReplyingTo(null);
        
        try {
            await postMessage(threadId, body, parentMessageId);
            // After success, refetch to get the real message from the DB
            await fetchAndSyncMessages();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Send Failed', description: error.message });
            setMessages(current => current.filter(m => m.id !== tempId)); // Revert on failure
        }
    }, [currentUserId, threadId, fetchAndSyncMessages, toast]);
    
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
        
        setMessages(current => current.map(msg => {
            if (msg.id === messageId) {
                const existingReaction = msg.reactions.find(r => r.user_id === currentUserId && r.reaction_emoji === emoji);
                if (existingReaction) {
                    return { ...msg, reactions: msg.reactions.filter(r => r.id !== existingReaction.id && r.user_id !== currentUserId) };
                } else {
                    const newReaction: MessageReaction = { id: `temp-${Date.now()}`, message_id: messageId, user_id: currentUserId, reaction_emoji: emoji, created_at: new Date().toISOString() };
                    return { ...msg, reactions: [...msg.reactions, newReaction] };
                }
            }
            return msg;
        }));

        try {
            const existing = previousMessages.find(m => m.id === messageId)?.reactions.find(r => r.user_id === currentUserId && r.reaction_emoji === emoji);
            if (existing) {
                await removeReaction(messageId, emoji);
            } else {
                await addReaction(messageId, emoji);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Reaction Failed', description: error.message });
            setMessages(previousMessages);
        }
    }, [messages, currentUserId, toast]);
  
    useEffect(() => { fetchAndSyncMessages(); }, [fetchAndSyncMessages]);

    useEffect(() => {
        if (!threadId) return;
        const handleRealtimeEvent = () => { fetchAndSyncMessages(); };
        const channel = supabase.channel(`thread_chat_${threadId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, handleRealtimeEvent)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, handleRealtimeEvent)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [threadId, currentUserId, fetchAndSyncMessages]);
    
    // --- NEW LOGIC: Create a flat, sorted list of messages for the chat view ---
    const flatMessages = useMemo(() => {
        return messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [messages]);

    return { 
        flatMessages, 
        isLoading, 
        setMessages, 
        refetchMessages: fetchAndSyncMessages,
        replyingTo,
        setReplyingTo,
        handleDeleteMessage,
        handleEditMessage,
        handleReaction
    };
};

// ======================================================================
// THREAD VIEW COMPONENT (Renderer)
// ======================================================================
export const ThreadView: React.FC<ThreadViewProps> = ({ threadId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    flatMessages, 
    setMessages,
    isLoading, 
    refetchMessages, 
    replyingTo, 
    setReplyingTo, 
    handleDeleteMessage,
    handleEditMessage,
    handleReaction
  } = useThreadData(threadId, user?.id);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);
  
  useEffect(() => { scrollToBottom(); }, [flatMessages, scrollToBottom]); 

  const handleSendMessage = async (body: string, parentMessageId: number | null = null): Promise<MessageWithDetails> => {
    if (!user) {
      throw new Error('You must be logged in to post a message.');
    }
    
    // Create a temporary message for optimistic UI
    const tempId = Date.now(); // Temporary, non-numeric ID
    const optimisticMessage: MessageWithDetails = {
      id: tempId,
      thread_id: threadId,
      user_id: user.id,
      body: body,
      parent_message_id: parentMessageId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      author: {
        full_name: user.user_metadata.full_name || 'You',
        profile_picture_url: user.user_metadata.avatar_url || null,
      },
      reactions: [],
      attachments: [],
    };

    // Instantly update the UI
    setMessages(currentMessages => [...currentMessages, optimisticMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      // Make the real API call
      const newMessage = await postMessage(threadId, body, parentMessageId);
      
      // Replace the temporary message with the real one from the database
      setMessages(currentMessages => 
        currentMessages.map(m => (m.id === tempId ? { ...newMessage, author: optimisticMessage.author } : m))
      );
      
      return { ...newMessage, author: optimisticMessage.author }; // Return the complete message object
    } catch (error) {
      // If it fails, remove the optimistic message and show an error
      setMessages(currentMessages => currentMessages.filter(m => m.id !== tempId));
      throw error; // Re-throw the error to be caught by MessageInput
    }
  };
  
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
                  // --- NEW: Render a simple, flat list of messages ---
                  flatMessages.map((msg) => (
                    <Message 
                        key={msg.id}
                        message={msg}
                        currentUserId={user?.id || ''}
                        onDelete={handleDeleteMessage}
                        onReplyClick={handleReplyClick}
                        refetchMessages={refetchMessages}
                        // Pass the new replyTo object to the Message component
                        replyTo={msg.replyTo}
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
