import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Applicant, updateApplicationStatus } from '@/integrations/supabase/industry.api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Enums } from '@/types';
import {
  User, FileText, Mail, Check, X, Eye, Loader2, ArrowRight, ExternalLink
} from 'lucide-react';

// Reusable helper to display the status badge
const getStatusBadge = (status: Enums<'application_status_enum'>) => {
  const baseClasses = 'font-medium px-2 py-1 rounded-full text-xs';
  switch (status) {
    case 'viewed': return <Badge className={`${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-100`}>Viewed</Badge>;
    case 'in_progress': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-100`}>In Progress</Badge>;
    case 'rejected': return <Badge className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-100`}>Rejected</Badge>;
    case 'hired': return <Badge className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100`}>Hired</Badge>;
    default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-100`}>Pending</Badge>;
  }
};

interface ApplicantCardProps {
  applicant: Applicant;
  applicationType: 'job' | 'collaboration';
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant, applicationType }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const resumeLink = (applicant as any).applicant_resume_url || applicant.resume_url;
  const isFile = resumeLink?.includes('supabase') || resumeLink?.match(/\.(pdf|doc|docx)$/i);

  const mutation = useMutation({
    mutationFn: ({ status }: { status: Enums<'application_status_enum'> }) => 
      updateApplicationStatus(applicant.application_id, status, applicationType),
    onSuccess: (data, variables) => {
      toast({ title: 'Status Updated!', description: `Application set to ${variables.status.replace('_', ' ').toUpperCase()}.` });
      const queryKeyToInvalidate = applicationType === 'job' ? ['jobApplicants', applicant.job_id] : ['collabApplicants', applicant.collab_id];
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
    },
    onError: (error) => {
      toast({ title: 'Error Updating Status', description: error.message, variant: 'destructive' });
    },
  });

  const handleUpdateStatus = (status: Enums<'application_status_enum'>) => {
    mutation.mutate({ status });
  };

  const isPending = mutation.isPending;
  const applicantTitle = applicant.job_title || applicant.collab_title;

  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Header: Name & Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Link to={`/profile/${applicant.applicant_id}`} className="text-lg font-semibold text-primary hover:underline block">
                    {applicant.applicant_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">Applied for: <span className="font-medium text-foreground">{applicantTitle}</span></p>
                </div>
              </div>
              {getStatusBadge(applicant.status as Enums<'application_status_enum'>)}
            </div>
            
            {/* Quick Stats / Info */}
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-md">
              <p>Applied: {new Date(applicant.applied_at).toLocaleDateString()}</p>
              
              {/* Cover Letter Indicator */}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {applicant.cover_letter ? <span className="text-green-600 font-medium">Cover Letter Included</span> : <span>No Cover Letter</span>}
              </div>

              {/* Resume Link (Direct) */}
              <div className="flex items-center gap-2 col-span-2">
                <FileText className="h-4 w-4" />
                {applicant.resume_url ? (
                  <a 
                    href={applicant.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    View Resume <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">No Resume Attached</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(true)}>
                Review Application Details
              </Button>

              <div className="flex gap-2">
                {/* Simplified Status Actions */}
                {applicant.status === 'pending' && (
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('viewed')} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />} Mark Viewed
                  </Button>
                )}
                {applicant.status !== 'rejected' && applicant.status !== 'hired' && (
                  <Button variant="destructive_outline" size="sm" onClick={() => handleUpdateStatus('rejected')} disabled={isPending}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                )}
                {applicant.status !== 'hired' && (
                  <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleUpdateStatus('hired')} disabled={isPending}>
                    <Check className="h-4 w-4 mr-1" /> Hire / Accept
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- DETAILS DIALOG --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Application from {applicant.applicant_name}</DialogTitle>
            <DialogDescription>
              Reviewing application for <strong>{applicantTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resume Section */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Resume / CV</p>
                  <p className="text-xs text-muted-foreground">PDF or Document</p>
                </div>
              </div>
              {applicant.resume_url ? (
                <Button asChild variant="outline">
                  <a href={applicant.resume_url} target="_blank" rel="noopener noreferrer">
                    Open File <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Badge variant="secondary">Not Provided</Badge>
              )}
            </div>

            {/* Cover Letter Section */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Cover Letter
              </h4>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-card">
                {applicant.cover_letter ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {applicant.cover_letter}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-8">
                    No cover letter provided.
                  </p>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
             <div className="text-xs text-muted-foreground">
               Applied: {new Date(applicant.applied_at).toLocaleString()}
             </div>
             <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
