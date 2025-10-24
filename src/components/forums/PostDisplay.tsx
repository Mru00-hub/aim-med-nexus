import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePostContext } from './PostContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
// CHANGED: Added Popover components and Smile icon
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
  Smile, // CHANGED: Added Smile
} from 'lucide-react';
import {
  toggleFollow,
  toggleReaction,
} from '@/integrations/supabase/community.api';

// CHANGED: Define our standard list of reactions
const REACTIONS = ['👍', '❤️', '🔥', '🧠', '😂'];

// Helper to group reactions
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

export const PostDisplay = () => {
  const { post, refreshPost } = usePostContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  // State to control the reaction popover
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Note: You'd fetch the user's actual follow status on load
  // useEffect(() => { ... fetch follow status ... }, [post.author_id, user.id]);

  const reactionGroups = useMemo(() => groupReactions(post.reactions), [
    post.reactions,
  ]);

  const handleFollow = async () => {
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
      await toggleReaction(post.first_message_id, emoji);
      refreshPost(); // Re-fetch to update counts
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsReactionLoading(false);
      // We don't close the popover, allowing multiple reactions
    }
  };

  // Check if the current user has reacted with a specific emoji
  const userHasReacted = (emoji: string) => {
    if (!user || !reactionGroups[emoji]) return false;
    return reactionGroups[emoji].users.includes(user.id);
  };

  // Check if the user has *any* reaction
  const userHasAnyReaction = useMemo(() => {
    if (!user) return false;
    return REACTIONS.some((emoji) => userHasReacted(emoji));
  }, [user, reactionGroups]);

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4 sm:p-6">
        {/* Author Info & Follow Button (Unchanged) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
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

        {/* Post Body (Unchanged) */}
        {/* ... */}

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

        {/* --- CHANGED: ACTION BAR --- */}
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
          <Button variant="ghost" className="w-full">
            <MessageSquare className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">
              Comment ({post.comment_count})
            </span>
          </Button>

          {/* 3. Share Button (Unchanged) */}
          <Button variant="ghost" className="w-full">
            <Share2 className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
