import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getAllActiveCollaborations } from '@/integrations/supabase/industry.api';
import { CollabCard } from '@/components/industry/CollabCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Users as CollabIcon } from 'lucide-react';
import { TabFilterProps } from './JobsAndOpportunitiesPage'; // Import props from parent

export const CollabsTab: React.FC<TabFilterProps> = ({
  searchQuery,
  locationId,
  industryId,
  specializationIds,
}) => {
  // --- Main Query for Collabs ---
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
      'allCollabs',
      searchQuery,
      locationId,
      industryId,
      specializationIds,
    ],
    queryFn: ({ pageParam = 1 }) =>
      getAllActiveCollaborations(pageParam, 12, {
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

  const allCollabs = data?.pages.flatMap((page) => page) ?? [];

  // --- Render Functions ---
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
          <AlertTitle>Error Loading Collaborations</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </PrimaryAlertDescription>
        </Alert>
      );
    }

    if (allCollabs.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <CollabIcon className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">No collaborations found matching your criteria.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {allCollabs.map((collab) => (
          <CollabCard key={collab.collab_id} collab={collab} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Latest Collaborations</h2>
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
        {!hasNextPage && allCollabs.length > 0 && (
          <p className="text-muted-foreground">You've reached the end.</p>
        )}
      </div>
      
      {/* --- Research Resources --- */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold mb-6">Research & Collaboration Resources</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Grant Writing Guide", desc: "Tips for securing research funding", icon: "✍️" },
            { title: "Ethics & IRB", desc: "Navigate ethics committee approvals", icon: "🛡️" },
            { title: "Statistical Analysis", desc: "Tools and guides for your data", icon: "📊" },
            { title: "Publishing Tips", desc: "Get your research published", icon: "G" }
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

