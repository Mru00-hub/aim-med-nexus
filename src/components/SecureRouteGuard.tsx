import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';

interface SecureRouteGuardProps {
  children: React.ReactNode;
}

export const SecureRouteGuard: React.FC<SecureRouteGuardProps> = ({ children }) => {
  const { user, profile, userMasterKey, generateAndSetKeys } = useAuth();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile || !profile.encryption_salt) {
      setError("Profile data is still loading or not configured. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    setError('');
    
    console.log('🔓 Attempting to unlock with password...');
    const success = await generateAndSetKeys(password, profile, profile.encryption_salt);
    
    if (!success) {
      setAttempts(prev => prev + 1);
      setError("Incorrect password. Please try again.");
      setPassword(''); // Clear password field on failure
      console.log(`❌ Unlock failed. Attempts: ${attempts + 1}`);
    } else {
      console.log('✅ Unlock successful!');
      // Optional: Add success toast
    }
    
    setIsLoading(false);
  }, [password, user, profile, generateAndSetKeys, attempts]);

  const unlockedContent = useMemo(() => {
    if (userMasterKey) {
      return <>{children}</>;
    }
    return null;
  }, [userMasterKey, children]);

  // Show loading state while waiting for user/profile
  if (!user || !profile) {
    return (
      <>
        <Header />
        <main className="container-medical flex items-center justify-center py-16">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading user data...</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  // Show children if already unlocked
  if (unlockedContent) {
    return unlockedContent;
  }

  // Show unlock screen
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
            
            {/* Success indicator when first-time setup */}
            {profile.encrypted_user_master_key === null && (
              <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  First-time setup: Your encryption keys will be generated securely.
                </AlertDescription>
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
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
                {attempts > 2 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Make sure Caps Lock is off
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-medical" 
                disabled={isLoading || !password}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Unlocking...
                  </>
                ) : (
                  'Unlock Messages'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Your messages are protected with end-to-end encryption. 
                  Your password never leaves your device and is used only to 
                  decrypt your personal encryption keys.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SecureRouteGuard;
