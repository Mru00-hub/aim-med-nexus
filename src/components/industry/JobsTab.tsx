import React, { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAllActiveJobs, getIndustries } from '@/integrations/supabase/industry.api';
import { supabase } from '@/integrations/supabase/client';
import { JobCard } from '@/components/industry/JobCard'; // Uses our new, detailed card
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  Search,
  X,
  Plus,
  Briefcase,
  Filter,
} from 'lucide-react';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const JobsTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    locationId: '',
    experience: '',
    jobType: '',
    specialization: '',
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  // --- Data for Filters ---
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: specializations } = useQuery({
    queryKey: ['specializations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('specializations').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // --- Main Query for Jobs ---
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
      debouncedSearch,
      filters.locationId,
      filters.experience,
      filters.jobType,
      filters.specialization,
    ],
    queryFn: ({ pageParam = 1 }) =>
      getAllActiveJobs(pageParam, 12), // TODO: Update API to accept all filters
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length + 1 : undefined;
    },
  });

  const allJobs = data?.pages.flatMap((page) => page) ?? [];

  const handleFilterChange = (
    key: 'locationId' | 'experience' | 'jobType' | 'specialization',
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAuthAction = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate('/login', { state: { from: path } });
    }
  };

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
          <Button
            variant="outline"
            onClick={() => setFilters({ search: '', locationId: '', experience: '', jobType: '', specialization: '' })}
          >
            Clear Filters
          </Button>
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
    <>
      {/* --- Filter Card (Based on your Jobs.tsx) --- */}
      <Card className="card-medical mb-8 animate-slide-up">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search job titles, companies, or skills..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select
              value={filters.locationId}
              onValueChange={(value) => handleFilterChange('locationId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.experience}
              onValueChange={(value) => handleFilterChange('experience', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                {/* These values come from your Enums */}
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="one_to_three">1-3 years</SelectItem>
                <SelectItem value="three_to_five">3-5 years</SelectItem>
                <SelectItem value="five_to_ten">5-10 years</SelectItem>
                <SelectItem value="ten_plus">10+ years</SelectItem>
              </SelectContent>
            </Select>
            <Button className="btn-medical">
              <Filter className="h-4 w-4 mr-2" />
              Search Jobs
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Select
              value={filters.jobType}
              onValueChange={(value) => handleFilterChange('jobType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="locum">Locum</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.specialization}
              onValueChange={(value) => handleFilterChange('specialization', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations?.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>{spec.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center md:col-span-2">
              <Button
                className="btn-medical w-full"
                onClick={() => handleAuthAction('/industryhub/post-job')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post a Job
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Jobs List --- */}
      <div className="space-y-6 animate-slide-up">
        <h2 className="text-2xl font-semibold">Latest Job Opportunities</h2>
        {renderContent()}
      </div>

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

      {/* --- Career Resources (from your Jobs.tsx) --- */}
      <div className="mt-16 animate-fade-in">
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
    </>
  );
};
