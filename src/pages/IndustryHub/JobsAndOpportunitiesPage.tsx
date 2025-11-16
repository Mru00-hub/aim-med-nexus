import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobsTab } from '@/components/industry/JobsTab';
import { CollabsTab } from '@/components/industry/CollabsTab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select';
import { Plus, Search, X } from 'lucide-react';

// --- Helper Types for Filters ---
type Option = {
  id: string;
  label: string;
};

// --- Props for Child Tabs ---
export type TabFilterProps = {
  searchQuery: string;
  locationId?: string;
  industryId?: string;
  specializationIds: string[];
};

export default function JobsAndOpportunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [industryId, setIndustryId] = useState<string | undefined>(undefined);
  const [specializationIds, setSpecializationIds] = useState<string[]>([]);

  // --- Data Fetching for Filters ---
  const [locations, setLocations] = useState<Option[]>([]);
  const [industries, setIndustries] = useState<Option[]>([]);
  const [specializations, setSpecializations] = useState<Option[]>([]);

  const [locationSearch, setLocationSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [specializationSearch, setSpecializationSearch] = useState("");

  const [isLocLoading, setIsLocLoading] = useState(false);
  const [isIndLoading, setIsIndLoading] = useState(false);
  const [isSpecLoading, setIsSpecLoading] = useState(false);

  // --- Debounced Fetching Hooks ---
  useDebouncedFetch(
    'locations',
    locationSearch,
    setLocations,
    setIsLocLoading
  );
  useDebouncedFetch(
    'industries',
    industrySearch,
    setIndustries,
    setIsIndLoading
  );
  useDebouncedFetch(
    'specializations',
    specializationSearch,
    setSpecializations,
    setIsSpecLoading
  );

  // --- Memoized Options for Selects ---
  const locationOptions = useMemo(() => 
    locations.map(loc => ({ value: loc.id, label: loc.label })),
    [locations]
  );
  const industryOptions = useMemo(() => 
    industries.map(ind => ({ value: ind.id, label: ind.label })),
    [industries]
  );
  const specializationOptions = useMemo(() =>
    specializations.map(spec => ({ value: spec.id, label: spec.label })),
    [specializations]
  );

  // --- Handlers ---
  const handlePostOpportunityClick = () => {
    if (user) {
      navigate('/industryhub/post-job'); 
    } else {
      navigate('/login', { state: { from: '/industryhub/post-job' } });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationId(undefined);
    setIndustryId(undefined);
    setSpecializationIds([]);
  };

  const hasActiveFilters =
    searchQuery || locationId || industryId || specializationIds.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
          
          {/* --- Redesigned Page Header --- */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                Jobs & Opportunities
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Find your next role or collaboration in the medical community.
              </p>
            </div>
            <Button
              className="w-full flex-shrink-0 md:w-auto"
              onClick={handlePostOpportunityClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Post an Opportunity
            </Button>
          </div>

          {/* --- New Filter Bar --- */}
          <Card className="mb-8 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or keyword..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Location Filter */}
                <SearchableSelect
                  value={locationId}
                  onValueChange={setLocationId}
                  options={locationOptions}
                  onSearchChange={setLocationSearch}
                  isLoading={isLocLoading}
                  placeholder="Filter by location..."
                  searchPlaceholder="Search locations..."
                  emptyMessage="No locations found."
                  showOther={false}
                />
                
                {/* Industry Filter */}
                <SearchableSelect
                  value={industryId}
                  onValueChange={setIndustryId}
                  options={industryOptions}
                  onSearchChange={setIndustrySearch}
                  isLoading={isIndLoading}
                  placeholder="Filter by industry..."
                  searchPlaceholder="Search industries..."
                  emptyMessage="No industries found."
                  showOther={false}
                />
                
                {/* Specialization Filter */}
                <SearchableMultiSelect
                  values={specializationIds}
                  onValuesChange={setSpecializationIds}
                  options={specializationOptions}
                  onSearchChange={setSpecializationSearch}
                  isLoading={isSpecLoading}
                  placeholder="Filter by specialty..."
                  searchPlaceholder="Search specialties..."
                  emptyMessage="No specialties found."
                />
              </div>
              
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- Tabs --- */}
          <Tabs defaultValue="jobs">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="collaborations">
                Collaborations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs">
              <JobsTab
                searchQuery={searchQuery}
                locationId={locationId}
                industryId={industryId}
                specializationIds={specializationIds}
              />
            </TabsContent>
            
            <TabsContent value="collaborations">
              <CollabsTab
                searchQuery={searchQuery}
                locationId={locationId}
                industryId={industryId}
                specializationIds={specializationIds}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- Custom Hook for Debounced Fetching ---
// (You can move this to a separate file, e.g., 'hooks/useDebouncedFetch.ts')
function useDebouncedFetch(
  tableName: 'locations' | 'industries' | 'specializations',
  searchTerm: string,
  setData: React.Dispatch<React.SetStateAction<Option[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  const isMounted = useRef(false);

  useEffect(() => {
    const fetchSearchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select('id, label') // Assuming 'industries' also uses 'label'
        .neq('label', 'Other')
        .or(`label.ilike.%${searchTerm}%`)
        .order('label')
        .limit(50);
      if (data) setData(data.map(d => ({ id: d.id, label: d.label })));
      if (error) console.error(`Error fetching ${tableName}:`, error);
      setLoading(false);
    };

    const fetchInitialData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select('id, label')
        .neq('label', 'Other')
        .order('label')
        .limit(10);
      if (data) setData(data.map(d => ({ id: d.id, label: d.label })));
      if (error) console.error(`Error fetching initial ${tableName}:`, error);
      setLoading(false);
    };

    if (!isMounted.current) {
      isMounted.current = true;
      fetchInitialData();
      return;
    }

    const searchTimer = setTimeout(() => {
      if (searchTerm.length < 2) {
        fetchInitialData();
      } else {
        fetchSearchData();
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchTerm, tableName, setData, setLoading]);
}
