// src/pages/community/SpaceDetailPage.tsx (Final Version)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/context/CommunityContext';
import { CreateThreadForm } from './CreateThread';
import { MemberList } from '@/components/forums/MemberList'; // The component we designed
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();

  // Step 1: Consume EVERYTHING from our powerful, centralized context
  const {
    selectedSpace,
    selectedSpaceThreads,
    selectedSpaceMemberCount,
    selectedSpaceThreadCount,
    isLoadingSelectedSpace,
    selectSpace,
    refreshSelectedSpace,
    isMemberOf
  } = useCommunity();

  const [showCreateThread, setShowCreateThread] = useState(false);

  // Step 2: Fetch all data for this space when the component mounts or ID changes
  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
    }
    // Cleanup when the user navigates away
    return () => {
      selectSpace(null);
    };
  }, [spaceId, selectSpace]);

  // Step 3: This permission logic is now simpler and more reliable
  const canCreateThread = useMemo(() => {
    if (!user || !selectedSpace) return false;
    // We can now trust isMemberOf completely
    return isMemberOf(selectedSpace.id);
  }, [user, selectedSpace, isMemberOf]);


  // Step 4: Main loading state for the entire page
  if (isLoadingSelectedSpace && !selectedSpace) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="container mx-auto py-8 px-4">
             <Skeleton className="h-24 w-full mb-8" />
             <Skeleton className="h-40 w-full" />
          </main>
          <Footer />
        </div>
    );
  }

  // Step 5: Handle the case where the space wasn't found (e.g., wrong ID, no permissions)
  if (!selectedSpace) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container mx-auto py-8 px-4 text-center">
                <p className="text-lg text-muted-foreground">Space not found or you do not have permission to view it.</p>
                <Button variant="link" onClick={() => navigate('/community')}>Return to Community Hub</Button>
            </main>
            <Footer />
        </div>
      );
  }

  // Main Render
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto py-8 px-4 flex-grow">
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-3xl">{selectedSpace.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                    {selectedSpace.description}
                    <Badge variant={selectedSpace.join_level === 'INVITE_ONLY' ? 'destructive' : 'secondary'} className="ml-2">
                        {selectedSpace.join_level === 'INVITE_ONLY' ? 'Private' : 'Open Access'}
                    </Badge>
                </div>
            </CardHeader>
        </Card>

        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Discussions</h2>
            <Button onClick={() => user ? setShowCreateThread(true) : navigate('/login')} disabled={!canCreateThread} title={!canCreateThread ? "You must be a member to start a thread here." : "Start a new discussion."}>
                <Plus className="h-4 w-4 mr-2" /> Start New Thread
            </Button>
        </div>
        
        <Tabs defaultValue="threads" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="threads">Threads ({selectedSpaceThreadCount ?? 0})</TabsTrigger>
                <TabsTrigger value="members">Members ({selectedSpaceMemberCount ?? 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="threads" className="pt-4">
              {selectedSpaceThreads.length > 0 ? (
                selectedSpaceThreads.map(thread => (
                  <Link to={`/community/thread/${thread.id}`} key={thread.id}>
                    <Card className="transition-all duration-300 hover:border-primary/50 hover:shadow-lg cursor-pointer mb-4">
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
                      <p>No threads yet. Be the first to start one!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="members" className="pt-4">
                <MemberList />
            </TabsContent>
        </Tabs>
      </main>
      <Footer />
      
      <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Thread in {selectedSpace.name}</DialogTitle>
                <DialogDescription>
                    This thread will be visible to all members of this space.
                </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
                <CreateThreadForm
                spaceId={spaceId!}
                onThreadCreated={(newThreadId) => {
                    setShowCreateThread(false);
                    selectSpace(spaceId); // Re-fetching the space data will refresh the threads
                    navigate(`/community/thread/${newThreadId}`);
                }}
                />
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
