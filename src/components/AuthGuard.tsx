import React from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  requireAuth?: boolean;
  children?: React.ReactNode; // CHANGE #1: Added optional children prop
}

const AuthGuard: React.FC<AuthGuardProps> = ({ requireAuth = true, children }) => {
  const { user, loading, loadingMessage } = useAuth();
  const location = useLocation();

  // 1. Render a loading state while the authentication status is being checked.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {loadingMessage || 'Verifying session...'}
          </p>
        </div>
      </div>
    );
  }

  // 2. Handle protected routes: If auth is required and there's no user,
  //    redirect to the login page. We save the user's intended location
  //    so we can redirect them back after they log in.
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Handle public routes (like /login, /register): If auth is NOT required
  //    but a user IS logged in, redirect them away from the login/register page
  //    and into the main application.
  if (!requireAuth && user) {
    const from = location.state?.from?.pathname || '/community';
    return <Navigate to={from} replace />;
  }

  // 4. If none of the above conditions are met, access is granted.
  //    Render children if they exist (wrapper mode), otherwise render Outlet (layout mode).
  // CHANGE #2: The final return statement is updated
  return children ? <>{children}</> : <Outlet />;
};

export default AuthGuard;
