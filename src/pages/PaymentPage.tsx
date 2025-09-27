import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import RazorpayPayment from '@/components/RazorpayPayment';

/**
 * Payment Page for AIMedNet Subscriptions
 * Displays premium and deluxe subscription options with Razorpay integration
 */
const PaymentPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <RazorpayPayment />
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentPage;