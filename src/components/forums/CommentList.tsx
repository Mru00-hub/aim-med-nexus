import React, { useMemo } from 'react';
import { MessageWithDetails } from '@/integrations/supabase/community.api';
import { CommentItem } from './CommentItem';

// 1. ADD refreshPost and threadId to the props
interface CommentListProps {
  comments: MessageWithDetails[];
  refreshPost: () => void;
  threadId: string;
}

// Define the shape of a comment node in the tree
type CommentNode = MessageWithDetails & { children: CommentNode[] };

// 2. ACCEPT the new props here
export const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  refreshPost, 
  threadId 
}) => {
  // This builds the nested tree
  const commentTree = useMemo(() => {
    const map: { [key: number]: CommentNode } = {};
    const tree: CommentNode[] = [];

    comments.forEach((c) => {
      map[c.id] = { ...c, children: [] };
    });

    comments.forEach((c) => {
      if (c.parent_message_id && map[c.parent_message_id]) {
        map[c.parent_message_id].children.push(map[c.id]);
      } else {
        // Top-level comment
        tree.push(map[c.id]);
      }
    });
    return tree;
  }, [comments]);

  // Recursive render function
  const renderComments = (commentList: CommentNode[]) => {
    return (
      <div className="space-y-4">
        {commentList.map((comment) => (
          <div key={comment.id}>
            {/* 3. PASS the props down to CommentItem */}
            <CommentItem 
              comment={comment} 
              refreshPost={refreshPost} 
              threadId={threadId} 
            />
            {comment.children.length > 0 && (
              // This is the mobile-first nesting
              // On small screens, ml-4 is enough. On larger, ml-8.
              <div className="ml-4 sm:ml-8 mt-4 pl-2 sm:pl-4 border-l-2">
                {renderComments(comment.children)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return renderComments(commentTree);
};
