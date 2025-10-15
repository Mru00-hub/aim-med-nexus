import React, { useState, useEffect, useRef } from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { socialApi } from '@/integrations/supabase/social.api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Star } from 'lucide-react'; // <-- Re-added Star import, was missing from your latest snippet
import { DirectMessage } from './DirectMessage';
import { DirectMessageInput } from './DirectMessageInput';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversationData } from '@/hooks/useConversationData'; 
import { cn } from '@/lib/utils'; // <-- Added import for cn utility for dynamic classes

// FIX #3: Add `is_starred` to the Conversation type
type Conversation = Tables<'inbox_conversations'> & { is_starred?: boolean };
type Profile = Tables<'profiles'>;
type ReplyContext = { id: number; content: string; sender_id: string; author_name: string; };

interface ConversationViewProps {
  conversation: Conversation;
  onConversationUpdate: () => void; 
}

export const ConversationView = ({ conversation }: ConversationViewProps) => {
  const { profile: currentUserProfile } = useAuth();
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  // FIX #1: Added the missing useState declaration for isStarred
  const [isStarred, setIsStarred] = useState(conversation.is_starred ?? false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);
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
    // Only scroll to bottom if the number of messages has increased
    if (messages.length > prevMessagesLength.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Update the ref to the current length for the next render
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const handleToggleStar = async () => {
      const newStarredStatus = !isStarred;
      setIsStarred(newStarredStatus);
      try {
          await socialApi.messaging.toggleStarConversation(conversation.conversation_id, newStarredStatus);
          onConversationUpdate(); // FIX: Call the callback to refetch the list
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
                {/* FIX #2: Correctly closed the Button tag and added the Star icon back inside it */}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleStar}>
                    <Star className={cn("h-4 w-4", isStarred && "fill-current text-yellow-500")} />
                </Button>
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
