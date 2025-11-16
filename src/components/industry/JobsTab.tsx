import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getAllActiveJobs } from '@/integrations/supabase/industry.api';
import { JobCard } from '@/components/industry/JobCard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Briefcase } from 'lucide-react';
import { TabFilterProps } from './JobsAndOpportunitiesPage'; // Import props from parent

export const JobsTab: React.FC<TabFilterProps> = ({
  searchQuery,
  locationId,
  industryId,
  specializationIds,
}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'allJobs',
      searchQuery,
      locationId,
      industryId,
      specializationIds,
    ],
    queryFn: ({ pageParam = 1 }) =>
      getAllActiveJobs(pageParam, 12, {
        searchQuery,
        locationId,
        industryId,
        specializationIds,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length + 1 : undefined;
    },
  });

  const allJobs = data?.pages.flatMap((page) => page) ?? [];

  const renderContent = () => {
    if (isLoading && !data) {
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

    if (allJobs.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Briefcase className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">No jobs found matching your criteria.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {allJobs.map((job) => (
          <JobCard key={job.job_id} job={job} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Latest Job Opportunities</h2>
      {renderContent()}

      {/* --- Pagination / Load More --- */}
      <div className="mt-12 flex justify-center">
        {hasNextPage && (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Load More
          </Button>
        )}
        {!hasNextPage && allJobs.length > 0 && (
          <p className="text-muted-foreground">You've reached the end.</p>
        )}
      </div>

      {/* --- Career Resources --- */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold mb-6">Career Resources</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Resume Builder", desc: "Create professional healthcare resumes", icon: "📄" },
            { title: "Interview Tips", desc: "Ace your healthcare job interviews", icon: "💼" },
            { title: "Salary Guide", desc: "Healthcare salary benchmarks in India", icon: "💰" },
            { title: "Career Paths", desc: "Explore healthcare career options", icon: "🎯" }
          ].map((resource) => (
            <Card key={resource.title} className="card-medical text-center">
              <CardContent className="p-6">
                <div className="text-3xl mb-3">{resource.icon}</div>
                <h3 className="font-semibold mb-2">{resource.title}</h3>
                <p className="text-sm text-muted-foreground">{resource.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
