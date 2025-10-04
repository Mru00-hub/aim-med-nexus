import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * This guard protects routes that require a user to have a complete profile.
 * It checks the `is_onboarded` flag from the user's profile.
 * It should be used INSIDE an AuthGuard.
 */
const OnboardingGuard: React.FC = () => {
  const { profile, loading, loadingMessage } = useAuth();
  const location = useLocation();

  // Show a loading screen while the auth context is initializing.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{loadingMessage || 'Verifying profile...'}</p>
        </div>
      </div>
    );
  }

  // If the profile is loaded and the user has not completed onboarding,
  // redirect them to the complete-profile page.
  if (profile && !profile.is_onboarded) {
    console.log("[OnboardingGuard] User has not completed onboarding. Redirecting to /complete-profile.");
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  // If the user is onboarded, render the child route.
  return <Outlet />;
};

export default OnboardingGuard;
