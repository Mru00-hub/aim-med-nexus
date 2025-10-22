import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building, TrendingUp, Calendar, Users, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const exampleCompanies = [
  { id: 1, name: 'CarePulse Labs', type: 'startup', location: 'Bengaluru, IN', description: 'Building AI tools to streamline hospital workflows.', employees: '50-100', tier: 'deluxe' },
  { id: 2, name: 'CityCare Hospital', type: 'hospital', location: 'Delhi, IN', description: 'Multi-specialty hospital with strong community programs.', employees: '500+', tier: 'premium' }
];
const exampleCollaborations = [
  { id: 1, title: 'Community Health Camp (Maternal & Child Health)', type: 'Health camp', location: 'Ranchi, IN', description: 'Looking for volunteers to run vitals and counsel mothers.', skills: ['Pediatrics', 'Counseling'], duration: '2 weeks', participants: 12 },
  { id: 2, title: 'Diabetes Research – Lifestyle Study', type: 'Research', location: 'Remote (India)', description: 'Seeking collaborators for a 6-month observational study.', skills: ['Research', 'Data Collection'], duration: '6 months', participants: 8 }
];

const IndustryHub = () => {
  const navigate = useNavigate();
  const handleSignIn = () => navigate('/login');
  const exampleProfileRoute = '/industryhub/company/example';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Industry Hub</h1>
          <p className="text-muted-foreground text-lg">
            A space for companies to showcase their work and for professionals to find collaborations.
          </p>
        </div>

        <Tabs defaultValue="companies" className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-6">
            <Card className="card-medical">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Input placeholder="Search name/desc..." />
                      <Select><SelectTrigger className="min-w-0"><SelectValue placeholder="Company type" className="truncate"/></SelectTrigger></Select>
                      <Input placeholder="Location..." />
                    </div>
                    <Button className="btn-medical w-full" onClick={handleSignIn}>Sign in to Filter</Button>
                </CardContent>
            </Card>
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h3 className="text-lg font-semibold">Companies on our Platform</h3>
                <Button className="btn-medical w-full sm:w-auto flex-shrink-0" onClick={handleSignIn}><Plus className="h-4 w-4 mr-2" />Create Company Page</Button>
            </div>
            <Card className="card-medical bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">See What's Coming!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <p className="text-muted-foreground">
                    Check out how our new, elegant company profile pages will look.
                  </p>
                  <Button 
                    className="btn-medical" 
                    onClick={() => navigate(exampleProfileRoute)}
                  >
                    View Example Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {exampleCompanies.map((company) => (
                <Card key={company.id} className="card-medical">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-semibold pr-2 truncate">{company.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 my-2">
                                    <Badge variant="outline">{company.type}</Badge>
                                    <Badge variant="secondary">{company.location}</Badge>
                                    <Badge className={company.tier === 'deluxe' ? 'bg-gradient-deluxe' : 'bg-gradient-premium'}>{company.tier}</Badge>
                                </div>
                                <p className="text-muted-foreground text-sm">{company.description}</p>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                                <Button variant="outline" size="sm" onClick={handleSignIn}>Follow</Button>
                                {company.name === 'CityCare Hospital' ? (
                                  <Button 
                                    className="btn-medical" 
                                    size="sm" 
                                    onClick={() => navigate(exampleProfileRoute)}
                                  >
                                    View Example Profile
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline"
                                    size="sm" 
                                    onClick={handleSignIn}
                                  >
                                    View Profile
                                  </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collaborations" className="space-y-6">
            <Card className="card-medical">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select><SelectTrigger className="min-w-0"><SelectValue placeholder="Type" className="truncate"/></SelectTrigger></Select>
                        <Input placeholder="Location" />
                        <Input placeholder="Skill" />
                    </div>
                    <Button className="btn-medical w-full" onClick={handleSignIn}>Sign in to Filter</Button>
                </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h3 className="text-lg font-semibold">Find Collaborations</h3>
                <Button className="btn-medical w-full sm:w-auto flex-shrink-0" onClick={handleSignIn}><Plus className="h-4 w-4 mr-2" />Create Post</Button>
            </div>
            <div className="space-y-4">
              {exampleCollaborations.map((collab) => (
                <Card key={collab.id} className="card-medical">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-2">{collab.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {collab.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{collab.duration}</span></div>
                                    <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{collab.participants} participants</span></div>
                                </div>
                            </div>
                            <Button className="btn-medical" onClick={handleSignIn}>Apply</Button>
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

export default IndustryHub;
