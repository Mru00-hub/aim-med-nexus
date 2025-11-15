import React from 'react';
import { Link } from 'react-router-dom';
// This is the correct type from our API file for the get_all_companies RPC
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin } from 'lucide-react';

interface CompanyCardProps {
  company: CompanyListing;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const {
    id, // This is the company_id
    company_name,
    company_logo_url,
    description,
    industry_name,
    location_name,
  } = company;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src={company_logo_url || ''} alt={`${company_name} logo`} />
          <AvatarFallback className="rounded-lg">
            {company_name?.charAt(0) || 'C'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg">{company_name}</CardTitle>
          <CardDescription className="flex items-center gap-1 pt-1">
            <Globe className="h-3 w-3" />
            {industry_name || 'Various Industries'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        {location_name && (
          <Badge variant="outline" className="font-normal">
            <MapPin className="mr-1.5 h-3 w-3" />
            {location_name}
          </Badge>
        )}
        <Button asChild className="w-full">
          {/* This route will be added to App.tsx */}
          <Link to={`/industryhub/company/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

