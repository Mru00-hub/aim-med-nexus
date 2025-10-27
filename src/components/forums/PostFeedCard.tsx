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
function getYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

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
  const postData = post as PublicPost; // We know this page only gets PublicPost

  const id = postData.thread_id;
  const title = postData.title; // <-- Uses the simple name
  const firstMessageId = postData.first_message_id;

  // Author details
  const authorId = postData.author.id;
  const authorName = postData.author.full_name;
  const authorPosition = postData.author.current_position;

  // Reaction details
  const originalReaction = postData.first_message_user_reaction;
  const reactionCount = postData.total_reaction_count;
  const userReaction = optimisticUserReaction !== undefined 
        ? optimisticUserReaction 
        : postData.first_message_user_reaction;
  const displayReactionCount = optimisticReactionCount ?? reactionCount;

  // Preview & Attachment details
  const body = postData.first_message_body;
  const attachments = postData.attachments;
  const previewTitle = postData.preview_title;
  const previewImage = postData.preview_image_url;
  const previewDesc = postData.preview_description;

  const hasPreview = previewTitle || previewImage;
  const hasAttachments = attachments && attachments.length > 0;
  const bodyUrls = body?.match(URL_REGEX);
  const firstUrl = (bodyUrls && bodyUrls[0]) ? bodyUrls[0] : '#';
  const videoId = body ? getYouTubeVideoId(firstUrl) : null;

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
      <CardContent className="p-4 sm:p-6">
        {/* Main clickable area */}
        <div className="block cursor-pointer" onClick={handleCardClick}>
          <div className="flex items-center gap-2 mb-3"> {/* Added margin-bottom */}
            <Avatar className="h-9 w-9">
              <AvatarImage src={postData.author?.profile_picture_url || ''} alt={authorName || 'Author'} />
              <AvatarFallback>{authorName?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-sm text-foreground">{authorName}</span>
              {authorPosition && <p className="text-xs text-muted-foreground">{authorPosition}</p>}
            </div>
          </div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          
          <div className="line-clamp-3">
            <ShortenedBody text={body} />
          </div>
          {!hasAttachments && (
            <div className="mt-3">
              {videoId ? (
                // --- YOUTUBE PREVIEW ---
                <div 
                  className="block mt-3 rounded-lg overflow-hidden relative aspect-video cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(firstUrl, '_blank');
                  }}
                >
                  {/* Use the YouTube thumbnail service */}
                  <img 
                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                    alt="YouTube Preview" 
                    className="w-full h-full object-cover"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all group-hover:bg-black/40">
                    <svg className="h-12 w-12 text-white/80" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                  </div>
                </div>
              ) : hasPreview ? (
                // --- WEBSITE PREVIEW ---
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
              ) : null}
            </div>
          )}
          <AttachmentPreview attachments={post.attachments} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-4">
            <div className="flex items-center gap-1 font-medium">
              <ThumbsUp className="h-3 w-3" />
              <span>{displayReactionCount} Reactions</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{postData.comment_count} comments</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Posted: {new Date(postData.created_at).toLocaleDateString()}</span>
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
                <Button variant={userReaction ? 'secondary' : 'ghost'} size="sm" onClick={(e) => e.stopPropagation()}>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
