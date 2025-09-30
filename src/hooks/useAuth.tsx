import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Define a type for our user profile for better type safety
export interface UserProfile {
  id: string;
  full_name: string;
  current_location: string;
  profile_picture_url: string;
  user_role: string;
  // Add any other fields from your profiles table you need globally
}
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null); 
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      // --- NEW --- If a user is logged in, fetch their profile
      if (session?.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile on initial load:", profileError);
        } else {
          setProfile(userProfile);
        }
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        // --- NEW --- Fetch profile on SIGN_IN, or clear it on SIGN_OUT
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error("Error fetching profile after sign in:", profileError);
          } else {
            setProfile(userProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // --- MODIFICATION START ---
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;

      // Step 1: Sign up the user in Supabase Auth.
      // We now capture the `data` object which contains the new user.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          // The metadata is still useful for triggers or if you need it later.
          data: metadata
        }
      });

      if (error) {
        toast({
          title: "Registration Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Check if the user object exists after a successful signup
      if (!data.user) {
        const genericError = new Error("Registration succeeded but no user was returned.");
        toast({
            title: "Registration Error",
            description: "Could not create user profile. Please contact support.",
            variant: "destructive",
        });
        return { error: genericError };
      }

      // Step 2: If auth is successful, create the public profile.
      // We map the metadata from the form to the columns in your `profiles` table.
      const fullName = `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim();
      const profileData = {
        id: data.user.id, // This links the profile to the authenticated user
        email: email,
        full_name: fullName,
        phone: metadata.phone,
        current_location: metadata.location,
        user_role: metadata.registration_type
        profile_picture_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        // This is a critical error. The user exists in auth, but their profile is missing.
        console.error("Profile Creation Error:", profileError);
        toast({
          title: "Account created, but profile setup failed.",
          description: "Please contact support to complete your registration.",
          variant: "destructive",
        });
        return { error: profileError };
      }

      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account.",
      });

      return { error: null };

    } catch (error: any) {
      toast({
        title: "An Unexpected Error Occurred",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };
  // --- MODIFICATION END ---


  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
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

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
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
    } catch (error: any) {
      toast({
        title: "Google Sign In Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
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
          description: "You have been signed out of your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
