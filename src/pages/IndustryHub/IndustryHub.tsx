import React, { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { 
  getAllCompanies, 
  getIndustries 
} from '@/integrations/supabase/industry.api';
import { supabase } from '@/integrations/supabase/client';
import { CompanyCard } from '@/components/industry/CompanyCard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Info, Search, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Simple debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export default function IndustryHub() {
  const [filters, setFilters] = useState({
    search: '',
    industryId: '',
    locationId: '',
  });
  const debouncedSearch = useDebounce(filters.search, 500);
  const navigate = useNavigate(); // 2. Get navigate function
  const { user } = useAuth();

  // Fetch data for filters
  const { data: industries } = useQuery({
    queryKey: ['industries'],
    queryFn: getIndustries,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Main query for companies using infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['allCompanies', debouncedSearch, filters.industryId, filters.locationId],
    queryFn: ({ pageParam = 1 }) =>
      getAllCompanies({
        page: pageParam,
        limit: 12, // 12 fits nicely in 1, 2, and 3-column grids
        searchQuery: debouncedSearch || undefined,
        industryId: filters.industryId || undefined,
        locationId: filters.locationId || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page had 12 items, we assume there's a next page
      return lastPage.length === 12 ? allPages.length + 1 : undefined;
    },
  });

  const allCompanies = data?.pages.flatMap((page) => page) ?? [];

  const handleFilterChange = (key: 'industryId' | 'locationId', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', industryId: '', locationId: '' });
  };

  const handleCreateCompanyClick = () => {
    if (user) {
      navigate('/industryhub/create-company'); // New page we will build
    } else {
      navigate('/login', { state: { from: '/industryhub/create-company' } });
    }
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
          <AlertTitle>Error Loading Companies</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </AlertDescription>
        </Alert>
      );
    }

    if (allCompanies.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Search className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            No companies found matching your criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allCompanies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
          {/* Hero Section */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                Industry Hub
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Explore companies, partners, and organizations.
              </p>
            </div>
            {/* 5. ADDED THE BUTTON HERE */}
            <Button 
              size="lg" 
              className="w-full flex-shrink-0 md:w-auto"
              onClick={handleCreateCompanyClick}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Company Page
            </Button>
          </div>

          {/* Disclaimer */}
          <Alert className="mb-8 border-blue-200 bg-blue-50 text-blue-800">
            <Info className="h-4 w-4 !text-blue-800" />
            <AlertTitle className="font-semibold">Welcome to the Hub</AlertTitle>
            <AlertDescription>
              All company profiles are managed directly by the organizations
              themselves. AIMMedNet does not endorse or verify all information.
            </AlertDescription>
          </Alert>

          {/* Filters Card */}
          <div className="mb-8 rounded-lg border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="relative md:col-span-3 lg:col-span-2">
                <Input
                  placeholder="Search by name, description..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              
              <Select
                value={filters.industryId}
                onValueChange={(value) => handleFilterChange('industryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  {industries?.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.locationId}
                onValueChange={(value) => handleFilterChange('locationId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(filters.search || filters.industryId || filters.locationId) && (
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
            {!hasNextPage && allCompanies.length > 0 && (
              <p className="text-muted-foreground">You've reached the end.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
