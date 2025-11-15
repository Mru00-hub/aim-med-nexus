import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CollaborationListing } from '@/integrations/supabase/industry.api'; // Our RPC type
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Briefcase,
  Calendar,
  Users,
  ExternalLink,
  FlaskConical,
} from 'lucide-react';

interface CollabCardProps {
  collab: CollaborationListing;
}

// Helper to format text
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const CollabCard: React.FC<CollabCardProps> = ({ collab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    collab_id,
    title,
    company_id,
    company_name,
    location,
    collaboration_type,
    duration,
    required_specialty = [],
    created_at,
  } = collab;

  // Simple date formatter
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    return "Today";
  };

  const handleApply = () => {
    navigate(`/collabs/apply/${collab_id}`);
  };

  const handleSignIn = () => {
    navigate('/login', { state: { from: `/collabs/details/${collab_id}` } });
  };

  return (
    <Card className="card-medical hover:shadow-hover transition-all">
      <CardContent className="p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <Link to={`/collabs/details/${collab_id}`}>
              <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                {title}
              </h3>
            </Link>
            
            {/* Company & Location Info */}
            <div className="my-3 flex flex-col gap-1 text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <Link
                  to={`/industryhub/company/${company_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {company_name}
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{location || 'Remote'}</span>
              </div>
              <Badge variant="outline" className="w-fit text-xs">
                {toTitleCase(collaboration_type)}
              </Badge>
            </div>

            {/* Skills */}
            <div className="mb-3 flex flex-wrap gap-2">
              {required_specialty.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {toTitleCase(skill)}
                </Badge>
              ))}
              {required_specialty.length > 4 && (
                 <Badge variant="secondary" className="text-xs">
                  +{required_specialty.length - 4} more
                </Badge>
              )}
            </div>
            
            {/* Bottom Row */}
            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{duration || 'Flexible duration'}</span>
              </div>
              <div className="flex items-center gap-1">
                <FlaskConical className="h-4 w-4" />
                <span>{timeAgo(created_at)}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-shrink-0">
            {user ? (
              <Button className="btn-medical" onClick={handleApply}>
                Apply Now
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSignIn}>
                  Sign in to Apply
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/collabs/details/${collab_id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
