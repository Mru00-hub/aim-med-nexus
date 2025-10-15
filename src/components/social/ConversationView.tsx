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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversationData } from '@/hooks/useConversationData'; 

type Conversation = Tables<'inbox_conversations'>;
type Profile = Tables<'profiles'>;
type ReplyContext = { id: number; content: string; sender_id: string; author_name: string; };

interface ConversationViewProps {
  conversation: Conversation;
}

export const ConversationView = ({ conversation }: ConversationViewProps) => {
  const { profile: currentUserProfile } = useAuth();
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useConversationData(conversation.conversation_id);

  useEffect(() => {
    // Fetch the other participant's profile
    const fetchRecipient = async () => {
      if (!conversation.participant_id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', conversation.participant_id).single();
      if (data) setRecipientProfile(data);
    };
    fetchRecipient();
  }, [conversation.participant_id]);

  useEffect(() => {
    // Update star state if the conversation prop changes
    setIsStarred(conversation.is_starred ?? false);
  }, [conversation.is_starred]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleStar = async () => {
    const newStarredStatus = !isStarred;
    setIsStarred(newStarredStatus); // Optimistic update
    try {
      await socialApi.messaging.toggleStarConversation(conversation.conversation_id, newStarredStatus);
    } catch (error) {
      console.error("Failed to update star status:", error);
      setIsStarred(!newStarredStatus); // Revert on failure
    }
  };

  const profilesMap = {
    ...(currentUserProfile && { [currentUserProfile.id]: currentUserProfile }),
    ...(recipientProfile && { [recipientProfile.id]: recipientProfile }),
  };

  return (
    <>
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={conversation.participant_avatar_url || undefined} />
                    <AvatarFallback>{conversation.participant_full_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold">{conversation.participant_full_name}</h3>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleStar}>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/20">
        {loading ? ( <Skeleton className="h-24 w-full" /> ) : (
          messages.map((message) => 
            <DirectMessage 
              key={message.id} 
              message={message} 
              authorProfile={profilesMap[message.sender_id]} 
              onReplyClick={setReplyingTo}
            />
          )
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <DirectMessageInput 
        conversationId={conversation.conversation_id}
        sendMessage={sendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </>
  );
};
