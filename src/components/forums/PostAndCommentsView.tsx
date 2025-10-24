import React from 'react';
import {
  FullPostDetails,
  // MessageWithDetails is not used, could be removed
} from '@/integrations/supabase/community.api';
// import { PostContext, PostContextType } from './PostContext'; // <-- REMOVED
import { PostDisplay } from './PostDisplay';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';

interface PostAndCommentsViewProps {
  threadId: string;
  postDetails: FullPostDetails;
  canEdit: boolean;
  refresh: () => void;
  onReaction: (emoji: string) => void;
  onComment: (body: string, files: File[], parentMessageId?: number | null) => void; 
  onCommentReaction: (commentId: number, emoji: string) => void; 
  onCommentEdit: (commentId: number, newBody: string) => void; 
  onCommentDelete: (commentId: number) => void;        
  onBodyUpdate: (newBody: string) => void;
  onPostDelete: () => void;
  onTitleUpdate: (newTitle: string) => void; 
}

export const PostAndCommentsView: React.FC<PostAndCommentsViewProps> = ({
  threadId,
  postDetails,
  canEdit,
  refresh,
  onReaction,
  onComment,
  onCommentReaction, // <-- ADDED
  onCommentEdit,     // <-- ADDED
  onCommentDelete,   // <-- ADDED
  onBodyUpdate,
  onTitleUpdate,
  onPostDelete, 
}) => {
  const { post, comments } = postDetails;

  return (
    <div className="max-w-3xl mx-auto">
      <PostDisplay
        post={post}
        threadId={threadId}
        canEdit={canEdit}
        refresh={refresh}
        onReaction={onReaction}
        onBodyUpdate={onBodyUpdate}
        onPostDelete={onPostDelete} 
        onTitleUpdate={onTitleUpdate}
      />

      <h2 className="text-xl font-semibold mb-4">
        Comments ({comments.length})
      </h2>
      <CommentInput threadId={threadId} onCommentPosted={onComment} />
      <div className="mt-6">
        <CommentList 
          comments={comments}
          threadId={threadId} 
          onComment={onComment}
          onCommentReaction={onCommentReaction}
          onCommentEdit={onCommentEdit}
          onCommentDelete={onCommentDelete}
        />
      </div>
    </div>
  );
};

