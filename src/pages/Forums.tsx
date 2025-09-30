// src/pages/community/Forums.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { SpaceCreator } from '@/components/forums/SpaceCreator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Users, MessageSquare, Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';

// STEP 1: Update Imports and Types
import {
  getDiscoverySpaces,
  getPublicThreads,
  createForum,
  createCommunitySpace,
  joinPublicForum,
  requestToJoinSpace,
  Forum,
  CommunitySpace,
  ThreadWithDetails
} from '@/integrations/supabase/community.api';

type Space = Forum | CommunitySpace;

export default function Forums() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // STEP 2: Update State Management with new types
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [publicThreads, setPublicThreads] = useState<ThreadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpaceCreator, setShowSpaceCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, FORUM, COMMUNITY_SPACE

  // STEP 3: Connect the Data Fetching useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user) {
          const [spacesData, publicThreadsData] = await Promise.all([
            getDiscoverySpaces(),
            getPublicThreads(),
          ]);
          setSpaces(spacesData);
          setPublicThreads(publicThreadsData);
        } else {
          // For logged-out users, we still get the mock data from the API layer
          const [mockSpaces, mockPublicThreads] = await Promise.all([
            getDiscoverySpaces(),
            getPublicThreads(),
          ]);
          setSpaces(mockSpaces);
          setPublicThreads(mockPublicThreads);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch community data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, toast]);

  // STEP 4: Refactor Filtering Logic
  const filteredSpaces = useMemo(() => {
    return spaces
      .filter(space => {
        if (selectedFilter === 'ALL') return true;
        // The `type` property exists on Forum, but not CommunitySpace, so we check for its existence
        const spaceType = 'type' in space ? 'FORUM' : 'COMMUNITY_SPACE';
        return spaceType === selectedFilter;
      })
      .filter(space => {
        const searchLower = searchQuery.toLowerCase();
        return (
          space.name.toLowerCase().includes(searchLower) ||
          space.description?.toLowerCase().includes(searchLower)
        );
      });
  }, [spaces, searchQuery, selectedFilter]);

  const filteredPublicThreads = useMemo(() => {
    return publicThreads.filter(thread => {
      const searchLower = threadSearchQuery.toLowerCase();
      return (
        thread.title.toLowerCase().includes(searchLower) ||
        thread.creator_email.toLowerCase().includes(searchLower)
      );
    });
  }, [publicThreads, threadSearchQuery]);


  // STEP 5: Implement User Actions
  const handleJoin = async (e: React.MouseEvent, space: Space) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
          navigate('/login');
          return;
      }

      toast({ title: 'Joining...', description: `Attempting to join ${space.name}.` });
      try {
          // Check if it's a Forum
          if ('type' in space) {
              if (space.type === 'PUBLIC') {
                  await joinPublicForum(space.id);
                  toast({ title: 'Success!', description: `You have joined ${space.name}.` });
              } else { // Private Forum
                  await requestToJoinSpace(space.id, 'FORUM');
                  toast({ title: 'Request Sent', description: `Your request to join ${space.name} is pending approval.` });
              }
          } else { // It's a Community Space
              await requestToJoinSpace(space.id, 'COMMUNITY_SPACE');
              toast({ title: 'Request Sent', description: `Your request to join ${space.name} is pending approval.` });
          }
          // Here you might want to refetch user memberships to update the "Joined" status
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  const handleCreateSpace = async (data: { name: string; description: string; type: 'FORUM' | 'COMMUNITY_SPACE'; forumType: 'PUBLIC' | 'PRIVATE' }) => {
    try {
      let newSpace;
      if (data.type === 'FORUM') {
        newSpace = await createForum({ name: data.name, description: data.description, type: data.forumType });
      } else {
        newSpace = await createCommunitySpace({ name: data.name, description: data.description });
      }
      toast({ title: 'Success!', description: `${newSpace.name} has been created.` });
      setShowSpaceCreator(false);
      // NOTE: We determine the type for the URL based on the object's properties
      const spaceUrlType = 'type' in newSpace ? 'forum' : 'community';
      navigate(`/community/space/${newSpace.id}?type=${spaceUrlType}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    }
  };

  const renderSpaceCard = (space: Space) => {
    const isForum = 'type' in space;
    const spaceTypeForURL = isForum ? 'forum' : 'community';

    const cardContent = (
      <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-2">
                <Badge variant={isForum ? 'secondary' : 'outline'}>
                    {isForum ? 'Forum' : 'Community Space'}
                </Badge>
                {isForum && space.type === 'PRIVATE' && <Badge variant="destructive">Private</Badge>}
            </div>
            <h3 className="text-xl font-semibold">{space.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{space.description}</p>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button variant="default" size="sm" onClick={(e) => handleJoin(e, space)}>
                Join
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    return user ? (
      <Link to={`/community/space/${space.id}?type=${spaceTypeForURL}`} key={space.id}>
        {cardContent}
      </Link>
    ) : (
      <div key={space.id} className="cursor-pointer" onClick={() => navigate('/login')}>
        {cardContent}
      </div>
    );
  };
  
  const renderPublicThreadCard = (thread: ThreadWithDetails) => (
    <Card key={thread.id} className="transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
       <Link to={user ? `/community/thread/${thread.id}` : '/login'}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-2">{thread.title}</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{thread.creator_email}</span>
            <div className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /><span>{thread.message_count} messages</span></div>
            <span>Last activity: {new Date(thread.last_activity_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Community Hub</h1>
          <p className="text-lg text-muted-foreground">Discover spaces, join discussions, and engage with your peers.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search spaces..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="md:w-56">
                  <SelectValue placeholder="Filter by type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Spaces</SelectItem>
                  <SelectItem value="FORUM">Forums Only</SelectItem>
                  <SelectItem value="COMMUNITY_SPACE">Community Spaces Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Discover Spaces</h2>
            <Button size="sm" onClick={() => user ? setShowSpaceCreator(true) : navigate('/login')}>
                <Plus className="h-4 w-4 mr-2" /> Create Space
            </Button>
          </div>
          {loading ? ( <p>Loading spaces...</p> ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpaces.map(renderSpaceCard)}
            </div>
          )}
        </section>

        <section>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Public Threads</h2>
            <Button size="sm" onClick={() => user ? navigate('/community/create-thread') : navigate('/login')}>
                <Plus className="h-4 w-4 mr-2" /> Start a Thread
            </Button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search public threads..." value={threadSearchQuery} onChange={(e) => setThreadSearchQuery(e.target.value)} className="pl-10" />
          </div>
          {loading ? ( <p>Loading threads...</p> ) : (
            <div className="space-y-4">
              {filteredPublicThreads.map(renderPublicThreadCard)}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <SpaceCreator
        isOpen={showSpaceCreator}
        onClose={() => setShowSpaceCreator(false)}
        onSubmit={handleCreateSpace}
      />
    </div>
  );
};
          
