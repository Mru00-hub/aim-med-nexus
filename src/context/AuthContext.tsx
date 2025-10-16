// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode, FC } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { deriveKey } from '@/lib/crypto'; // Import our new crypto function

// 1. DEFINE THE SHAPE OF THE CONTEXT
// This tells TypeScript what data and functions our context will provide.
interface AuthContextType {
  user: User | null;
  encryptionKey: CryptoKey | null;
  isLoading: boolean;
  generateAndSetKey: (password: string, salt: string) => Promise<void>;
  logout: () => Promise<void>;
}

// 2. CREATE THE CONTEXT
// We initialize it as undefined. The custom hook below will handle this.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. CREATE THE PROVIDER COMPONENT
// This component will wrap our application and manage all the authentication state.
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const supabase: SupabaseClient = useSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect runs once on mount to check the initial session
  // and subscribes to any authentication changes (login, logout).
  useEffect(() => {
    // Check for an active session right away
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // IMPORTANT: If the session ends, we must clear the encryption key from memory.
      if (!session) {
        setEncryptionKey(null);
      }
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Function to derive and store the encryption key in state
  const generateAndSetKey = async (password: string, salt: string) => {
    if (!password || !salt) {
      console.error("Password and salt are required to generate the encryption key.");
      return;
    }
    try {
      const key = await deriveKey(password, salt);
      setEncryptionKey(key);
      console.log("✅ Encryption key derived and set successfully.");
    } catch (error) {
      console.error("Failed to derive encryption key:", error);
      // You might want to show a toast notification here
    }
  };

  // Function to sign out the user
  const logout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will automatically handle clearing the user and key.
  };

  // The value that will be provided to all consuming components
  const value = {
    user,
    encryptionKey,
    isLoading,
    generateAndSetKey,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. CREATE THE CUSTOM HOOK
// This is a best practice. Components will use this hook to easily access the context.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
