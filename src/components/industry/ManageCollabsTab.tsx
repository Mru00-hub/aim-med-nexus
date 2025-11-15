import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanyProfileDetails } from '@/integrations/supabase/industry.api';
import { DashboardCollabRow } from '@/components/industry/DashboardCollabRow';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ManageCollabsTabProps {
  companyId: string;
}

export const ManageCollabsTab: React.FC<ManageCollabsTabProps> = ({ companyId }) => {
  // We re-use the same query as the jobs tab
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
        <AlertTitle>Error Loading Collaborations</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  const collaborations = data?.collaborations || [];

  if (collaborations.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed">
        <Users className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          You have not posted any collaborations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {collaborations.map((collab) => (
        <DashboardCollabRow key={collab.id} collab={collab} />
      ))}
    </div>
  );
};
