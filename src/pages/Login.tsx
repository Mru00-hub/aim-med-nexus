import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  Shield,
  AlertCircle,
  Eye,      // --- ADDED ---
  EyeOff 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

/**
 * Login Page for AIMedNet with Supabase Authentication
 * Email and password authentication with Google OAuth option
 */
const Login = () => {
  const { signIn, generateAndSetKeys, sendPasswordResetEmail } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendMessageType, setResendMessageType] = useState<'default' | 'destructive'>('default');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user types
    if (needsVerification) setNeedsVerification(false);
    if (resendMessage) setResendMessage('');
  };

  const handleResend = async () => {
    if (!formData.email) {
      setError("Please enter your email address in the field above.");
      return;
    }
    setResendLoading(true);
    setResendMessage('');
    setError(''); // Clear the main login error

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
    });

    if (error) {
      setResendMessage(error.message);
      setResendMessageType('destructive');
    } else {
      setResendMessage("A new verification link has been sent! Please check your inbox (and spam folder).");
      setResendMessageType('default');
    }
    setResendLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address to reset your password.");
      setNeedsVerification(false);
      setResendMessage('');
      return;
    }
    
    setIsResetLoading(true);
    setError('');
    setNeedsVerification(false);
    setResendMessage('');

    try {
      // The useAuth hook's function will show its own success/error toasts
      await sendPasswordResetEmail(formData.email);
    } catch (err: any) {
      // Fallback catch, though sendPasswordResetEmail handles its own toasts
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsResetLoading(false);
    }
  };

  // --- THIS FUNCTION HAS BEEN CORRECTED ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setNeedsVerification(false); // Reset on every new attempt
    setResendMessage('');
    try {
      // Step A: Sign in the user
      const { error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
        throw signInError; // This will be caught by the catch block
      }
      
      // Step B: If sign-in is successful, get the user's session to find their ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Could not retrieve user session after login.");
      }

      // Step C: Fetch the user's profile to get their unique salt
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        throw new Error("Could not retrieve your profile. Please contact support.");
      }
      if (!profile?.encryption_salt) {
        // This is a critical issue if the salt is missing for a user.
        throw new Error("Your account is not configured for secure messaging. Please contact support.");
      }

      // Step D: Generate the encryption key using the password from the form and the fetched salt
      const keysGenerated = await generateAndSetKeys(formData.password, profile, profile.encryption_salt);
      
      if (!keysGenerated) {
        // The generateAndSetKeys function shows its own "Incorrect Password" toast.
        // We just need to stop execution. The `finally` block will handle isLoading.
        return; 
      }
      
      // Note: Navigation will be handled automatically by the onAuthStateChange listener in your useAuth hook.

    } catch (err: any) {
      if (err.message && err.message.includes('Email not confirmed')) {
        setError('Your email is not verified. Please check your inbox or resend the verification link below.');
        setNeedsVerification(true); // This will show the resend button
      } else if (err.message && err.message.includes('Invalid login credentials')) {
        // Catch the specific sign-in error
        setError('Invalid email or password. Please try again.');
        setNeedsVerification(false);
      }
      else {
        setError(err.message || 'An unexpected error occurred.');
        setNeedsVerification(false); // Hide button for all other errors
      }
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
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to your AIMedNet account
            </p>
          </div>

          {/* Login Form */}
          <Card className="card-medical">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your professional network
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {needsVerification && (
                <div className="mb-4 space-y-2">
                  <Button
                    type="button" // Important: not 'submit'
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    disabled={resendLoading}
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You will receive an email from Supabase to confirm your account.
                  </p>
                </div>
              )}
              {resendMessage && (
                <Alert variant={resendMessageType} className="mb-6">
                  <AlertDescription>{resendMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>                

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button" 
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1} 
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => handleInputChange('rememberMe', !!checked)}
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm text-primary hover:underline"
                    onClick={handleForgotPassword}
                    disabled={isResetLoading || isLoading}
                  >
                    {isResetLoading ? 'Sending...' : 'Forgot Password?'}
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-medical"
                  disabled={isLoading || isResetLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Join AIMedNet today
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link to="/info/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link to="/info/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
