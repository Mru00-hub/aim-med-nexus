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
  loadingMessage: string; // For displaying messages like "Generating your profile..."
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
        
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // --- CORE ONBOARDING LOGIC ---
        if (currentUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          console.log(`[useAuth] ➡️ Processing sign-in for user: ${currentUser.id}`);
          setLoadingMessage('Checking your profile...');

          // Step 1: Check for an existing profile.
          let { data: userProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*, is_onboarded') // IMPORTANT: select the is_onboarded flag
            .eq('id', currentUser.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "No rows found"
            console.error("[useAuth] 🛑 Real error fetching profile:", fetchError);
            toast({ title: "Error", description: "Could not fetch your profile.", variant: "destructive" });
            setLoading(false);
            return;
          }
          
          // Step 2: If no profile exists, create a shell profile. This is the user's first-ever interaction.
          if (!userProfile) {
            console.log("[useAuth] 👶 No profile found. Creating a new shell profile for the user.");
            setLoadingMessage('Generating your profile...');

            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({ 
                id: currentUser.id, 
                email: currentUser.email,
                ...currentUser.user_metadata,
                is_onboarded: false // Explicitly set to false
              })
              .select('*, is_onboarded')
              .single();

            if (insertError) {
              console.error("[useAuth] 🛑 FATAL: Could not create shell profile.", insertError);
              let description = "Please contact support.";
              if (insertError.code === '42501') {
                description = "Database permission denied. Please check RLS policies.";
              }
              toast({ title: "Account Setup Failed", description: description, variant: "destructive" });
              setLoading(false);
              return;
            }
            console.log("[useAuth] ✨ Shell profile created successfully.");
            userProfile = newProfile as Profile; // Use the newly created profile for the next step.
          }

          // Step 3: Now we are GUARANTEED to have a profile. Make the routing decision based on the flag.
          setProfile(userProfile); // Set the profile in context
          
          if (userProfile.is_onboarded) {
            // --- RETURNING USER PATH ---
            console.log("[useAuth] ✅ RETURNING USER (is_onboarded: true). Redirecting to /community.");
            const from = location.state?.from || '/community';
            navigate(from, { replace: true });
          } else {
            // --- NEW USER / INCOMPLETE PROFILE PATH ---
            console.log("[useAuth] 🚧 NEW USER (is_onboarded: false). Redirecting to /complete-profile.");
            navigate('/complete-profile', { replace: true });
          }

        } else if (event === 'SIGNED_OUT') {
          console.log("[useAuth] 🚪 User signed out. Clearing profile.");
          setProfile(null);
        } else {
           console.log("[useAuth] ℹ️ Other auth event, no navigation action needed.");
        }
      
        console.log("🏁 [useAuth] All checks complete. Setting loading to false.");
        setLoading(false);
        setLoadingMessage('');
      }
    );

    // Initial check to prevent screen flicker, but onAuthStateChange is the source of truth for loading state.
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(`[useAuth] Initial getSession() call completed. Session ${session ? 'exists' : 'does not exist'}.`);
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      // REMOVED setLoading(false) from here to prevent race conditions.
    });
  
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
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
