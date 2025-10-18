import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, MessageSquare, Briefcase, Loader2 } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import { useQuery } from '@tanstack/react-query';
import { getUsersCount, getSpacesCount } from '@/integrations/supabase/metrics.api';

const formatCount = (num: number): string => {
  if (num < 1000) {
    return `${num}+`;
  }
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  }
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M+`;
};

const MetricDisplay = ({ count, isLoading, fallback }: { count: number | undefined, isLoading: boolean, fallback: string }) => {
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  return <span>{count ? formatCount(count) : fallback}</span>;
};

/**
 * AIMedNet Hero Section Component
 * Features the main pitch line and call-to-action for healthcare professionals
 * Responsive design with professional medical theming
 */
export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userCount, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['userCount'],
    queryFn: getUsersCount,
  });

  const { data: spacesCount, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ['spacesCount'],
    queryFn: getSpacesCount,
  });

  return (
    <section className="section-medical bg-gradient-hero relative overflow-hidden">
      {/* Background Image Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage}
          alt="Healthcare professionals collaborating and networking"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
      </div>

      <div className="container-medical relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Where Healthcare Professionals 
                <span className="text-primary block">Connect, Collaborate,</span>
                <span className="text-accent">and Grow</span>
              </h1>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!user && (
                <Button 
                  size="lg" 
                  className="btn-medical text-lg px-8 py-6 group"
                  // CHANGE 4: Use navigate function for SPA-friendly routing
                  onClick={() => navigate('/register')}
                >
                  Join AIMedNet Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/5"
                // CHANGE 5: Use navigate function and update to the correct path
                onClick={() => navigate('/community')}
              >
                Explore Platform
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MetricDisplay count={userCount} isLoading={isLoadingUsers} fallback="50k+" /> 
                  Healthcare Professionals
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MetricDisplay count={spacesCount} isLoading={isLoadingSpaces} fallback="1k+" /> 
                  Active Communities
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Career Growth</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-slide-up">
            <div className="relative">
              {/* Main Hero Image */}
              <div className="rounded-radius-xl overflow-hidden shadow-hover">
                <img 
                  src={heroImage}
                  alt="Healthcare professionals using AIMedNet platform"
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
              </div>

              {/* Floating Stats Cards */}
              <div className="absolute -top-4 -left-4 bg-card border border-border rounded-lg p-4 shadow-card animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      <MetricDisplay count={userCount} isLoading={isLoadingUsers} fallback="50,000+" />
                    </div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-card border border-border rounded-lg p-4 shadow-card animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-medical rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                       <MetricDisplay count={spacesCount} isLoading={isLoadingSpaces} fallback="1,000+" />
                    </div>
                    <div className="text-xs text-muted-foreground">Discussions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
