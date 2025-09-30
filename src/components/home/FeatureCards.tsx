import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Briefcase, 
  Building, 
  GraduationCap,
  Calendar,
  PenTool,
  Share2,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Feature Cards Component for AIMedNet
 * Displays both functional features and "Coming Soon" features
 * Professional healthcare design with premium indicators
 */

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href?: string;
  isComingSoon?: boolean;
  isPremium?: boolean;
  isActive?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  isComingSoon, 
  isPremium,
  isActive = false
}) => {
  const cardContent = (
    <Card className={`card-medical group cursor-pointer h-full transition-all duration-300 hover:scale-[1.02] ${
      isPremium ? 'border-premium/30 bg-gradient-to-br from-card to-premium/5' : ''
    } ${isActive ? 'border-primary/50 shadow-medical' : ''}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isPremium ? 'bg-gradient-premium' : 'bg-gradient-primary'
          }`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex gap-2">
            {isComingSoon && (
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            )}
            {isPremium && (
              <Badge className="bg-gradient-premium text-premium-foreground text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            {isActive && (
              <Badge className="bg-gradient-primary text-primary-foreground text-xs">
                Active
              </Badge>
            )}
          </div>
        </div>
        
        <div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-base leading-relaxed">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Button 
          variant={isComingSoon ? "secondary" : "ghost"} 
          className={`w-full group/btn ${
            isComingSoon 
              ? 'cursor-not-allowed opacity-60' 
              : 'hover:bg-primary/5 hover:text-primary'
          }`}
          disabled={isComingSoon}
        >
          {isComingSoon ? 'Notify Me' : 'Explore'}
          {!isComingSoon && (
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          )}
        </Button>
      </CardContent>
    </Card>
  );

  if (isComingSoon || !href) {
    return cardContent;
  }

  return (
    <Link to={href} className="block h-full">
      {cardContent}
    </Link>
  );
};

export const FeatureCards = () => {
  const activeFeatures = [
    {
      title: 'Forums & Community Spaces',
      description: 'Join specialty-based discussions with verified clinicians. Create and manage professional communities, engage in real-time conversations, and share knowledge with your peers.',
      icon: MessageSquare,
      href: '/community',
      isActive: true
    },
    {
      title: 'Jobs & Career Opportunities',
      description: 'Discover healthcare job openings, explore career paths, and connect with healthcare organizations. Find your perfect role in the medical field.',
      icon: Briefcase,
      href: '/jobs',
      isActive: true
    },
    {
      title: 'Professional Networking',
      description: 'Build your professional profile, connect with healthcare professionals, and explore collaboration opportunities across the medical field.',
      icon: Users,
      href: '/networking',
      isActive: true
    }
  ];

  const comingSoonFeatures = [
    {
      title: 'Upskilling',
      description: 'Advanced courses, CME credits, and peer-led learning paths. Enhance your skills with verified continuing education programs designed by healthcare experts.',
      icon: GraduationCap,
      isComingSoon: true,
      isPremium: true
    },
    {
      title: 'Mentorship',
      description: 'Find mentors, book sessions, and get feedback on your growth. Connect with experienced professionals who can guide your career development.',
      icon: Users,
      isComingSoon: true,
      isPremium: true
    },
    {
      title: 'Events',
      description: 'Conferences, grand rounds, and journal clubs. Access exclusive healthcare events, webinars, and professional development opportunities.',
      icon: Calendar,
      isComingSoon: true
    },
    {
      title: 'Write & Publish',
      description: 'Blogs, articles, and newsletters from the community. Share your expertise, publish research insights, and contribute to healthcare knowledge.',
      icon: PenTool,
      isComingSoon: true
    },
    {
      title: 'Social',
      description: 'Share updates, achievements, and links with your network. Build your professional presence and stay connected with your healthcare community.',
      icon: Share2,
      isComingSoon: true
    },
    {
      title: 'Digital Library',
      description: 'Support creators and access premium knowledge. Buy and download digital books and magazines from leading clinicians and healthcare experts.',
      icon: BookOpen,
      isComingSoon: true,
      isPremium: true
    }
  ];

  return (
    <section className="section-medical bg-muted/30">
      <div className="container-medical">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Complete Healthcare
            <span className="text-primary block">Professional Ecosystem</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to connect, learn, and grow in your healthcare career, 
            all in one comprehensive platform designed for medical professionals.
          </p>
        </div>

        {/* Active Features */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-8 text-center">
            🚀 Available Now
          </h3>
          <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
            {activeFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div>
          <h3 className="text-2xl font-semibold mb-8 text-center">
            🔮 Coming Soon
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
            {comingSoonFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to join the future of healthcare networking?
          </p>
          <Button size="lg" className="btn-medical text-lg px-8 py-6">
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
