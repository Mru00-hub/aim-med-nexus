import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
// REMOVED: import { usePostContext } from './PostContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  UserPlus,
  ThumbsUp,
  MessageSquare,
  Share2,
  File as FileIcon,
  Loader2,
  Smile,
  Edit,
} from 'lucide-react';
import {
  toggleFollow,
  toggleReaction,
  FullPostDetails, // ADDED: Import FullPostDetails type
} from '@/integrations/supabase/community.api';
import { ChevronDown, ChevronUp, MoreHorizontal, Edit2, Trash2} from 'lucide-react';

const REACTIONS = ['👍', '❤️', '🔥', '🧠', '😂'];

// Helper to group reactions (unchanged)
const groupReactions = (reactions: any[]) => {
  if (!reactions) return {};
  return reactions.reduce((acc, reaction) => {
    const emoji = reaction.reaction_emoji;
    if (!acc[emoji]) {
      acc[emoji] = { count: 0, users: [] };
    }
    acc[emoji].count++;
    // @ts-ignore
    acc[emoji].users.push(reaction.user_id);
    return acc;
  }, {} as { [key: string]: { count: number; users: string[] } });
};

// ADDED: Props interface
interface PostDisplayProps {
  post: FullPostDetails['post'];
  commentCount: number;
  refresh: () => void;
  onReaction: (emoji: string) => void; 
  onBodyUpdate: (newBody: string) => void;
  onPostDelete: () => void; 
  onTitleUpdate: (newTitle: string) => void;
  canEdit: boolean;
  threadId: string;
}
const TRUNCATE_LENGTH = 300;
// CHANGED: Component signature to accept props
export const PostDisplay: React.FC<PostDisplayProps> = ({
  post,
  commentCount,
  refresh,
  onReaction,
  onBodyUpdate,
  onPostDelete,
  onTitleUpdate,
  canEdit, // This prop is now available if you need to add an "Edit" button
  threadId, // This prop is now available
}) => {
  // REMOVED: const { post, refreshPost } = usePostContext();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleShare = () => {
    // Get the current page's URL
    const postUrl = window.location.href;
    
    // Use the modern navigator.clipboard API
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast({
          title: 'Link Copied!',
          description: 'The link to this post has been copied to your clipboard.',
        });
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not copy the link.',
        });
      });
  };

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [editedBody, setEditedBody] = useState(post.body || '');
  const [isSavingBody, setIsSavingBody] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title || '');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const needsTruncation = useMemo(() => {
    // We strip HTML tags for a more accurate length check
    const plainText = (post.body || '').replace(/<[^>]+>/g, '');
    return plainText.length > TRUNCATE_LENGTH;
  }, [post.body]);

  const handleSaveBody = () => {
    if (!editedBody.trim() || editedBody === post.body) {
      setIsEditingBody(false);
      return;
    }
    
    setIsSavingBody(true);
    // Call the optimistic handler from parent
    onBodyUpdate(editedBody); 
    
    // Simulate save time and close
    setTimeout(() => {
      setIsEditingBody(false);
      setIsSavingBody(false);
    }, 500);
  };

  const startEdit = () => {
    setEditedBody(post.body || '');
    setIsEditingBody(true);
  };

  const handleSaveTitle = () => {
    if (!editedTitle.trim() || editedTitle === post.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    onTitleUpdate(editedTitle); // Call parent handler
    
    setTimeout(() => {
      setIsEditingTitle(false);
      setIsSavingTitle(false);
    }, 500);
  };

  // ADDED: Handler to start editing title
  const startEditTitle = () => {
    setEditedTitle(post.title || '');
    setIsEditingTitle(true);
  };

  const reactionGroups = useMemo(() => groupReactions(post.reactions), [
    post.reactions,
  ]);

  const handleFollow = async () => {
    // (function logic unchanged)
    if (isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      await toggleFollow(post.author_id);
      setIsFollowing(!isFollowing); // Optimistic update
      toast({
        title: isFollowing ? 'Unfollowed' : 'Followed',
        description: `You are no longer ${
          isFollowing ? '' : 'not'
        } following ${post.author_name}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (isReactionLoading || !user) return;
    setIsReactionLoading(true);
    try {
      onReaction(emoji);
      
      
    } catch (error: any) {
      // This is now less likely to fire, but good as a fallback
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsReactionLoading(false);
      // We can close the popover after a short delay
      setTimeout(() => setPopoverOpen(false), 300);
    }
  };

  // (rest of your helper functions: userHasReacted, userHasAnyReaction...)

  const userHasReacted = (emoji: string) => {
    if (!user || !reactionGroups[emoji]) return false;
    return reactionGroups[emoji].users.includes(user.id);
  };

  const userHasAnyReaction = useMemo(() => {
    if (!user) return false;
    return REACTIONS.some((emoji) => userHasReacted(emoji));
  }, [user, reactionGroups]);


  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4 sm:p-6">
        {/* Author Info & Follow Button (Unchanged) */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <Link
              to={`/profile/${post.author_id}`}
              className="flex items-center gap-3 group"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={post.author_avatar || ''}
                  alt={post.author_name || 'Author'}
                />
                <AvatarFallback>
                  {post.author_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold group-hover:underline">
                  {post.author_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {post.author_position}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </Link>
            {user && user.id !== post.author_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFollow}
                disabled={isFollowLoading}
                className="w-full sm:w-auto"
              >
                {isFollowLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={startEditTitle}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={startEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Post Body
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={onPostDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>

        {isEditingTitle ? (
          <div className="space-y-2 mb-4">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingTitle(false)} disabled={isSavingTitle}>Cancel</Button>
              <Button size="sm" onClick={handleSaveTitle} disabled={isSavingTitle}>
                {isSavingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        )}

        {/* Post Body (HTML) */}
        {isEditingBody ? (
          <div className="space-y-2">
            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={10}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditingBody(false)}
                disabled={isSavingBody}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveBody}
                disabled={isSavingBody}
              >
                {isSavingBody ? (
                  <Loader2 className="h-4 w-4 animate-spin" /> 
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`
                prose prose-sm dark:prose-invert max-w-none
                ${needsTruncation && !isExpanded ? 'line-clamp-4' : ''}
              `}
              dangerouslySetInnerHTML={{ __html: post.body || '' }}
            />

            {needsTruncation && (
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto text-primary hover:no-underline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show more
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* Attachments (Unchanged) */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {post.attachments.map((att: any) =>
              att.file_type.startsWith('image/') ? (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={att.file_url}
                    alt={att.file_name}
                    className="rounded-md object-cover w-full h-auto max-h-80 border"
                  />
                </a>
              ) : (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center p-3 border rounded-md hover:bg-muted transition-colors"
                >
                  <FileIcon className="h-6 w-6 mr-3 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{att.file_name}</span>
                </a>
              )
            )}
          </div>
        )}

        {/* Reaction Counts (Unchanged) */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            {Object.entries(reactionGroups).map(([emoji, { count }]) => (
              <Badge
                key={emoji}
                variant={userHasReacted(emoji) ? 'default' : 'secondary'}
                className="px-2 py-1 cursor-pointer"
                onClick={() => handleReaction(emoji)}
              >
                {emoji} {count}
              </Badge>
            ))}
          </div>
        )}

        {/* --- ACTION BAR (Unchanged) --- */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
          {/* 1. React Button with Popover */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={userHasAnyReaction ? 'secondary' : 'ghost'}
                className="w-full"
                disabled={isReactionLoading || !user}
              >
                {isReactionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Smile className="h-5 w-5" />
                )}
                <span className="ml-2 hidden sm:inline">React</span>
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

          {/* 2. Comment Button (Unchanged) */}
          <Button variant="ghost" className="w-full" >
            <MessageSquare className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">
              Comment ({commentCount})
            </span>
          </Button>

          {/* 3. Share Button (Unchanged) */}
          <Button variant="ghost" className="w-full" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
