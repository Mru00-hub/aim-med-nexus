import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getJobById,
  getCollabById,
  applyToJob,
  applyToCollab,
  MyJobApplication,
  MyCollabApplication,
} from '@/integrations/supabase/industry.api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileText, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type ApplicationType = 'job' | 'collaboration';

export default function SubmitApplicationPage() {
  const { jobId, collabId } = useParams<{ jobId?: string; collabId?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth(); // We need the user's profile
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [coverLetter, setCoverLetter] = useState('');
  
  // 1. Determine the context (Job vs. Collab)
  const applicationType: ApplicationType = jobId ? 'job' : 'collaboration';
  const id = jobId || collabId;

  // 2. Fetch the details of the job or collab to show in the header
  const {
    data,
    isLoading: isLoadingData,
    isError,
    error,
  } = useQuery({
    queryKey: [applicationType === 'job' ? 'jobDetails' : 'collabDetails', id],
    queryFn: () => {
      if (!id) return null;
      return applicationType === 'job' ? getJobById(id) : getCollabById(id);
    },
    enabled: !!id && !!user, // Only run if we have an ID and user
  });

  // 3. Create the submission mutation
  const { mutate: submitApplication, isPending: isSubmitting } = useMutation({
    mutationFn: () => {
      const payload = {
        p_cover_letter: coverLetter || null,
        ...(applicationType === 'job'
          ? { p_job_id: jobId! }
          : { p_collab_id: collabId! }),
      };
      
      if (applicationType === 'job') {
        return applyToJob(payload);
      } else {
        return applyToCollab(payload);
      }
    },
    onSuccess: (newData: any) => {
      // --- Optimistic Update ---
      // We'll optimistically add this to the 'My Applications' list
      // before we even navigate away.
      
      const queryKey = [applicationType === 'job' ? 'myJobApplications' : 'myCollabApplications'];
      
      // We don't have all the data from the RPC, so we build a temporary object
      const optimisticApp = {
        application_id: newData?.application_id || new Date().toISOString(),
        applied_at: new Date().toISOString(),
        status: 'pending',
        cover_letter: coverLetter || null,
        ...(applicationType === 'job'
          ? {
              job_id: jobId,
              job_title: data?.title,
              company_name: data?.company_name,
            }
          : {
              collab_id: collabId,
              collab_title: data?.title,
              company_name: data?.company_name,
            }),
      };
      
      // Update the cache
      queryClient.setQueryData(queryKey, (oldData: any[] | undefined) => {
        return [optimisticApp, ...(oldData || [])];
      });

      toast({
        title: 'Application Submitted!',
        description: `Your application for ${data?.title} has been sent.`,
      });
      
      // 4. Navigate to the "My Applications" page
      navigate('/industryhub/my-applications');
    },
    onError: (err) => {
      toast({
        title: 'Submission Failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.resume_url) {
      toast({
        title: 'No Resume Found',
        description: 'Please add a resume to your user profile before applying.',
        variant: 'destructive',
      });
      return;
    }
    submitApplication();
  };
  
  // --- Render States ---

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container-medical flex-1 py-12">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="mt-4 h-8 w-1/2" />
          <Skeleton className="mt-8 h-64 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container-medical flex-1 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Application</AlertTitle>
            <AlertDescription>
              {error?.message || "This opportunity could not be found."}
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="container-medical flex-1 py-12">
        <Card className="mx-auto max-w-3xl shadow-lg">
          <CardHeader>
            <CardDescription>You are applying for:</CardDescription>
            <CardTitle className="text-3xl">{data.title}</CardTitle>
            <Link
              to={`/industryhub/company/${data.company_id}`}
              className="text-lg text-primary hover:underline"
            >
              at {data.company_name}
            </Link>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Resume Info */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    Your Profile
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You are applying as: <strong>{profile?.full_name || user?.email}</strong>
                  </p>
                  {profile?.resume_url ? (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
                      <FileText className="h-5 w-5 flex-shrink-0 text-green-700" />
                      <p className="text-sm text-green-800">
                        Your profile resume (<strong>{profile.resume_url.split('/').pop()}</strong>) will be attached.
                      </p>
                    </div>
                  ) : (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Resume on Profile</AlertTitle>
                      <AlertDescription>
                        You must <Link to={`/profile/${user?.id}?edit=true`} className="font-bold underline">upload a resume to your profile</Link> before applying.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Cover Letter */}
              <div className="space-y-2">
                <label htmlFor="coverLetter" className="text-base font-medium">
                  Cover Letter (Optional)
                </label>
                <Textarea
                  id="coverLetter"
                  placeholder={`Write a brief message to ${data.company_name}...`}
                  rows={8}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              {/* Submission */}
              <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || !profile?.resume_url}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
