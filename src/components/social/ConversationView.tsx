import React, { useState, useEffect, useRef } from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { socialApi } from '@/integrations/supabase/social.api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { MoreVertical, Star } from 'lucide-react';
import { DirectMessage } from './DirectMessage';
import { DirectMessageInput } from './DirectMessageInput';

type Conversation = Tables<'inbox_conversations'>;
type MessageWithRelations = Tables<'direct_messages'> & {
  direct_message_reactions: Tables<'direct_message_reactions'>[];
  direct_message_attachments: Tables<'direct_message_attachments'>[];
};

interface ConversationViewProps {
  conversation: Conversation;
}

export const ConversationView = ({ conversation }: ConversationViewProps) => {
  const [messages, setMessages] = useState<MessageWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!conversation?.conversation_id) return;
    setLoading(true);
    const { data } = await socialApi.messaging.getMessagesForConversation(conversation.conversation_id);
    if (data) {
      setMessages(data as MessageWithRelations[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`conversation-${conversation.conversation_id}`)
      .on<Tables<'direct_messages'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversation.conversation_id}` },
        () => {
          // Re-fetch all messages on any change to ensure reactions/edits are captured
          fetchMessages(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.conversation_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <CardHeader className="pb-4 border-b border-border">
        {/* ... Header UI as before ... */}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-12 w-1/2 ml-auto" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => <DirectMessage key={message.id} message={message} />)
        ) : (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <p>This is the beginning of your conversation.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <DirectMessageInput
        conversationId={conversation.conversation_id}
        onMessageSent={fetchMessages}
      />
    </>
  );
};
