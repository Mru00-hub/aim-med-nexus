// src/components/messaging/ThreadView.tsx

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from './Message';
import { MessageInput } from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

// Import our new API function and types
import { getMessages, MessageWithAuthor } from '@/integrations/supabase/community.api';

interface ThreadViewProps {
  threadId: string;
}

export const ThreadView = ({ threadId }: ThreadViewProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Helper function to scroll to the bottom of the chat
    const scrollToBottom = () => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
      }
    };

    // --- 1. Fetch Initial Messages ---
    const fetchInitialMessages = async () => {
      if (!threadId) return;
      setLoading(true);
      try {
        const initialMessages = await getMessages(threadId);
        setMessages(initialMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
        // Use a short delay to ensure DOM has updated before scrolling
        setTimeout(scrollToBottom, 50);
      }
    };

    fetchInitialMessages();

    // --- 2. Set up Real-time Subscription ---
    const channel = supabase
      .channel(`messages_thread_${threadId}`)
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          // When a new message arrives, we can't just use payload.new because it's missing the author's email.
          // The best practice is to refetch the latest message to get the joined data.
          // A simpler, optimistic approach is shown here:
          const newMessage = payload.new;

          // Optimistically create the full MessageWithAuthor object
          // NOTE: In a production app with profiles, you might fetch the profile separately
          const authorEmail = user?.email ?? 'New User'; // A fallback email

          setMessages((currentMessages) => [
            ...currentMessages,
            {
                id: newMessage.id,
                body: newMessage.body,
                created_at: newMessage.created_at,
                is_edited: newMessage.is_edited,
                user_id: newMessage.user_id,
                email: authorEmail, // Add the email here
            },
          ]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    // --- 3. Cleanup ---
    // This function is called when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user]); // Rerun effect if threadId or user changes

  if (!threadId) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a thread to start chatting.</div>;
  }

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <div className="flex-1 overflow-y-hidden">
        <ScrollArea className="h-full p-4" viewportRef={scrollViewportRef}>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-2/3 ml-auto" />
              <Skeleton className="h-16 w-3/4" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      <MessageInput threadId={threadId} />
    </div>
  );
};
