// src/components/messaging/ThreadView.tsx

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from './Message';
import { MessageInput } from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { getMessages, postMessage, MessageWithAuthor } from '@/integrations/supabase/community.api';
import { Database } from '@/integrations/supabase/types';

// Define the raw message row type for the subscription payload
type MessagesRow = Database['public']['Tables']['messages']['Row'];

interface ThreadViewProps {
  threadId: string;
}

export const ThreadView = ({ threadId }: ThreadViewProps) => {
  const { user, profile } = useAuth(); // Ensure `profile` is provided by your useAuth hook
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
      }
    };

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
        setTimeout(scrollToBottom, 50);
      }
    };

    fetchInitialMessages();

    const channel = supabase
      .channel(`messages_thread_${threadId}`)
      .on<MessagesRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          const newMessage = payload.new;

          // Ignore the real-time event for our own messages, as they are handled optimistically
          if (newMessage.user_id === user?.id) {
            return;
          }

          // For messages from OTHERS, fetch their profile to build the complete object
          const { data: authorProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.user_id)
            .single();

          if (profileError) {
            console.error("Error fetching profile for new message:", profileError);
            return; 
          }

          const completeMessage: MessageWithAuthor = {
            ...newMessage,
            author: authorProfile,
          };

          setMessages((currentMessages) => [...currentMessages, completeMessage]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user]);

  // --- NEW: Function to handle sending messages with optimistic updates ---
  const handleSendMessage = async (body: string) => {
    if (!user || !profile || !threadId) {
      toast({ variant: 'destructive', title: 'Could not send message', description: 'User not found or profile is not loaded.' });
      return;
    }

    // 1. Create the optimistic message object using our own profile data
    const optimisticMessage: MessageWithAuthor = {
      id: crypto.randomUUID(), // Temporary unique ID for the React key
      created_at: new Date().toISOString(),
      body: body,
      is_edited: false,
      thread_id: threadId,
      user_id: user.id,
      author: profile,
    };

    // 2. Add the optimistic message to the UI immediately
    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);

    // 3. Send the actual message to the database in the background
    try {
      await postMessage(threadId, body);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error sending message', description: error.message });
      // On failure, remove the optimistic message from the UI
      setMessages((currentMessages) =>
        currentMessages.filter((m) => m.id !== optimisticMessage.id)
      );
    }
  };

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
      {/* --- MODIFIED: Pass the new handler function as a prop --- */}
      <MessageInput threadId={threadId} onSendMessage={handleSendMessage} />
    </div>
  );
};
