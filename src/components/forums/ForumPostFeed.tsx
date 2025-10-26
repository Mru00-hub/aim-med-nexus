import React, { useState, useEffect, useCallback } from 'react';
import { PostOrThreadSummary, getThreadsForSpace, toggleReaction } from '@/integrations/supabase/community.api';
import { PostFeedCard } from '@/components/forums/PostFeedCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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

    setOptimisticReactions(prev => {
      const currentCount = prev[postId] ?? posts.find(p => p.id === postId)?.first_message_reaction_count ?? 0;
      return { ...prev, [postId]: currentCount + 1 };
    });
  
    try {
      await toggleReaction(firstMessageId, emoji);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      setOptimisticReactions(prev => {
        const originalCount = posts.find(p => p.id === postId)?.first_message_reaction_count ?? 0;
        return { ...prev, [postId]: originalCount };
      });
    }
  }, [user, navigate, toast, posts]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No posts have been started in this forum yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostFeedCard 
          key={post.id}
          post={post}
          onReaction={handleOptimisticReaction}
          optimisticReactionCount={optimisticReactions[post.id]}
          // Follow logic is not implemented in this feed
          onFollow={() => {}} 
          isFollowing={false}
          isFollowLoading={false}
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
