// src/components/messaging/ThreadList.tsx
import { useState, useEffect } from 'react';
import { getThreads } from '@/integrations/supabase/api';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import type { Space } from './SpaceSidebar';

// Define the Thread type based on the get_threads function return type
type Thread = Database['public']['Functions']['get_threads']['Returns'][number];

interface ThreadListProps {
  space: Space | null;
  onSelectThread: (threadId: string) => void;
  activeThreadId: string | null;
}

export const ThreadList = ({ space, onSelectThread, activeThreadId }: ThreadListProps) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!space) return;

    const fetchThreads = async () => {
      setLoading(true);
      const containerId = space.type === 'GLOBAL' ? null : space.id;
      const containerType = space.type === 'GLOBAL' ? null : space.type;
      const data = await getThreads(containerId, containerType);
      setThreads(data || []);
      setLoading(false);
    };

    fetchThreads();
  }, [space]);

  if (!space) return null;

  if (loading) {
    return <div className="p-2 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>;
  }

  return (
    <div className="p-2">
      <h2 className="font-bold text-lg p-2">{space.name}</h2>
      <div className="flex flex-col gap-1">
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onSelectThread(thread.id!)}
            className={`p-2 rounded-md text-left hover:bg-muted ${activeThreadId === thread.id ? 'bg-muted' : ''}`}
          >
            <p className="font-semibold">{thread.title}</p>
            <p className="text-xs text-muted-foreground">
              {thread.message_count} messages
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
