// src/components/SecureRouteGuard.tsx

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';

interface SecureRouteGuardProps {
  children: React.ReactNode;
}

export const SecureRouteGuard: React.FC<SecureRouteGuardProps> = ({ children }) => {
  const { user, profile, encryptionKey, generateAndSetKey } = useAuth();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.encryption_salt) {
      setError("Your profile is not configured correctly. Please contact support.");
      return;
    }
    setIsLoading(true);
    setError('');

    // 1. Verify the password is correct by trying to sign in again.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      setError("Incorrect password. Please try again.");
      setIsLoading(false);
      return;
    }

    // 2. If correct, generate the key. The component will then re-render.
    await generateAndSetKey(password, profile.encryption_salt);
    setIsLoading(false);
  };

  // If the key exists, the user is fully authenticated. Render the page.
  if (encryptionKey) {
    return <>{children}</>;
  }

  // If the key is missing, show the "Unlock" screen.
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical flex items-center justify-center py-16">
        <Card className="max-w-md w-full animate-fade-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Enable Secure Messaging</CardTitle>
            <CardDescription>
              For your security, please confirm your password to access encrypted messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full btn-medical" disabled={isLoading}>
                {isLoading ? 'Unlocking...' : 'Unlock Messages'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};
