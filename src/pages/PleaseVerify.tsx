// src/pages/PleaseVerify.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // 2. Import supabase
import { Alert, AlertDescription } from '@/components/ui/alert'; // 3. Import Alert

const PleaseVerify = () => {
  const location = useLocation();
  // Get the email passed from the registration page
  const email = location.state?.email;

  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'default' | 'destructive'>('default');

  // 5. Create the resend handler
  const handleResend = async () => {
    if (!email) {
      setMessage("No email address found. Please go back to the registration page.");
      setMessageType('destructive');
      return;
    }
    
    setIsSending(true);
    setMessage('');

    const { error }_ = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      setMessage(error.message);
      setMessageType('destructive');
    } else {
      setMessage("A new verification link has been successfully sent!");
      setMessageType('default');
    }
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical flex items-center justify-center py-20 px-4 sm:px-6">
        <Card className="card-medical max-w-lg w-full animate-fade-in">
          <CardHeader className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-4">
              <MailCheck className="h-8 w-8 text-success-foreground" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              Almost There!
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Please check your inbox to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-center">
            {email ? (
              <p className="mb-6">
                We've sent a confirmation link to <br />
                <strong className="text-primary">{email}</strong>
              </p>
            ) : (
              <p className="mb-6">
                A confirmation link has been sent to the email address you provided.
              </p>
            )}
            {message && (
              <Alert variant={messageType} className="mb-6 text-left">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground mb-6">
              You will need to verify your email before you can log in.
              Can't find it? Check your spam/junk folder.
            </p>
            <div className="space-y-4">
              <Button asChild size="lg" className="btn-medical w-full">
                <Link to="/login">Proceed to Login</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={isSending || !email}
              >
                {isSending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              You will receive an email from a Supabase address.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PleaseVerify;

