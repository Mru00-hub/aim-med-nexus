import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getMyJobApplications,
  getMyCollabApplications,
} from '@/integrations/supabase/industry.api';
import { ApplicationStatusItem } from '@/components/industry/ApplicationStatusItem';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Helper component to render the list for each tab
const ApplicationList: React.FC<{ type: 'job' | 'collaboration' }> = ({ type }) => {
  const queryFn = type === 'job' ? getMyJobApplications : getMyCollabApplications;
  const queryKey = type === 'job' ? 'myJobApplications' : 'myCollabApplications';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [queryKey],
    queryFn: queryFn,
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
        <AlertTitle>Error Loading Applications</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed">
        <FileText className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          You have not submitted any {type} applications yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const id = type === 'job' ? item.job_id : item.collab_id;
        return (
          <ApplicationStatusItem 
            key={item.application_id || id} 
            item={item} 
            type={type} 
          />
        );
      })}
    </div>
  );
};

// Main Page Component
export default function MyApplicationsPage() {
  const { user } = useAuth(); // Ensures user is logged in (via AuthGuard)

  if (!user) {
    // This page should be protected by AuthGuard, but this is a fallback.
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
              My Applications
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Track the status of all your submitted applications.
            </p>
          </div>

          <Tabs defaultValue="jobs">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="jobs">Job Applications</TabsTrigger>
              <TabsTrigger value="collaborations">
                Collaboration Applications
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs">
              <ApplicationList type="job" />
            </TabsContent>
            
            <TabsContent value="collaborations">
              <ApplicationList type="collaboration" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
