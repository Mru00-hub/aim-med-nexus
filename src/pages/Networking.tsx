import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import UserRecommendations from '@/components/UserRecommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Users, 
  Briefcase, 
  Building, 
  MessageSquare,
  MapPin,
  Star,
  ExternalLink,
  FileText,
  TrendingUp,
  Award,
  Calendar,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Jobs & Networking Page - Comprehensive Module
 * Features: Profiles, Jobs, Companies, Collaborations
 * Professional networking for healthcare industry
 */

// Example data as requested for demonstration
const exampleProfiles = [
  {
    id: 1,
    name: 'Dr. Aisha Khan',
    title: 'Cardiologist | Preventive Care',
    location: 'Mumbai, IN',
    organization: 'HeartCare Clinic',
    specialization: 'Senior Cardiologist',
    skills: ['Cardiology', 'ECG', 'Hypertension', 'Telemedicine'],
    connections: 450,
    isConnected: false,
    profileImage: '/api/placeholder/64/64'
  },
  {
    id: 2,
    name: 'Rahul Mehta',
    title: 'Healthcare Data Analyst',
    location: 'Bengaluru, IN',
    organization: 'MediData',
    specialization: 'Data Analyst',
    skills: ['SQL', 'Python', 'Dashboards', 'Public Health'],
    connections: 280,
    isConnected: true,
    profileImage: '/api/placeholder/64/64'
  },
  {
    id: 3,
    name: 'Dr. Sneha Iyer',
    title: 'Pediatrician | Community Health',
    location: 'Pune, IN',
    organization: 'Sunshine Hospital',
    specialization: 'Pediatrician',
    skills: ['Pediatrics', 'Vaccination', 'Growth Monitoring', 'Counseling'],
    connections: 520,
    isConnected: false,
    profileImage: '/api/placeholder/64/64'
  }
];

const exampleJobs = [
  {
    id: 1,
    title: 'Clinical Data Analyst',
    company: 'CarePulse Labs',
    location: 'Remote (India)',
    type: 'Full-time',
    salary: '₹8.0L - ₹15.0L',
    experience: '2-5+ yrs',
    skills: ['SQL', 'Python', 'ETL', 'Dashboards'],
    postedDate: '2 days ago',
    applicants: 45,
    isExample: true
  },
  {
    id: 2,
    title: 'Resident Pediatrician',
    company: 'CityCare Hospital',
    location: 'Pune, IN',
    type: 'Contract',
    salary: '₹10.0L - ₹18.0L',
    experience: '1-3+ yrs',
    skills: ['Pediatrics', 'Emergency Care', 'Vaccination'],
    postedDate: '1 week ago',
    applicants: 23,
    isExample: true
  }
];

const exampleCompanies = [
  {
    id: 1,
    name: 'CarePulse Labs',
    type: 'startup',
    location: 'Bengaluru, IN',
    description: 'Building AI tools to streamline hospital workflows and patient triage.',
    employees: '50-100',
    isLookingForInvestment: true,
    tier: 'premium',
    logo: '/api/placeholder/64/64'
  },
  {
    id: 2,
    name: 'CityCare Hospital',
    type: 'hospital',
    location: 'Delhi, IN',
    description: 'Multi-specialty hospital with strong preventive and community programs.',
    employees: '500+',
    isLookingForInvestment: false,
    tier: 'deluxe',
    logo: '/api/placeholder/64/64'
  }
];

const exampleCollaborations = [
  {
    id: 1,
    title: 'Community Health Camp (Maternal & Child Health)',
    type: 'Health camp',
    location: 'Ranchi, IN',
    description: 'Looking for volunteers to run vitals, counsel mothers, and manage vaccines.',
    skills: ['Pediatrics', 'Counseling', 'Vitals'],
    duration: '2 weeks',
    participants: 12,
    isExample: true
  },
  {
    id: 2,
    title: 'Diabetes Research – Lifestyle Study',
    type: 'Research',
    location: 'Remote (India)',
    description: 'Seeking collaborators for a 6-month observational study on diabetes management.',
    skills: ['Research', 'Data Collection', 'Biostatistics'],
    duration: '6 months',
    participants: 8,
    isExample: true
  }
];

const Networking = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Networking</h1>
          <p className="text-muted-foreground text-lg">
            Connect with peers, discover jobs, companies, and collaborations.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
          </TabsList>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            {/* Search & Filter Section */}
            <Card className="card-medical">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search name/headline" 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="bengaluru">Bengaluru</SelectItem>
                      <SelectItem value="pune">Pune</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="data-analyst">Data Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Skills" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">My Professional Profile</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                    <Button className="btn-medical">
                      Create / Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Section */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Resume file URL (PDF/DOC/DOCX)</label>
                    <Select defaultValue="application/pdf">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="application/pdf">application/pdf</SelectItem>
                        <SelectItem value="application/doc">application/doc</SelectItem>
                        <SelectItem value="application/docx">application/docx</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">File name</label>
                    <Input placeholder="Size (bytes)" disabled />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button className="btn-medical">Save Resume</Button>
                  <Button variant="outline">Refresh</Button>
                </div>
              </CardContent>
            </Card>

            {/* Example Data Notice */}
            <Badge variant="secondary" className="text-sm">
              Showing example data - Example only
            </Badge>

            {/* Profiles List */}
            <div className="space-y-4">
              {exampleProfiles.map((profile) => (
                <Card key={profile.id} className="card-medical">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 flex-1">
                        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {profile.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">{profile.name}</h3>
                          <p className="text-primary font-medium mb-2">{profile.title}</p>
                          <p className="text-muted-foreground mb-3">
                            {profile.location} • {profile.organization} • {profile.specialization}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {profile.skills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{profile.connections} connections</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant={profile.isConnected ? "outline" : "default"}
                          size="sm"
                          className={!profile.isConnected ? "btn-medical" : ""}
                        >
                          {profile.isConnected ? 'Connected' : 'Connect'}
                        </Button>
                        <Button variant="outline" size="sm">Follow</Button>
                        <Button variant="ghost" size="sm">Message</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Job Search & Filter */}
            <Card className="card-medical">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-5 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search job title" className="pl-10" />
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="pune">Pune</SelectItem>
                      <SelectItem value="bengaluru">Bengaluru</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5+">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Salary Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-5">₹0-5L</SelectItem>
                      <SelectItem value="5-10">₹5-10L</SelectItem>
                      <SelectItem value="10-15">₹10-15L</SelectItem>
                      <SelectItem value="15+">₹15L+</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="btn-medical">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Jobs
                  </Button>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Company type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="pharma">Pharmaceutical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Skills" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sql">SQL</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Notify me for new roles</span>
                  </label>
                  <Badge variant="secondary" className="text-xs">Paid advertisements</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Post Job */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Post a Job</h3>
              <Button className="btn-medical">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
              {exampleJobs.map((job) => (
                <Card key={job.id} className="card-medical">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        <div className="flex items-center gap-4 text-muted-foreground mb-3">
                          <span className="font-medium text-primary">{job.company}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-3 text-sm">
                          <span>CTC: {job.salary}</span>
                          <span>•</span>
                          <span>Exp: {job.experience}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{job.postedDate}</span>
                          <span>•</span>
                          <span>{job.applicants} applicants</span>
                          {job.isExample && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">Example only</Badge>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button className="btn-medical">Apply</Button>
                        <Button variant="outline" size="sm">Notify similar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            {/* Company Search */}
            <Card className="card-medical">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <Input placeholder="Search name/desc" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Company type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="pharma">Pharmaceutical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Location" />
                </div>
                <Button className="btn-medical w-full">Filter</Button>
                
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-center mb-2">
                    Pay via UPI 7094800291 • mrudulabhalke75917@okhdfcbank
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button size="sm" className="btn-premium">
                      Unlock Individual ₹100/mo
                    </Button>
                    <Button size="sm" className="btn-deluxe">
                      Unlock Company ₹500/mo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create Company */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create Company</h3>
              <Button className="btn-medical">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>

            {/* Companies List */}
            <div className="space-y-4">
              {exampleCompanies.map((company) => (
                <Card key={company.id} className={`card-medical ${
                  company.tier === 'deluxe' ? 'border-deluxe/30' : 
                  company.tier === 'premium' ? 'border-premium/30' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building className="h-8 w-8 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-xl font-semibold pr-2">{company.name}</h3>
                            <Badge variant="outline" className="text-xs">{company.type}</Badge>
                            <Badge variant="secondary" className="text-xs">{company.location}</Badge>
                            {company.tier === 'deluxe' && (
                              <Badge className="bg-gradient-deluxe text-xs">Deluxe</Badge>
                            )}
                            {company.tier === 'premium' && (
                              <Badge className="bg-gradient-premium text-xs">Premium</Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{company.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {company.isLookingForInvestment && (
                              <Badge variant="secondary" className="text-xs">
                                Looking for Investment
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {company.employees} employees
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row lg:flex-col gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="text-xs px-3">Follow</Button>
                        <Button className="btn-medical" size="sm">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Advertise
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs px-3">Contact</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Collaborations Tab */}
          <TabsContent value="collaborations" className="space-y-6">
            {/* Collaboration Search */}
            <Card className="card-medical">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="health-camp">Health Camp</SelectItem>
                      <SelectItem value="study-group">Study Group</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Location" />
                  <Input placeholder="Skill" />
                </div>
                <Button className="btn-medical w-full">Filter</Button>
              </CardContent>
            </Card>

            {/* Create Collaboration */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create Collaboration</h3>
              <Button className="btn-medical">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>

            {/* Collaborations List */}
            <div className="space-y-4">
              {exampleCollaborations.map((collab) => (
                <Card key={collab.id} className="card-medical">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{collab.title}</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="text-xs">{collab.type}</Badge>
                          <Badge variant="secondary" className="text-xs">{collab.location}</Badge>
                          {collab.isExample && (
                            <Badge variant="secondary" className="text-xs">Example only</Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{collab.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {collab.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{collab.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{collab.participants} participants</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="btn-medical">Apply</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Networking;