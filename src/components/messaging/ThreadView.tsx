import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  postMessage, 
  getMessagesWithDetails,
  MessageWithDetails,
} from '@/integrations/supabase/community.api'; 

// Import the actual child components
import { Message } from './Message'; 
import { MessageInput } from './MessageInput'; 

// --- Type Definitions for the display layer ---
type ThreadedMessage = MessageWithDetails & {
    replies: MessageWithDetails[];
}

interface ThreadViewProps {
  threadId: string;
}

// ======================================================================
// CENTRALIZED HOOK: Handles all Data, Real-Time, and Threading Logic
// ======================================================================

const useThreadData = (threadId: string, currentUserId: string | undefined) => {
    const { toast } = useToast();
    const [messages, setMessages] = useState<MessageWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // NEW STATE: For handling a reply target in the input field
    const [replyingTo, setReplyingTo] = useState<MessageWithDetails | null>(null);
    
    // --- 1. Fetching & Refetching (The source of truth) ---
    const fetchAndSyncMessages = useCallback(async () => {
      if (!threadId) return;
      setIsLoading(true);
      try {
        const data = await getMessagesWithDetails(threadId);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        if (messages.length === 0) setIsLoading(false);
        if (isLoading) setIsLoading(false); 
      }
    }, [threadId]);

    // Initial load
    useEffect(() => {
        fetchAndSyncMessages();
    }, [threadId, fetchAndSyncMessages]);
    
    // --- 2. Real-Time Subscription ---
    useEffect(() => {
        if (!threadId || !currentUserId) return;

        const handleRealtimeEvent = (payload: any) => {
            const changedBySelf = payload.new?.user_id === currentUserId || payload.old?.user_id === currentUserId;
            
            if (!changedBySelf || payload.eventType === 'DELETE') {
                fetchAndSyncMessages(); 
            }
        };

        const channel = supabase
            .channel(`thread_chat_${threadId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, handleRealtimeEvent)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, handleRealtimeEvent)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_attachments', filter: `thread_id=eq.${threadId}` }, handleRealtimeEvent)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [threadId, currentUserId, fetchAndSyncMessages]);
    
    // --- 3. Threaded Message Grouping ---
    const threadedMessages = useMemo(() => {
        const primaryMessages = messages.filter(m => m.parent_message_id === null);
        const repliesMap = messages.filter(m => m.parent_message_id !== null).reduce((acc, reply) => {
            const parentId = reply.parent_message_id as number;
            if (!acc.has(parentId)) {
                acc.set(parentId, []);
            }
            acc.get(parentId)!.push(reply);
            return acc;
        }, new Map<number, MessageWithDetails[]>());
        
        return primaryMessages.map(m => ({
            ...m,
            replies: repliesMap.get(m.id) || []
        })) as ThreadedMessage[];
    }, [messages]);

    return { 
        threadedMessages, 
        isLoading, 
        refetchMessages: fetchAndSyncMessages,
        replyingTo,
        setReplyingTo
    };
};

// ======================================================================
// THREAD VIEW COMPONENT (Renderer)
// ======================================================================

export const ThreadView: React.FC<ThreadViewProps> = ({ threadId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use the centralized data hook
  const { threadedMessages, isLoading, refetchMessages, replyingTo, setReplyingTo } = useThreadData(threadId, user?.id);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // --- Utility for scrolling to bottom ---
  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);
  
  // Scroll to bottom whenever messages update
  useEffect(() => {
      scrollToBottom();
  }, [threadedMessages]); 

  // --- Message Posting Handler (Accepts reply target) ---
  const handleSendMessage = async (body: string, parentMessageId: number | null = null) => {
    if (!user || !threadId) {
      toast({ variant: 'destructive', title: 'Login Required', description: 'Please log in to post a message.' });
      return;
    }
    
    try {
      await postMessage(threadId, body, parentMessageId);
      
      // Clear reply state after successful send
      setReplyingTo(null);
      
      await refetchMessages(); 
      setTimeout(scrollToBottom, 50);

    } catch (error: any) {
      const errorMessage = error.message.includes('permission denied') 
                           ? 'Access Denied: You cannot post to this thread.' 
                           : error.message || 'Failed to send message.';

      toast({ variant: 'destructive', title: 'Error sending message', description: errorMessage });
    }
  };
  
  const handleReplyClick = (message: MessageWithDetails) => {
      setReplyingTo(message);
  }

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
                {threadedMessages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No messages yet. Start the conversation!</div>
                ) : (
                  threadedMessages.map((msg) => (
                      <div key={msg.id} className="space-y-2">
                          {/* Render the parent message */}
                          <Message 
                              message={msg} 
                              currentUserId={user?.id || ''}
                              refetchMessages={refetchMessages}
                              onReplyClick={handleReplyClick} // Pass the reply handler
                          />
                          
                          {/* Render replies, indented */}
                          {msg.replies.length > 0 && (
                              <div className="ml-6 sm:ml-10 border-l pl-4 space-y-2">
                                  {msg.replies.map(reply => (
                                      <Message 
                                          key={reply.id} 
                                          message={reply} 
                                          currentUserId={user?.id || ''}
                                          isReply={true} 
                                          refetchMessages={refetchMessages}
                                          onReplyClick={handleReplyClick} // Pass the reply handler
                                      />
                                  ))}
                              </div>
                          )}
                      </div>
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Input at the bottom */}
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
