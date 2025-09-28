// src/pages/ThreadPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const ThreadPage = () => {
  const { threadId } = useParams<{ threadId: string }>();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-8">
        <h1 className="text-3xl font-bold">Viewing Thread</h1>
        <p className="text-muted-foreground mt-2">
          This is where the full chat interface for thread ID: <strong>{threadId}</strong> will be built.
        </p>
        {/* The main post, replies, and reply form will go here */}
      </main>
      <Footer />
    </div>
  );
};

export default ThreadPage;
