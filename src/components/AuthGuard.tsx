import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to login page, save current location
        navigate(redirectTo, { 
          state: { from: location.pathname },
          replace: true 
        });
      } else if (!requireAuth && user) {
        // User is logged in but trying to access auth pages
        const from = location.state?.from || '/';
        navigate(from, { replace: true });
      }
    }
  }, [user, loading, requireAuth, navigate, redirectTo, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect in useEffect
  }

  if (!requireAuth && user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AuthGuard;