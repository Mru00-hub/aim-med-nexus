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

// ----------------------------------------------------------------------
// REVISED IMPORTS - Use the unified API and the new Context
// ----------------------------------------------------------------------
import {
  Space,             // Unified Space Type
  createSpace,       // Unified Creation Function
  joinPublicForum,
  requestToJoinSpace,
} from '@/integrations/supabase/community.api';
import { useCommunity } from '@/context/CommunityContext'; // NEW: Import the Community Context

// We'll also import the Enums for clarity in the createSpace function
import { Enums } from '@/integrations/supabase/types';

// This page no longer needs to fetch data, the context handles it.

export default function Forums() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ----------------------------------------------------------------------
  // REVISED STATE MANAGEMENT - Use the global context
  // ----------------------------------------------------------------------
  const { 
    spaces, 
    publicThreads, 
    isLoadingSpaces: loading, 
    fetchSpaces, 
    isMemberOf,
    publicSpaceId // Use the ID from the context
  } = useCommunity();

  const [showSpaceCreator, setShowSpaceCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL'); // ALL, FORUM, COMMUNITY_SPACE

  // ----------------------------------------------------------------------
  // REFACTORED FILTERING LOGIC
  // ----------------------------------------------------------------------
  const filteredSpaces = useMemo(() => {
    // Only display non-PUBLIC spaces here (Public threads are separate)
    return spaces
      .filter(space => space.space_type !== 'PUBLIC')
      .filter(space => {
        if (selectedFilter === 'ALL') return true;
        // Check against the unified space_type
        return space.space_type === selectedFilter;
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
        // NOTE: creator_email is now likely replaced by creator_name/full_name 
        // in a joined profile object, but we keep creator_email for now.
        thread.full_name?.toLowerCase().includes(searchLower) 
      );
    });
  }, [publicThreads, threadSearchQuery]);


  // ----------------------------------------------------------------------
  // REFACTORED USER ACTIONS
  // ----------------------------------------------------------------------
  const handleJoin = async (e: React.MouseEvent, space: Space) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
          navigate('/login');
          return;
      }

      toast({ title: 'Joining...', description: `Attempting to join ${space.name}.` });
      try {
          // A Forum is public if join_level is OPEN
          const isPublicForum = space.space_type === 'FORUM' && space.join_level === 'OPEN';
          
          if (isPublicForum) {
              await joinPublicForum(space.id); // This RPC handles immediate membership
              toast({ title: 'Success!', description: `You have joined ${space.name}.` });
          } else { 
              // This handles Private Forums and all Community Spaces (which are INVITE_ONLY)
              await requestToJoinSpace(space.id, space.space_type);
              toast({ title: 'Request Sent', description: `Your request to join ${space.name} is pending approval.` });
          }
          // Crucial: Re-fetch spaces to update the 'isMemberOf' status in the context
          await fetchSpaces();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  const handleCreateSpace = async (data: { 
      name: string; 
      description: string; 
      type: 'FORUM' | 'COMMUNITY_SPACE'; 
      forumType: 'PUBLIC' | 'PRIVATE' 
  }) => {
    try {
      // Map the UI form data to the unified API types
      const payload = {
        name: data.name,
        description: data.description,
        space_type: data.type as Enums<'space_type'>,
        join_level: (data.type === 'FORUM' && data.forumType === 'PUBLIC') 
            ? 'OPEN' as Enums<'join_level'> 
            : 'INVITE_ONLY' as Enums<'join_level'>,
      };

      const newSpace = await createSpace(payload);
      toast({ title: 'Success!', description: `${newSpace.name} has been created.` });
      setShowSpaceCreator(false);
      
      // Update the global state with the new space
      await fetchSpaces(); 
      
      // Redirect to the newly created space detail page
      navigate(`/community/space/${newSpace.id}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    }
  };

  const renderSpaceCard = (space: Space) => {
    const isPrivate = space.join_level === 'INVITE_ONLY';
    const hasJoined = isMemberOf(space.id); // Check context for membership

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
                // If already a member, navigate directly
                <Button variant="outline" size="sm">Go to Space</Button>
            ) : (
                // If not a member, allow joining/requesting
                <Button variant="default" size="sm" onClick={(e) => handleJoin(e, space)}>
                    {isPrivate ? 'Request to Join' : 'Join'}
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

    // If already joined, click action links to the space page
    // Otherwise, the click action defaults to the button action or login
    const clickHandler = hasJoined ? 
        () => navigate(`/community/space/${space.id}`) : 
        (e: React.MouseEvent) => {
            if (user) {
                // If the user is logged in but hasn't joined, the button handles the action.
                // We prevent default navigation on the card click to let the button handle it.
                e.preventDefault(); 
            } else {
                navigate('/login');
            }
        };

    return (
        <div key={space.id} className="cursor-pointer" onClick={clickHandler}>
            {cardContent}
        </div>
    );
  };
  
  // renderPublicThreadCard logic remains largely the same, but should link to the ThreadDetailPage
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
    // Wrap the entire application or the main community section in the CommunityProvider 
    // for this hook to work correctly.

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
          {loading ? ( 
            <p>Loading spaces...</p> 
          ) : (
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
          {loading ? ( 
            <p>Loading threads...</p> 
          ) : (
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
