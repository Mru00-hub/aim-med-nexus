import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/integrations/supabase/community.api';
import { useLocation, useNavigate } from 'react-router-dom';
import { deriveKey, generateConversationKey, exportConversationKey, decryptMessage, importConversationKey, encryptMessage } from '@/lib/crypto';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loadingMessage: string;
  initialUnreadCount: number | null;
  personalKey: CryptoKey | null; // Renamed from encryptionKey
  userMasterKey: CryptoKey | null;
  generateAndSetKeys: (password: string, salt: string) => Promise<boolean>;
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
  const [initialUnreadCount, setInitialUnreadCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing session...');
  const [personalKey, setPersonalKey] = useState<CryptoKey | null>(null); // Renamed
  const [userMasterKey, setUserMasterKey] = useState<CryptoKey | null>(null); 
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use ref to prevent race conditions with auth operations
  const isAuthOperationInProgress = useRef(false);

  // Fetch profile helper with error handling
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
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
  }, [toast]); 

  // FIXED: Initialize auth state with getSession AND listen for changes
  useEffect(() => {
    let mounted = true;

    const updateUserState = async (session: Session | null) => {
      if (session) {
        // Call our new, efficient RPC function
        const { data, error } = await supabase.rpc('get_user_profile_and_social_counts');

        if (mounted) {
          if (error) {
            console.error("Error fetching profile and counts:", error);
            setProfile(null);
            setInitialUnreadCount(0);
          } else {
            // Set everything at once from the single call
            setProfile(data.profile);
            setInitialUnreadCount(data.unread_inbox_count);
          }
          setSession(session);
          setUser(session.user);
        }
      } else {
        // Clear everything if the user logs out
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setInitialUnreadCount(null);
        }
      }
      if (mounted) setLoading(false);
    };

    // Initial check on page load
    supabase.auth.getSession().then(({ data }) => updateUserState(data.session));

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserState(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
    
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
  }, [fetchProfile]);

  const generateAndSetKeys = async (password: string, salt: string): Promise<boolean> => {
    if (!password || !salt || !profile) {
      toast({ title: "Key Generation Failed", variant: "destructive" });
      return false;
    }

    try {
      // Step 1: Derive the temporary personalKey from the password
      const derivedPersonalKey = await deriveKey(password, salt);
      setPersonalKey(derivedPersonalKey);

      // Step 2: Check if the user has a permanent master key stored
      if (profile.encrypted_user_master_key) {
        // User exists, decrypt their master key
        const masterKeyJwkString = await decryptMessage(profile.encrypted_user_master_key, derivedPersonalKey);
        const masterKey = await importConversationKey(masterKeyJwkString); // You'll add this to crypto.ts
        setUserMasterKey(masterKey);
        console.log("✅ User master key unlocked.");

      } else {
        // First-time setup for this user. Generate, encrypt, and store their master key.
        console.log("🔑 First-time setup: generating user master key...");
        const newMasterKey = await generateConversationKey(); // Re-use the same generator
        setUserMasterKey(newMasterKey);

        const masterKeyJwkString = await exportConversationKey(newMasterKey);
        const encryptedMasterKey = await encryptMessage(masterKeyJwkString, derivedPersonalKey); 

        // Store it in the database
        const { error } = await supabase
          .from('profiles')
          .update({ encrypted_user_master_key: encryptedMasterKey })
          .eq('id', profile.id);

        if (error) throw error;
        await refreshProfile(); 
        setUserMasterKey(newMasterKey);
        console.log("✅ New user master key generated and stored.");
      }
      return true;

    } catch (error) {
      console.error("Failed to generate/unlock keys:", error);
      // This catch block is important. It will catch decryption errors (wrong password).
      return false;
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
      await supabase.auth.signOut();
      // FIX: Add navigation to the home page after sign-out.
      navigate('/'); 
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign Out Error",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    } finally {
      setLoadingMessage('');
      // onAuthStateChange will still run and clear the user state
    }
  };


  const value = {
    user,
    session,
    profile,
    loading,
    loadingMessage,
    personalKey,
    userMasterKey,
    generateAndSetKeys, 
    refreshProfile, 
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
