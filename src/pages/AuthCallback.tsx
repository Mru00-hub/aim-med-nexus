// src/pages/AuthCallback.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // <-- Make sure this path is correct
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  // Get the complete user object from the auth context
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs when the user object becomes available after loading
    if (user) {
      // --- This is the logic for detecting a first-time sign-in ---
      const createdAt = new Date(user.created_at || 0).getTime();
      const lastSignInAt = new Date(user.last_sign_in_at || 0).getTime();

      // If the last sign-in is within 15 seconds of creation,
      // it's guaranteed to be their first sign-in via email confirmation.
      const isFirstSignIn = Math.abs(lastSignInAt - createdAt) < 15000;

      if (isFirstSignIn) {
        // This is their first time, send them to complete their profile
        toast({ title: "Welcome!", description: "Please review your profile to continue." });
        navigate('/complete-profile', { replace: true });
      } else {
        // This is a returning user, send them to the main app
        toast({ title: "Welcome back!", description: "You have been successfully signed in." });
        navigate('/community', { replace: true });
      }

    } else if (!loading && !user) {
      // This is an edge case: authentication finished, but there's no user.
      toast({ title: "Authentication Failed", description: "Please try logging in again.", variant: "destructive" });
      navigate('/login', { replace: true });
    }

  }, [user, loading, navigate, toast]); // Dependencies for the effect

  // While the logic runs, the user sees this loading screen
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
