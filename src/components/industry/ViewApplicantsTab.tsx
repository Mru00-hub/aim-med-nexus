import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  getJobApplicants,
  getCollabApplicants,
  Applicant,
  getCompanyProfileDetails,
} from '@/integrations/supabase/industry.api';
import { Loader2, Users, Frown, Filter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApplicantCard } from './ApplicantCard'; // Assuming ApplicantCard is in the same directory or properly imported

type ApplicationType = 'job' | 'collaboration' | 'all';
type ApplicationStatus = 'all' | 'pending' | 'viewed' | 'in_progress' | 'rejected' | 'hired';

export const ViewApplicantsTab: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ApplicationType>('all');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Company ID of the current admin
  const { data: companyId, isLoading: isLoadingId, isError: isErrorId } = useQuery<string | null, Error>({
    queryKey: ['myAdminCompanyId'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_admin_company_id');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });
  
  // 2. Fetch all active Jobs and Collabs to get their IDs for applicant queries
  const { data: companyProfile } = useQuery({
    queryKey: ['companyProfileDetails', companyId],
    queryFn: () => getCompanyProfileDetails(companyId!),
    enabled: !!companyId,
    // Ensure we don't block the main render if this fails, we only need the IDs
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const jobIds = companyProfile?.jobs.filter(j => j.is_active).map(j => j.id) || [];
  const collabIds = companyProfile?.collaborations.filter(c => c.is_active).map(c => c.id) || [];

  // 3. Fetch Job Applicants (Parallel Queries)
  const jobApplicantsQueries = jobIds.map(jobId => useQuery<Applicant[], Error>({
    queryKey: ['jobApplicants', jobId],
    queryFn: () => getJobApplicants(jobId),
    enabled: !!companyId && !!jobId,
  }));

  // 4. Fetch Collab Applicants (Parallel Queries)
  const collabApplicantsQueries = collabIds.map(collabId => useQuery<Applicant[], Error>({
    queryKey: ['collabApplicants', collabId],
    queryFn: () => getCollabApplicants(collabId),
    enabled: !!companyId && !!collabId,
  }));

  const isLoadingApplicants = jobApplicantsQueries.some(q => q.isLoading) || collabApplicantsQueries.some(q => q.isLoading);

  // 5. Merge and Process Data
  const allApplicants: (Applicant & { applicationType: 'job' | 'collaboration' })[] = useMemo(() => {
    if (!companyProfile) return [];

    const jobApplicants = jobApplicantsQueries
      .filter(q => q.isSuccess && q.data)
      .flatMap(q => q.data!.map(a => ({ ...a, applicationType: 'job' as const })));

    const collabApplicants = collabApplicantsQueries
      .filter(q => q.isSuccess && q.data)
      .flatMap(q => q.data!.map(a => ({ ...a, applicationType: 'collaboration' as const })));

    return [...jobApplicants, ...collabApplicants];
  }, [jobApplicantsQueries, collabApplicantsQueries, companyProfile]);

  // 6. Apply Filters and Sort
  const filteredApplicants = useMemo(() => {
    let list = allApplicants;

    // Filter by Application Type
    if (activeTab === 'job') {
      list = list.filter(a => a.applicationType === 'job');
    } else if (activeTab === 'collaboration') {
      list = list.filter(a => a.applicationType === 'collaboration');
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter);
    }

    // Filter by Search Term (Name or Title)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(a => 
        a.applicant_name.toLowerCase().includes(lowerSearch) ||
        (a.job_title || a.collab_title || '').toLowerCase().includes(lowerSearch)
      );
    }
    
    // Sort by applied_at (newest first)
    list.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

    return list;
  }, [allApplicants, activeTab, statusFilter, searchTerm]);

  if (isLoadingId || isLoadingApplicants) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isErrorId || !companyId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You are not an admin for a company or your company ID could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  const jobCount = allApplicants.filter(a => a.applicationType === 'job').length;
  const collabCount = allApplicants.filter(a => a.applicationType === 'collaboration').length;
  const totalCount = allApplicants.length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        Applicant Management
      </h2>
      <p className="text-muted-foreground">
        View and manage all applications submitted to your company's job and collaboration posts.
      </p>
      
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Input
          placeholder="Search applicants by name or post title..."
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
          <Filter className="h-4 w-4" />
          Filter by Status:
        </div>
        <Select onValueChange={(value) => setStatusFilter(value as ApplicationStatus)} value={statusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for Application Type */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ApplicationType)} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All Applications ({totalCount})</TabsTrigger>
          <TabsTrigger value="job">Jobs ({jobCount})</TabsTrigger>
          <TabsTrigger value="collaboration">Collaborations ({collabCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredApplicants.length > 0 ? (
            filteredApplicants.map(applicant => (
              <ApplicantCard
                key={applicant.application_id}
                applicant={applicant}
                applicationType={applicant.applicationType}
              />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Frown className="mx-auto h-10 w-10 mb-4" />
              <p className="text-lg">No applicants found matching your criteria.</p>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
