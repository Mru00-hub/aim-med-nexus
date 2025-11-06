// src/pages/UpdatePassword.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Lock, 
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { deriveKey, generateConversationKey, exportConversationKey, encryptMessage } from '@/lib/crypto';

/**
 * Page for users to set a new password after clicking the reset link.
 * This will also reset their encryption keys.
 */
const UpdatePassword = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Redirect user to login if they aren't in the password recovery state
  useEffect(() => {
    if (!authLoading && !user) {
      toast({ 
        title: "Not Authorized", 
        description: "You must be logged in to update your password.", 
        variant: "destructive" 
      });
      navigate('/login');
    }
  }, [user, authLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!profile) {
      setError("Profile not loaded. Please wait a moment and try again.");
      return;
    }
    if (!profile.encryption_salt) {
      setError("Critical error: Missing encryption salt. Cannot reset password. Please contact support.");
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Step 1: Update the user's auth password in Supabase
      const { error: updateError } = await supabase.auth.updateUser({ password: password });
      if (updateError) {
        throw updateError;
      }

      // --- E2EE Key Reset ---
      // Because the password changed, the old personal key is useless.
      // We must generate a new key set.

      // Step 2: Generate a NEW personal key from the NEW password and EXISTING salt
      const newPersonalKey = await deriveKey(password, profile.encryption_salt);

      // Step 3: Generate a NEW master key
      const newMasterKey = await generateConversationKey();
      const masterKeyJwkString = await exportConversationKey(newMasterKey);

      // Step 4: Encrypt the NEW master key with the NEW personal key
      const encryptedMasterKey = await encryptMessage(masterKeyJwkString, newPersonalKey);

      // Step 5: Save the NEW encrypted master key to the profile, overwriting the old one
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ encrypted_user_master_key: encryptedMasterKey })
        .eq('id', profile.id);
      
      if (profileError) {
        throw profileError;
      }

      // Step 6: Success!
      setSuccess(true);
      toast({ 
        title: "Password Updated!", 
        description: "Your password and encryption keys have been reset." 
      });

      // Sign the user out to force a clean re-login with their new credentials
      // and to clear the recovery-state session.
      await supabase.auth.signOut();
      navigate('/login');

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-16">
        <div className="max-w-md mx-auto animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Create New Password</h1>
            <p className="text-muted-foreground">
              Enter a new, strong password for your account.
            </p>
          </div>

          {/* Login Form */}
          <Card className="card-medical">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            
            <CardContent>
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription>
                  Resetting your password will create new encryption keys. 
                  **You will permanently lose access to all previous encrypted messages.** This action is irreversible.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert variant="default" className="mb-6">
                  <AlertDescription>
                    Success! Redirecting you to the login page...
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button" 
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowPass(!showPass)}
                      tabIndex={-1} 
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button" 
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      tabIndex={-1} 
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-medical"
                  disabled={isLoading || success}
                >
                  {isLoading ? 'Resetting...' : 'Set New Password & Reset Keys'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UpdatePassword;
