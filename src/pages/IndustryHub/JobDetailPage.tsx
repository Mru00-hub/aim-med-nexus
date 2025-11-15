import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getJobById } from '@/integrations/supabase/industry.api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  AlertCircle,
  MapPin,
  Briefcase,
  Clock,
  Building,
  ArrowLeft,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CompanySidebarCard } from '@/components/industry/CompanySidebarCard';

// Helper to format text
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['jobDetails', jobId],
    queryFn: () => getJobById(jobId!),
    enabled: !!jobId,
  });

  const handleApplyClick = () => {
    if (user) {
      // Navigate to the application form page, passing job ID
      navigate(`/jobs/apply/${jobId}`);
    } else {
      // Redirect to login, but tell it where to come back to
      navigate('/login', { state: { from: `/jobs/apply/${jobId}` } });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container-medical flex-1 py-12">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Job</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'This job could not be found.'}
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  // Destructure job data
  const {
    title,
    company_id,
    company_name,
    location_text,
    location_type,
    job_type,
    experience_level,
    specialties_required = [],
    description,
    external_apply_url,
  } = job;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/jobs-and-opportunities')} // Link back to the main jobs page
            className="mb-4 text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Opportunities
          </Button>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content (Left Column) */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold">{title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      <span>{toTitleCase(job_type)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{toTitleCase(location_type)} ({location_text})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      <span>{toTitleCase(experience_level)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Job Description */}
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Job Description</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {/* Using whitespace-pre-wrap to respect newlines from the database */}
                      <p style={{ whiteSpace: 'pre-wrap' }}>
                        {description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Skills/Specialties */}
                  {specialties_required.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold">Required Skills & Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {specialties_required.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-base font-normal">
                            {toTitleCase(skill)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar (Right Column) */}
            <div className="space-y-6 lg:col-span-1">
              {/* Apply Card */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  {external_apply_url ? (
                    <Button asChild size="lg" className="w-full">
                      <a href={external_apply_url} target="_blank" rel="noopener noreferrer">
                        Apply on Company Site
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full" onClick={handleApplyClick}>
                      {user ? 'Apply Now on AIM MedNexus' : 'Sign in to Apply'}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <CompanySidebarCard 
                companyId={company_id} 
                companyName={company_name} 
              />

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
