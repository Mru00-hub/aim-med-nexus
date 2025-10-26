import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicPost, PostOrThreadSummary, SimpleAttachment } from '@/integrations/supabase/community.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThumbsUp, MessageSquare, FileText, UserPlus, Check, Loader2, Smile } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ShortenedBody } from './ShortenedBody'; // We will create this
import { AttachmentPreview } from './AttachmentPreview'; // We will create this

const REACTIONS = ['👍', '❤️', '🔥', '🧠', '😂'];

interface PostFeedCardProps {
  // Use a generic type that covers both PublicPost and PostOrThreadSummary
  post: PublicPost | PostOrThreadSummary;
  
  // State from parent for optimistic updates
  optimisticReactionCount?: number;
  
  // Handlers from parent
  onReaction: (postId: string, firstMessageId: number, emoji: string) => void;
  onFollow: (authorId: string) => void;

  // Follow button state from parent
  isFollowing: boolean;
  isFollowLoading: boolean;
}

export const PostFeedCard: React.FC<PostFeedCardProps> = ({ 
  post, 
  optimisticReactionCount,
  onReaction, 
  onFollow,
  isFollowing,
  isFollowLoading,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Normalize data between the two types ---
  const id = 'thread_id' in post ? post.thread_id : post.id;
  const authorId = 'author_id' in post ? post.author_id : post.creator_id;
  const authorName = 'author_name' in post ? post.author_name : post.creator_full_name;
  const authorPosition = 'author_position' in post ? post.author_position : post.creator_position;
  const reactionCount = 'total_reaction_count' in post ? post.total_reaction_count : post.first_message_reaction_count ?? 0;
  const firstMessageId = post.first_message_id;

  const displayReactionCount = optimisticReactionCount ?? reactionCount;
  const lastActivity = new Date(post.last_activity_at).toLocaleDateString();

  const handleCardClick = () => {
    if (!user) navigate('/login');
    else navigate(`/community/thread/${id}`);
  };

  const handleReactionClick = (e: React.MouseEvent, emoji: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firstMessageId) navigate('/login');
    else onReaction(id, firstMessageId, emoji);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) navigate('/login');
    else onFollow(authorId);
  };

  return (
    <Card 
      key={id} 
      className="transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
    >
      <CardContent className="p-6">
        {/* Main clickable area */}
        <div className="block cursor-pointer" onClick={handleCardClick}>
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
          
          <ShortenedBody text={post.first_message_body} />
          <AttachmentPreview attachments={post.attachments} />
          
          <div className="flex flex-col gap-3 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{authorName}</span>
              {authorPosition && <p className="text-xs">{authorPosition}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-1 font-medium">
                <ThumbsUp className="h-3 w-3" />
                <span>{displayReactionCount} Reactions</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{post.comment_count} comments</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Bar */}
        {user && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
            {/* Follow Button */}
            {user.id !== authorId && (
              <Button
                variant={isFollowing ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleFollowClick}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isFollowing ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
            
            {/* Reaction Button (Popover) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Smile className="h-4 w-4 mr-2" /> React
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1">
                <div className="flex gap-1">
                  {REACTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-lg rounded-full"
                      onClick={(e) => handleReactionClick(e, emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Comment Button (as a link) */}
            <Button variant="ghost" size="sm" asChild>
              <Link to={user ? `/community/thread/${id}` : '/login'}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {post.comment_count}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
