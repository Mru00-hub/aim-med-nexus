import React from 'react';
import { Link } from 'react-router-dom';
import { JobListing } from '@/integrations/supabase/industry.api';
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
import { MapPin, Briefcase, Clock, Building } from 'lucide-react';

interface JobCardProps {
  job: JobListing;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const {
    job_id,
    title,
    company_id,
    company_name,
    company_logo_url,
    location_text,
    location_type,
    job_type,
    experience_level,
  } = job;

  // Helper to format text
  const formatText = (text: string | null | undefined) => {
    if (!text) return null;
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="pt-1">
            <Link 
              to={`/industryhub/company/${company_id}`} 
              className="text-primary hover:underline"
            >
              {company_name}
            </Link>
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        {/* Badge section for job details */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-normal">
            <MapPin className="mr-1.5 h-3 w-3" />
            {formatText(location_type) || location_text}
          </Badge>
          <Badge variant="outline" className="font-normal">
            <Briefcase className="mr-1.5 h-3 w-3" />
            {formatText(job_type) || 'Full-time'}
          </Badge>
          <Badge variant="outline" className="font-normal">
            <Clock className="mr-1.5 h-3 w-3" />
            {formatText(experience_level) || 'Entry'}
          </Badge>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          {/* This route will be added to App.tsx */}
          <Link to={`/jobs/details/${job_id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
