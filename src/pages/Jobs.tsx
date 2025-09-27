import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Briefcase, 
  MapPin,
  ExternalLink,
  Filter,
  Calendar,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Jobs Page - Comprehensive job search and posting
 * Features job listings, search, filters, and posting capabilities
 */

// Example job data for preview
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
    description: 'Join our healthcare analytics team to help hospitals make data-driven decisions...',
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
    description: 'Seeking a dedicated pediatrician to join our children\'s healthcare team...',
    isExample: true
  },
  {
    id: 3,
    title: 'Senior Cardiologist',
    company: 'HeartCare Specialty Center',
    location: 'Mumbai, IN',
    type: 'Full-time',
    salary: '₹25.0L - ₹40.0L',
    experience: '5-10+ yrs',
    skills: ['Cardiology', 'Interventional Procedures', 'ECG'],
    postedDate: '3 days ago',
    applicants: 67,
    description: 'Lead our cardiology department and provide advanced cardiac care...',
    isExample: true
  }
];

const Jobs = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Jobs & Career Opportunities</h1>
          <p className="text-muted-foreground text-lg">
            Discover healthcare job opportunities and advance your career.
          </p>
        </div>

        {/* Job Search & Filter */}
        <div className="mb-8 animate-slide-up">
          <Card className="card-medical">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-5 gap-4 mb-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search job titles, companies, or skills..." 
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
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="pune">Pune</SelectItem>
                    <SelectItem value="bengaluru">Bengaluru</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
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
                <Button className="btn-medical">
                  <Filter className="h-4 w-4 mr-2" />
                  Search Jobs
                </Button>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
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
                    <SelectValue placeholder="Salary Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-5">₹0-5L</SelectItem>
                    <SelectItem value="5-10">₹5-10L</SelectItem>
                    <SelectItem value="10-20">₹10-20L</SelectItem>
                    <SelectItem value="20+">₹20L+</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="data-analyst">Data Analytics</SelectItem>
                    <SelectItem value="nursing">Nursing</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  {user ? (
                    <Button className="btn-medical flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Post Job
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 text-xs">
                      Sign in to post jobs
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Notify me for new roles</span>
                  </label>
                  <Badge variant="secondary" className="text-xs">Premium listings available</Badge>
                </div>
                
                {!user && (
                  <Badge variant="outline" className="text-xs">
                    Sign in for personalized recommendations
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Mode Notice */}
        {!user && (
          <div className="mb-6 animate-fade-in">
            <Badge variant="secondary" className="text-sm">
              Preview Mode - Sign in to apply for jobs and access full features
            </Badge>
          </div>
        )}

        {/* Example Data Notice */}
        <div className="mb-6">
          <Badge variant="secondary" className="text-sm">
            Showing example data - Example only
          </Badge>
        </div>

        {/* Jobs List */}
        <div className="space-y-6 animate-slide-up">
          <h2 className="text-2xl font-semibold">Latest Job Opportunities</h2>
          
          <div className="space-y-4">
            {exampleJobs.map((job) => (
              <Card key={job.id} className="card-medical hover:shadow-hover transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        {job.isExample && (
                          <Badge variant="secondary" className="text-xs">
                            Example
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span className="font-medium text-primary">{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {job.type}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="font-semibold text-success">{job.salary}</span>
                        <span>{job.experience} experience</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{job.postedDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{job.applicants} applicants</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {user ? (
                        <>
                          <Button className="btn-medical">
                            Apply Now
                          </Button>
                          <Button variant="outline" size="sm">
                            Save Job
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline">
                            Sign in to Apply
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              {user ? "Looking for more opportunities?" : "Sign in to see personalized job recommendations"}
            </p>
            <Button className="btn-medical">
              {user ? "Browse All Jobs" : "Sign In to Continue"}
            </Button>
          </div>
        </div>

        {/* Career Resources */}
        <div className="mt-16 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6">Career Resources</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Resume Builder", desc: "Create professional healthcare resumes", icon: "📄" },
              { title: "Interview Tips", desc: "Ace your healthcare job interviews", icon: "💼" },
              { title: "Salary Guide", desc: "Healthcare salary benchmarks in India", icon: "💰" },
              { title: "Career Paths", desc: "Explore healthcare career options", icon: "🎯" }
            ].map((resource, index) => (
              <Card key={index} className="card-medical text-center">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">{resource.icon}</div>
                  <h3 className="font-semibold mb-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">{resource.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Jobs;