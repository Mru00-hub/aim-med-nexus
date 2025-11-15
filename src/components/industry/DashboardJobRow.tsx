import React, { useState } from 'react'; // [!code ++]
import { Link } from 'react-router-dom';
// [!code ++] (Import mutation hooks and API functions)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setJobActiveStatus, CompanyJob } from '@/integrations/supabase/industry.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// [!code ++] (Import new icons and components)
import { Edit, Users, Eye, Trash2, Loader2, AlertCircle } from 'lucide-react';
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

interface DashboardJobRowProps {
  job: CompanyJob;
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
  const applicantCount = 0; // Placeholder
  // [!code ++] (Add state for dialog)
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // [!code ++] (Add mutation for deactivating)
  const deactivateMutation = useMutation({
    mutationFn: () => setJobActiveStatus(job.id, false),
    onSuccess: () => {
      toast({ title: 'Job Deactivated' });
      // Refresh job list and company profile (for job_count)
      queryClient.invalidateQueries({ queryKey: ['companyJobs', job.company_id] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', job.company_id] });
      setIsDeactivateAlertOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card className="card-medical">
      <CardContent className="p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{job.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={job.is_active ? 'default' : 'outline'}>
                {job.is_active ? 'Active' : 'Deactivated'}
              </Badge>
              <Badge variant="secondary">{toTitleCase(job.job_type)}</Badge>
              <Badge variant="secondary">{toTitleCase(job.location_type)}</Badge>
            </div>
          </div>
          <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/industryhub/dashboard/applicants/job/${job.id}`}>
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
              <Link to={`/industryhub/dashboard/edit-job/${job.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            {/* [!code ++] (Add Deactivate Button and Dialog) */}
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
                    This action will update your company's total job count.
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
