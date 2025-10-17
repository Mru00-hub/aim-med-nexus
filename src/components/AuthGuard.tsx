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

  // After loading, if auth is required and there's still no user, then redirect.
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle public routes for already logged-in users.
  if (!requireAuth && user) {
    const from = location.state?.from?.pathname || '/community';
    return <Navigate to={from} replace />;
  }
  
  // If all checks pass, render the content.
  return children ? <>{children}</> : <Outlet />;
};

export default AuthGuard;
