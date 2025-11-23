import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserX, MessageSquare, Loader2, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';
import { useToast } from '@/components/ui/use-toast';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { useAuth } from '@/hooks/useAuth';

// API Imports
import { 
  getMyConnections, 
  removeConnection, 
  createOrGetConversation, 
  Connection 
} from '@/integrations/supabase/social.api';
import { toggleFollow } from '@/integrations/supabase/community.api';

export const NetworkTab = ({ onConnectionRemoved }: { onConnectionRemoved?: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFollowing, refetchSocialGraph } = useSocialCounts();
  
  // --- State ---
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true); // Initial load
  const [loadingMore, setLoadingMore] = useState(false); // Pagination load
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action loading states
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);

  // --- 1. Fetch Logic ---
  const fetchConnections = useCallback(async (pageNum: number, search: string) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const limit = 20;
      // Ensure your API supports the search param!
      const newConnections = await getMyConnections(pageNum, limit, search);

      setConnections(prev => {
        if (pageNum === 1) return newConnections;
        // Filter out duplicates just in case
        const existingIds = new Set(prev.map(c => c.id));
        const uniqueNew = newConnections.filter(c => !existingIds.has(c.id));
        return [...prev, ...uniqueNew];
      });

      // If we got fewer than the limit, we've reached the end
      setHasMore(newConnections.length === limit);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load connections", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  // --- 2. Search Debounce & Reset ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Reset pagination state when search changes
      setPage(1);
      setHasMore(true); 
      fetchConnections(1, searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchConnections]);

  // --- 3. Infinite Scroll Trigger ---
  const lastConnectionRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
            const nextPage = prevPage + 1;
            fetchConnections(nextPage, searchTerm);
            return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, searchTerm, fetchConnections]);


  // --- 4. Handlers ---
  const handleFollow = useCallback(async (userId: string) => {
    if (!user) return;
    setFollowLoadingMap(prev => ({ ...prev, [userId]: true }));
    try {
      await toggleFollow(userId);
      await refetchSocialGraph(); 
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  }, [user, refetchSocialGraph, toast]);

  const handleStartConversation = async (connection: Connection) => {
    toast({ title: "Opening conversation..." });
    try {
      const conversationId = await createOrGetConversation(connection.id);
      navigate('/inbox', {
        state: {
          conversationId: conversationId,
          participant: {
            id: connection.id,
            full_name: connection.full_name,
            profile_picture_url: connection.profile_picture_url,
          }
        }
      });
    } catch (error: any) {
      toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" });
    }
  };

  const handleRemove = async (connectionId: string) => {
      try {
          await removeConnection(connectionId);
          // Optimistic UI Update: Remove locally immediately
          setConnections(prev => prev.filter(c => c.id !== connectionId));
          if (onConnectionRemoved) onConnectionRemoved();
          refetchSocialGraph(); // Update global counts
          toast({ title: "Removed", description: "Connection removed." });
      } catch (error: any) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
      }
  };

  return (
    <Card className="h-full flex flex-col min-h-[500px]">
      <CardHeader>
        <CardTitle>My Connections</CardTitle>
        <div className="relative pt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search connections..." 
            className="pl-10" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </CardHeader>
      
      <CardContent 
        className="space-y-2 flex-1 overflow-y-auto max-h-[60vh] pr-2"
      >
        {loading && page === 1 ? (
           <div className="space-y-4">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
           </div>
        ) : (
          <>
            {connections.length === 0 && !loading && (
                <div className="py-8 text-center text-muted-foreground">
                    {searchTerm ? "No connections found matching your search." : "You have no connections yet."}
                </div>
            )}

            {connections.map((conn, index) => {
              // Check if this is the last element to attach the observer
              const isLastElement = index === connections.length - 1;
              const liveIsFollowing = isFollowing(conn.id);
              const isFollowLoading = !!followLoadingMap[conn.id];

              return (
                <div key={conn.id} ref={isLastElement ? lastConnectionRef : null}>
                    <UserActionCard
                        user={{
                            id: conn.id,
                            full_name: conn.full_name,
                            profile_picture_url: conn.profile_picture_url,
                            title: conn.current_position || conn.specialization_name,
                            organization: conn.organization,
                            location: conn.location_name
                        }}
                    >
                        <Button variant="ghost" size="icon" onClick={() => handleStartConversation(conn)}>
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                        <Button
                            size="sm"
                            variant={liveIsFollowing ? "outline" : "ghost"}
                            onClick={() => handleFollow(conn.id)}
                            disabled={isFollowLoading}
                            className="w-[100px]"
                        >
                            {isFollowLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                            ) : liveIsFollowing ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Following
                            </>
                            ) : (
                            'Follow'
                            )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRemove(conn.id)}>
                            <UserX className="h-4 w-4 mr-2" />Remove
                        </Button>
                    </UserActionCard>
                </div>
              );
            })}
            
            {/* Loading spinner at bottom while fetching next page */}
            {loadingMore && (
                <div className="py-4 flex justify-center w-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {!hasMore && connections.length > 0 && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                    End of results
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
