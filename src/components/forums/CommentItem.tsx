import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
// REMOVED: import { usePostContext } from './PostContext';
import { MessageWithDetails } from '@/integrations/supabase/community.api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ThumbsUp, CornerDownRight, Smile, File as FileIcon } from 'lucide-react';
import { CommentInput } from './CommentInput';
import { toggleReaction } from '@/integrations/supabase/community.api';
import { useToast } from '@/components/ui/use-toast';

const REACTIONS = ['👍', '❤️', '🔥', '🧠', '😂'];

// CHANGED: Updated props interface
interface CommentItemProps {
  comment: MessageWithDetails;
  refreshPost: () => void; // <-- ADDED
  threadId: string;       // <-- ADDED
}

// CHANGED: Updated component signature
export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  refreshPost, 
  threadId 
}) => {
  // REMOVED: const { refreshPost, threadId } = usePostContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);

  // ... (rest of the component logic is unchanged) ...

  const reactionGroups = useMemo(() => {
    if (!comment.reactions) return {};
    return comment.reactions.reduce((acc, reaction) => {
      const emoji = reaction.reaction_emoji;
      if (!acc[emoji]) {
        acc[emoji] = { count: 0, users: [] };
      }
      acc[emoji].count++;
      // @ts-ignore
      acc[emoji].users.push(reaction.user_id);
      return acc;
    }, {} as { [key: string]: { count: number; users: string[] } });
  }, [comment.reactions]);

  const userHasReacted = (emoji: string) => {
    if (!user || !reactionGroups[emoji]) return false;
    return reactionGroups[emoji].users.includes(user.id);
  };

  const handleReaction = async (emoji: string) => {
    if (!user) return;
    try {
      await toggleReaction(comment.id, emoji);
      refreshPost(); // This now calls the prop
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3">
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
        <AvatarImage src={comment.author?.profile_picture_url || ''} />
        <AvatarFallback>
          {comment.author?.full_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="font-semibold text-sm">
            {comment.author?.full_name}
          </p>
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
          {/* Render comment attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center text-sm p-2 border rounded-md bg-background hover:bg-zinc-100"
                >
                  <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{att.file_name}</span>
                </a>
              ))}
            </div>
          )}
          
          {/* Render comment reactions */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(reactionGroups).map(([emoji, { count }]) => (
                <Badge
                  key={emoji}
                  variant={userHasReacted(emoji) ? 'default' : 'secondary'}
                  className="px-1.5 py-0.5 text-xs cursor-pointer"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji} {count}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {/* --- ACTION BAR --- */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground px-2 py-1">
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="font-medium hover:text-primary"
          >
            Reply
          </button>
          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
          
          {/* Add Reaction Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1">
              <div className="flex gap-1">
                {REACTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={userHasReacted(emoji) ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 text-lg rounded-full"
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {isReplying && (
          <div className="mt-2">
            <CommentInput
              threadId={threadId} // This now comes from the prop
              parentMessageId={comment.id}
              onCommentPosted={() => {
                setIsReplying(false);
                refreshPost(); // This now comes from the prop
              }}
              isReply={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
