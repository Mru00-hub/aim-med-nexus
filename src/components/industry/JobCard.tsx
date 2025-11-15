import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JobListing } from '@/integrations/supabase/industry.api'; // Our RPC type
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
} from 'lucide-react';

interface JobCardProps {
  job: JobListing;
}

// Helper to format text (from your file)
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

  const {
    job_id,
    title,
    company_id,
    company_name,
    location_text,
    job_type,
    experience_level,
    specialties_required = [],
    created_at, // We'll need to format this
  } = job;

  // Simple date formatter (you can replace with date-fns)
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
    // This will go to the 'SubmitApplicationPage'
    navigate(`/jobs/apply/${job_id}`);
  };

  const handleSignIn = () => {
    navigate('/login', { state: { from: `/jobs/details/${job_id}` } });
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
                <span>{location_text}</span>
              </div>
              <Badge variant="outline" className="w-fit text-xs">
                {toTitleCase(job_type)}
              </Badge>
            </div>

            {/* Skills */}
            <div className="mb-3 flex flex-wrap gap-2">
              {specialties_required.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {toTitleCase(skill)}
                </Badge>
              ))}
              {specialties_required.length > 4 && (
                 <Badge variant="secondary" className="text-xs">
                  +{specialties_required.length - 4} more
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
              {/* We don't have applicants count from the RPC, but can add if needed */}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-shrink-0">
            {user ? (
              <>
                <Button className="btn-medical" onClick={handleApply}>
                  Apply Now
                </Button>
                {/* We'll add "Save Job" functionality later */}
                {/* <Button variant="outline" size="sm">Save Job</Button> */}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleSignIn}>
                  Sign in to Apply
                </Button>
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
