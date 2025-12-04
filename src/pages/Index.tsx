import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection'; // This is your existing Hero code
import { FeaturedVideos } from '@/components/home/FeaturedVideos';
import { FeatureCards } from '@/components/home/FeatureCards';
import { PartnershipSection } from '@/components/home/PartnershipSection';
import { Footer } from '@/components/layout/Footer';
import { QuizAlertBanner } from '@/components/home/QuizAlertBanner'; // Import the new banner

/**
 * AIMedNet Main Landing Page
 * Complete healthcare networking platform homepage
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Inserted the Alert Banner here. 
        It sits between the Header and the Main content 
      */}
      <QuizAlertBanner />

      <main>
        <HeroSection />
        <FeaturedVideos />
        <FeatureCards />
        <PartnershipSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
