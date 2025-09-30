// src/pages/SpaceDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { getSpaceDetails, getThreadsForSpace } from '@/integrations/supabase/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Use the Thread type from your generated types
import { Database } from '@/integrations/supabase/types';
type Thread = Database['public']['Functions']['get_threads']['Returns'][number];

const SpaceDetailPage = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaceName, setSpaceName] = useState('');
  const [spaceType, setSpaceType] = useState<string>('');
  const [showThreadCreator, setShowThreadCreator] = useState(false);

  useEffect(() => {
    if (!spaceId) return;
    setLoading(true);
    Promise.all([
      getSpaceDetails(spaceId),
      getThreadsForSpace(spaceId)
    ])
      .then(([space, threads]) => {
        setSpaceName(space?.title || '');
        setSpaceType(space?.type || 'FORUM');
        setThreads(threads || []);
      })
      .finally(() => setLoading(false));
      
  }, [spaceId]);

  return (
    <>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="container-medical py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {spaceType === 'COMMUNITY_SPACE' ? 'Community Space Threads' : 'Forum Threads'}
              {' - '}{spaceName}
            </h1>
            <Button onClick={() => setShowThreadCreator(true)}>
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
      {showThreadCreator && (
        <CreateThread
          spaceId={spaceId}
          onClose={() => setShowThreadCreator(false)}
          onThreadCreated={(newThreadId) => {
            setShowThreadCreator(false);
            navigate(`/threads/${newThreadId}`);
          }}
        />
      )}
    </>
  );
};

export default SpaceDetailPage;
