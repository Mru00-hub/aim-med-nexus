import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Profile } from '@/integrations/supabase/community.api'; // Import your Profile type
import { useLocation, useNavigate } from 'react-router-dom'; // <--- ADD THIS IMPORT

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
  const location = useLocation();

  useEffect(() => {
    console.log("[useAuth] useEffect initialized");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[useAuth] Auth state changed:", event);
        console.log("[useAuth] Session data:", session ? "Session exists" : "No session");
        
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          console.log("[useAuth] Current user ID:", currentUser.id);
          console.log("[useAuth] Current user email:", currentUser.email);
          console.log("[useAuth] User metadata:", JSON.stringify(currentUser.user_metadata, null, 2));
        }
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && currentUser) {
          console.log("[useAuth] Processing sign-in for user:", currentUser.id);
          try {
            // Check if profile exists
            console.log("[useAuth] Checking if profile exists in database...");
            const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            
            console.log("[useAuth] Profile query result:");
            console.log("[useAuth] Profile found:", !!existingProfile);
            console.log("[useAuth] Fetch error:", fetchError?.message || "none");
          
            if (fetchError) {
              console.log("[useAuth] Error code:", fetchError.code);
              console.log("[useAuth] details:", JSON.stringify(fetchError, null, 2));
            }

            if (fetchError && fetchError.code !== 'PGRST116') {
              // Real error (not "no rows" error)
              console.error("[useAuth] Real error checking profile:", fetchError);
              toast({
                title: "Profile Check Failed",
                description: "Could not verify your profile status. Please try again.",
                variant: "destructive",
              });
              setProfile(null);
              setLoading(false);
              return;
            }

            if (!existingProfile) {
              // NEW USER - No profile exists yet
              console.log("[useAuth] NEW USER DETECTED - No profile found");
              console.log("[useAuth] Redirecting to /complete-profile");
              setProfile(null);
              setTimeout(() => {
                console.log("[useAuth] Executing redirect to /complete-profile");
                toast({
                  title: "Welcome!",
                  description: "Let's set up your profile.",
                });
                navigate('/complete-profile', { replace: true });
              }, 100);
            } else {
              // RETURNING USER - Profile exists
              console.log("[useAuth] RETURNING USER - Profile found");
              console.log("[useAuth] Profile data:", JSON.stringify(existingProfile, null, 2));
              console.log("[useAuth] Redirecting to /community");
              setProfile(existingProfile);
              setTimeout(() => {
                console.log("[useAuth] Executing redirect to /community");
                const from = location.state?.from || '/community';
                toast({
                  title: "Welcome back!",
                  description: "Redirecting to your community...",
                });
                navigate(from, { replace: true });
              }, 100);
            }
          } catch (error: any) {
            console.error("[useAuth] UNEXPECTED ERROR in auth flow:", error);
            console.error("[useAuth] Error name:", error.name);
            console.error("[useAuth] Error message:", error.message);
            console.error("[useAuth] Error stack:", error.stack);
            toast({
              title: "Authentication Error",
              description: "An unexpected error occurred. Please contact support.",
              variant: "destructive",
            });
            setProfile(null);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("[useAuth] User signed out");
          setProfile(null);
        } else {
          console.log("[useAuth] Other auth event, no action needed");
        }
      
        console.log("🏁 [useAuth] Setting loading to false");
        setLoading(false);
      }
    );

    console.log("[useAuth] Getting initial session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("[useAuth] Initial session found:", session.user.id);
        setSession(session);
        setUser(session.user);
      } else {
        console.log("[useAuth] No initial session");
      }
      setLoading(false);
    });
  
    return () => {
      console.log("[useAuth] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [toast, navigate, location]);

  // --- CHANGED: signUp now returns the user object on success ---
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
