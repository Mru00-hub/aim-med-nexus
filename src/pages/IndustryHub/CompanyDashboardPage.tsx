import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getCompanyProfileDetails } from '@/integrations/supabase/industry.api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Plus, Edit, Briefcase, MessageSquare, Users, Building, Link as LinkIcon, UserCog, Settings } from 'lucide-react';

// [!code --] (Old imports)
// import { ManageJobsTab } from '@/components/industry/ManageJobsTab';
// import { ManageCollabsTab } from '@/components/industry/ManageCollabsTab';
// import { ViewApplicantsTab } from '@/components/industry/ViewApplicantsTab';
// [!code ++] (New imports for our new components)
import { ManageJobsTab } from '@/components/industry/ManageJobsTab';
import { ManageCollabsTab } from '@/components/industry/ManageCollabsTab';
import { ViewApplicantsTab } from '@/components/industry/ViewApplicantsTab';
import { ManageProductsAndLinksTab } from '@/components/industry/ManageProductsAndLinksTab';
import { ManageManagersTab } from '@/components/industry/ManageManagersTab';


export default function CompanyDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'jobs'); 
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // 1. Fetch the user's company ID (Permission Check)
  const {
    data: companyId,
    isLoading: isLoadingId,
    isError: isErrorId,
    error: idError,
  } = useQuery<string | null, Error>({
    queryKey: ['myAdminCompanyId'],
    queryFn: async () => {
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
  if (isLoadingId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyId) {
    if (!isLoadingId) {
      if (!isErrorId && !companyId) {
        navigate('/industryhub/create-company');
        return null;
      }
      
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
    return null; 
  }
  
  const companyName = companyDetails?.company_name;

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
              <Button variant="secondary" onClick={() => setActiveTab('applicants')}>
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
              <TabsTrigger value="links" className="flex items-center">
                <LinkIcon className="mr-2 h-4 w-4" />
                Products & Links
              </TabsTrigger>
              <TabsTrigger value="managers" className="flex items-center">
                <UserCog className="mr-2 h-4 w-4" />
                Managers
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

            {/* [!code --] (This is where the old placeholders were) */}
            {/* [!code ++] (Replace placeholders with the new components) */}
            <TabsContent value="links" className="mt-8">
              <ManageProductsAndLinksTab companyId={companyId} />
            </TabsContent>
            
            <TabsContent value="managers" className="mt-8">
              <ManageManagersTab companyId={companyId} />
            </TabsContent>
            
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
