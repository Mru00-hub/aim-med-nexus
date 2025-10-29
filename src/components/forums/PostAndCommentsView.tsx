import React, { useState } from 'react';
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
  onReaction: (emoji: string) => Promise<void> | void;
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
  const [isCommentBoxVisible, setIsCommentBoxVisible] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <PostDisplay
        post={post}
        commentCount={comments.length}
        threadId={threadId}
        canEdit={canEdit}
        refresh={refresh}
        onReaction={onReaction}
        onBodyUpdate={onBodyUpdate}
        onPostDelete={onPostDelete} 
        onTitleUpdate={onTitleUpdate}
        onCommentClick={() => setIsCommentBoxVisible(prev => !prev)}
      />

      <h2 className="text-xl font-semibold mb-4">
        Comments
      </h2>
      
      {isCommentBoxVisible && (
        <CommentInput
          threadId={threadId}
          // --- THIS IS THE FIX (Part 4) - Optional ---
          // This will close the box after you post
          onCommentPosted={async (body, files, parentId) => {
            await onComment(body, files, parentId); // Call the original function
            setIsCommentBoxVisible(false); // Close the box
          }}
        />
      )}
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

