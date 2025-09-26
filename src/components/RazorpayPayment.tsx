import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  icon: any;
}

const paymentPlans: PaymentPlan[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: 100,
    duration: 'month',
    features: [
      'Priority access & listing',
      'Enhanced profile visibility', 
      'Priority customer support',
      'Special partner discounts',
      'Advanced networking tools'
    ],
    icon: Crown
  },
  {
    id: 'deluxe',
    name: 'Deluxe',
    price: 250,
    duration: 'month',
    features: [
      'All Premium features',
      'Premium badge display',
      'Featured job postings',
      'Advanced analytics',
      'Exclusive webinars & events',
      '24/7 dedicated support'
    ],
    popular: true,
    icon: Zap
  }
];

const RazorpayPayment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan: PaymentPlan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a subscription.",
        variant: "destructive",
      });
      return;
    }

    setLoading(plan.id);
    
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay');
      }

      // Create payment order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'process-payment',
        {
          body: {
            action: 'create_order',
            planId: plan.id,
            amount: plan.price,
            currency: 'INR'
          }
        }
      );

      if (orderError) {
        throw orderError;
      }

      const { order_id, amount, currency, key } = orderData;

      const options = {
        key,
        amount,
        currency,
        order_id,
        name: 'AIMedNet',
        description: `${plan.name} Subscription - ${plan.duration}ly`,
        image: '/favicon.ico',
        handler: async (response: any) => {
          try {
            // Verify payment
            const { error: verifyError } = await supabase.functions.invoke(
              'process-payment',
              {
                body: {
                  action: 'verify_payment',
                  ...response
                }
              }
            );

            if (verifyError) {
              throw verifyError;
            }

            toast({
              title: "Payment Successful!",
              description: `Welcome to ${plan.name}! Your subscription is now active.`,
            });

            // Reload the page to reflect the new subscription
            window.location.reload();

          } catch (error: any) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#667eea'
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  return (
    <div className="container-medical py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Upgrade Your Experience</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock advanced features and get priority access to opportunities
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {paymentPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`card-medical relative ${
              plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
          >
            {plan.popular && (
              <Badge 
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary"
              >
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <plan.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-primary">₹{plan.price}</span>
                <span className="text-muted-foreground">/{plan.duration}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full btn-medical"
                onClick={() => handlePayment(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? 'Processing...' : `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Secure payment powered by Razorpay • Cancel anytime</p>
      </div>
    </div>
  );
};

export default RazorpayPayment;