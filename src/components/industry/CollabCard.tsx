import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CollaborationListing } from '@/integrations/supabase/industry.api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  MapPin,
  Briefcase,
  Calendar,
  ExternalLink,
  FlaskConical,
  Share2,
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
  const { toast } = useToast(); 

  const {
    collab_id,
    title,
    company_id,
    company_name,
    location_name,
    collaboration_type,
    duration,
    specializations = [],
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/collabs/details/${collab_id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Collaboration link copied to clipboard",
    });
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
                <span>{location_name || 'Remote'}</span>
              </div>
              <Badge variant="outline" className="w-fit text-xs">
                {toTitleCase(collaboration_type)}
              </Badge>
            </div>

            {/* Skills */}
            <div className="mb-3 flex flex-wrap gap-2">
              {specializations.slice(0, 4).map((spec) => (
                <Badge key={spec.id} variant="secondary" className="text-xs">
                  {spec.label}
                </Badge>
              ))}
              {specializations.length > 4 && (
                 <Badge variant="secondary" className="text-xs">
                  +{specializations.length - 4} more
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleShare}
                  title="Share"
                  className="shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button className="btn-medical flex-1" onClick={handleApply}>
                  Apply Now
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                   <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleShare}
                    title="Share"
                    className="shrink-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleSignIn}>
                    Sign in to Apply
                  </Button>
                </div>
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
