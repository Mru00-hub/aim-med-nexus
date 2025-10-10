// src/pages/community/Forums.tsx

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { SpaceCreator } from '@/components/forums/SpaceCreator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';

// --- FIX #1: IMPORT API FUNCTIONS DIRECTLY ---
import {
  Space,
  createSpace,
  ThreadWithDetails,
  requestToJoinSpace,
  joinSpaceAsMember // <-- Import the function directly
} from '@/integrations/supabase/community.api';
import { useCommunity } from '@/context/CommunityContext';
import { Enums } from '@/integrations/supabase/types';


export default function Forums() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- FIX #2: UPDATE CONTEXT CONSUMPTION ---
  // We no longer ask for joinSpaceAsMember or publicSpaceId from the context.
  const { 
    spaces, 
    publicThreads, 
    isLoadingSpaces: loading, 
    fetchSpaces, 
    isMemberOf,
  } = useCommunity();

  const [showSpaceCreator, setShowSpaceCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const filteredSpaces = useMemo(() => {
    if (!spaces) return []; // Safety check
    return spaces
      .filter(space => space.space_type !== 'PUBLIC')
      .filter(space => {
        if (selectedFilter === 'ALL') return true;
        return space.space_type === selectedFilter;
      })
      .filter(space => {
        const searchLower = searchQuery.toLowerCase();
        return (
          space.name.toLowerCase().includes(searchLower) ||
          (space.description && space.description.toLowerCase().includes(searchLower))
        );
      });
  }, [spaces, searchQuery, selectedFilter]);

  const filteredPublicThreads = useMemo(() => {
    if (!publicThreads) return []; // Safety check
    return publicThreads.filter(thread => {
      const searchLower = threadSearchQuery.toLowerCase();
      return (
        thread.title.toLowerCase().includes(searchLower) ||
        thread.creator_full_name.toLowerCase().includes(searchLower)
      );
    });
  }, [publicThreads, threadSearchQuery]);


  const handleCreateSpace = async (data: {
    name: string;
    description?: string;
    space_type: 'FORUM' | 'COMMUNITY_SPACE';
    join_level: Enums<'space_join_level'>;
  }) => {
    if (!user) return;
    toast({ title: 'Creating space...' });
    try {
      await createSpace({
        name: data.name,
        description: data.description,
        space_type: data.space_type,
        join_level: data.join_level,
      });
      toast({ title: 'Success!', description: `The space "${data.name}" has been created.` });
      await fetchSpaces();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    } finally {
      setShowSpaceCreator(false);
    }
  };

  // --- FIX #3: UPDATE THE handleJoin FUNCTION ---
  // It now correctly uses the directly imported API functions for all cases.
  const handleJoin = async (e: React.MouseEvent, space: Space) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
          navigate('/login');
          return;
      }

      toast({ title: 'Processing...', description: `Requesting to join ${space.name}.` });
      try {
          const isPublicForum = space.space_type === 'FORUM' && space.join_level === 'OPEN';
          
          if (isPublicForum) {
              await joinSpaceAsMember(space.id); // Using the imported function
              toast({ title: 'Success!', description: `You have joined ${space.name}.` });
          } else { 
              await requestToJoinSpace(space.id, space.space_type);
              toast({ title: 'Request Sent', description: `Your request to join ${space.name} is pending approval.` });
          }
          await fetchSpaces();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  const renderSpaceCard = (space: Space) => {
    const isPrivate = space.join_level === 'INVITE_ONLY';
    const hasJoined = isMemberOf(space.id);

    const cardContent = (
      <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-2">
                <Badge variant={space.space_type === 'FORUM' ? 'secondary' : 'outline'}>
                    {space.space_type === 'FORUM' ? 'Forum' : 'Community Space'}
                </Badge>
                {isPrivate && <Badge variant="destructive">Private</Badge>}
            </div>
            <h3 className="text-xl font-semibold">{space.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{space.description}</p>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end">
            {hasJoined ? (
                <Button variant="outline" size="sm">Go to Space</Button>
            ) : (
                <Button variant="default" size="sm" onClick={(e) => handleJoin(e, space)}>
                    {isPrivate ? 'Request to Join' : 'Join'}
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

    const clickHandler = () => {
        if (isMemberOf(space.id)) {
            navigate(`/community/space/${space.id}`);
        } else if (!user) {
            navigate('/login');
        }
        // If logged in but not a member, clicking the card does nothing; the button must be used.
    };

    return (
        <div key={space.id} className="cursor-pointer" onClick={clickHandler}>
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
            <span className="font-medium text-foreground">{thread.creator_full_name}</span>
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
            {publicThreads && publicThreads.length > 0 && (
                <Button size="sm" onClick={() => user ? navigate(`/community/space/${publicThreads[0].space_id}/create-thread`) : navigate('/login')}>
                    <Plus className="h-4 w-4 mr-2" /> Start a Thread
                </Button>
            )}
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
