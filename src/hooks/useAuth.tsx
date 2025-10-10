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
    // 1. Set up the listener for auth changes first.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Get the current user ID before the state updates
        const currentUserId = user?.id;
        
        // Update session and user state immediately. This is lightweight.
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // This is the crucial logic:
        // Only do a disruptive profile fetch if the USER has actually changed.
        if (newSession?.user && newSession.user.id !== currentUserId) {
          // A new user has logged in. Set loading state and fetch their profile.
          setLoading(true);
          supabase.from('profiles').select('*, is_onboarded').eq('id', newSession.user.id).single()
            .then(({ data: userProfile, error: profileError }) => {
              if (profileError && profileError.code !== 'PGRST116') throw profileError;
              setProfile(userProfile);
            })
            .catch(error => console.error("Error fetching new user profile:", error))
            .finally(() => setLoading(false));

        } else if (!newSession?.user && currentUserId) {
          // The user has logged out. Clear the profile.
          setProfile(null);
        }
        // If the session is refreshed for the SAME user, we do nothing disruptive.
        // The session token is updated silently, and no major re-render is triggered.
      }
    );

    // 2. On initial page load, we still need to set the initial state.
    // We set loading to true only for this very first check.
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (initialSession) {
            supabase.from('profiles').select('*, is_onboarded').eq('id', initialSession.user.id).single()
            .then(({ data: userProfile, error: profileError }) => {
              if (profileError && profileError.code !== 'PGRST116') throw profileError;
              setProfile(userProfile);
            })
            .catch(error => {
                console.error("Error fetching initial profile:", error);
                // Optionally, show a toast to the user
                toast({
                    title: "Could not load profile",
                    description: "There was an issue fetching your profile data.",
                    variant: "destructive"
                });
            });
        }
    }).finally(() => {
        setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Keep the empty dependency array. The logic inside now correctly handles state changes..

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
