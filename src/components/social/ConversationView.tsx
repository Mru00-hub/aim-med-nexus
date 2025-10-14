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
import { useAuth } from '@/hooks/useAuth';

type Conversation = Tables<'inbox_conversations'>;
type MessageWithRelations = Tables<'direct_messages'> & {
  direct_message_reactions: Tables<'direct_message_reactions'>[];
  direct_message_attachments: Tables<'direct_message_attachments'>[];
};
type Profile = Tables<'profiles'>;

interface ConversationViewProps {
  conversation: Conversation;
}

export const ConversationView = ({ conversation }: ConversationViewProps) => {
  const { user, profile: authorProfile } = useAuth(); // Logged-in user's profile
  const [messages, setMessages] = useState<MessageWithRelations[]>([]);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAndSetData = async () => {
    if (!conversation?.conversation_id || !conversation.participant_id) return;
    setLoading(true);

    // Fetch messages and recipient profile in parallel
    const [messagesRes, recipientRes] = await Promise.all([
      socialApi.messaging.getMessagesForConversation(conversation.conversation_id),
      supabase.from('profiles').select('*').eq('id', conversation.participant_id).single()
    ]);
    
    if (messagesRes.data) setMessages(messagesRes.data as MessageWithRelations[]);
    if (recipientRes.data) setRecipientProfile(recipientRes.data);
    
    setLoading(false);
  };
useEffect(() => {
    fetchAndSetData();

    const channel = supabase
      .channel(`conversation-${conversation.conversation_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'direct_messages', 
        filter: `conversation_id=eq.${conversation.conversation_id}` 
      }, () => fetchAndSetData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'direct_message_reactions', 
        // A bit trickier to filter, so we just refetch on any reaction change
      }, () => fetchAndSetData())
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
        <h3 className="font-semibold">{conversation.participant_full_name}</h3>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/20">
        {loading ? (
          <div className="space-y-4"> <Skeleton className="h-12 w-1/2" /><Skeleton className="h-12 w-1/2 ml-auto" /></div>
        ) : (
          messages.map((message) => 
            <DirectMessage 
              key={message.id} 
              message={message} 
              authorProfile={authorProfile}
              recipientProfile={recipientProfile}
            />
          )
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <DirectMessageInput conversationId={conversation.conversation_id} />
    </>
  );
};
