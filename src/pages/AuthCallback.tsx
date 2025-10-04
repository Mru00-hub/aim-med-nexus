// src/pages/AuthCallback.tsx

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';

// This component is now just a fallback loading screen.
// The logic in AuthProvider should handle redirection before the user even sees this page.
const AuthCallback = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Finalizing session...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthCallback;
