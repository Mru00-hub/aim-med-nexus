import React from 'react';
import {
  FullPostDetails,
  MessageWithDetails,
} from '@/integrations/supabase/community.api';
import { PostContext, PostContextType } from './PostContext';
import { PostDisplay } from './PostDisplay';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';

interface PostAndCommentsViewProps {
  threadId: string;
  postDetails: FullPostDetails;
  canEdit: boolean;
  refresh: () => void;
}

export const PostAndCommentsView: React.FC<PostAndCommentsViewProps> = ({
  threadId,
  postDetails,
  canEdit,
  refresh,
}) => {
  const { post, comments } = postDetails;

  const contextValue: PostContextType = {
    // @ts-ignore
    post: post,
    refreshPost: refresh,
    canEdit: canEdit,
    threadId: threadId,
  };

  return (
    <PostContext.Provider value={contextValue}>
      {/* Centered layout, max-w-3xl is good for mobile and desktop reading */}
      <div className="max-w-3xl mx-auto">
        <PostDisplay />
        <h2 className="text-xl font-semibold mb-4">
          Comments ({comments.length})
        </h2>
        <CommentInput threadId={threadId} onCommentPosted={refresh} />
        <div className="mt-6">
          <CommentList comments={comments} />
        </div>
      </div>
    </PostContext.Provider>
  );
};

