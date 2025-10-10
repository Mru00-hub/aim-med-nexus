// src/pages/community/SpaceDetailPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Users, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// --- NEW IMPORTS ---
import { useCommunity } from '@/context/CommunityContext'; 
import { useSpaceThreads, useSpaceMetrics, useSpaceMemberList } from '@/hooks/useSpaceData';
import { CreateThreadForm } from './CreateThread'; 


export default function SpaceDetailPage() {
  const { user } = useAuth();
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // --- DATA FETCHING ---
  // 1. Get GLOBAL data from the context
  const { spaces, isLoadingSpaces, isMemberOf } = useCommunity();
  // 2. Get LOCAL data for this page using our dedicated hooks
  const { threads, isLoadingThreads, refreshThreads } = useSpaceThreads(spaceId);
  const { memberCount, threadCount, isLoadingMetrics } = useSpaceMetrics(spaceId);
  const { memberList, isLoadingList } = useSpaceMemberList(spaceId);

  // Find the specific space details from the global list
  const space = useMemo(() => spaces.find(s => s.id === spaceId), [spaces, spaceId]);

  // --- UI STATE ---
  const [showCreateThread, setShowCreateThread] = useState(false);

  // --- LOGIC & EFFECTS ---
  const loading = isLoadingSpaces || !spaceId; // Initial loading is for the master list

  const canCreateThread = useMemo(() => {
    if (!user || !space) return false;
    if (space.space_type === 'FORUM' && space.join_level === 'OPEN') return true;
    return isMemberOf(space.id);
  }, [user, space, isMemberOf]);

  useEffect(() => {
      if (!isLoadingSpaces && !space) {
          toast({ variant: 'destructive', title: 'Not Found', description: 'This space does not exist or you may not have permission to view it.' });
          navigate('/community');
      }
  }, [isLoadingSpaces, space, navigate, toast]);

  // --- RENDER LOGIC ---
  // This is the same as your original file, just using the hooks cleanly.
  // ... (All your render logic like ThreadList, skeletons, etc. is preserved below)

  const ThreadList = () => (
    <div className="space-y-4">
      {isLoadingThreads ? (
        <>
            <Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" />
        </>
      ) : threads.length > 0 ? (
        threads.map(thread => (
          <Link to={`/community/thread/${thread.id}`} key={thread.id}>
            <Card className="transition-all duration-300 hover:border-primary/50 hover:shadow-lg cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg">{thread.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {thread.message_count} messages • Started by {thread.creator_full_name}
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
        {loading ? (
          <>
            <Skeleton className="h-12 w-3/4 mb-4" /><Skeleton className="h-8 w-1/2 mb-8" />
            <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
          </>
        ) : space ? (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-3xl">{space.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                    {space.description} 
                    <Badge variant={space.join_level === 'INVITE_ONLY' ? 'destructive' : 'secondary'} className="ml-2">
                        {space.join_level === 'INVITE_ONLY' ? 'Private' : 'Open Access'}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Users className="h-4 w-4 text-primary" />
                        <span>{isLoadingMetrics ? <Skeleton className="h-4 w-16 inline-block" /> : <>{memberCount} Active Members</>}</span>
                    </div>
                    <div className="flex items-center gap-1"><Hash className="h-4 w-4 text-primary" />
                        <span>{isLoadingMetrics ? <Skeleton className="h-4 w-12 inline-block" /> : <>{threadCount} Discussion Threads</>}</span>
                    </div>
                </div>
                {memberList.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold text-base mb-3">Space Members ({memberList.length})</h4>
                        {isLoadingList ? (<Skeleton className="h-10 w-full" />) : (
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
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
              <h2 className="text-2xl font-semibold flex items-center gap-2"><Hash className="h-6 w-6" />Threads</h2>
              <Button onClick={() => user ? setShowCreateThread(true) : navigate('/login')} disabled={!canCreateThread} title={!canCreateThread ? "You must be a member to start a thread here." : "Start a new discussion."}>
                <Plus className="h-4 w-4 mr-2" />Start New Thread
              </Button>
            </div>
            <ThreadList />
          </>
        ) : (
            <div className="text-center"><p className="text-lg text-muted-foreground">Space not found.</p></div>
        )}
      </main>
      <Footer />
      {/* FIX: Conditionally render the Dialog only when 'space' exists */}
      {space && (
        <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Thread in {space.name}</DialogTitle>
              <DialogDescription>
                  {space.join_level === 'INVITE_ONLY' ? 'This thread will only be visible to members of this private space.' : 'This thread will be visible to all members.'}
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              {/* FIX: Pass the guaranteed 'space.id' instead of the unsafe 'spaceId!' */}
              <CreateThreadForm spaceId={space.id} onThreadCreated={(newThreadId) => {
                  setShowCreateThread(false);
                  refreshThreads();
                  navigate(`/community/thread/${newThreadId}`);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
