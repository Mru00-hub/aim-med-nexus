import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobsTab } from '@/components/industry/JobsTab';
import { CollabsTab } from '@/components/industry/CollabsTab';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Plus } from 'lucide-react';

export default function JobsAndOpportunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePostOpportunityClick = () => {
    if (user) {
      // We can have a single "poster" page that asks what type,
      // or we can link to a dashboard. Let's start with a simple link.
      // We'll need to create this route.
      navigate('/industryhub/post-job'); 
    } else {
      navigate('/login', { state: { from: '/industryhub/post-job' } });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
              Jobs & Opportunities
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Find your next role or collaboration in the medical community.
            </p>
          </div>

          {/* --- NEW: Informational & CTA Section --- */}
          <Alert className="mb-8 flex flex-col items-start justify-between gap-4 border-blue-200 bg-blue-50 text-blue-800 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 !text-blue-800" />
                <AlertTitle className="font-semibold">
                  Find Your Next Opportunity
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2 text-blue-700">
                Browse all active job postings and research collaborations from
                companies and professionals on the platform.
              </AlertDescription>
            </div>
            <Button
              className="w-full flex-shrink-0 bg-blue-600 text-white hover:bg-blue-700 md:w-auto"
              onClick={handlePostOpportunityClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Post an Opportunity
            </Button>
          </Alert>
          {/* --- End New Section --- */}


          <Tabs defaultValue="jobs">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="collaborations">
                Collaborations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs">
              <JobsTab />
            </TabsContent>
            
            <TabsContent value="collaborations">
              <CollabsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
