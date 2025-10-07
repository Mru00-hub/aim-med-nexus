import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/integrations/supabase/community.api';
import { useLocation, useNavigate } from 'react-router-dom';

// --- UPDATED: AuthContextType now includes a loading message ---
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loadingMessage: string;// For displaying messages like "Generating your profile..."
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data: { user: User | null; }; error: any; }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing session...'); // State for the loading message
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
  };

  useEffect(() => {
    console.log("[useAuth] ✅ useEffect initialized. Setting up auth listener.");
    setLoading(true);
    setLoadingMessage('Initializing session...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[useAuth] 👂 Auth state change event received: ${event}`);
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setSession(session);

        // This logic now correctly handles both initial page load (INITIAL_SESSION) and manual sign-in (SIGNED_IN).
        if (currentUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          console.log(`[useAuth] ➡️ Processing session for user: ${currentUser.id}`);
          setLoadingMessage('Checking your profile...');

          const { data: userProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*, is_onboarded')
            .eq('id', currentUser.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("[useAuth] 🛑 Error fetching profile:", fetchError);
            toast({ title: "Error", description: "Could not fetch your profile.", variant: "destructive" });
          } else if (userProfile) {
            setProfile(userProfile);
            if (userProfile.is_onboarded) {
              console.log("[useAuth] ✅ RETURNING USER (is_onboarded: true).");
              // Only navigate if we are on a public page, to avoid redirect loops
              if (location.pathname === '/login' || location.pathname === '/register') {
                navigate('/community', { replace: true });
              }
            } else {
              console.log("[useAuth] 🚧 NEW USER (is_onboarded: false). Redirecting to /complete-profile.");
              navigate('/complete-profile', { replace: true });
            }
          } else {
             // This case (user exists in auth but not in profiles) is now handled by your SIGNED_IN logic.
             // For INITIAL_SESSION, if there's no profile, it indicates a potential issue.
             console.warn("[useAuth] ⚠️ User session found, but no profile exists in database.");
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("[useAuth] 🚪 User signed out. Clearing state.");
          setProfile(null);
          // Don't navigate here, let components decide what to do on sign-out
        }
      
        console.log("🏁 [useAuth] All checks complete. Setting loading to false.");
        setLoading(false);
        setLoadingMessage('');
      }
    );
  
    return () => {
      console.log("[useAuth] 🧹 Cleaning up auth subscription on component unmount.");
      subscription.unsubscribe();
    };
  }, []); // <-- CORRECTED: Empty dependency array ensures this runs only ONCE.

  // --- No changes needed for the functions below ---
  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: metadata
      }
    });

    if (error) {
      toast({
        title: "Registration Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
       toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account.",
      });
    }
    setLoading(false);
    return { data: { user: data.user }, error }; 
  };
  
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      // The onAuthStateChange handler will manage the "Welcome back" toast and redirection.
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      toast({
        title: "Google Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
    }
    setLoading(false);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    loadingMessage,
    refreshProfile,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
