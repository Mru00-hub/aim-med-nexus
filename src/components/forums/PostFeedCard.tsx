import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicPost, PostOrThreadSummary, SimpleAttachment } from '@/integrations/supabase/community.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThumbsUp, MessageSquare, FileText, UserPlus, Check, Loader2, Smile } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ShortenedBody } from './ShortenedBody'; // We will create this
import { Avatar, AvatarFallback, AvatarImage, AvatarProfile } from "@/components/ui/avatar";
import { useSocialCounts } from '@/context/SocialCountsContext';
import { toggleFollow } from '@/integrations/supabase/community.api';
import { useToast } from "@/components/ui/use-toast";

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
}

export const PostFeedCard: React.FC<PostFeedCardProps> = ({ 
  post, 
  optimisticReactionCount,
  optimisticUserReaction,
  onReaction, 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFollowing, refetchSocialGraph } = useSocialCounts();
  const [localFollowLoading, setLocalFollowLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const isPublicPost = 'thread_id' in post;
  const title = post.title;
  const firstMessageId = post.first_message_id;
  const body = post.first_message_body;
  const attachments = post.attachments;
  const commentCount = post.comment_count;
  const createdAt = post.created_at;

  // 3. Get type-specific data
  const id = isPublicPost 
    ? (post as PublicPost).thread_id 
    : (post as PostOrThreadSummary).id;
    
  const authorId = isPublicPost 
    ? (post as PublicPost).author.id 
    : (post as PostOrThreadSummary).creator_id;
    
  const authorName = isPublicPost 
    ? (post as PublicPost).author.full_name 
    : (post as PostOrThreadSummary).creator_full_name;
    
  const authorPosition = isPublicPost 
    ? (post as PublicPost).author.current_position 
    : (post as PostOrThreadSummary).creator_position;
    
  const authorAvatar = isPublicPost 
    ? (post as PublicPost).author.profile_picture_url 
    : ''; // PostOrThreadSummary type doesn't have an avatar, so we default to empty.

  const reactionCount = isPublicPost
    ? (post as PublicPost).total_reaction_count
    : (post as PostOrThreadSummary).first_message_reaction_count ?? 0;

  const originalReaction = post.first_message_user_reaction;

  // 4. Preview logic (only PublicPost has this)
  const previewTitle = isPublicPost ? (post as PublicPost).preview_title : null;
  const previewImage = isPublicPost ? (post as PublicPost).preview_image_url : null;
  const previewDesc = isPublicPost ? (post as PublicPost).preview_description : null;

  // --- END FIX ---

  // Reaction details (This logic is now correct)
  const userReaction = optimisticUserReaction !== undefined 
        ? optimisticUserReaction 
        : originalReaction;
  const displayReactionCount = optimisticReactionCount ?? reactionCount;

  const hasPreview = previewTitle || previewImage;
  const hasAttachments = attachments && attachments.length > 0;
  const bodyUrls = body?.match(URL_REGEX);
  const firstUrl = (bodyUrls && bodyUrls[0]) ? bodyUrls[0] : '#';
  const videoId = body ? getYouTubeVideoId(firstUrl) : null;
  const liveIsFollowing = isFollowing(authorId);

  const authorProfile: AvatarProfile = useMemo(() => ({
      id: authorId,
      full_name: authorName,
      profile_picture_url: authorAvatar
  }), [authorId, authorName, authorAvatar]);

  const handleCardClick = () => {
    if (!user) navigate('/login');
    else navigate(`/community/thread/${id}`);
  };

  const handleReactionClick = (e: React.MouseEvent, emoji: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firstMessageId) navigate('/login');
    else onReaction(id, firstMessageId, emoji);
    setTimeout(() => setPopoverOpen(false), 300);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setLocalFollowLoading(true);
    try {
      await toggleFollow(authorId);
      await refetchSocialGraph(); // Refresh the global state
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLocalFollowLoading(false);
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
            <Avatar profile={authorProfile} className="h-9 w-9">
              <AvatarImage alt={authorName || 'Author'} />
              <AvatarFallback />
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
          {hasAttachments && !hasPreview && (
            <div className="mt-3">
              {attachments.length === 1 && (attachments[0].file_type.startsWith('image/') || attachments[0].file_type.startsWith('video/')) ? (
                // Single image or video - make it prominent
                <a
                  href={attachments[0].file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                  onClick={(e) => e.stopPropagation()} // Prevent card click
                >
                  {attachments[0].file_type.startsWith('image/') ? (
                    <img
                      src={attachments[0].file_url}
                      alt={attachments[0].file_name}
                      className="w-full h-auto object-cover max-h-72" // Adjust max-height as needed
                    />
                  ) : (
                    <video
                      src={attachments[0].file_url}
                      controls
                      className="w-full h-auto max-h-72 bg-black"
                    />
                  )}
                </a>
              ) : (
                // Multiple attachments or single non-image/video file - use a grid/list
                <div className="grid grid-cols-2 gap-2">
                  {attachments.slice(0, 4).map((att: SimpleAttachment) => {
                    const isImage = att.file_type.startsWith('image/');
                    const isVideo = att.file_type.startsWith('video/');

                    return (
                      <a
                        key={att.file_url}
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center p-2 border rounded-md aspect-square bg-gray-100 overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                      >
                        {isImage ? (
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : isVideo ? (
                          <video
                            src={att.file_url}
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <FileText className="h-8 w-8" />
                            <p className="text-xs text-center mt-2 truncate w-full px-1">
                              {att.file_name}
                            </p>
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
              {attachments.length > 4 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  +{attachments.length - 4} more attachments
                </p>
              )}
            </div>
          )}
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-4">
            <div className="flex items-center gap-1 font-medium">
              <ThumbsUp className="h-3 w-3" />
              <span>{displayReactionCount} Reactions</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{commentCount} comments</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Posted: {new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Action Bar */}
        {user && firstMessageId && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
            {/* Follow Button */}
            {user.id !== authorId && (
              <Button
                variant={liveIsFollowing ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleFollowClick}
                disabled={localFollowLoading}
              >
                {localFollowLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : liveIsFollowing ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {liveIsFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
            
            {/* Reaction Button (Popover) */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
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
                <span>{commentCount} comments</span>
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
