import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyListing } from '@/integrations/supabase/industry.api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Building, Users, Share2 } from 'lucide-react';

interface CompanyCardProps {
  company: CompanyListing;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const { toast } = useToast();
  const {
    id,
    company_name,
    company_logo_url,
    description,
    industry_name,
    location_name,
    company_size, // We'll use this now
    tier,           // We'll use this now
  } = company;

  const getTierBadgeClass = (tier: string | null) => {
    switch (tier) {
      case 'premium':
        return 'bg-gradient-premium text-white';
      case 'deluxe':
        return 'bg-gradient-deluxe text-white';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent potential link navigation
    e.stopPropagation();
    const url = `${window.location.origin}/industryhub/company/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Company profile link copied to clipboard",
    });
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src={company_logo_url || ''} alt={`${company_name} logo`} />
          <AvatarFallback className="rounded-lg">
            <Building className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg">{company_name}</CardTitle>
          <CardDescription className="flex items-center gap-1 pt-1">
            <Globe className="h-3 w-3" />
            {industry_name || 'Various Industries'}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={handleShare}
          title="Share Company Profile"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-4">
        {/* Comprehensive badge section */}
        <div className="flex w-full flex-wrap gap-2">
          {tier && (
            <Badge 
              className={`font-normal ${getTierBadgeClass(tier)}`}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Badge>
          )}
          {location_name && (
            <Badge variant="outline" className="font-normal">
              <MapPin className="mr-1.5 h-3 w-3" />
              {location_name}
            </Badge>
          )}
          {company_size && (
            <Badge variant="outline" className="font-normal">
              <Users className="mr-1.5 h-3 w-3" />
              {company_size}
            </Badge>
          )}
        </div>
        <Button asChild className="w-full">
          <Link to={`/industryhub/company/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
