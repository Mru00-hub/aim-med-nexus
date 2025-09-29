import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { ForumsNav } from '@/components/forums/ForumsNav';
import { SpaceCreator } from '@/components/forums/SpaceCreator';
// Removed unused 'Space' type and defined types inline or where needed
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
  // ... (rest of exampleSpaces array)
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
  // ... (examplePublicThreads array)
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
  // --- FIXED: Moved useState hook inside the component ---
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

  // I've removed the handleCreateSpace function for now as its types were not defined
  // You can add it back with the correct types for `SpaceType` and `JoinMechanism`

  const specialties = [
    'All specialties', 'General Physician', 'Cardiology', 'Radiology', 
    'Pediatrics', 'Emergency Medicine', 'Hospital Network', 'Surgery', 
    'Internal Medicine', 'Nursing', 'Pharmacy'
  ];

  const forumTypes = ['All Types', 'Public Forums', 'Private Forums'];

  const communityspaceTypes = [
    'All Types', 'Institution-Based Spaces', 'Purpose-Driven Spaces', 
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

  const renderSpaceCard = (space: any) => {
    const cardContent = (
        <Card className="card-medical hover:shadow-hover transition-all">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                        onClick={(e) => { e.preventDefault();
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

    return user ? (
        <Link to={`/forums/${space.id}`} key={space.id}>{cardContent}</Link>
    ) : (
        <div key={space.id} className="cursor-pointer" onClick={() => navigate('/login')}>{cardContent}</div>
    );
  };

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
                  <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {forumTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (<SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center mt-4">
                {user ? (
                  <Button className="btn-medical"><Plus className="h-4 w-4 mr-2" />Create forum/space</Button>
                ) : (
                  <Button variant="outline">Sign in to create forum</Button>
                )}
                <Button variant="outline">{user ? "Manage requests" : "Browse forums"}</Button>
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
            {exampleSpaces.slice(0, 4).map((space) => (
              <Card key={space.id} className="card-medical text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{space.title}</h3>
                    <Badge variant="outline" className="text-xs">Most members</Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">{space.members.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">members</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Specialties Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Specialties</h2>
          <div className="flex flex-wrap gap-3">
            {specialties.slice(1).map((specialty) => (
              <Button key={specialty} variant="outline" size="sm" className="hover:bg-primary/5 hover:text-primary hover:border-primary">
                {specialty}
              </Button>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Forums;
