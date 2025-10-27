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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const REACTIONS = ['👍', '❤️', '🔥', '🧠', '😂'];

interface PostFeedCardProps {
  // Use a generic type that covers both PublicPost and PostOrThreadSummary
  post: PublicPost | PostOrThreadSummary;
  
  // State from parent for optimistic updates
  optimisticReactionCount?: number;
  optimisticUserReaction?: string | null;
  
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
  optimisticUserReaction,
  onReaction, 
  onFollow,
  isFollowing,
  isFollowLoading,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Normalize data between the two types ---
  const id = 'thread_id' in post ? post.thread_id : post.id;
  const title = 'thread_title' in post ? post.thread_title : post.title;
  const firstMessageId = post.first_message_id;

  // Author details
  const authorId = 'author' in post ? post.author.id : post.creator_id;
  const authorName = 'author' in post ? post.author.full_name : post.creator_full_name;
  const authorPosition = 'author' in post ? post.author.current_position : post.creator_position;
  
  // Reaction details
  const reactionCount = 'total_reaction_count' in post ? post.total_reaction_count : (post.first_message_reaction_count ?? 0);
  const userReaction = optimisticUserReaction !== undefined ? optimisticUserReaction : post.first_message_user_reaction;
  const displayReactionCount = optimisticReactionCount ?? reactionCount;

  // Preview & Attachment details
  const body = 'first_message_body' in post ? post.first_message_body : null;
  const attachments = post.attachments;
  const previewTitle = 'preview_title' in post ? post.preview_title : null;
  const previewImage = 'preview_image_url' in post ? post.preview_image_url : null;
  const previewDesc = 'preview_description' in post ? post.preview_description : null;

  const hasPreview = previewTitle || previewImage;
  const hasAttachments = attachments && attachments.length > 0;
  const bodyUrls = body?.match(URL_REGEX);
  const firstUrl = (bodyUrls && bodyUrls[0]) ? bodyUrls[0] : '#';

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
          
          <div className="line-clamp-3">
            <ShortenedBody text={body} />
          </div>
          {hasPreview && !hasAttachments && (
            <a 
              href={firstUrl}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} 
              className="block mt-3 border rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/50"
            >
              {previewImage && (
                <img src={previewImage} alt="Preview" className="w-full h-40 object-cover" />
              )}
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate">
                  {previewTitle || 'No Title'}
                </h4>
                {previewDesc && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {previewDesc}
                  </p>
                )}
              </div>
            </a>
          )}
          <AttachmentPreview attachments={post.attachments} />
          
          <div className="flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author?.profile_picture_url || ''} alt={authorName || 'Author'} />
                <AvatarFallback>{authorName?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-foreground">{authorName}</span>
                {authorPosition && <p className="text-xs">{authorPosition}</p>}
              </div>
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
        {user && firstMessageId && (
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
                {/* This toggle now works */}
                <Button variant={userReaction ? 'secondary' : 'ghost'} size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Smile className="h-4 w-4 mr-2" /> React
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1">
                <div className="flex gap-1">
                  {REACTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant={userReaction === emoji ? 'default' : 'ghost'}
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
                <span>{post.comment_count} comments</span>
              </Link>
            </Button>
            <div className="flex items-center gap-1">
              <span>Last activity: {new Date(post.last_activity_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
