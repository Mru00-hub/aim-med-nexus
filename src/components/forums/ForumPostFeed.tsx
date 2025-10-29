import React, { useState, useEffect, useCallback } from 'react';
import { PostOrThreadSummary, getThreadsForSpace, toggleReaction, toggleFollow } from '@/integrations/supabase/community.api';
import { PostFeedCard } from '@/components/forums/PostFeedCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useSocialCounts } from '@/context/SocialCountsContext';

const POSTS_PER_PAGE = 10;

interface ForumPostFeedProps {
  spaceId: string;
  refreshKey: number;
}

export const ForumPostFeed: React.FC<ForumPostFeedProps> = ({ spaceId, refreshKey }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [posts, setPosts] = useState<PostOrThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [optimisticReactions, setOptimisticReactions] = useState<Record<string, number>>({});
  const [optimisticUserReactions, setOptimisticUserReactions] = useState<Record<string, string | null>>({});
  
  // Note: Follow logic is handled at the parent (Forums.tsx) level
  // This feed component doesn't know about "following"

  const loadPosts = useCallback(async (page: number) => {
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const newPosts = await getThreadsForSpace({ 
        spaceId: spaceId, 
        page: page, 
        limit: POSTS_PER_PAGE 
      });
      setPosts(prev => page === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
      setCurrentPage(page);
    } catch (error: any) {
      toast({ title: 'Error loading posts', description: error.message, variant: 'destructive' });
    } finally {
      if (page === 1) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  }, [spaceId, toast]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts, refreshKey]); // Reload if onPostCreated changes (i.e., a post is created)

  const handleOptimisticReaction = useCallback(async (
    postId: string, 
    firstMessageId: number,
    emoji: string
  ) => {
    if (!user) { navigate('/login'); return; }

    const post = posts.find(p => p.id === postId); // Note: 'p.id' is correct for this component
    if (!post) return;

    // 1. Get original state for reverting on failure
    const originalReaction = post.first_message_user_reaction;
    const originalCount = post.first_message_reaction_count ?? 0;

    // 2. Determine the *current* state (checking optimistic state first)
    const currentReaction = optimisticUserReactions.hasOwnProperty(postId)
      ? optimisticUserReactions[postId]
      : originalReaction;
    
    const currentCount = optimisticReactions.hasOwnProperty(postId)
      ? optimisticReactions[postId]
      : originalCount;

    // 3. Determine the *next* state
    let nextReaction: string | null;
    let nextCount: number;

    if (currentReaction === emoji) {
      nextReaction = null;
      nextCount = currentCount - 1;
    } else if (currentReaction && currentReaction !== emoji) {
      nextReaction = emoji;
      nextCount = currentCount; // Count stays the same
    } else {
      nextReaction = emoji;
      nextCount = currentCount + 1;
    }

    // 4. Set optimistic state for both
    setOptimisticUserReactions(prev => ({ ...prev, [postId]: nextReaction }));
    setOptimisticReactions(prev => ({ ...prev, [postId]: nextCount }));
  
    try {
      await toggleReaction(firstMessageId, emoji);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      // 6. Revert on failure
      setOptimisticUserReactions(prev => ({ ...prev, [postId]: originalReaction }));
      setOptimisticReactions(prev => ({ ...prev, [postId]: originalCount }));
    }
  }, [user, navigate, toast, posts, optimisticUserReactions, optimisticReactions]);

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostFeedCard 
          key={post.id}
          post={post}
          onReaction={handleOptimisticReaction}
          optimisticReactionCount={optimisticReactions[post.id]}
          optimisticUserReaction={optimisticUserReactions[post.id]}
        />
      ))}
      {hasMorePosts && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => loadPosts(currentPage + 1)}
            disabled={isLoadingMore}
          >
            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Show More Posts
          </Button>
        </div>
      )}
      {!hasMorePosts && posts.length > POSTS_PER_PAGE && (
        <p className="text-sm text-center text-muted-foreground mt-6">You've reached the end.</p>
      )}
    </div>
  );
};
