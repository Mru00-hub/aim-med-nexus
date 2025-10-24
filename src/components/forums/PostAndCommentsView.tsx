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
}

// You will also need to update PostDisplay to accept these props
interface PostDisplayProps {
  post: FullPostDetails['post'];
  threadId: string;
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

  // const contextValue: PostContextType = { ... }; // <-- REMOVED

  return (
    // <PostContext.Provider ...> // <-- REMOVED WRAPPER
    
    // Centered layout, max-w-3xl is good for mobile and desktop reading
    <div className="max-w-3xl mx-auto">
      {/* Pass data directly as props now.
        You will need to update your PostDisplay component 
        to accept these props.
      */}
      <PostDisplay
        post={post}
        threadId={threadId}
        canEdit={canEdit}
        refresh={refresh}
      />

      <h2 className="text-xl font-semibold mb-4">
        Comments ({comments.length})
      </h2>
      <CommentInput threadId={threadId} onCommentPosted={refresh} />
      <div className="mt-6">
        <CommentList comments={comments} />
      </div>
    </div>
    
    // </PostContext.Provider> // <-- REMOVED WRAPPER
  );
};

