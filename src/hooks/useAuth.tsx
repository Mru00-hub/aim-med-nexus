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

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('[fetchProfile] START - Fetching for userId:', userId);
    try {
      console.log('[fetchProfile] Querying Supabase profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      console.log('[fetchProfile] Supabase query FINISHED.');
      if (error) {
        console.error("[fetchProfile] Supabase ERROR:", error);
        toast({
          title: "Profile Error",
          description: "Could not load your profile. Please refresh the page.",
          variant: "destructive",
        });
        console.log('[fetchProfile] END - Returning NULL due to error');
        return null;
      }
      console.log('[fetchProfile] END - Returning data:', data ? 'OK' : 'NULL');
      return data;
    } catch (error) {
      console.error("[fetchProfile] UNEXPECTED CATCH ERROR:", error); // <-- LOG G (Catch Error)
      console.log('[fetchProfile] END - Returning NULL due to catch error');
      return null;
    }
  }, [toast]); 

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
  }, []);

  useEffect(() => {
    console.log('[Auth] Effect mounted');
    
    setLoading(true);
    setLoadingMessage('Initializing session...');

    // Set up auth listener
    console.log('[Auth] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[Auth] Auth state changed: ${event}`);
    
      // Handle initial load, sign-in, or token refresh
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user) {
          console.log('[Auth] User found, loading profile...');
          setLoadingMessage('Loading profile...');
          
          // We await these so setLoading(false) doesn't run too early
          const profileData = await fetchProfile(newSession.user.id);
          
          if (profileData) {
            setProfile(profileData);
            await fetchUnreadCount();
          }
          
          // Set user/session *after* profile is loaded
          setSession(newSession);
          setUser(newSession.user);
          console.log('[Auth] User and profile set.');

        } else if (event === 'INITIAL_SESSION') {
            // This handles the case where the app loads and there is no user
            console.log('[Auth] Initial session loaded, no user found.');
            setLoading(false);
            setLoadingMessage('');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out, clearing state.');
        setSession(null);
        setUser(null);
        setProfile(null);
        setInitialUnreadCount(null);
        setPersonalKey(null);
        setUserMasterKey(null);
      }
      
      // Stop loading *after* the event is processed
      // (except for the 'no user on initial load' case, handled above)
      if (event !== 'INITIAL_SESSION' || newSession?.user) {
        console.log('[Auth] Event processed, setting loading=false');
        setLoading(false);
        setLoadingMessage('');
      }
    });

    return () => {
      console.log('[Auth] Cleaning up subscription...');
      subscription.unsubscribe();
    };
  }, [toast, fetchProfile, fetchUnreadCount]); 
    
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

  const generateAndSetKeys = useCallback(async (password: string, profile: Profile, salt: string): Promise<boolean> => {
    if (!password || !salt) {
      console.error('❌ Missing password or salt');
      toast({ title: "Key Generation Failed", description: "Missing required data", variant: "destructive" });
      return false;
    }

    try {
      console.log('🔐 === KEY GENERATION START ===');
      console.log('Salt from profile:', salt);
      console.log('Encrypted master key exists:', !!profile.encrypted_user_master_key);

      // Step 1: ALWAYS derive the personalKey from password + salt
      console.log('⚙️ Deriving personal key from password...');
      const derivedPersonalKey = await deriveKey(password, salt);
      setPersonalKey(derivedPersonalKey);
      console.log('✅ Personal key derived successfully');

      // Step 2: Check if user has an encrypted master key stored
      if (profile.encrypted_user_master_key) {
        console.log('🔓 MODE: DECRYPTION (existing user)');
        console.log('Encrypted key to decrypt:', profile.encrypted_user_master_key.substring(0, 50) + '...');
        
        try {
          // Decrypt the stored master key using the personal key
          const masterKeyJwkString = await decryptMessage(
            profile.encrypted_user_master_key, 
            derivedPersonalKey
          );
          console.log('✅ Master key decrypted successfully');
          console.log('JWK string length:', masterKeyJwkString.length);
          
          // Import the JWK back into a CryptoKey
          const masterKey = await importConversationKey(masterKeyJwkString);
          setUserMasterKey(masterKey);
          console.log('✅ Master key imported and set');
          console.log('🔐 === KEY GENERATION SUCCESS ===');
          return true;

        } catch (decryptError: any) {
          console.error('❌ DECRYPTION FAILED:', decryptError.message);
          console.error('This usually means the password is incorrect');
          toast({ 
            title: "Incorrect Password", 
            description: "Could not unlock your encryption keys. Please check your password.",
            variant: "destructive" 
          });
          return false;
        }

      } else {
        console.log('🔒 MODE: ENCRYPTION (first-time setup)');
        
        // Generate a brand new master key for this user
        console.log('⚙️ Generating new master key...');
        const newMasterKey = await generateConversationKey();
        console.log('✅ New master key generated');

        // Export it to JWK string
        const masterKeyJwkString = await exportConversationKey(newMasterKey);
        console.log('✅ Master key exported to JWK');
        console.log('JWK string length:', masterKeyJwkString.length);

        // Encrypt the JWK with the personal key
        const encryptedMasterKey = await encryptMessage(masterKeyJwkString, derivedPersonalKey);
        console.log('✅ Master key encrypted');
        console.log('Encrypted string:', encryptedMasterKey.substring(0, 50) + '...');

        // Save to database
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

        // Update local state
        setProfile(currentProfile => {
          if (currentProfile) {
            return { ...currentProfile, encrypted_user_master_key: encryptedMasterKey };
          }
          return null;
        });
        setUserMasterKey(newMasterKey);
        
        console.log('✅ First-time setup complete');
        console.log('🔐 === KEY GENERATION SUCCESS ===');
        return true;
      }

    } catch (error: any) {
      console.error('❌ === KEY GENERATION FAILED ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      toast({ 
        title: "Encryption Error", 
        description: "Failed to set up encryption keys. Please try again.",
        variant: "destructive" 
      });
      return false;
    }
  }, [toast]); 

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

  const signOut = useCallback(async () => {
    isAuthOperationInProgress.current = true;
    setLoadingMessage('Signing out...');
  
    try {
      await supabase.removeAllChannels();
      console.log('All Supabase channels removed.');
    
      // Clear encryption keys BEFORE signing out
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

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    loadingMessage,
    initialUnreadCount,
    personalKey,
    userMasterKey,
    generateAndSetKeys, 
    refreshProfile, 
    fetchUnreadCount,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  }), [
    user,
    session,
    profile,
    loading,
    loadingMessage,
    initialUnreadCount,
    personalKey,
    userMasterKey,
    generateAndSetKeys,
    refreshProfile,
    fetchUnreadCount,
    signUp,
    signIn,
    signOut,
    signInWithGoogle
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
