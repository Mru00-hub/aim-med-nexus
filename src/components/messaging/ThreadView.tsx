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
    const flatMessages = useMemo((): FlatMessage[] => {
        // Create a quick lookup map for all messages by their ID
        const messageMap = new Map(messages.map(m => [m.id, m]));

        return messages
            .map(message => {
                const flatMessage: FlatMessage = { ...message, replyTo: null };
                if (message.parent_message_id) {
                    const parent = messageMap.get(message.parent_message_id);
                    if (parent) {
                        flatMessage.replyTo = {
                            author: parent.author?.full_name || 'User',
                            body: parent.body,
                        };
                    }
                }
                return flatMessage;
            })
            // Sort all messages chronologically
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [messages]);

    return { 
        flatMessages, 
        isLoading, 
        refetchMessages: fetchAndSyncMessages,
        replyingTo,
        setReplyingTo,
        handleDeleteMessage 
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
    isLoading, 
    refetchMessages, 
    replyingTo, 
    setReplyingTo, 
    handleDeleteMessage 
  } = useThreadData(threadId, user?.id);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);
  
  useEffect(() => { scrollToBottom(); }, [flatMessages, scrollToBottom]); 

  const handleSendMessage = async (body: string, parentMessageId: number | null = null) => {
    if (!user || !threadId) {
      toast({ variant: 'destructive', title: 'Login Required' });
      return;
    }
    
    try {
      // We don't wait for the API call to finish before updating the UI locally
      postMessage(threadId, body, parentMessageId);
      setReplyingTo(null);
      // Refetch after a small delay to allow the database to update
      setTimeout(() => {
        refetchMessages().then(() => setTimeout(scrollToBottom, 50));
      }, 500);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error sending message', description: error.message });
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
