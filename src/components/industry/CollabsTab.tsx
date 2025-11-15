import React, { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAllActiveCollaborations } from '@/integrations/supabase/industry.api';
import { supabase } from '@/integrations/supabase/client';
import { CollabCard } from '@/components/industry/CollabCard'; // Uses our new card
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import {
  Loader2,
  AlertCircle,
  Search,
  X,
  Plus,
  Users as CollabIcon,
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

export const CollabsTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    locationId: '',
    collabType: '',
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
      debouncedSearch,
      filters.locationId,
      filters.collabType,
    ],
    queryFn: ({ pageParam = 1 }) =>
      getAllActiveCollaborations(pageParam, 12), // TODO: Update API to accept all filters
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 12 ? allPages.length + 1 : undefined;
    },
  });

  const allCollabs = data?.pages.flatMap((page) => page) ?? [];

  const handleFilterChange = (
    key: 'locationId' | 'collabType',
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
          <AlertTitle>Error Loading Collaborations</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </AlertDescription>
        </Alert>
      );
    }

    if (allCollabs.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <CollabIcon className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">No collaborations found matching your criteria.</p>
          <Button
            variant="outline"
            onClick={() => setFilters({ search: '', locationId: '', collabType: '' })}
          >
            Clear Filters
          </Button>
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
    <>
      {/* --- Filter Card --- */}
      <Card className="card-medical mb-8 animate-slide-up">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search titles, companies, or skills..."
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
              value={filters.collabType}
              onValueChange={(value) => handleFilterChange('collabType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Collaboration Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinical_trial">Clinical Trial</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="advisory">Advisory</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
             <div className="md:col-span-2">
               <Button className="btn-medical w-full">
                 <Filter className="h-4 w-4 mr-2" />
                 Search Collaborations
               </Button>
             </div>
             <div className="flex items-center md:col-span-2">
              <Button
                className="btn-medical w-full"
                onClick={() => handleAuthAction('/industryhub/post-collab')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post a Collaboration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Collabs List --- */}
      <div className="space-y-6 animate-slide-up">
        <h2 className="text-2xl font-semibold">Latest Collaborations</h2>
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
        {!hasNextPage && allCollabs.length > 0 && (
          <p className="text-muted-foreground">You've reached the end.</p>
        )}
      </div>
      
      {/* --- Research Resources (Similar to Career Resources) --- */}
      <div className="mt-16 animate-fade-in">
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
    </>
  );
};

