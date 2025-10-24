import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
// REMOVED: import { usePostContext } from './PostContext';
import { MessageWithDetails } from '@/integrations/supabase/community.api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ThumbsUp, CornerDownRight, Smile, File as FileIcon, MoreHorizontal, Edit2, Trash2, Loader2 } from 'lucide-react';
import { CommentInput } from './CommentInput';
import { toggleReaction } from '@/integrations/supabase/community.api';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

const REACTIONS = ['👍', '❤️', '🔥', '🧠', '😂'];

// CHANGED: Updated props interface
interface CommentItemProps {
  comment: MessageWithDetails;
  threadId: string;       // <-- ADDED
  depth: number;
  onComment: (body: string, files: File[], parentMessageId?: number | null) => Promise<void>;
  onCommentReaction: (commentId: number, emoji: string) => void;
  onCommentEdit: (commentId: number, newBody: string) => void;
  onCommentDelete: (commentId: number) => void;
}

// CHANGED: Updated component signature
export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  threadId,
  depth,
  onComment,
  onCommentReaction,
  onCommentEdit,
  onCommentDelete
}) => {
  // REMOVED: const { refreshPost, threadId } = usePostContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(comment.body);
  const [isSaving, setIsSaving] = useState(false);
  const canEditOrDelete = user?.id === comment.user_id;
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
      onCommentReaction(comment.id, emoji);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editedBody.trim() || editedBody === comment.body) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    onCommentEdit(comment.id, editedBody);

    // Close editing box after a short delay
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 500);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onCommentDelete(comment.id);
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
        <div className="bg-muted rounded-lg px-3 py-2 relative">
          {canEditOrDelete && !isEditing && (
            <div className="absolute top-1 right-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <p className="font-semibold text-sm">
            {comment.author?.full_name}
          </p>
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ReactMarkdown className="text-sm prose prose-sm dark:prose-invert max-w-none">
                {comment.body}
              </ReactMarkdown>
              {comment.is_edited && (
                <span className="text-xs opacity-70 ml-1">
                  (edited at {new Date(comment.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </>
          )}
      
          {/* Render comment attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.attachments.map((att) => {
                const isImage = att.file_type?.startsWith('image/');
                if (isImage) {
                  return (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="rounded-md object-cover w-full h-auto max-h-60 border"
                      />
                    </a>
                  );
                }
                
                // Fallback for non-image files
                return (
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
                );
              })}
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
          {depth < 5 && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="font-medium hover:text-primary"
            >
              Reply
            </button>
          )}
          <span>{new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
          
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
        {isReplying && depth < 5 && (
          <div className="mt-2">
            <CommentInput
              threadId={threadId}
              parentMessageId={comment.id}
              onCommentPosted={async (body, files, parentId) => {
                await onComment(body, files, parentId);
                setIsReplying(false);
              }}
              isReply={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
