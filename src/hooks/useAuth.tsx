import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/integrations/supabase/community.api'; // Import your Profile type
import { useNavigate } from 'react-router-dom'; // <--- ADD THIS IMPORT

// --- NEW: AuthContextType now includes the user's profile ---
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null; // Add the profile object
  loading: boolean;
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
  const [profile, setProfile] = useState<Profile | null>(null); // State for the user profile
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && currentUser) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .single();

        if (!existingProfile) {
          // --- NEW USER PATH ---
          // Profile creation and redirect to /complete-profile
          console.log('First session detected. Creating profile...');
          const registrationData = currentUser.user_metadata;
          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: currentUser.id, email: currentUser.email, ...registrationData })
            .select().single();

          if (insertError) {
            console.error("Error creating profile:", insertError);
            setProfile(null);
          } else {
            setProfile(createdProfile);
            toast({ title: "Welcome!", description: "Your profile has been created." });
            // Redirect new users to complete their profile.
            navigate('/complete-profile', { replace: true });
          }
        } else {
          // --- RETURNING USER PATH ---
          // Fetch profile and redirect to /community
          const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();

          if (error) {
            console.error("Error fetching profile:", error);
            setProfile(null);
          } else {
            setProfile(data);
            // Redirect returning users to the community page.
            const from = location.state?.from || '/community';
            navigate(from, { replace: true });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        // Optional: redirect to login page on sign out
        // navigate('/login'); 
      }
      setLoading(false);
    }
  );

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setSession(session);
      setUser(session.user);
    }
    setLoading(false);
  });
  
  return () => subscription.unsubscribe();
}, [toast, navigate, location]);

  // --- CHANGED: signUp now returns the user object on success ---
  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
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
    // Return both data and error so the frontend can get the new user's ID
    return { data: { user: data.user }, error }; 
  };
  
  // No changes needed for signIn, signInWithGoogle, signOut
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
    profile, // Provide the profile to the rest of the app
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
