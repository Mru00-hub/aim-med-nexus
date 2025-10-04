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
import { Database } from '@/integrations/supabase/types'; // Assuming you have this for the raw row type

// Define the raw message row type for the payload
type MessagesRow = Database['public']['Tables']['messages']['Row'];

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
      .on<MessagesRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          const newMessage = payload.new;

          // --- THIS IS THE CORRECTED LOGIC ---
          //
          // We can't use payload.new directly because it's missing the author's profile.
          // Instead, we fetch the author's profile using the `user_id` from the new message.
          
          // Safety check: If MessageInput does its own optimistic update, this prevents duplicates.
          if (newMessage.user_id === user?.id) {
            return;
          }

          const { data: authorProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*') // Select all profile fields you might need
            .eq('id', newMessage.user_id)
            .single();

          if (profileError) {
            console.error("Error fetching profile for new message:", profileError);
            return; // Don't add the message if we can't get the author
          }

          // Now, construct the complete `MessageWithAuthor` object with the fetched profile
          const completeMessage: MessageWithAuthor = {
            ...newMessage,
            author: authorProfile, // Your 'MessageWithAuthor' type should expect a nested author object
          };

          setMessages((currentMessages) => [...currentMessages, completeMessage]);
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
