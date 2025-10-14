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

type ReplyContext = {
    id: number;
    content: string;
    sender_id: string;
    author_name: string;
};

interface ConversationViewProps {
  conversation: Conversation;
}

export const ConversationView = ({ conversation }: ConversationViewProps) => {
  const { user, profile: currentUserProfile } = useAuth();
  const [messages, setMessages] = useState<MessageWithRelations[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const fetchAndSetData = async () => {
    if (!conversation?.conversation_id || !conversation.participant_id || !currentUserProfile) return;
    setLoading(true);

    const { data: messagesData } = await socialApi.messaging.getMessagesForConversation(conversation.conversation_id);
    const { data: recipientData } = await supabase.from('profiles').select('*').eq('id', conversation.participant_id).single();

    if (messagesData) {
        setMessages(messagesData as MessageWithRelations[]);
    }

    if (recipientData) {
        // Create a complete map of profiles for this conversation
        setProfiles({
            [currentUserProfile.id]: currentUserProfile, // The logged-in user
            [recipientData.id]: recipientData,          // The other participant
        });
    }

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
        {loading ? ( <Skeleton /> ) : (
          messages.map((message) => 
            <DirectMessage 
              key={message.id} 
              message={message} 
              authorProfile={profiles[message.sender_id]}
              onReplyClick={setReplyingTo}
            />
          )
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <DirectMessageInput 
        conversationId={conversation.conversation_id}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </>
  );
};
