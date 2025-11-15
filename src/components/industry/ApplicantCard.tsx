import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Applicant, updateApplicationStatus } from '@/integrations/supabase/industry.api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Enums } from '@/types';
import {
  User, FileText, Mail, Check, X, Eye, Loader2, ArrowRight
} from 'lucide-react';

// Reusable helper to display the status badge
const getStatusBadge = (status: Enums<'application_status_enum'>) => {
  const baseClasses = 'font-medium';
  switch (status) {
    case 'viewed':
      return <Badge className={`${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-100`}>Viewed</Badge>;
    case 'in_progress':
      return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-100`}>In Progress</Badge>;
    case 'rejected':
      return <Badge className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-100`}>Rejected</Badge>;
    case 'hired':
      return <Badge className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100`}>Hired</Badge>;
    case 'pending':
    default:
      return <Badge className={`${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-100`}>Pending</Badge>;
  }
};

interface ApplicantCardProps {
  applicant: Applicant;
  applicationType: 'job' | 'collaboration';
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant, applicationType }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ status }: { status: Enums<'application_status_enum'> }) => 
      updateApplicationStatus(applicant.application_id, status, applicationType),
    onSuccess: (data, variables) => {
      toast({ 
        title: 'Status Updated!', 
        description: `Application is now set to ${variables.status.replace('_', ' ').toUpperCase()}.` 
      });

      // 1. Determine the correct query key to invalidate based on application type
      const queryKeyToInvalidate = applicationType === 'job'
        ? ['jobApplicants', applicant.job_id]
        : ['collabApplicants', applicant.collab_id];
        
      // 2. Invalidate the specific applicant list query
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      
      // 3. (Optional but recommended) Invalidate the main company profile.
      // This will be useful if/when you add applicant counts to the ManageJobs/Collabs tabs.
      queryClient.invalidateQueries({ queryKey: ['companyProfile', applicant.company_id] });
    },
    onError: (error) => {
      toast({ title: 'Error Updating Status', description: error.message, variant: 'destructive' });
    },
  });

  const handleUpdateStatus = (status: Enums<'application_status_enum'>) => {
    mutation.mutate({ status });
  };

  const isPending = mutation.isPending;
  const applicantTitle = applicant.job_title || applicant.collab_title; // Use either job or collab title

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Applicant Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <Link to={`/profile/${applicant.applicant_id}`} className="text-xl font-semibold text-primary hover:underline">
                {applicant.applicant_name}
              </Link>
            </div>
            {getStatusBadge(applicant.status as Enums<'application_status_enum'>)}
          </div>
          
          {/* Application Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Applied for: <span className="font-medium text-gray-900">{applicantTitle}</span></p>
            <p>Applied on: {new Date(applicant.applied_at).toLocaleDateString()}</p>
            {applicant.cover_letter && (
              <p className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Has Cover Letter
              </p>
            )}
            <p className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Resume: <a href={applicant.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View File</a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t mt-4">
            {applicant.status !== 'viewed' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateStatus('viewed')}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Eye className="mr-2 h-4 w-4" />
                Set to Viewed
              </Button>
            )}
            {applicant.status !== 'in_progress' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ArrowRight className="mr-2 h-4 w-4" />
                Set to In Progress
              </Button>
            )}
            {applicant.status !== 'hired' && (
              <Button 
                variant="success" 
                size="sm"
                onClick={() => handleUpdateStatus('hired')}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" />
                Hire / Accepted
              </Button>
            )}
            {applicant.status !== 'rejected' && (
              <Button 
                variant="destructive_outline" 
                size="sm"
                onClick={() => handleUpdateStatus('rejected')}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
