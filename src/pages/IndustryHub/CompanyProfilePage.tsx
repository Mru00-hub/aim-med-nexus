import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import {
  getCompanyProfileDetails,
  toggleFollowCompany,
  CompanyProfileDetails,
} from '@/integrations/supabase/industry.api';

// --- UI Imports (from your file) ---
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building, Globe, Users, MapPin, Calendar, MessageSquare,
  Briefcase, Link as LinkIcon, Linkedin, Twitter, ExternalLink,
  HeartPulse, Stethoscope, FlaskConical, BookOpen, Loader2, AlertCircle
} from 'lucide-react';
import CityCareBanner from '@/assets/1761020986644.jpg'; // We'll keep this as a fallback

// --- Helper Functions (from your file) ---
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const getCollaborationIcon = (type: string) => {
  switch (type) {
    case 'research': return <FlaskConical className="h-4 w-4 mr-1.5" />;
    case 'clinical_trial': return <Stethoscope className="h-4 w-4 mr-1.5" />;
    case 'advisory': return <Briefcase className="h-4 w-4 mr-1.5" />;
    default: return <BookOpen className="h-4 w-4 mr-1.5" />;
  }
};

const getSocialIcon = (type: string, title: string) => {
  if (type === 'linkedin') {
    return <Linkedin className="h-4 w-4 mr-2" />;
  }
  // A simple check for other common social platforms by title
  if (title.toLowerCase().includes('twitter')) {
    return <Twitter className="h-4 w-4 mr-2" />;
  }
  // You could add 'instagram', 'facebook' etc. here
  if (type === 'social') {
    return <Globe className="h-4 w-4 mr-2" />; // Generic 'social' icon
  }
  return <LinkIcon className="h-4 w-4 mr-2" />; // Default 'url' icon
};

// --- The Data-Driven Component ---
export default function CompanyProfilePage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Data Fetching using the RPC
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<CompanyProfileDetails, Error>({
    queryKey: ['companyProfile', companyId],
    queryFn: () => getCompanyProfileDetails(companyId!),
    enabled: !!companyId, // Only run if companyId is present
  });

  // 2. Optimistic Update for the "Follow" button
  const followMutation = useMutation({
    mutationFn: () => toggleFollowCompany(companyId!),
    onMutate: async () => {
      // 1. Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['companyProfile', companyId] });
      // 2. Snapshot the previous value
      const previousData = queryClient.getQueryData<CompanyProfileDetails>(['companyProfile', companyId]);
      // 3. Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<CompanyProfileDetails>(
          ['companyProfile', companyId],
          {
            ...previousData,
            is_followed_by_viewer: !previousData.is_followed_by_viewer,
          }
        );
      }
      return { previousData };
    },
    // 4. Rollback on error
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['companyProfile', companyId], context.previousData);
      }
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
    // 5. Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
    },
  });

  // 3. Auth-aware Event Handlers
  const handleAuthAction = (action: () => void) => {
    if (!user) {
      navigate('/login');
    } else {
      action();
    }
  };

  const handleFollowClick = () => {
    handleAuthAction(() => followMutation.mutate());
  };

  const handleContactClick = () => {
    // We navigate to the inbox, pre-filling the user.
    // We assume the company creator's ID is on the profile.
    if (data?.profile.creator_id) {
      handleAuthAction(() => navigate(`/inbox?with=${data.profile.creator_id}`));
    } else {
      toast({ title: "Cannot contact company", description: "This company has not set up a contact." });
    }
  };

  // --- Render States ---
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

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container-medical flex-1 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Profile</AlertTitle>
            <AlertDescription>
              {error?.message || "This company profile could not be found."}
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  // --- Data is loaded, destructure it ---
  const { profile: company, jobs, collaborations, links, is_followed_by_viewer } = data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* === Section 1: Hero Header (Now with real data) === */}
        <div className="relative w-full h-48 md:h-64">
          <img
            src={company.company_banner_url || CityCareBanner} // Use fallback
            alt={`${company.company_name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="container-medical">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20 z-10 relative">
            <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg bg-white shadow-xl border-4 border-background flex items-center justify-center">
              <Avatar className="h-full w-full rounded-md">
                <AvatarImage src={company.company_logo_url || ''} className="object-cover" />
                <AvatarFallback className="rounded-md bg-gradient-primary">
                  <Building className="h-16 w-16 md:h-20 md:w-20 text-white" />
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 min-w-0 pt-4 md:pt-20">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                    {company.company_name}
                    {company.tier && (
                      <Badge className="bg-gradient-premium text-white text-sm ml-2">
                        {toTitleCase(company.tier)} Partner
                      </Badge>
                    )}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                    <div className="flex items-center text-muted-foreground">
                      <HeartPulse className="h-4 w-4 mr-1.5" />
                      {company.industry_name || 'Industry'}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1.5" />
                      {company.location_name || 'Global'}
                    </div>
                    {company.website_url && (
                      <a 
                        href={company.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        {company.website_url.replace('https://', '')}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    variant={is_followed_by_viewer ? "default" : "outline"} 
                    onClick={handleFollowClick}
                    disabled={followMutation.isPending}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {is_followed_by_viewer ? 'Following' : 'Follow'}
                  </Button>
                  <Button className="btn-medical" onClick={handleContactClick}>
                    <MessageSquare className="h-4 w-4 mr-2" />Contact Company
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === Section 2: Page Content (Tabs with real data) === */}
        <div className="container-medical py-12">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto mb-8">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="collaborations">Collaborations ({collaborations.length})</TabsTrigger>
              <TabsTrigger value="jobs">Open Positions ({jobs.length})</TabsTrigger>
              <TabsTrigger value="links">Products & Links ({links.length})</TabsTrigger>
            </TabsList>

            {/* --- About Tab --- */}
            <TabsContent value="about">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <Card className="card-medical">
                    <CardHeader>
                      <CardTitle>About {company.company_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm md:prose-base max-w-none text-muted-foreground space-y-4">
                      {company.description.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <div className="md:col-span-1 space-y-6">
                  <Card className="card-medical">
                    <CardHeader>
                      <CardTitle>At a Glance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {company.company_size && (
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-sm text-muted-foreground">Company Size</span>
                            <p className="font-semibold">{company.company_size}</p>
                          </div>
                        </div>
                      )}
                      {company.location_name && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-sm text-muted-foreground">Location</span>
                            <p className="font-semibold">{company.location_name}</p>
                          </div>
                        </div>
                      )}
                      {company.founded_year && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-sm text-muted-foreground">Founded</span>
                            <p className="font-semibold">{company.founded_year}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* --- Collaborations Tab --- */}
            <TabsContent value="collaborations" className="space-y-4">
              {collaborations.length > 0 ? collaborations.map(collab => (
                <Card key={collab.id} className="card-medical">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 flex items-center w-fit">
                          {getCollaborationIcon(collab.collaboration_type)}
                          {toTitleCase(collab.collaboration_type)}
                        </Badge>
                        <h3 className="text-xl font-semibold mb-2">{collab.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {collab.required_specialty?.map(skill => <Badge key={skill} variant="secondary">{toTitleCase(skill)}</Badge>)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{collab.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {collab.location && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{collab.location}</span></div>}
                          {collab.duration && <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{collab.duration}</span></div>}
                        </div>
                      </div>
                      <Button asChild className="btn-medical w-full md:w-auto flex-shrink-0">
                        <Link to={`/collabs/details/${collab.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-muted-foreground text-center py-8">This company has not posted any collaborations yet.</p>
              )}
            </TabsContent>

            {/* --- Jobs Tab --- */}
            <TabsContent value="jobs" className="space-y-4">
              {jobs.length > 0 ? jobs.map(job => (
                <Card key={job.id} className="card-medical">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{toTitleCase(job.job_type)}</Badge>
                          <Badge variant="secondary">{toTitleCase(job.location_type)}</Badge>
                          <Badge variant="secondary">{toTitleCase(job.experience_level)}</Badge>
                          {job.specialties_required?.map(spec => <Badge key={spec} variant="secondary">{toTitleCase(spec)}</Badge>)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{job.location_text}</span></div>
                        </div>
                      </div>
                      <Button asChild className="btn-medical w-full md:w-auto flex-shrink-0">
                        <Link to={`/jobs/details/${job.id}`}>View Job</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-muted-foreground text-center py-8">This company has no open positions right now.</p>
              )}
            </TabsContent>

            {/* --- Products & Links Tab --- */}
            <TabsContent value="links">
              {links.length > 0 ? (
                 <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Products & Services</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {links.filter(l => l.link_type === 'product').map(link => (
                           <Card key={link.id} className="card-medical hover:shadow-md transition-shadow">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                               <CardTitle className="text-lg font-medium">{link.title}</CardTitle>
                               <ExternalLink className="h-4 w-4 text-muted-foreground" />
                             </CardHeader>
                             <CardContent>
                               <p className="text-sm text-muted-foreground">{link.description}</p>
                             </CardContent>
                             <CardFooter>
                               <Button variant="outline" size="sm" asChild>
                                 <a href={link.url} target="_blank" rel="noopener noreferrer">Learn More</a>
                               </Button>
                             </CardFooter>
                           </Card>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
                      <div className="flex flex-wrap gap-4">
                      {/* Now filtering for 'social' which is in your enum */}
                      {links.filter(l => ['linkedin', 'social', 'url'].includes(l.link_type)).map(link => (
                        <Button key={link.id} variant="outline" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {getSocialIcon(link.link_type, link.title)}
                            {link.title}
                          </a>
                        </Button>
                      ))}
                    </div>
                    </div>
                 </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">This company has not added any links yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};
