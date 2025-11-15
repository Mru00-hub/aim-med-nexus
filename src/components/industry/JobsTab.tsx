import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getAllActiveJobs } from '@/integrations/supabase/industry.api';
import { JobCard } from '@/components/industry/JobCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Search, X, Briefcase } from 'lucide-react';

// Re-using the same debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const JobsTab: React.FC = () => {
  const [filters, setFilters] = useState({
    search: '',
    jobType: '',
    location: '',
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  // Main query for jobs using infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    // TODO: Update queryKey and queryFn to support new filters
    queryKey: ['allJobs', debouncedSearch, filters.jobType, filters.location],
    queryFn: ({ pageParam = 1 }) =>
      getAllActiveJobs(pageParam, 12), // TODO: Update API call with filters
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length + 1 : undefined;
    },
  });

  const allJobs = data?.pages.flatMap((page) => page) ?? [];

  const handleFilterChange = (key: 'jobType' | 'location', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', jobType: '', location: '' });
  };

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
          <p className="text-muted-foreground">
            No jobs found matching your criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allJobs.map((job) => (
          <JobCard key={job.job_id} job={job} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Filters Card */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-3 lg:col-span-2">
            <Input
              placeholder="Search by title, company, or skill..."
              className="pl-10"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          <Select
            value={filters.jobType}
            onValueChange={(value) => handleFilterChange('jobType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              {/* These values come from your Enums */}
              <SelectItem value="full_time">Full-time</SelectItem>
              <SelectItem value="part_time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="locum">Locum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {(filters.search || filters.jobType || filters.location) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-4">
            <X className="mr-1.5 h-4 w-4" />
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Content Grid */}
      {renderContent()}

      {/* Pagination / Load More */}
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
    </>
  );
};
