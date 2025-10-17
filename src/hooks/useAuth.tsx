import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/integrations/supabase/community.api';
import { useLocation, useNavigate } from 'react-router-dom';
import { deriveKey } from '@/lib/crypto';
const ENCRYPTION_KEY_STORAGE_KEY = 'aimednet-encryption-key';

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
  const refreshProfile = useCallback(async () => {
    // This now safely uses the `user` state variable.
    if (!user) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  }, [user]); 
  
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
          sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY); // Clear corrupted key
        }
      }
    };
    loadKeyFromSession();
  }, []); 

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setProfile(userProfile);
        setSession(session);
        setUser(session.user);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setEncryptionKey(null);
        sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
      }
      setLoading(false);
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
      const jwk = await crypto.subtle.exportKey('jwk', key);
      // Save the JSON string to session storage
      sessionStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, JSON.stringify(jwk));

      console.log("✅ Encryption key derived and saved to session storage.");
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
    sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
    await supabase.auth.signOut();
    setLoading(false);
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
