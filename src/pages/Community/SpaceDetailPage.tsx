// src/pages/community/SpaceDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Users, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// STEP 1: Update Imports and Types
import {
  getSpaceDetails,
  getThreadsForSpace,
  Forum,
  CommunitySpace,
  ThreadWithDetails
} from '@/integrations/supabase/community.api';
import { CreateThreadForm } from './CreateThread';

type Space = Forum | CommunitySpace;

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const { spaceId } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // STEP 2: Update State Management
  const [space, setSpace] = useState<Space | null | undefined>(null);
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateThread, setShowCreateThread] = useState(false);

  // STEP 3: Update Data Fetching with spaceType from URL
  useEffect(() => {
    // Determine the space type from the URL query parameter
    const typeParam = searchParams.get('type');
    const spaceType = typeParam === 'forum' ? 'FORUM' : 'COMMUNITY_SPACE';

    if (!spaceId) {
      navigate('/community'); // Redirect if no ID is provided
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [spaceData, threadsData] = await Promise.all([
          getSpaceDetails(spaceId, spaceType),
          getThreadsForSpace(spaceId, spaceType)
        ]);
        
        if (!spaceData) {
          toast({ variant: 'destructive', title: 'Error', description: 'This space could not be found.' });
          navigate('/community');
          return;
        }

        setSpace(spaceData);
        setThreads(threadsData);
      } catch (error: any) {
        console.error("Failed to fetch space details:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [spaceId, searchParams, navigate, toast]);

  const ThreadList = () => (
    <div className="space-y-4">
      {threads.length > 0 ? (
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
                <Button variant="link" onClick={() => user ? setShowCreateThread(true) : navigate('/login')} className="mt-2">
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
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-8 w-1/2 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </>
        ) : space ? (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-3xl">{space.name}</CardTitle>
                <CardDescription>{space.description}</CardDescription>
              </CardHeader>
              <CardContent>
                  {/* Future: Add member list and other details here */}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Hash className="h-6 w-6" />
                Threads
              </h2>
              <Button onClick={() => user ? setShowCreateThread(true) : navigate('/login')}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Thread
              </Button>
            </div>
            
            <ThreadList />
          </>
        ) : (
            <div className="text-center">
                <p className="text-lg text-muted-foreground">Space not found.</p>
            </div>
        )}
      </main>
      <Footer />
      <Dialog open={showCreateThread} onOpenChange={setShowCreateThread}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Thread in {space?.name}</DialogTitle>
            <DialogDescription>This thread will only be visible to members of this space.</DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <CreateThreadForm
              spaceId={spaceId}
              spaceType={searchParams.get('type') === 'forum' ? 'FORUM' : 'COMMUNITY_SPACE'}
              onThreadCreated={(newThreadId) => {
                setShowCreateThread(false);
                navigate(`/community/thread/${newThreadId}`);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
