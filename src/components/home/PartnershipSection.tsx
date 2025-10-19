import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Handshake, Globe, Users, ArrowRight, Loader2, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPartnershipProposalsCount } from '@/integrations/supabase/metrics.api';
import { getUsersCount } from '@/integrations/supabase/metrics.api'; // Re-using from Hero

// Helper function to format large numbers
const formatCount = (num: number): string => {
  if (num < 1000) {
    return `${num}+`;
  }
  return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
};

// Metric display component
const MetricDisplay = ({ count, isLoading, fallback }: { count: number | undefined, isLoading: boolean, fallback: string }) => {
  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  }
  return <div className="text-2xl font-bold text-primary">{count ? formatCount(count) : fallback}</div>;
};

/**
 * Partnership Section Component for AIMedNet (Updated)
 * Showcases partnership opportunities, linking to the main partnerships page.
 * Displays real-time metrics for professionals and proposals.
 */
export const PartnershipSection = () => {
  const navigate = useNavigate();

  // Fetch real-time metrics
  const { data: userCount, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['userCount'], // Re-uses cached data from HeroSection if available
    queryFn: getUsersCount,
  });

  const { data: proposalCount, isLoading: isLoadingProposals } = useQuery({
    queryKey: ['partnershipProposalsCount'],
    queryFn: getPartnershipProposalsCount,
    staleTime: 5 * 60 * 1000,
  });

  // Synced with your main Partnerships.tsx page
  const partnershipTypes = [
    {
      icon: Building2,
      title: 'Healthcare Organizations',
    },
    {
      icon: Handshake,
      title: 'Medical Education Partners',
    },
    {
      icon: Globe,
      title: 'Healthcare Technology',
    },
    {
      icon: Users,
      title: 'Medical Associations & Clubs',
    }
  ];

  return (
    <section className="section-medical bg-gradient-hero">
      <div className="container-medical">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Partnership
            <span className="text-primary block">Opportunities</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AIMedNet serves as your connecting platform to reach verified healthcare professionals 
            and hospitals. Offer your services through our network.
          </p>
        </div>

        {/* Partnership Cards (Simplified) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 animate-slide-up">
          {partnershipTypes.map((partnership, index) => (
            <Card key={index} className="card-medical h-full text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <partnership.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg md:text-xl">{partnership.title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Partnership CTA (Updated) */}
        <div className="max-w-4xl mx-auto text-center animate-scale-in">
          <Card className="card-premium border-primary/20">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl md:text-3xl">
                Ready to Partner with AIMedNet?
              </CardTitle>
              <CardDescription className="text-lg">
                Connect with our growing network of verified professionals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Real-time Metrics */}
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <MetricDisplay count={userCount} isLoading={isLoadingUsers} fallback="50k+" />
                  <div className="text-sm text-muted-foreground">Verified Professionals</div>
                </div>
                <div>
                  <MetricDisplay count={proposalCount} isLoading={isLoadingProposals} fallback="100+" />
                  <div className="text-sm text-muted-foreground">Partnership Proposals</div>
                </div>
              </div>
              
              {/* Updated CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="btn-medical px-8 py-6 group"
                  onClick={() => navigate('/partnerships')}
                >
                  Submit Partnership Proposal
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                {/* "Schedule a Call" button removed as requested */}
              </div>
              
              <p className="text-sm text-muted-foreground">
                📧 For inquiries: <a href="mailto:mrudulabhalke75917@gmail.com" className="text-primary hover:underline">mrudulabhalke75917@gmail.com</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
