// src/components/messaging/ThreadList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

import { 
  getThreadsForSpace,
  ThreadWithDetails,
  Space // Import the unified Space type
} from '@/integrations/supabase/community.api';
import { useCommunity } from '@/context/CommunityContext'; // Import context

// This component is designed to be used inside SpaceDetailPage's parent component 
// or render the list of threads for the currently selected space.

interface ThreadListProps {
  space: Space; // Now requires the unified Space object
  // NOTE: onSelectThread and activeThreadId are usually managed by the parent/router now.
}

export const ThreadList: React.FC<ThreadListProps> = ({ space }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the thread creation permission logic from the SpaceDetailPage concept
  const canCreateThread = user && space.join_level !== 'INVITE_ONLY'; 

  const fetchThreads = useCallback(async (spaceId: string) => {
    setLoading(true);
    try {
        // Use the unified getThreadsForSpace API function
        const data = await getThreadsForSpace(spaceId);
        setThreads(data || []);
    } catch (error) {
        console.error("Failed to fetch threads:", error);
        setThreads([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (space?.id) {
        fetchThreads(space.id);
    }
  }, [space, fetchThreads]); // Re-fetch whenever the space object changes

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Hash className="h-6 w-6" />
        {space.name} Threads
      </h2>
      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <Link to={user ? `/community/thread/${thread.id}` : '/login'} key={thread.id}>
              <Card className="transition-all duration-300 hover:shadow-md cursor-pointer">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-base">{thread.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Started by {thread.creator_email}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {thread.message_count} messages
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            <p>No threads in this space yet.</p>
            {canCreateThread && (
                <Button variant="link" onClick={() => navigate('/community/create-thread')} className="mt-2">
                    Start the first discussion!
                </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
