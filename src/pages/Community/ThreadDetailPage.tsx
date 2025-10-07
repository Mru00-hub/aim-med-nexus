// src/pages/community/ThreadDetailPage.tsx

import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThreadView } from '@/components/messaging/ThreadView'; // We will put all the logic here
import AuthGuard from '@/components/AuthGuard'; // Protect this page
import { useEffect, useState } from 'react';
import { getThreadDetails } from '@/integrations/supabase/community.api';
import { Skeleton } from '@/components/ui/skeleton';

type ThreadDetails = {
  title: string;
  description: string | null;
  spaceName: string | null;
};

export default function ThreadDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [threadDetails, setThreadDetails] = useState<ThreadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!threadId) return;
    
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const data = await getThreadDetails(threadId);
        if (data) {
          setThreadDetails({
            title: data.title,
            description: data.description,
            spaceName: data.spaces?.name || 'Public Thread'
          });
        }
      } catch (error) {
        console.error("Failed to fetch thread details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [threadId]);

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto flex flex-col py-4 px-4">
          <header>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : threadDetails ? (
              <>
                <p className="text-sm text-muted-foreground">{threadDetails.spaceName}</p>
                <h1 className="text-3xl font-bold tracking-tight">{threadDetails.title}</h1>
                {threadDetails.description && (
                  <p className="mt-2 text-lg text-muted-foreground">{threadDetails.description}</p>
                )}
              </>
            ) : (
              <p>Thread not found.</p>
            )}
          </header>
          {/* All the chat logic is encapsulated in the ThreadView component */}
          <div className="flex-1">
            <ThreadView threadId={threadId!} />
          </div>
        </main>
    </AuthGuard>
  );
};
