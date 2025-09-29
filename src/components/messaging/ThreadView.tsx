// src/components/messaging/ThreadView.tsx
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMessages } from '@/integrations/supabase/api';
import { MessageWithAuthor } from '@/types/forum';
import { Message } from './Message';
import { MessageInput } from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ThreadViewProps {
  threadId: string | null;
}

export const ThreadView = ({ threadId }: ThreadViewProps) => {
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to scroll to the bottom
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    };

    // Fetch initial messages
    const fetchMessages = async () => {
      if (!threadId) return;
      setLoading(true);
      const data = await getMessages(threadId);
      setMessages(data);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`thread_${threadId}`)
      .on<MessageWithAuthor>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((current) => [...current, payload.new as MessageWithAuthor]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  if (!threadId) {
    return <div className="flex items-center justify-center h-full">Select a thread to start chatting.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          messages.map((msg) => <Message key={msg.id} message={msg} />)
        )}
      </ScrollArea>
      <MessageInput threadId={threadId} />
    </div>
  );
};
