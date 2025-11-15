import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanyProfileDetails } from '@/integrations/supabase/industry.api';
import { DashboardJobRow } from '@/components/industry/DashboardJobRow';
import { Loader2, AlertCircle, Briefcase } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ManageJobsTabProps {
  companyId: string;
}

export const ManageJobsTab: React.FC<ManageJobsTabProps> = ({ companyId }) => {
  // We re-use the getCompanyProfileDetails query to get the jobs list
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['companyProfile', companyId],
    queryFn: () => getCompanyProfileDetails(companyId),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Jobs</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const jobs = data?.jobs || [];

  if (jobs.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed">
        <Briefcase className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          You have not posted any jobs yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <DashboardJobRow key={job.id} job={job} />
      ))}
    </div>
  );
};
