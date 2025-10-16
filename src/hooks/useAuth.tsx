import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/integrations/supabase/community.api';
import { useLocation, useNavigate } from 'react-router-dom';
import { deriveKey } from '@/lib/crypto';

// --- UPDATED: AuthContextType now includes a loading message ---
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loadingMessage: string;// For displaying messages like "Generating your profile..."
  encryptionKey: CryptoKey | null; 
  generateAndSetKey: (password: string, salt: string) => Promise<void>;
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
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
  };

  useEffect(() => {
    // 1. Define an async function to get the initial session and profile.
    const initializeSession = async () => {
      // Get the initial session data
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        toast({ title: "Error", description: "Could not initialize session.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (initialSession) {
        // If a session exists, fetch the corresponding profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', initialSession.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching initial profile:", profileError);
          toast({ title: "Could not load profile", description: profileError.message, variant: "destructive" });
        } else {
          setProfile(userProfile);
        }
        
        // Set user and session state
        setUser(initialSession.user);
        setSession(initialSession);
      }
      
      // We are done with the initial load
      setLoading(false);
    };

    // 2. Call the initialization function.
    initializeSession();

    // 3. Set up the listener for ANY SUBSEQUENT auth changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // This listener now only worries about *changes* after the initial load.
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession) {
        setEncryptionKey(null);
        setProfile(null);
      } else {
        // Re-fetch profile on sign-in
        refreshProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); 

  const generateAndSetKey = async (password: string, salt: string) => {
    if (!password || !salt) {
      toast({ title: "Encryption Error", description: "Cannot generate key without password and salt.", variant: "destructive" });
      return;
    }
    try {
      const key = await deriveKey(password, salt);
      setEncryptionKey(key);
      console.log("✅ Encryption key derived and set in context.");
    } catch (error) {
      console.error("Failed to derive encryption key:", error);
      toast({ title: "Critical Error", description: "Could not prepare secure session.", variant: "destructive" });
    }
  };
  
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
    encryptionKey,
    refreshProfile,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
