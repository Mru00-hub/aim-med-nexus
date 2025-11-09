// src/pages/community/Forums.tsx

import React, { useState, useMemo, useEffect, useCallback} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { SpaceCreator } from '@/components/forums/SpaceCreator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { useCommunity } from '@/context/CommunityContext';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { Enums } from '@/integrations/supabase/types';
import {
  SpaceWithDetails, 
  createSpace,
  PublicPost,
  requestToJoinSpace,
  joinSpaceAsMember,
  toggleFollow,
  toggleReaction,
  getPublicThreads,
} from '@/integrations/supabase/community.api';
import { PostFeedCard } from '@/components/forums/PostFeedCard';
import { SpaceCard } from '@/components/forums/SpaceCard';
import { Skeleton } from '@/components/ui/skeleton';
const POSTS_PER_PAGE = 4;
const SPACES_PER_PAGE = 9;

export default function Forums() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { 
    refreshSpaces, 
    getMembershipStatus,
    setMemberships, 
    loadSpacesPage, 
  } = useCommunity();
  
  const { isFollowing, refetchSocialGraph } = useSocialCounts();
  const [showSpaceCreator, setShowSpaceCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  // Add state for optimistic updates
  
  const [optimisticReactions, setOptimisticReactions] = useState<Record<string, number>>({});
  const [optimisticUserReactions, setOptimisticUserReactions] = useState<Record<string, string | null>>({});
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [spaces, setSpaces] = useState<SpaceWithDetails[]>([]); // New local state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true); // Now local
  const [isLoadingMoreSpaces, setIsLoadingMoreSpaces] = useState(false);
  const [currentSpacePage, setCurrentSpacePage] = useState(1);
  const [hasMoreSpaces, setHasMoreSpaces] = useState(true);

  const loadSpaces = useCallback(async (page: number) => {
    if (page === 1) setIsLoadingSpaces(true);
    else setIsLoadingMoreSpaces(true);

    try {
      const newSpaces = await loadSpacesPage({
        page, 
        limit: SPACES_PER_PAGE,
        searchQuery: searchQuery,
        filter: selectedFilter
      }); 
      setSpaces(prev => page === 1 ? newSpaces : [...prev, ...newSpaces]);
      setHasMoreSpaces(newSpaces.length === SPACES_PER_PAGE);
      setCurrentSpacePage(page);

    } catch (error: any) {
      toast({ title: 'Error loading spaces', description: error.message, variant: 'destructive' });
    } finally {
      if (page === 1) setIsLoadingSpaces(false);
      else setIsLoadingMoreSpaces(false);
    }
  }, [toast, loadSpacesPage, searchQuery, selectedFilter]); // Depend on loadSpacesPage

  useEffect(() => {
    loadSpaces(1);
  }, [loadSpaces]);

  const loadPosts = useCallback(async (page: number) => {
    if (page === 1) setIsLoadingPosts(true);
    else setIsLoadingMore(true);

    try {
      const newPosts = await getPublicThreads({ 
        page, 
        limit: POSTS_PER_PAGE,
        searchQuery: threadSearchQuery 
      });
      setPosts(prev => page === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
      setCurrentPage(page);

    } catch (error: any) {
      toast({ title: 'Error loading posts', description: error.message, variant: 'destructive' });
    } finally {
      if (page === 1) setIsLoadingPosts(false);
      else setIsLoadingMore(false);
    }
  }, [toast, threadSearchQuery]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const handleCreateSpace = async (data: {
    name: string;
    description?: string;
    space_type: 'FORUM' | 'COMMUNITY_SPACE';
    join_level: Enums<'space_join_level'>;
  }) => {
    if (!user) return;
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticSpace: SpaceWithDetails = {
      ...data,
      id: tempId,
      created_at: new Date().toISOString(),
      creator_id: user.id,
      creator_full_name: user.user_metadata.full_name || 'You',
      moderators: [], 
      member_count: 1, 
      thread_count: 0,
      last_activity_at: new Date().toISOString(),
      creator_position: null,
      creator_organization: null,
      creator_specialization: null,
    };

    setSpaces(currentSpaces => [optimisticSpace, ...currentSpaces]);
    setShowSpaceCreator(false);
    
    try {
      await createSpace(data);
      await refreshSpaces(); 
      // 🚀 CHANGE: Remove temp space from local state
      setSpaces(currentSpaces => currentSpaces.filter(s => s.id !== tempId));
      // 🚀 CHANGE: Reload first page instead of calling refreshSpaces()
      loadSpaces(1); 
      toast({ title: 'Success!', description: `The space "${data.name}" has been created.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
      // 🚀 CHANGE: Revert local state on failure
      setSpaces(currentSpaces => currentSpaces.filter(s => s.id !== tempId));
    } 
  };
  
  const handleJoin = async (space: SpaceWithDetails) => {
    if (!user) {
      navigate('/login');
      return;
    }
    toast({ title: 'Processing...', description: `Requesting to join ${space.name}.` });
    try {
      if (space.join_level === 'OPEN') {
        await joinSpaceAsMember(space.id);
        toast({ title: 'Success!', description: `You have joined ${space.name}.` });
        await refreshSpaces();
        loadSpaces(1); 
      } else { 
        await requestToJoinSpace(space.id);
        toast({ title: 'Request Sent', description: `Your request to join ${space.name} is pending approval.` });
        setMemberships(prev => [
          ...prev,
          {
            space_id: space.id,
            user_id: user.id,
            status: 'PENDING',
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: 'MEMBER',
          }
        ]);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleOptimisticReaction = useCallback(async (
    postId: string, 
    firstMessageId: number,
    emoji: string
  ) => {
    if (!user) { navigate('/login'); return; }

    const post = posts.find(p => p.thread_id === postId);
    if (!post) return;

    // 1. Get original state for reverting on failure
    const originalReaction = post.first_message_user_reaction;
    const originalCount = post.total_reaction_count;

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
      // Case 1: Un-reacting (clicking the same emoji)
      nextReaction = null;
      nextCount = currentCount - 1;
    } else if (currentReaction && currentReaction !== emoji) {
      // Case 2: Changing reaction (e.g., from 👍 to ❤️)
      nextReaction = emoji;
      nextCount = currentCount; // Count stays the same
    } else {
      // Case 3: Adding a new reaction
      nextReaction = emoji;
      nextCount = currentCount + 1;
    }

    // 4. Set optimistic state for both reaction and count
    setOptimisticUserReactions(prev => ({ ...prev, [postId]: nextReaction }));
    setOptimisticReactions(prev => ({ ...prev, [postId]: nextCount }));
  
    try {
      // 5. Call the API
      await toggleReaction(firstMessageId, emoji);
      // Success! The optimistic state is now the "real" state until a refresh.
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      
      // 6. Revert on failure
      setOptimisticUserReactions(prev => ({ ...prev, [postId]: originalReaction }));
      setOptimisticReactions(prev => ({ ...prev, [postId]: originalCount }));
    }
  }, [user, navigate, toast, posts, optimisticUserReactions, optimisticReactions]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Community Hub</h1>
          <p className="text-lg text-muted-foreground">Discover spaces, join discussions, and engage with your peers.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search spaces..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10" 
                />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="md:w-56">
                  <SelectValue placeholder="Filter by type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Spaces</SelectItem>
                  <SelectItem value="FORUM">Forums Only</SelectItem>
                  <SelectItem value="COMMUNITY_SPACE">Community Spaces Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Discover Spaces</h2>
            <Button 
              size="sm" 
              onClick={() => user ? setShowSpaceCreator(true) : navigate('/login')}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Space
            </Button>
          </div>
          {isLoadingSpaces ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : spaces.length === 0 ? ( // 🚀 CHANGE
            <p className="text-center text-muted-foreground py-4">No spaces match your criteria.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 🚀 CHANGE: Map over local 'spaces' state directly */}
              {spaces
                .filter(space => space.space_type !== 'PUBLIC') // Keep client-side 'PUBLIC' filter
                .map(space => ( 
                <SpaceCard 
                  key={space.id}
                  space={space}
                  membershipStatus={getMembershipStatus(space.id)}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          )}
          <div className="mt-6 text-center">
            {hasMoreSpaces && !isLoadingSpaces && (
              <Button
                variant="outline"
                onClick={() => loadSpaces(currentSpacePage + 1)}
                disabled={isLoadingMoreSpaces}
              >
                {isLoadingMoreSpaces && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoadingMoreSpaces ? 'Loading...' : 'Show More Spaces'}
              </Button>
            )}
            {!hasMoreSpaces && spaces.length > SPACES_PER_PAGE && (
              <p className="text-sm text-muted-foreground">You've reached the end of spaces.</p>
            )}
          </div>
        </section>
        <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Public Posts</h2>
            <Button 
              size="sm" 
              // CHANGED: This now links to our new Create Post page
              onClick={() => user ? navigate(`/community/create-post`) : navigate('/login')}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Post
            </Button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search public posts..." // CHANGED
              value={threadSearchQuery} 
              onChange={(e) => setThreadSearchQuery(e.target.value)} 
              className="pl-10" 
            />
          </div>
          
          {isLoadingPosts ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : posts.length === 0 ? ( // 🚀 CHANGE
            <p className="text-center text-muted-foreground py-4">No public posts match your search.</p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => {
                const authorId = 'author_id' in post ? post.author_id : post.creator_id;
                return (
                  <PostFeedCard 
                    key={post.thread_id} 
                    post={post}
                    onReaction={handleOptimisticReaction}
                    optimisticReactionCount={optimisticReactions[post.thread_id]}
                    optimisticUserReaction={optimisticUserReactions[post.thread_id]}
                  />
                );
           
            })}
            </div>
          )}

          {/* --- 12. ADD "Show More" Button --- */}
          <div className="mt-6 text-center">
            {hasMorePosts && !isLoadingPosts && (
              <Button
                variant="outline"
                onClick={() => loadPosts(currentPage + 1)}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoadingMore ? 'Loading...' : 'Show More Posts'}
              </Button>
            )}
            {!hasMorePosts && posts.length > POSTS_PER_PAGE && (
              <p className="text-sm text-muted-foreground">You've reached the end.</p>
            )}
          </div>

        </section>
      </main>
      <Footer />
      {user && (
        <SpaceCreator
          isOpen={showSpaceCreator}
          onClose={() => setShowSpaceCreator(false)}
          onSubmit={handleCreateSpace}
        />
      )}
    </div>
  );
}
