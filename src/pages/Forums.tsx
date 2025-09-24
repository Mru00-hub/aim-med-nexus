import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Users, 
  MessageSquare, 
  Filter,
  TrendingUp,
  Star,
  Clock,
  Heart,
  Reply,
  MoreHorizontal
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Forums & Community Spaces Page
 * Comprehensive forum system with specialty-based discussions
 * Real-time messaging capabilities and community management
 */

// Example forum data - in real app this would come from API
const exampleForums = [
  {
    id: 1,
    title: 'Global Cardiology',
    type: 'forum',
    specialty: 'Cardiology',
    members: 12450,
    description: 'Connect with cardiologists worldwide. Share cases, discuss latest research, and collaborate on complex cardiac conditions.',
    isPublic: true,
    isJoined: true,
    activity: 'Very Active',
    lastActive: '2 minutes ago',
    isPremium: false
  },
  {
    id: 2,
    title: 'AI in Healthcare',
    type: 'forum',
    specialty: 'Radiology',
    members: 10320,
    description: 'Exploring artificial intelligence applications in medical imaging and healthcare delivery systems.',
    isPublic: true,
    isJoined: false,
    activity: 'Active',
    lastActive: '15 minutes ago',
    isPremium: true
  },
  {
    id: 3,
    title: 'USMLE 2025 Prep',
    type: 'college',
    specialty: 'Pediatrics',
    members: 8740,
    description: 'Medical students and residents preparing for USMLE exams. Share resources, study tips, and mock tests.',
    isPublic: true,
    isJoined: true,
    activity: 'Active',
    lastActive: '30 minutes ago',
    isPremium: false
  },
  {
    id: 4,
    title: 'Hospital Admins Network',
    type: 'hospital',
    specialty: 'Hospital Network',
    members: 5620,
    description: 'Healthcare administrators discussing operational excellence, policy changes, and hospital management strategies.',
    isPublic: false,
    isJoined: false,
    activity: 'Moderate',
    lastActive: '1 hour ago',
    isPremium: true
  },
  {
    id: 5,
    title: 'Emergency Medicine Crisis Response',
    type: 'forum',
    specialty: 'Emergency Medicine',
    members: 15200,
    description: 'EM physicians sharing rapid response protocols, trauma cases, and emergency preparedness strategies.',
    isPublic: true,
    isJoined: true,
    activity: 'Very Active',
    lastActive: '5 minutes ago',
    isPremium: false
  }
];

// Example recent threads - showing example data as requested
const exampleThreads = [
  {
    id: 1,
    title: 'Best guidelines for AFib in 2025?',
    author: 'Dr. Chen',
    timestamp: '24/09/2025, 10:19:02',
    preview: 'Check the new ESC update with NOAC dosing...',
    replies: 23,
    hearts: 15,
    isExample: true
  },
  {
    id: 2,
    title: 'Hospital EHR vendor comparison',
    author: 'Dr. Patel',
    timestamp: '24/09/2025, 10:19:02',
    preview: 'We migrated to Epic last quarter...',
    replies: 18,
    hearts: 8,
    isExample: true
  },
  {
    id: 3,
    title: 'AI triage in ER—real results',
    author: 'Dr. Ahmed',
    timestamp: '24/09/2025, 10:19:02',
    preview: 'False positives dropped after threshold tuning...',
    replies: 31,
    hearts: 24,
    isExample: true
  }
];

const Forums = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All types');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All specialties');

  const specialties = [
    'All specialties',
    'Cardiology',
    'Radiology', 
    'Pediatrics',
    'Emergency Medicine',
    'Hospital Network',
    'Surgery',
    'Internal Medicine',
    'Nursing',
    'Pharmacy'
  ];

  const forumTypes = [
    'All types',
    'Public Forums',
    'Private Forums',
    'Hospital Networks',
    'Medical Colleges',
    'Research Groups'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Forums & Community Spaces</h1>
          <p className="text-muted-foreground text-lg">
            Join specialty communities, collaborate in spaces, and discuss with peers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 animate-slide-up">
          <Card className="card-medical">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name/description or thread title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {forumTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <Button className="btn-medical">
                  <Plus className="h-4 w-4 mr-2" />
                  Create forum/space
                </Button>
                
                <Button variant="outline">
                  Manage requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Example Data Notice */}
        <div className="mb-6">
          <Badge variant="secondary" className="text-sm">
            Showing example data - Example only
          </Badge>
        </div>

        {/* Forums List */}
        <div className="mb-12 animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6">Your forums & community spaces</h2>
          
          <div className="space-y-4">
            {exampleForums.map((forum) => (
              <Card key={forum.id} className="card-medical hover:shadow-hover transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{forum.title}</h3>
                        
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {forum.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {forum.specialty}
                          </Badge>
                          {forum.isPremium && (
                            <Badge className="bg-gradient-premium text-xs">
                              Premium
                            </Badge>
                          )}
                          {!forum.isPublic && (
                            <Badge variant="destructive" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{forum.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{forum.members.toLocaleString()} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{forum.activity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{forum.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant={forum.isJoined ? "outline" : "default"}
                      size="sm"
                      className={forum.isJoined ? "" : "btn-medical"}
                    >
                      {forum.isJoined ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Threads */}
        <div className="animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Threads</h2>
            <Button size="sm" className="btn-medical">
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>

          <div className="space-y-4">
            {exampleThreads.map((thread) => (
              <Card key={thread.id} className="card-medical hover:shadow-hover transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                        {thread.title}
                      </h3>
                      <p className="text-muted-foreground mb-3">{thread.preview}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{thread.author}</span>
                        <span>{thread.timestamp}</span>
                        <div className="flex items-center gap-1">
                          <Reply className="h-4 w-4" />
                          <span>{thread.replies} replies</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{thread.hearts}</span>
                        </div>
                        {thread.isExample && (
                          <Badge variant="secondary" className="text-xs">
                            Example only
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">Open a thread to start chatting</p>
            <Button className="btn-medical">
              Browse All Discussions
            </Button>
          </div>
        </div>

        {/* Top Forums Section */}
        <div className="mt-16 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6">Top forums by members</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exampleForums.slice(0, 4).map((forum, index) => (
              <Card key={forum.id} className="card-medical text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{forum.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      Most members
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {forum.members.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">members</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div className="mt-16 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6">Specialties</h2>
          
          <div className="flex flex-wrap gap-3">
            {specialties.slice(1).map((specialty) => (
              <Button
                key={specialty}
                variant="outline"
                size="sm"
                className="hover:bg-primary/5 hover:text-primary hover:border-primary"
              >
                {specialty}
              </Button>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Forums;