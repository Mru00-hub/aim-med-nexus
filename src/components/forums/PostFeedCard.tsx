// src/components/forums/PostFeedCard.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicPost, PostOrThreadSummary, SimpleAttachment } from '@/integrations/supabase/community.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageSquare, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Helper: Renders the "Show More" text
const ShortenedBody = ({ text }: { text: string | null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const isLong = text.length > 150;
  const displayText = isLong && !isExpanded ? `${text.substring(0, 150)}...` : text;

  return (
    <div className="text-sm text-muted-foreground whitespace-pre-line mb-3">
      <p>{displayText}</p>
      {isLong && (
        <Button
          variant="link"
          className="p-0 h-auto text-xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
};

// Helper: Renders attachments
const AttachmentPreview = ({ attachments }: { attachments: SimpleAttachment[] | null }) => {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="mb-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att, index) => (
          <a
            key={index}
            href={att.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 p-1.5 bg-muted rounded-md text-xs hover:bg-muted-foreground/20 transition-colors"
          >
            {att.file_type.startsWith('image/') ? (
              <img src={att.file_url} alt={att.file_name} className="h-4 w-4 rounded-sm object-cover" />
            ) : (
              <FileText className="h-3 w-3 flex-shrink-0" />
            )}
            <span className="truncate max-w-[150px]">{att.file_name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

// Main Card Component
interface PostFeedCardProps {
  post: PublicPost | PostOrThreadSummary;
  // This function allows the parent to handle optimistic updates
  onReaction: (postId: string, firstMessageId: number, currentReactionCount: number) => void;
  // This prop allows the parent to optimistically update its local state
  optimisticReactionCount?: number;
}

export const PostFeedCard: React.FC<PostFeedCardProps> = ({ 
  post, 
  onReaction, 
  optimisticReactionCount 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Normalize data between PublicPost and PostOrThreadSummary ---
  const id = 'thread_id' in post ? post.thread_id : post.id;
  const authorName = 'author_name' in post ? post.author_name : post.creator_full_name;
  const authorPosition = 'author_position' in post ? post.author_position : post.creator_position;
  const reactionCount = 'total_reaction_count' in post ? post.total_reaction_count : post.first_message_reaction_count ?? 0;
  const firstMessageId = post.first_message_id;

  // Use the optimistic count if it's provided, otherwise use the post's count
  const displayReactionCount = optimisticReactionCount ?? reactionCount;

  const handleCardClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(`/community/thread/${id}`);
    }
  };

  const handleReactionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) navigate('/login');
    if (firstMessageId) {
      onReaction(id, firstMessageId, displayReactionCount);
    }
  };

  return (
    <Card 
      key={id} 
      className="transition-all duration-300 hover:border-primary/50 hover:shadow-lg cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        {/* Post Title */}
        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        
        {/* Post Body and Attachments */}
        <ShortenedBody text={post.first_message_body} />
        <AttachmentPreview attachments={post.attachments} />
        
        <div className="flex flex-col gap-3 text-xs text-muted-foreground">
          {/* Author Info */}
          <div>
            <span className="font-medium text-foreground">{authorName}</span>
            {authorPosition && <p className="text-xs">{authorPosition}</p>}
          </div>
          
          {/* Stats & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-x-4">
              {/* Reaction Stat */}
              <div className="flex items-center gap-1 font-medium">
                <ThumbsUp className="h-3 w-3" />
                <span>{displayReactionCount} Reactions</span>
              </div>
              {/* Comment Stat */}
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{post.comment_count} comments</span>
              </div>
            </div>
            
            {/* Reaction Button */}
            {user && firstMessageId && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary"
                onClick={handleReactionClick}
              >
                <ThumbsUp className="h-4 w-4 mr-2" /> React
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
