import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getCompanyProfileDetails } from '@/integrations/supabase/industry.api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Plus, Edit, Briefcase, MessageSquare, Users } from 'lucide-react';

// Imported/Finalized Components (from the provided repo structure)
import { ManageJobsTab } from '@/components/industry/ManageJobsTab';
import { ManageCollabsTab } from '@/components/industry/ManageCollabsTab';
import { ViewApplicantsTab } from '@/components/industry/ViewApplicantsTab'; // From previous step

export default function CompanyDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs'); // Set default tab

  // 1. Fetch the user's company ID (Permission Check)
  const {
    data: companyId,
    isLoading: isLoadingId,
    isError: isErrorId,
    error: idError,
  } = useQuery<string | null, Error>({
    queryKey: ['myAdminCompanyId'],
    queryFn: async () => {
      // This RPC finds the company ID managed by the current user
      const { data, error } = await supabase.rpc('get_my_admin_company_id');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  // 2. Fetch the Company Name for a better header display
  const { data: companyDetails } = useQuery({
    queryKey: ['companyProfile', companyId],
    queryFn: () => getCompanyProfileDetails(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });

  // --- Render States ---

  // Loading State
  if (isLoadingId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Access Denied / No Company State (Triggered if RPC returns null or fails)
  if (!companyId) {
    // If the RPC returns null (no company), or an error occurs.
    if (!isLoadingId) {
      // Immediately navigate if the user needs to create a company
      if (!isErrorId && !companyId) {
        navigate('/industryhub/create-company');
        return null;
      }
      
      // Show an error if the fetch failed
      return (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="container-medical flex-1 py-12">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                Your company profile could not be loaded. Please ensure you are authorized. 
                Error: {idError?.message || 'Unknown error.'}
              </AlertDescription>
            </Alert>
          </main>
          <Footer />
        </div>
      );
    }
    return null; // Should be handled by navigation or loading state
  }
  
  const companyName = companyDetails?.profile.company_name;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        <div className="container-medical mx-auto max-w-5xl px-4 py-8 md:py-12">
          
          {/* Header Section */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                {companyName ? `${companyName} Dashboard` : 'Company Dashboard'}
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Manage your company's presence, postings, and applicants.
              </p>
            </div>
            <div className="flex w-full flex-shrink-0 gap-2 md:w-auto">
              <Button asChild variant="outline" className="flex-1">
                <Link to={`/industryhub/company/${companyId}`}>
                  <Building className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                {/* Note: EditCompanyPage doesn't need ID in URL as it fetches it */}
                <Link to="/industryhub/edit-company"> 
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </div>

          {/* Post Actions (Quick Links) */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Button asChild variant="secondary">
                <Link to="/industryhub/post-job">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Job
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/industryhub/post-collab">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Collab
                </Link>
              </Button>
              <Button asChild variant="secondary" onClick={() => setActiveTab('applicants')}>
                  <Users className="mr-2 h-4 w-4" />
                  View Applicants
              </Button>
               <Button asChild variant="secondary">
                <Link to="/settings/notifications">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
          </div>
          <hr className="my-8" />


          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto h-12">
              <TabsTrigger value="jobs" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Manage Jobs
              </TabsTrigger>
              <TabsTrigger value="collaborations" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Manage Collabs
              </TabsTrigger>
              <TabsTrigger value="applicants" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                View Applicants
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Open Job Postings</h2>
              <ManageJobsTab companyId={companyId} />
            </TabsContent>
            
            <TabsContent value="collaborations" className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Active Collaborations</h2>
              <ManageCollabsTab companyId={companyId} />
            </TabsContent>
            
            <TabsContent value="applicants" className="mt-8">
              <ViewApplicantsTab />
            </TabsContent>
            
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
