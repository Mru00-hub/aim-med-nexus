import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JobListing } from '@/integrations/supabase/industry.api';
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
  Share2,
} from 'lucide-react';

interface JobCardProps {
  job: JobListing;
}

// Helper to format text
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast(); 

  const {
    job_id,
    title,
    company_id,
    company_name,
    location_name,
    job_type,
    experience_level,
    specializations = [],
    created_at,
  } = job;

  // Simple date formatter
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const handleApply = () => {
    navigate(`/jobs/apply/${job_id}`);
  };

  const handleSignIn = () => {
    navigate('/login', { state: { from: `/jobs/details/${job_id}` } });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking card link
    const url = `${window.location.origin}/jobs/details/${job_id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Job link copied to clipboard",
    });
  };

  return (
    <Card className="card-medical hover:shadow-hover transition-all">
      <CardContent className="p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <Link to={`/jobs/details/${job_id}`}>
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
                <span>{location_name || 'Not specified'}</span>
              </div>
              <Badge variant="outline" className="w-fit text-xs">
                {toTitleCase(job_type)}
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
              <span className="font-semibold text-success">
                {toTitleCase(experience_level)} Experience
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
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
                  <Link to={`/jobs/details/${job_id}`}>
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
