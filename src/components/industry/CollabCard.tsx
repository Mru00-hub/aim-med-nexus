import React from 'react';
import { Link } from 'react-router-dom';
import { CollaborationListing } from '@/integrations/supabase/industry.api';
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
import { MapPin, Clock, Users, Building, FlaskConical } from 'lucide-react';

interface CollabCardProps {
  collab: CollaborationListing;
}

export const CollabCard: React.FC<CollabCardProps> = ({ collab }) => {
  const {
    collab_id,
    title,
    company_id,
    company_name,
    company_logo_url,
    location,
    collaboration_type,
    duration,
    required_specialty = [], // Default to empty array
  } = collab;

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
      
      <CardContent className="flex-1 space-y-4">
        {/* Badge section for collab details */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="font-normal">
            <FlaskConical className="mr-1.5 h-3 w-3" />
            {formatText(collaboration_type) || 'Other'}
          </Badge>
          {location && (
            <Badge variant="outline" className="font-normal">
              <MapPin className="mr-1.5 h-3 w-3" />
              {location}
            </Badge>
          )}
          {duration && (
            <Badge variant="outline" className="font-normal">
              <Clock className="mr-1.5 h-3 w-3" />
              {duration}
            </Badge>
          )}
        </div>
        
        {/* Skills/Specialties */}
        {required_specialty.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Skills Needed</h4>
            <div className="flex flex-wrap gap-1.5">
              {required_specialty.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="font-normal">
                  {formatText(skill)}
                </Badge>
              ))}
              {required_specialty.length > 3 && (
                <Badge variant="outline" className="font-normal">
                  +{required_specialty.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          {/* This route will be added to App.tsx */}
          <Link to={`/collabs/details/${collab_id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
