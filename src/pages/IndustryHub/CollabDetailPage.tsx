import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getCollabById } from '@/integrations/supabase/industry.api';
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
  Clock,
  Building,
  ArrowLeft,
  FlaskConical,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Helper to format text
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export default function CollabDetailPage() {
  const { collabId } = useParams<{ collabId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: collab,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['collabDetails', collabId],
    queryFn: () => getCollabById(collabId!),
    enabled: !!collabId,
  });

  const handleApplyClick = () => {
    if (user) {
      // Navigate to the application form page, passing collab ID
      navigate(`/collabs/apply/${collabId}`);
    } else {
      // Redirect to login, but tell it where to come back to
      navigate('/login', { state: { from: `/collabs/apply/${collabId}` } });
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

  if (isError || !collab) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container-medical flex-1 py-12">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opportunities
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Collaboration</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'This collaboration could not be found.'}
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  // Destructure collaboration data
  const {
    title,
    company_id,
    company_name,
    location,
    collaboration_type,
    duration,
    required_specialty = [],
    description,
    // Note: Our Collab table doesn't have an external_apply_url,
    // so we will only use the internal "Apply" button.
  } = collab;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/jobs-and-opportunities')} // Link back to the main opportunities page
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
                      <FlaskConical className="h-4 w-4" />
                      <span>{toTitleCase(collaboration_type)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{duration || 'Flexible Duration'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Description */}
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Project Description</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p style={{ whiteSpace: 'pre-wrap' }}>
                        {description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Skills/Specialties */}
                  {required_specialty.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold">Required Skills & Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {required_specialty.map((skill) => (
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
                  <Button size="lg" className="w-full" onClick={handleApplyClick}>
                    {user ? 'Apply Now on AIM MedNexus' : 'Sign in to Apply'}
                  </Button>
                </CardContent>
              </Card>

              {/* Company Card */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12 rounded-lg">
                    {/* We need to fetch the company logo, but for now we use a fallback */}
                    <AvatarFallback className="rounded-lg">
                      <Building className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {company_name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/industryhub/company/${company_id}`}>
                      View Company Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
