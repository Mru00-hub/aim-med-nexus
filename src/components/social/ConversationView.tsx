// src/components/social/ConversationView.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Loader2, ArrowLeft } from 'lucide-react';
import { DirectMessage } from './DirectMessage';
import { DirectMessageInput } from './DirectMessageInput';
import { useAuth } from '@/hooks/useAuth';
import { decryptMessage } from '@/lib/crypto'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversationData } from '@/hooks/useConversationData'; // NEW: Using our powerful hook
import { cn } from '@/lib/utils';
import { Database, Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client'; // For profile fetching and starring
import { markConversationAsRead } from '@/integrations/supabase/social.api';
import { DirectMessageWithDetails } from '@/integrations/supabase/social.api';
import { Link } from 'react-router-dom';

type Conversation = Database['public']['Functions']['get_my_inbox_conversations']['Returns'][number];

interface ConversationViewProps {
  conversation: Conversation;
  onConversationUpdate: () => void;
  onBack?: () => void;
}

export const ConversationView = ({ conversation, onConversationUpdate, onBack}: ConversationViewProps) => {
  const { user } = useAuth();
  const [isStarred, setIsStarred] = useState(conversation.is_starred ?? false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef<number | null>(null);

  // NEW: All message logic is now handled by the hook.
  const {
    messages,
    isLoading,
    conversationKey,
    replyingTo,
    setReplyingTo,
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleReaction
  } = useConversationData(conversation.conversation_id, conversation.participant_id);
  
  useEffect(() => {
    const markAsRead = async () => {
      if (conversation?.unread_count && conversation.unread_count > 0) {
        try {
          await supabase.rpc('mark_conversation_as_read', { 
            p_conversation_id: conversation.conversation_id 
          });
          setTimeout(() => {
            onConversationUpdate();
          }, 500);
        } catch (error) {
          console.error("Failed to mark conversation as read:", error);
        }
      }
    };
    markAsRead();
  }, [conversation.conversation_id, conversation.unread_count, onConversationUpdate]);  
  
  useEffect(() => {
    // On the very first render, prevMessagesLength.current is null, so we set it.
    if (prevMessagesLength.current === null) {
        prevMessagesLength.current = messages.length;
        return; // And we don't scroll
    }

    // We only scroll if the number of messages has actually increased.
    // This prevents scrolling on edits, deletes, or reactions.
    if (messages.length > prevMessagesLength.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // After every render, we update the ref to the current length for the next comparison.
    prevMessagesLength.current = messages.length;
  }, [messages]); 

  useEffect(() => {
    setIsStarred(conversation.is_starred ?? false);
  }, [conversation.is_starred]);
  
  const handleToggleStar = async () => {
      // FIX 1: Add a guard clause to ensure the user object exists
      if (!user) return;

      const newStarredStatus = !isStarred;
      setIsStarred(newStarredStatus); // Optimistic update
      
      try {
          // FIX 2: Destructure the 'error' object from the result of the await call
          const { error } = await supabase
            .from('conversation_participants')
            .update({ is_starred: newStarredStatus })
            .match({
              conversation_id: conversation.conversation_id,
              user_id: user.id
            });

          // FIX 3: Now the 'error' variable exists and this check works correctly
          if (error) {
            throw error;
          }

          onConversationUpdate();

        } catch (error) {
          console.error("Failed to update star status:", error);
          setIsStarred(!newStarredStatus); // Revert on failure
        }
    };
    
  const handleReplyClick = (message: any) => {
      setReplyingTo(message);
      // Optional: focus input and scroll down
      messagesEndRef.current?.scrollIntoView();
  }

  return (
    <>
      <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 border-b border-border">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden h-8 w-8 -ml-2" // Only shows on mobile
                  onClick={onBack}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Link 
                to={`/profile/${conversation.participant_id}`} 
                className="flex items-center gap-3 transition-smooth hover:opacity-80 group"
              >
                <Avatar className="h-10 w-10 md:h-12 md:w-12 border shadow-card">
                    <AvatarImage src={conversation.participant_avatar_url || undefined} />
                    <AvatarFallback>{conversation.participant_full_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-base md:text-xl font-semibold tracking-tight">
                      {conversation.participant_full_name}
                    </h3>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 md:h-9 md:w-9 transition-smooth" 
                  onClick={handleToggleStar}
                >
                    <Star className={cn("h-4 w-4", isStarred && "fill-current text-yellow-500")} />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 lg:p-6 space-y-3 md:space-y-4 bg-muted/20">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          messages.map((message) =>
            <DirectMessage
              key={message.id}
              message={message}
              currentUserId={user?.id || ''}
              conversationKey={conversationKey}
              onReplyClick={handleReplyClick}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
              onReaction={handleReaction}
            />
          )
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <DirectMessageInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        // ✅ FIX: Pass the correct key status to the input component
        isKeyAvailable={!!conversationKey}
      />
    </>
  );
};
