import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { FeatureCards } from '@/components/home/FeatureCards';
import { PartnershipSection } from '@/components/home/PartnershipSection';
import { Footer } from '@/components/layout/Footer';

/**
 * AIMedNet Main Landing Page
 * Complete healthcare networking platform homepage
 * Features hero section, functional modules, coming
 * soon features, and partnerships
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <HeroSection />
        <FeatureCards />
        <PartnershipSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
