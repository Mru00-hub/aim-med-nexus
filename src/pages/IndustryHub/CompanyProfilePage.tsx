import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Globe,
  Users,
  MapPin,
  Calendar,
  MessageSquare,
  Briefcase,
  Link,
  Linkedin,
  Twitter,
  ExternalLink,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  BookOpen,
} from 'lucide-react';

// --- Mock Data Based On Your Schema ---

const mockCompany = {
  id: 2,
  company_name: 'CityCare Hospital',
  industry: 'Hospital',
  company_logo_url: '/placeholder-logo.png', // Using placeholder
  company_banner_url: 'https://via.placeholder.com/1200x300.png?text=CityCare+Hospital+Banner',
  company_size: '500-1000 employees',
  website_url: 'https://citycare.example.com',
  description:
    "CityCare Hospital is a leading multi-specialty healthcare provider in Delhi, dedicated to offering compassionate and comprehensive medical services. Our state-of-the-art facility is equipped with the latest technology and staffed by a team of highly skilled medical professionals.\n\nWe are committed to excellence in patient care, research, and medical education. Our mission is to improve the health of the communities we serve through innovative treatments, preventative care, and a patient-first approach. We believe in building lasting relationships with our patients, partners, and the community.",
  tier: 'deluxe',
  location: 'Delhi, IN',
  founded_year: 2005,
};

const mockLinks = [
  { id: 1, company_id: 2, link_type: 'product', title: 'Patient Portal', url: '#', description: 'Access your medical records and book appointments.' },
  { id: 2, company_id: 2, link_type: 'product', title: 'Telemedicine Service', url: '#', description: 'Consult with our top doctors from your home.' },
  { id: 3, company_id: 2, link_type: 'linkedin', title: 'LinkedIn', url: '#', description: null },
  { id: 4, company_id: 2, link_type: 'twitter', title: 'Twitter', url: '#', description: null },
];

const mockCollaborations = [
  { id: 1, company_id: 2, title: 'Clinical Trial for New Cardiovascular Drug', collaboration_type: 'clinical_trial', description: 'Seeking partner clinics and cardiologists for a Phase 3 trial.', required_specialty: ['Cardiology', 'Internal Medicine'], location: 'Delhi, IN', duration: '12 months' },
  { id: 2, company_id: 2, title: 'Pediatric Health Screening Camp', collaboration_type: 'other', description: 'Partnering with NGOs and pediatricians for a 3-day community health camp.', required_specialty: ['Pediatrics', 'Community Health'], location: 'Gurgaon, IN', duration: '3 Days' },
];

const mockJobs = [
  { id: 1, posted_by_id: 2, title: 'Senior Consultant - Cardiology', job_type: 'full_time', specialty_required: ['Cardiology'], experience_level: 'consultant', location: 'Delhi, IN', location_type: 'onsite' },
  { id: 2, posted_by_id: 2, title: 'Registered Nurse - ICU', job_type: 'full_time', specialty_required: ['Critical Care'], experience_level: 'mid', location: 'Delhi, IN', location_type: 'onsite' },
  { id: 3, posted_by_id: 2, title: 'Healthcare Data Analyst', job_type: 'remote', specialty_required: ['Analytics', 'Healthcare IT'], experience_level: 'junior', location: 'Remote', location_type: 'remote' },
];

// --- Helper Functions ---

const toTitleCase = (str: string) => {
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

const getSocialIcon = (type: string) => {
  switch (type) {
    case 'linkedin': return <Linkedin className="h-4 w-4 mr-2" />;
    case 'twitter': return <Twitter className="h-4 w-4 mr-2" />;
    default: return <Link className="h-4 w-4 mr-2" />;
  }
};

// --- The Component ---

const CompanyProfilePage = () => {
  const navigate = useNavigate();
  // const { companyId } = useParams(); // In a real app, you'd fetch data using this ID
  
  // For this placeholder, we just use the mock data directly
  const company = mockCompany;
  const links = mockLinks;
  const collaborations = mockCollaborations;
  const jobs = mockJobs;

  const handleSignIn = () => navigate('/login');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* === Section 1: Hero Header === */}
        <div className="relative w-full h-48 md:h-64">
          <img
            src={company.company_banner_url}
            alt={`${company.company_name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" /> {/* Dark overlay for text contrast */}
        </div>

        <div className="container-medical">
          {/* Profile Header Card */}
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20 z-10 relative">
            {/* Logo */}
            <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg bg-white shadow-xl border-4 border-background flex items-center justify-center">
              {/* Using your placeholder style from IndustryHub */}
              <div className="w-full h-full bg-gradient-primary rounded-md flex items-center justify-center">
                <Building className="h-16 w-16 md:h-20 md:w-20 text-white" />
              </div>
            </div>
            
            {/* Info & Actions */}
            <div className="flex-1 min-w-0 pt-4 md:pt-20">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                    {company.company_name}
                    {/* Using your deluxe badge style */}
                    <Badge className="bg-gradient-deluxe text-white text-sm ml-2">
                      Deluxe Partner
                    </Badge>
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                    <div className="flex items-center text-muted-foreground">
                      <HeartPulse className="h-4 w-4 mr-1.5" />
                      {company.industry}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1.5" />
                      {company.location}
                    </div>
                    <a 
                      href={company.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      {company.website_url.replace('https://', '')}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" onClick={handleSignIn}>
                    <Users className="h-4 w-4 mr-2" />Follow
                  </Button>
                  <Button className="btn-medical" onClick={handleSignIn}>
                    <MessageSquare className="h-4 w-4 mr-2" />Contact Company
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === Section 2: Page Content (Tabs) === */}
        <div className="container-medical py-12">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="collaborations">Collaborations ({collaborations.length})</TabsTrigger>
              <TabsTrigger value="jobs">Open Positions ({jobs.length})</TabsTrigger>
              <TabsTrigger value="links">Products & Links</TabsTrigger>
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
                      {/* Render multiline description */}
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
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-sm text-muted-foreground">Company Size</span>
                          <p className="font-semibold">{company.company_size}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-sm text-muted-foreground">Location</span>
                          <p className="font-semibold">{company.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-sm text-muted-foreground">Founded</span>
                          <p className="font-semibold">{company.founded_year}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* --- Collaborations Tab --- */}
            <TabsContent value="collaborations" className="space-y-4">
              {collaborations.map(collab => (
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
                          {collab.required_specialty.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{collab.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{collab.location}</span></div>
                          <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{collab.duration}</span></div>
                        </div>
                      </div>
                      <Button className="btn-medical w-full md:w-auto flex-shrink-0" onClick={handleSignIn}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* --- Jobs Tab --- */}
            <TabsContent value="jobs" className="space-y-4">
              {jobs.map(job => (
                <Card key={job.id} className="card-medical">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{toTitleCase(job.job_type)}</Badge>
                          <Badge variant="secondary">{toTitleCase(job.location_type)}</Badge>
                          <Badge variant="secondary">{toTitleCase(job.experience_level)}</Badge>
                          {job.specialty_required.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{job.location}</span></div>
                        </div>
                      </div>
                      <Button className="btn-medical w-full md:w-auto flex-shrink-0" onClick={handleSignIn}>
                        View Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* --- Products & Links Tab --- */}
            <TabsContent value="links">
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
                      {links.filter(l => ['linkedin', 'twitter'].includes(l.link_type)).map(link => (
                        <Button key={link.id} variant="outline" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {getSocialIcon(link.link_type)}
                            {link.title}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyProfilePage;
