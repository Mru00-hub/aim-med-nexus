import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building, TrendingUp, Calendar, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Example data remains for placeholder purposes
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

const Opportunities = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Opportunities</h1>
          <p className="text-muted-foreground text-lg">
            Discover companies and collaborations in the healthcare industry. Sign in to post.
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
                    {/* Placeholder Search UI */}
                </CardContent>
            </Card>
            <div className="space-y-4">
              {exampleCompanies.map((company) => (
                <Card key={company.id} className="card-medical">
                    {/* Placeholder Company Card UI */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collaborations" className="space-y-6">
            <Card className="card-medical">
                <CardContent className="pt-6">
                    {/* Placeholder Filter UI */}
                </CardContent>
            </Card>
            <div className="space-y-4">
              {exampleCollaborations.map((collab) => (
                <Card key={collab.id} className="card-medical">
                    {/* Placeholder Collaboration Card UI */}
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

export default Opportunities;
