import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/integrations/supabase/community.api';
import { useLocation, useNavigate } from 'react-router-dom';
import { deriveKey } from '@/lib/crypto';

const ENCRYPTION_KEY_STORAGE_KEY = 'aimednet-encryption-key';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loadingMessage: string;
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
  const [loadingMessage, setLoadingMessage] = useState('Initializing session...');
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use ref to prevent race conditions with auth operations
  const isAuthOperationInProgress = useRef(false);

  // Load encryption key from session storage on mount
  useEffect(() => {
    const loadKeyFromSession = async () => {
      const storedKey = sessionStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
      if (storedKey) {
        try {
          const jwk = JSON.parse(storedKey);
          const key = await crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          setEncryptionKey(key);
          console.log("✅ Encryption key loaded from session storage.");
        } catch (e) {
          console.error("Failed to load encryption key from session:", e);
          sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
        }
      }
    };
    loadKeyFromSession();
  }, []);

  // Fetch profile helper with error handling
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Profile fetch error:", error);
        toast({
          title: "Profile Error",
          description: "Could not load your profile. Please refresh the page.",
          variant: "destructive",
        });
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      return null;
    }
  };

  // FIXED: Initialize auth state with getSession AND listen for changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoadingMessage('Checking authentication...');
        
        // Check for existing session first (CRITICAL FIX)
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session initialization error:", error);
        }
        
        if (mounted && initialSession?.user) {
          setLoadingMessage('Loading profile...');
          const userProfile = await fetchProfile(initialSession.user.id);
          
          if (mounted) {
            setProfile(userProfile);
            setSession(initialSession);
            setUser(initialSession.user);
          }
        }
        
        if (mounted) {
          setLoading(false);
          setLoadingMessage('');
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
          setLoadingMessage('');
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event);
      
      // Avoid race conditions with manual sign in/out operations
      if (isAuthOperationInProgress.current && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        isAuthOperationInProgress.current = false;
      }

      if (session?.user) {
        setLoadingMessage('Loading profile...');
        const userProfile = await fetchProfile(session.user.id);
        
        if (mounted) {
          setProfile(userProfile);
          setSession(session);
          setUser(session.user);
          setLoadingMessage('');
        }
      } else {
        if (mounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setEncryptionKey(null);
          sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
          setLoadingMessage('');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // FIXED: refreshProfile no longer depends on user state
  const refreshProfile = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) {
        console.warn("No session found, cannot refresh profile");
        return;
      }
      
      const userProfile = await fetchProfile(currentSession.user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      toast({
        title: "Refresh Error",
        description: "Could not refresh your profile.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generateAndSetKey = async (password: string, salt: string) => {
    if (!password || !salt) {
      toast({ 
        title: "Encryption Error", 
        description: "Cannot generate key without password and salt.", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const key = await deriveKey(password, salt);
      setEncryptionKey(key);
      
      const jwk = await crypto.subtle.exportKey('jwk', key);
      sessionStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, JSON.stringify(jwk));

      console.log("✅ Encryption key derived and saved to session storage.");
    } catch (error) {
      console.error("Failed to derive encryption key:", error);
      toast({ 
        title: "Critical Error", 
        description: "Could not prepare secure session.", 
        variant: "destructive" 
      });
    }
  };

  // FIXED: Proper error handling and return value
  const signUp = async (email: string, password: string, metadata?: any) => {
    isAuthOperationInProgress.current = true;
    setLoadingMessage('Creating your account...');
    
    try {
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
        return { data: { user: null }, error };
      }
      
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account.",
      });
      
      return { data: { user: data.user || null }, error: null };
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { data: { user: null }, error };
    } finally {
      setLoadingMessage('');
      isAuthOperationInProgress.current = false;
    }
  };
  
  // FIXED: No conflicting loading state management
  const signIn = async (email: string, password: string) => {
    isAuthOperationInProgress.current = true;
    setLoadingMessage('Signing you in...');
    
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
      
      // onAuthStateChange will handle the rest
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoadingMessage('');
      // Don't set isAuthOperationInProgress to false here - 
      // let onAuthStateChange handle it
    }
  };

  const signInWithGoogle = async () => {
    isAuthOperationInProgress.current = true;
    setLoadingMessage('Redirecting to Google...');
    
    try {
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
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Google Sign In Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoadingMessage('');
    }
  };

  const signOut = async () => {
    isAuthOperationInProgress.current = true;
    setLoadingMessage('Signing out...');
    
    try {
      sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign Out Error",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    } finally {
      setLoadingMessage('');
      // onAuthStateChange will reset the flag
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    loadingMessage,
    encryptionKey,
    generateAndSetKey,
    refreshProfile, 
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
