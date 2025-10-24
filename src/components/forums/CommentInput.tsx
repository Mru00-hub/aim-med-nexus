import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import {
  postMessage,
  uploadAttachment, // Assuming a modified uploadAttachment
} from '@/integrations/supabase/community.api';
import { useToast } from '@/components/ui/use-toast';

interface CommentInputProps {
  threadId: string;
  parentMessageId?: number | null;
  onCommentPosted: () => void;
  // To hide the avatar and simplify layout for replies
  isReply?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  threadId,
  parentMessageId = null,
  onCommentPosted,
  isReply = false,
}) => {
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setIsLoading(true);

    try {
      // 1. Post the text message.
      // We are re-using the `postMessage` from your other spaces.
      const newMessage = await postMessage(threadId, body, parentMessageId);

      // 2. TODO: Add file upload logic here
      // e.g., if (files.length > 0) { ... upload files ... }

      setBody('');
      onCommentPosted();
      toast({
        title: 'Success',
        description: parentMessageId
          ? 'Reply posted.'
          : 'Comment posted.',
      });
    } catch (error: any) {
      console.error('Failed to post comment', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-2 ${isReply ? 'mt-2' : 'items-start'}`}
    >
      {!isReply && (
        <Avatar className="h-10 w-10 hidden sm:block">
          <AvatarImage
            src={profile?.profile_picture_url || ''}
            alt={profile?.full_name || 'Your avatar'}
          />
          <AvatarFallback>
            {profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 space-y-2">
        <Textarea
          placeholder={
            parentMessageId ? 'Write a reply...' : 'Write a comment...'
          }
          rows={isReply ? 2 : 3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <div className="flex justify-between items-center">
          {/* TODO: Add attachment button */}
          <div />
          <Button
            type="submit"
            size={isReply ? 'sm' : 'default'}
            disabled={isLoading || !body.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">{isReply ? 'Reply' : 'Post Comment'}</span>
          </Button>
        </div>
      </div>
    </form>
  );
};

