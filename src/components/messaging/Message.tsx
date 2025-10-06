// components/messaging/Message.tsx

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

import { 
  getMessagesWithDetails,
  postMessage, 
  MessageWithDetails,
  // Add functions for reaction and edit/delete here for completeness
} from '@/integrations/supabase/community.api'; 

// ======================================================================
// PLACEHOLDER CHILD COMPONENTS (Define in their respective files later)
// ======================================================================

// Placeholder for Message component
interface MessageProps {
    message: MessageWithDetails;
    currentUserId: string;
    isReply?: boolean;
    refetchMessages: () => Promise<void>;
    // You'd also pass moderation props, edit/delete handlers, etc.
}
const Message: React.FC<MessageProps> = ({ message }) => (
    <div 
      className={`p-3 rounded-lg max-w-lg ${message.user_id === message.currentUserId ? 'bg-primary/10 ml-auto' : 'bg-muted/50'} ${message.isReply ? 'mt-2 text-sm' : 'mt-4'}`}
    >
        <div className="font-semibold text-xs">{message.author?.full_name || 'Anonymous'}</div>
        <p className="text-sm">{message.body}</p>
        <span className="text-xs text-muted-foreground block text-right">{new Date(message.created_at).toLocaleTimeString()}</span>
        {/* Placeholder for reactions/attachments */}
    </div>
);

// Placeholder for MessageInput component
interface MessageInputProps {
    threadId: string;
    onSendMessage: (body: string, parentMessageId: number | null) => Promise<void>;
    // Future: Add logic for replying to a specific message
}
const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() || isSending) return;
        
        setIsSending(true);
        await onSendMessage(body, null); // For now, always send as a main message
        setBody('');
        setIsSending(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                disabled={isSending}
                rows={1}
                className="flex-grow resize-none"
            />
            <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
        </form>
    );
};
// ======================================================================


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
        // Only set loading to false if this is the initial fetch
        if (messages.length === 0) setIsLoading(false);
        // Ensure subsequent fetches don't toggle the skeleton
        if (isLoading) setIsLoading(false); 
      }
    }, [threadId]);

    // Initial load
    useEffect(() => {
        fetchAndSyncMessages();
    }, [threadId, fetchAndSyncMessages]);
    
    // --- 2. Real-Time Subscription (Handles ALL changes: Reactions, Attachments, CRUD) ---
    useEffect(() => {
        if (!threadId || !currentUserId) return;

        // Function to handle ALL real-time events
        const handleRealtimeEvent = (payload: any) => {
            // Check if the change originated from the current user (optimistic update bypass)
            const changedBySelf = payload.new?.user_id === currentUserId || payload.old?.user_id === currentUserId;
            
            // Only refetch if the change is NOT from the current user, or if it's a DELETE (always refetch delete)
            if (!changedBySelf || payload.eventType === 'DELETE') {
                fetchAndSyncMessages(); 
            }
        };

        const channel = supabase
            .channel(`thread_chat_${threadId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, handleRealtimeEvent)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions', filter: `thread_id=eq.${threadId}` }, handleRealtimeEvent)
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
        
        // Structure the final display array
        return primaryMessages.map(m => ({
            ...m,
            replies: repliesMap.get(m.id) || []
        })) as ThreadedMessage[];
    }, [messages]);

    return { 
        threadedMessages, 
        isLoading, 
        refetchMessages: fetchAndSyncMessages 
    };
};

// ======================================================================
// THREAD VIEW COMPONENT (Renderer)
// ======================================================================

export const ThreadView: React.FC<ThreadViewProps> = ({ threadId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Use the centralized data hook
  const { threadedMessages, isLoading, refetchMessages } = useThreadData(threadId, user?.id);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // --- Utility for scrolling to bottom ---
  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, []);
  
  // Scroll to bottom on initial load and whenever messages update (from others)
  useEffect(() => {
      scrollToBottom();
  }, [threadedMessages]); // Scroll whenever the message content changes

  // --- Message Posting Handler (Accepts reply target) ---
  const handleSendMessage = async (body: string, parentMessageId: number | null = null) => {
    if (!user || !threadId) {
      toast({ variant: 'destructive', title: 'Login Required', description: 'Please log in to post a message.' });
      return;
    }
    
    try {
      // REVISED API CALL: Includes parentMessageId for replies
      await postMessage(threadId, body, parentMessageId);
      
      // Force a refetch to update the UI immediately with the DB-confirmed message.
      await refetchMessages(); 
      
      // Scroll to bottom immediately
      setTimeout(scrollToBottom, 50);

    } catch (error: any) {
      // RLS will typically throw an error here if the user lacks posting permission
      const errorMessage = error.message.includes('permission denied') 
                           ? 'Access Denied: You cannot post to this thread.' 
                           : error.message || 'Failed to send message.';

      toast({ variant: 'destructive', title: 'Error sending message', description: errorMessage });
    }
  };

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
        <ScrollArea className="h-full p-4" viewportRef={scrollViewportRef}>
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
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Input at the bottom */}
      <div className="mt-4 p-4 border-t bg-background">
        <MessageInput threadId={threadId} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};
