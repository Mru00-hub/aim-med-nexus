// src/pages/ThreadDetailPage.tsx
import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ThreadView } from '@/components/messaging/ThreadView'; // The powerful component we already designed

const ThreadDetailPage = () => {
  const { threadId } = useParams<{ threadId: string }>();

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        {/* This page's only job is to host the ThreadView component */}
        <ThreadView threadId={threadId!} />
      </main>
    </div>
  );
};

export default ThreadDetailPage;
