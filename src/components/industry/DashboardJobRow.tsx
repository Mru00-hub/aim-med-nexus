import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setJobActiveStatus } from '@/integrations/supabase/industry.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, Eye, Trash2, Loader2, MapPin, Share2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

// This type should match the 'jobs' object from the get_company_profile_details RPC
type JobFromRPC = {
  id: string;
  title: string;
  is_active: boolean;
  job_type: string;
  location_type: string;
  location_name: string | null;
  specializations: { id: string; label: string }[];
  company_id: string;
  applicants_count: number;
};

interface DashboardJobRowProps {
  job: JobFromRPC;
}

// Helper to format text
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const DashboardJobRow: React.FC<DashboardJobRowProps> = ({ job }) => {
  const applicantCount = job.applicants_count;
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: () => setJobActiveStatus(job.id, false),
    onSuccess: () => {
      toast({ title: 'Job Deactivated' });
      // Refresh job list and company profile (for job_count)
      queryClient.invalidateQueries({ queryKey: ['companyProfile', job.company_id] });
      setIsDeactivateAlertOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleShare = () => {
    const url = `${window.location.origin}/jobs/details/${job.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Public job link copied to clipboard",
    });
  };

  return (
    <Card className="card-medical">
      <CardContent className="p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{job.title}</h3>
            {/* Badges for Status, Type, and Location */}
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={job.is_active ? 'default' : 'outline'}>
                {job.is_active ? 'Active' : 'Deactivated'}
              </Badge>
              <Badge variant="secondary">{toTitleCase(job.job_type)}</Badge>
              <Badge variant="secondary" className="flex items-center">
                <MapPin className="mr-1.5 h-3 w-3" />
                {toTitleCase(job.location_type)} ({job.location_name || 'N/A'})
              </Badge>
            </div>
            {/* Badges for Specializations */}
            {job.specializations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {job.specializations.map((spec) => (
                  <Badge key={spec.id} variant="secondary" className="font-normal">
                    {spec.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
            <Button variant="outline" size="icon" onClick={handleShare} title="Share Public Link">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/industryhub/dashboard/${job.company_id}?tab=applicants`}>
                <Users className="mr-2 h-4 w-4" />
                Applicants ({applicantCount})
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/jobs/details/${job.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/industryhub/dashboard/${job.company_id}/edit-job/${job.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            
            <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setIsDeactivateAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive_outline"
                  size="icon"
                  disabled={!job.is_active}
                  title="Deactivate Job"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deactivate the job posting and hide it from the public.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deactivateMutation.mutate()}
                    disabled={deactivateMutation.isPending}
                  >
                    {deactivateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

