// src/pages/SpaceDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { getSpaceDetails, getThreadsForSpace } from '@/integrations/supabase/api'; // Use our existing function
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Use the Thread type from your generated types
import { Database } from '@/integrations/supabase/types';
type Thread = Database['public']['Functions']['get_threads']['Returns'][number];

const SpaceDetailPage = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaceName, setSpaceName] = useState(''); // You'd fetch this too

  useEffect(() => {
    if (!spaceId) return;
    Promise.all([
      getSpaceDetails(spaceId),

    // In a real app, you'd fetch space details (like its name) first.
    // For now, we'll just fetch the threads.
    // The 'FORUM' type might need to be dynamic if you have Community Spaces.
      getThreadsForSpace(spaceId)
    ])
      .then(([space, threads]) => {
        setSpaceName(space?.title || '');
        setThreads(data || []);
      })
      .finally(() => setLoading(false));
      
  }, [spaceId]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="container-medical py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{spaceName || 'Forum Threads'}</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Start New Thread
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map(thread => (
              <Link to={`/threads/${thread.id}`} key={thread.id}>
                <Card className="card-medical hover:shadow-hover transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg">{thread.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {thread.message_count} messages • Created by {thread.creator_email}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SpaceDetailPage;
