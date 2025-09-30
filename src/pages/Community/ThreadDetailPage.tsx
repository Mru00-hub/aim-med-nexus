// src/pages/community/ThreadDetailPage.tsx

import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThreadView } from '@/components/messaging/ThreadView'; // We will put all the logic here
import AuthGuard from '@/components/AuthGuard'; // Protect this page

export default function ThreadDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto flex flex-col py-4 px-4">
          {/* All the chat logic is encapsulated in the ThreadView component */}
          <ThreadView threadId={threadId!} />
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
};
