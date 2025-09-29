import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { ForumsNav } from '@/components/forums/ForumsNav';
import { SpaceCreator } from '@/components/forums/SpaceCreator';
import { createSpace } from '@/integrations/supabase/api';
import type { Space, SpaceType, JoinMechanism } from '@/types/forum';
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
import { getSpaces, getPublicThreads } from '@/integrations/supabase/api';
/**
 * Forums & Community Spaces Page
 * Comprehensive forum system with specialty-based discussions
 * Real-time messaging capabilities and community management
 */

// This array now represents both Forums and Community Spaces for discovery.
// The `type` and `isPublic` fields are key to distinguishing them.
const exampleSpaces = [
  // --- Forums ---
  {
    id: 'forum-1',
    title: 'AI in Healthcare',
    type: 'forum', // This is a Forum
    category: 'Public Forums',
    specialty: 'Radiology',
    members: 10320,
    description: 'Exploring AI in medical imaging and healthcare delivery systems.',
    isPublic: true, // This is a PUBLIC Forum (no approval needed to join)
    isJoined: false,
    activity: 'Active',
    lastActive: '15 minutes ago',
    isPremium: true,
    exampleThreads: [
      { id: 'thread-ai-1', title: 'Radiology AI' },
      { id: 'thread-ai-2', title: 'Pathology AI' },
      { id: 'thread-ai-3', title: 'Clinical Decision Support AI' }
    ]
  },
  {
    id: 'forum-2',
    title: 'USMLE 2026 Prep',
    type: 'forum', // This is a Forum
    category: 'Private Forums',
    specialty: 'Medical Education',
    members: 8740,
    description: 'Preparing for USMLE exams. Share resources, study tips, and mock tests.',
    isPublic: false, // This is a PRIVATE Forum (moderator approval needed)
    isJoined: true,
    activity: 'Active',
    lastActive: '30 minutes ago',
    isPremium: false,
    exampleThreads: [
      { id: 'thread-usmle-1', title: 'Study Materials' },
      { id: 'thread-usmle-2', title: 'Q&A Discussions' },
      { id: 'thread-usmle-3', title: 'Important Notifications' }
    ]
  },
  // --- Community Spaces ---
  {
    id: 'space-1',
    title: 'Global Cardiology',
    type: 'community_space', // This is a Community Space
    category: 'Professional & Association-Based Spaces',
    specialty: 'Cardiology',
    members: 12450,
    description: 'Connect with cardiologists worldwide. Share cases, discuss latest research, and collaborate on complex cardiac conditions.',
    isPublic: false, // Community Spaces are always private (admin approval needed)
    isJoined: true,
    activity: 'Very Active',
    lastActive: '2 minutes ago',
    isPremium: false,
    exampleThreads: [
        { id: 'thread-cardio-1', title: 'World Heart Federation notifications' },
        { id: 'thread-cardio-2', title: 'MI Updates' },
        { id: 'thread-cardio-3', title: 'Drugs updates' }
    ]
  },
  {
    id: 'space-2',
    title: 'Hospital Admins Network',
    type: 'community_space', // This is a Community Space
    category: 'Institution-Based Spaces',
    specialty: 'Hospital Network',
    members: 5620,
    description: 'Healthcare administrators discussing operational excellence, policy changes, and hospital management strategies.',
    isPublic: false, // Community Spaces are always private
    isJoined: false,
    activity: 'Moderate',
    lastActive: '1 hour ago',
    isPremium: true,
    exampleThreads: [
        { id: 'thread-admin-1', title: 'Introductions' },
        { id: 'thread-admin-2', title: 'Regulatory updates' },
        { id: 'thread-admin-3', title: 'Collaborations' }
    ]
  },
  {
    id: 'space-3',
    title: 'Emergency Medicine Crisis Response',
    type: 'community_space', // This is a Community Space
    specialty: 'Emergency Medicine',
    category: 'Purpose-Driven Spaces',
    members: 15200,
    description: 'EM physicians sharing rapid response protocols, trauma cases, and emergency preparedness strategies.',
    isPublic: false, // Community Spaces are always private
    isJoined: true,
    activity: 'Very Active',
    lastActive: '5 minutes ago',
    isPremium: false,
    exampleThreads: [
        { id: 'thread-em-1', title: 'Trauma Case discussions' },
        { id: 'thread-em-2', title: 'Natural Disaster response' },
        { id: 'thread-em-3', title: 'Poisoning treatment updates' }
    ]
  }
];

// This array now exclusively represents the Public Threads visible to everyone on the main page.
const examplePublicThreads = [
  {
    id: 'pub-thread-1',
    title: 'Best guidelines for AFib in 2025?',
    author: 'Dr. Chen',
    timestamp: '28/09/2025, 10:19:02',
    preview: 'Check the new ESC update with NOAC dosing...',
    replies: 23,
    hearts: 15
  },
  {
    id: 'pub-thread-2',
    title: 'Hospital EHR vendor comparison',
    author: 'Dr. Patel',
    timestamp: '28/09/2025, 08:45:10',
    preview: 'We migrated to Epic last quarter and the transition was...',
    replies: 18,
    hearts: 8
  },
  {
    id: 'pub-thread-3',
    title: 'AI triage in ER—real results',
    author: 'Dr. Ahmed',
    timestamp: '27/09/2025, 19:30:55',
    preview: 'False positives dropped after threshold tuning...',
    replies: 31,
    hearts: 24
  },
  {
    id: 'pub-thread-4',
    title: 'Medical Memes',
    author: 'Dr. Lee',
    timestamp: '27/09/2025, 14:12:00',
    preview: 'Post your best ones here. We all need a laugh.',
    replies: 102,
    hearts: 88
  }
];

const Forums = () => {
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  // --- STATE MANAGEMENT ---
  // Default state is the mock data for guests
  const [spaces, setSpaces] = useState(exampleSpaces);
  const [publicThreads, setPublicThreads] = useState(examplePublicThreads);
  const [loading, setLoading] = useState(true);
  // Other UI state from your original file
  const [showSpaceCreator, setShowSpaceCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All types');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All specialties');
  const filteredSpaces = useMemo(() => {
    return spaces
      .filter(space => {
        // Filter by search query (name or description)
        const searchLower = searchQuery.toLowerCase();
        return (
          space.title.toLowerCase().includes(searchLower) ||
          space.description.toLowerCase().includes(searchLower)
        );
      })
      .filter(space => {
        // Filter by type (e.g., 'Public Forums')
        if (selectedType === 'All Types') return true;
        return space.category === selectedType;
      })
      .filter(space => {
      // Filter by specialty
      if (selectedSpecialty === 'All specialties') return true;
      return space.specialty === selectedSpecialty;
      });
      // You can add more .filter() calls for specialty, etc.
  }, [spaces, searchQuery, selectedType, selectedSpecialty]); // Dependencies
  // --- NEW LOGIC: Fetch real data for logged-in users ---
  useEffect(() => {
    // This is an async function to fetch all necessary data for a logged-in user
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both spaces and public threads in parallel for better performance
        const [spacesData, publicThreadsData] = await Promise.all([
          getSpaces(),
          getPublicThreads(),
        ]);
        // Update the state with the real data from the database
        setSpaces(spacesData || []);
        setPublicThreads(publicThreadsData || []);
      } catch (error) {
        console.error("Failed to fetch real data:", error);
        // In a real app, you might show an error message to the user here
      } finally {
        // This always runs, ensuring the loading indicator is turned off
        setLoading(false);
      }
    };
    // --- This is the main logic ---
    if (user) {
      // If the user is logged in, call the function to fetch real data
      fetchData();
    } else {
      // If the user is a guest, reset the state to the mock data
      setSpaces(exampleSpaces);
      setPublicThreads(examplePublicThreads);
      setLoading(false);
    }
  }, [user]); // This dependency ensures the code re-runs whenever the user logs in or out


  const handleCreateSpace = async (data: {
    type: SpaceType;
    name: string;
    description: string;
    joinMechanism: JoinMechanism;
    isPrivate: boolean;
    category: string;
    specialty: string;
  }) => {
    // Implement space creation logic
    console.log('Creating space:', data);
  };
  
  const specialties = [
    'All specialties',
    'General Physician',
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
    'All Types',
    'Public Forums',
    'Private Forums'
  ];

  const communityspaceTypes = [
    'All Types',
    'Institution-Based Spaces',
    'Purpose-Driven Spaces',
    'Professional & Association-Based Spaces'
  ];

  const filteredPublicThreads = useMemo(() => {
    return publicThreads.filter(thread => {
      const searchLower = threadSearchQuery.toLowerCase();
      return (
        thread.title.toLowerCase().includes(searchLower) ||
        thread.preview.toLowerCase().includes(searchLower) ||
        thread.author.toLowerCase().includes(searchLower)
      );
    });
  }, [publicThreads, threadSearchQuery]);
  // Helper to render a single Forum or Community Space card
  const renderSpaceCard = (space: Space) => {
    // --- Step 1: Define the card's appearance ---
    const cardContent = (
      <Card className="card-medical hover:shadow-hover transition-all">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4"> {/* Added padding to prevent text touching the button */}
              <div className="flex items-center gap-3 mb-2 flex-wrap"> {/* Added flex-wrap for smaller screens */}
                <h3 className="text-xl font-semibold">{space.title}</h3>
                <Badge variant={space.type === 'forum' ? 'secondary' : 'outline'}>
                  {space.type === 'forum' ? 'Forum' : 'Community Space'}
                </Badge>
                {!space.isPublic && <Badge variant="destructive">Private</Badge>}
              </div>
              <p className="text-muted-foreground mb-3 text-sm">{space.description}</p>
              {space.exampleThreads && space.exampleThreads.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Hot Topics</h4>
                  <ul className="space-y-1 list-none pl-0">
                    {space.exampleThreads.slice(0, 2).map((thread: any) => (
                      <li key={thread.id} className="text-sm text-foreground/80 hover:text-primary transition-colors truncate">
                        <Link to={user ? `/threads/${thread.id}` : '/login'} onClick={(e) => e.stopPropagation()}>
                          › {thread.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button variant={space.isJoined ? "outline" : "default"} 
              size="sm" 
              onClick={(e) => { e.preventDefault(); // Stop the card's link from navigating
               if (user) {
                 alert(`Join logic for ${space.title}`);
               } else {
                 navigate('/login');
               }
             }}
            >
              {user ? (space.isJoined ? 'Joined' : 'Join') : 'Sign in to Join'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    // --- Step 2: Return the card with the correct wrapper ---
    // This is the single, correct return block. The duplicate has been removed.
    return user ? (
      <Link to={`/forums/${space.id}`} key={space.id}>
        {cardContent}
      </Link>
    ) : (
      <div key={space.id} className="cursor-pointer" onClick={() => navigate('/login')}>
        {cardContent}
      </div>
    );
  };

  // --- RENDER FUNCTION FOR PUBLIC THREADS ---
  const renderPublicThreadCard = (thread: any) => {
    const cardContent = (
      <Card className="card-medical hover:shadow-hover transition-all">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-2">{thread.title}</h3>
          <p className="text-muted-foreground text-sm mb-3">{thread.preview}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{thread.author}</span>
            <div className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /><span>{thread.replies} replies</span></div>
            <div className="flex items-center gap-1"><Heart className="h-3 w-3" /><span>{thread.hearts}</span></div>
          </div>
        </CardContent>
      </Card>
    );

    return user ? (
      <Link to={`/threads/${thread.id}`} key={thread.id}>{cardContent}</Link>
    ) : (
      <div key={thread.id} className="cursor-pointer" onClick={() => navigate('/login')}>{cardContent}</div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Forums & Community Spaces</h1>
          <p className="text-muted-foreground">Join forums and community spaces, collaborate and discuss with peers.</p>
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
                {user ? (
                  <Button className="btn-medical" onClick={() => setShowSpaceCreator(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create forum/space
                  </Button>
                ) : (
                  <Button variant="outline">
                    Sign in to create forum
                  </Button>
                )}
                
                <Button variant="outline">
                  {user ? "Manage requests" : "Browse forums"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section for Forums and Community Spaces */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Forums & Community Spaces</h2>
            <Button size="sm" onClick={() => user ? setShowSpaceCreator(true) : navigate('/login')}>
                <Plus className="h-4 w-4 mr-2" /> Create Space
            </Button>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredSpaces.map(renderSpaceCard)}
            </div>
          )}
        </section>

        {/* Section for Public Threads */}
        <section>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Public Threads</h2>
            <Button size="sm" onClick={() => user ? navigate('/create-thread') : navigate('/login')}>
                <Plus className="h-4 w-4 mr-2" /> Start a Thread
            </Button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search public threads..."
              value={threadSearchQuery}
              onChange={(e) => setThreadSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {filteredPublicThreads.map(renderPublicThreadCard)}
            </div>
          )}
        </section>
        {/* Top Forums Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Top forums by members</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exampleSpaces.slice(0, 4).map((space, index) => (
              <Card key={space.id} className="card-medical text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{space.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      Most members
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {space.members.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">members</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        {/* 5. Specialties Section */}
        <section>
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
        </section>
      </main>
      <Footer />
      <SpaceCreator
        isOpen={showSpaceCreator}
        onClose={() => setShowSpaceCreator(false)}
        onSubmit={async (spaceData) => {
          const result = await createSpace(spaceData);
          setShowSpaceCreator(false);
          if (result?.id) {
            navigate(`/forums/${result.id}`);
          }
        }}
      />
    </div>
  );
};

export default Forums;
