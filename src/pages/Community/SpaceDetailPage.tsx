// src/pages/community/SpaceDetailPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Users, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/context/CommunityContext'; 
import { CreateThreadForm } from './CreateThread'; 
import { MemberList } from '@/components/forums/MemberList'; // <-- Import the component we planned
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // For better layout

// ======================================================================
// NEW: Custom Hook for fetching Threads within a Space
// ======================================================================
interface UseSpaceThreadsResult {
    threads: ThreadWithDetails[];
    isLoadingThreads: boolean;
    refreshThreads: () => void;
}

const useSpaceThreads = (spaceId: string): UseSpaceThreadsResult => {
    const { toast } = useToast();
    const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchThreads = useCallback(async () => {
        setIsLoadingThreads(true);
        try {
            const threadsData = await getThreadsForSpace(spaceId);
            setThreads(threadsData);
        } catch (error: any) {
            console.error("Failed to fetch space threads:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load discussions for this space.' });
            setThreads([]);
        } finally {
            setIsLoadingThreads(false);
        }
    }, [spaceId, toast]);

    useEffect(() => {
        if (spaceId) {
            fetchThreads();
        }
    }, [spaceId, refreshTrigger, fetchThreads]);

    const refreshThreads = () => setRefreshTrigger(prev => prev + 1);

    return { threads, isLoadingThreads, refreshThreads };
};

// ======================================================================
// NEW: Custom Hook for fetching Space Metrics (Count)
// ======================================================================
const useSpaceMetrics = (spaceId: string) => {
    const [memberCount, setMemberCount] = useState<number | null>(null);
    const [threadCount, setThreadCount] = useState<number | null>(null);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            setIsLoadingMetrics(true);
            try {
                // Use the imported API functions
                const [members, threads] = await Promise.all([
                    getSpaceMemberCount(spaceId), 
                    getThreadsCountForSpace(spaceId)
                ]); 
                setMemberCount(members);
                setThreadCount(threads);
            } catch (e) {
                console.error("Failed to fetch space metrics:", e);
                setMemberCount(null);
                setThreadCount(null);
            } finally {
                setIsLoadingMetrics(false);
            }
        };

        if (spaceId) {
            fetchMetrics();
        }
    }, [spaceId]);

    return { memberCount, threadCount, isLoadingMetrics };
};

// ======================================================================
// NEW: Custom Hook for fetching Member List (For Admin/Mod)
// ======================================================================
const useSpaceMemberList = (spaceId: string) => {
    const [memberList, setMemberList] = useState<MemberProfile[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

    useEffect(() => {
        const fetchList = async () => {
            setIsLoadingList(true);
            try {
                const list = await getSpaceMemberList(spaceId); 
                setMemberList(list);
            } catch (e) {
                // Suppress expected RLS error for non-admins/non-mods
                console.warn(`Access check: Failed to fetch full member list for ${spaceId}.`, e);
                setMemberList([]); 
            } finally {
                setIsLoadingList(false);
            }
        };

        if (spaceId) {
            fetchList();
        }
    }, [spaceId]);

    return { memberList, isLoadingList };
};

// ======================================================================
// REFACTORED SPACE DETAIL PAGE
// ======================================================================
export default function SpaceDetailPage() {
  const { user } = useAuth();
  const { spaceId } = useParams<{ spaceId: string }>();
  
  // Use the custom data hooks
  const { memberCount, threadCount, isLoadingMetrics } = useSpaceMetrics(spaceId || '');
  const { memberList, isLoadingList } = useSpaceMemberList(spaceId || '');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ----------------------------------------------------------------------
  // CONTEXT CONSUMPTION
  // ----------------------------------------------------------------------
  const { spaces, isLoadingSpaces, isMemberOf } = useCommunity();

  // Find the space object from the global context
  const space = useMemo(() => spaces.find(s => s.id === spaceId), [spaces, spaceId]);

  // Use the custom hook to fetch threads for the found space
  const { threads, isLoadingThreads, refreshThreads } = useSpaceThreads(spaceId || '');

  // Local UI State
  const [showCreateThread, setShowCreateThread] = useState(false);

  // ----------------------------------------------------------------------
  // VALIDATION & PERMISSION LOGIC
  // ----------------------------------------------------------------------
  // Combined loading state: wait for space list to load OR thread data to load
  const loading = isLoadingSpaces || !spaceId; 

  // Check if the user is allowed to post a new thread (UI side guidance)
  const canCreateThread = useMemo(() => {
    if (!user || !space) return false;
    
    // Open Forums allow posting by any authenticated user who has a membership row (even implicit)
    if (space.space_type === 'FORUM' && space.join_level === 'OPEN') return true;
    
    // Private spaces require active membership (checked via isMemberOf)
    return isMemberOf(space.id);
  }, [user, space, isMemberOf]);

  useEffect(() => {
      // Redirect if context finished loading but space wasn't found
      if (!loading && !space) {
          toast({ variant: 'destructive', title: 'Access Denied', description: 'Space not found or you do not have permission to view it.' });
          navigate('/community');
      }
  }, [loading, space, navigate, toast]);


  // ----------------------------------------------------------------------
  // RENDER COMPONENTS
  // ----------------------------------------------------------------------
  const ThreadList = () => (
    <div className="space-y-4">
      {isLoadingThreads ? (
        // Loading Skeletons for the thread list
        <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </>
      ) : threads.length > 0 ? (
        threads.map(thread => (
          <Link to={`/community/thread/${thread.id}`} key={thread.id}>
            <Card className="transition-all duration-300 hover:border-primary/50 hover:shadow-lg cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg">{thread.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {thread.message_count} messages • Started by {thread.creator_email}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                <p>No threads have been started in this space yet.</p>
                <Button 
                    variant="link" 
                    onClick={() => user && canCreateThread ? setShowCreateThread(true) : navigate('/login')} 
                    className="mt-2"
                >
                    Be the first to start one!
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto py-8 px-4 flex-grow">
        {/* Loading State: Use combined loading */}
        {loading ? (
          <>
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-8 w-1/2 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </>
        ) : space ? (
          <>
            {/* Display Space Details from Context */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-3xl">{space.name}</CardTitle>
                <div className="text-sm text-muted-foreground"> {/* This class mimics CardDescription's style */}
                    {space.description} 
                    <Badge variant={space.join_level === 'INVITE_ONLY' ? 'destructive' : 'secondary'} className="ml-2">
                        {space.join_level === 'INVITE_ONLY' ? 'Private' : 'Open Access'}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span>
                            {isLoadingMetrics ? (
                                <Skeleton className="h-4 w-16 inline-block align-middle" />
                            ) : (
                                // FIX: Removed extra asterisks
                                <>{memberCount} Active Members</>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4 text-primary" />
                        <span>
                            {isLoadingMetrics ? (
                                <Skeleton className="h-4 w-12 inline-block align-middle" />
                            ) : (
                                // FIX: Removed extra asterisks
                                <>{threadCount} Discussion Threads</>
                            )}
                        </span>
                    </div>
                </div>
    
                {/* NEW: Member List for Admins/Mods */}
                {/* RLS is the true gate, but we check if we received data */}
                {memberList.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold text-base mb-3">Space Members ({memberList.length})</h4>
                        {isLoadingList ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {/* Only display a few members, or open a modal for the full list */}
                                {memberList.slice(0, 10).map(member => (
                                    <Badge key={member.id} variant={member.role === 'ADMIN' ? 'destructive' : member.role === 'MODERATOR' ? 'secondary' : 'default'}>
                                        {member.full_name} ({member.role.slice(0, 1)})
                                    </Badge>
                                ))}
                                {memberList.length > 10 && <span className="text-xs text-muted-foreground self-center ml-1">+{memberList.length - 10} more</span>}
                            </div>
                          )}
                      </div>
                  )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Hash className="h-6 w-6" />
                Threads
              </h2>
              {/* Conditional Button: Disable if user cannot post */}
              <Button 
                onClick={() => user ? setShowCreateThread(true) : navigate('/login')}
                disabled={!canCreateThread}
                title={!canCreateThread ? "You must be a member to start a thread here." : "Start a new discussion."}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Thread
              </Button>
            </div>
            
            <ThreadList />
          </>
        ) : (
            <div className="text-center">
                <p className="text-lg text-muted-foreground">Space not found or unauthorized access attempt.</p>
            </div>
        )}
      </main>
      <Footer />
      
      {/* Create Thread Dialog */}
      <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Thread in {space?.name}</DialogTitle>
            <DialogDescription>
                {space?.join_level === 'INVITE_ONLY' 
                    ? 'This thread will only be visible to members of this private space.' 
                    : 'This thread will be visible to all members.'}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <CreateThreadForm
              spaceId={spaceId!} // spaceId is guaranteed to exist here
              onThreadCreated={(newThreadId) => {
                setShowCreateThread(false);
                refreshThreads(); // <--- REFRESH THREADS AFTER CREATION
                navigate(`/community/thread/${newThreadId}`);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
