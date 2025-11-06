import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  personalKey: CryptoKey | null;
  userMasterKey: CryptoKey | null;
  generateAndSetKeys: (password: string, profile: Profile, salt: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data: { user: User | null; }; error: any; }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  isRecovery: boolean;
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
  const [initialUnreadCount, setInitialUnreadCount] = useState<number | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing session...');
  const [personalKey, setPersonalKey] = useState<CryptoKey | null>(null);
  const [userMasterKey, setUserMasterKey] = useState<CryptoKey | null>(null); 
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAuthOperationInProgress = useRef(false);

  // --- Using useCallback as in your first file ---
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

  // --- Using useCallback as in your first file ---
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_unread_inbox_count');
      
      if (error) {
        console.error("Error fetching unread count:", error.message);
        setInitialUnreadCount(null);
      } else {
        setInitialUnreadCount(data);
      }
    } catch (rpcError: any) {
      console.error("RPC call failed:", rpcError.message);
      setInitialUnreadCount(null);
    }
  }, []); // Empty dependency array is correct here

  // =================================================================
  // START: YOUR ORIGINAL useEffect (Restored)
  // =================================================================
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // This getSession() is what causes the reload hang
      try {
        const { data, error } = await supabase.auth.getSession();
        
        // Handle session error
        if (error) {
          console.error("Error getting session:", error.message);
          return; // Don't proceed
        }

        if (mounted && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch profile in a separate try/catch so it can fail
          // without stopping the auth state from being set.
          try {
            const userProfile = await fetchProfile(data.session.user.id);
            if (mounted) {
              setProfile(userProfile);
              if (userProfile) {
                await fetchUnreadCount();
              }
            }
          } catch (profileError: any) {
            console.error("Failed to fetch profile during init:", profileError.message);
            // You might want a toast here, but for now, just log it.
          }
        }
      } catch (err: any) {
        // Catch any other unexpected error
        console.error("Critical error in auth init:", err.message);
      } finally {
        // This is the most important part:
        // Always set loading to false, no matter what happens.
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    // The auth state change listener is fine
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      if (_event === 'PASSWORD_RECOVERY') {
        setLoading(false);
        setIsRecovery(true); 
      }

      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        
        fetchProfile(newSession.user.id).then(async (userProfile) => {
          if (mounted) { 
            setProfile(userProfile);
            if (userProfile) {
              await fetchUnreadCount();
            }
          }
        });
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setInitialUnreadCount(null);
        setPersonalKey(null);
        setUserMasterKey(null);
        setIsRecovery(false); 
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchUnreadCount]);
  // =================================================================
  // END: YOUR ORIGINAL useEffect
  // =================================================================
    
  // --- Using useCallback as in your first file ---
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
  }, [fetchProfile, toast]);

  // --- Using useCallback as in your first file ---
  const generateAndSetKeys = useCallback(async (password: string, profile: Profile, salt: string): Promise<boolean> => {
    if (!password || !salt) {
      console.error('❌ Missing password or salt');
      toast({ title: "Key Generation Failed", description: "Missing required data", variant: "destructive" });
      return false;
    }

    try {
      console.log('🔐 === KEY GENERATION START ===');
      const derivedPersonalKey = await deriveKey(password, salt);
      setPersonalKey(derivedPersonalKey);
      console.log('✅ Personal key derived successfully');

      if (profile.encrypted_user_master_key) {
        console.log('🔓 MODE: DECRYPTION (existing user)');
        try {
          const masterKeyJwkString = await decryptMessage(
            profile.encrypted_user_master_key, 
            derivedPersonalKey
          );
          const masterKey = await importConversationKey(masterKeyJwkString);
          setUserMasterKey(masterKey);
          console.log('✅ Master key imported and set');
          console.log('🔐 === KEY GENERATION SUCCESS ===');
          return true;
        } catch (decryptError: any) {
          console.error('❌ DECRYPTION FAILED:', decryptError.message);
          toast({ 
            title: "Incorrect Password", 
            description: "Could not unlock your encryption keys. Please check your password.",
            variant: "destructive" 
          });
          return false;
        }
      } else {
        console.log('🔒 MODE: ENCRYPTION (first-time setup)');
        const newMasterKey = await generateConversationKey();
        const masterKeyJwkString = await exportConversationKey(newMasterKey);
        const encryptedMasterKey = await encryptMessage(masterKeyJwkString, derivedPersonalKey);

        console.log('⚙️ Saving encrypted master key to database...');
        const { error } = await supabase
          .from('profiles')
          .update({ encrypted_user_master_key: encryptedMasterKey })
          .eq('id', profile.id);

        if (error) {
          console.error('❌ Database update failed:', error);
          throw error;
        }
        
        console.log('✅ Encrypted master key saved to database');
        setProfile(currentProfile => currentProfile ? { ...currentProfile, encrypted_user_master_key: encryptedMasterKey } : null);
        setUserMasterKey(newMasterKey);
        
        console.log('✅ First-time setup complete');
        console.log('🔐 === KEY GENERATION SUCCESS ===');
        return true;
      }
    } catch (error: any) {
      console.error('❌ === KEY GENERATION FAILED ===');
      console.error('Error:', error.message);
      toast({ 
        title: "Encryption Error", 
        description: "Failed to set up encryption keys. Please try again.",
        variant: "destructive" 
      });
      return false;
    }
  }, [toast]); 

  // --- Using useCallback as in your first file ---
  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
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
  }, [toast]); 
  
  // --- Using useCallback as in your first file ---
  const signIn = useCallback(async (email: string, password: string) => {
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
    }
  }, [toast]); 

  // --- Using useCallback as in your first file ---
  const signInWithGoogle = useCallback(async () => {
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
  }, [toast]); 

  // --- Using useCallback as in your first file ---
  const signOut = useCallback(async () => {
    isAuthOperationInProgress.current = true;
    setLoadingMessage('Signing out...');
  
    try {
      await supabase.removeAllChannels();
      console.log('All Supabase channels removed.');
    
      setPersonalKey(null);
      setUserMasterKey(null);
    
      await supabase.auth.signOut();
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
    }
  }, [navigate, toast]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    isAuthOperationInProgress.current = true;
    setLoadingMessage('Sending password reset link...');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`, // This is the page you will create for users to enter a new password
      });

      if (error) {
        toast({
          title: "Password Reset Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Check Your Email",
        description: "A password reset link has been sent to your email address.",
      });
      return { error: null };

    } catch (error: any) {
      toast({
        title: "Password Reset Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoadingMessage('');
      isAuthOperationInProgress.current = false; // Following signUp pattern
    }
  }, [toast]);

  // --- Using useMemo as in your first file ---
  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    loadingMessage,
    initialUnreadCount,
    personalKey,
    userMasterKey,
    isRecovery,
    generateAndSetKeys, 
    refreshProfile, 
    fetchUnreadCount,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    sendPasswordResetEmail,
  }), [
    user,
    session,
    profile,
    loading,
    loadingMessage,
    initialUnreadCount,
    personalKey,
    userMasterKey,
    isRecovery, 
    generateAndSetKeys,
    refreshProfile,
    fetchUnreadCount,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    sendPasswordResetEmail
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
