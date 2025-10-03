// src/pages/AuthCallback.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const AuthCallback = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // We wait until the authentication check is complete
    if (!authLoading) {
      // Once loading is false, we check the user's profile
      if (profile) {
        // A simple way to check if a profile is "incomplete" is to see if a key field
        // that is ONLY added in CompleteProfile.tsx is missing. The avatar is a perfect choice.
        if (profile.profile_picture_url) {
          // Profile is complete, send to the main app page
          navigate('/community', { replace: true });
        } else {
          // Profile is incomplete, FORCE redirect to complete-profile
          navigate('/complete-profile', { replace: true });
        }
      } else {
        // If there's no profile at all after login, something is wrong.
        // Send them back to login, maybe with an error message in the future.
        console.error("AuthCallback: No profile found after auth completed. Redirecting to login.");
        navigate('/login', { replace: true });
      }
    }
  }, [authLoading, profile, navigate]);

  // This is the content that will be displayed while the logic runs.
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Finalizing your login...</p>
          {/* You can add a spinner component here */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthCallback;
