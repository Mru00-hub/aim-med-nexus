import React, { useMemo, useEffect, useRef } from 'react';
import { MessageWithDetails } from '@/integrations/supabase/community.api';
import { CommentItem } from './CommentItem';
type CommentNode = MessageWithDetails & { children: CommentNode[] };
// 1. ADD refreshPost and threadId to the props
interface CommentListProps {
  comments: MessageWithDetails[];
  threadId: string;
  onComment: (body: string, files: File[], parentMessageId?: number | null) => Promise<void>; 
  onCommentReaction: (commentId: number, emoji: string) => void;
  onCommentEdit: (commentId: number, newBody: string) => void;
  onCommentDelete: (commentId: number) => void;
}

// 2. ACCEPT the new props here
export const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  threadId,
  onComment,
  onCommentReaction,
  onCommentEdit,
  onCommentDelete
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const scrollToBottom = () => {
    // We use 'auto' behavior. 'smooth' can be laggy and 
    // get interrupted by other renders. 'auto' is instant.
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments.length]); 

  // Recursive render function
  const renderComments = (commentList: CommentNode[], depth: number) => {
    return (
      <div className="space-y-4">
        {commentList.map((comment) => (
          <div key={comment.id}>
            {/* 3. PASS the props down to CommentItem */}
            <CommentItem 
              comment={comment} 
              threadId={threadId} 
              depth={depth}
              onComment={onComment}
              onCommentReaction={onCommentReaction}
              onCommentEdit={onCommentEdit}
              onCommentDelete={onCommentDelete}
            />
            {comment.children.length > 0 && depth < 5 && (
              <div className="ml-4 sm:ml-8 mt-4 pl-2 sm:pl-4 border-l-2">
                {renderComments(comment.children, depth + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {renderComments(commentTree, 1)}
      <div ref={messagesEndRef} />
    </div>
  );
};
