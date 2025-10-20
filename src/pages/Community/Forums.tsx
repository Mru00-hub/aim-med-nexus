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
import { useCommunity } from '@/context/CommunityContext';
import { Enums } from '@/integrations/supabase/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SpaceWithDetails, 
  createSpace,
  ThreadWithDetails,
  requestToJoinSpace,
  joinSpaceAsMember
} from '@/integrations/supabase/community.api';

export default function Forums() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { 
    spaces, 
    publicThreads, 
    isLoadingSpaces: loading, 
    refreshSpaces, 
    getMembershipStatus,
    setMemberships, 
  } = useCommunity();

  const [showSpaceCreator, setShowSpaceCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  // Add state for optimistic updates
  const [optimisticSpaces, setOptimisticSpaces] = useState<SpaceWithDetails[]>([]);

  // Define the missing functions
  const addOptimisticSpace = (space: SpaceWithDetails) => {
    setOptimisticSpaces(prev => [...prev, space]);
  };

  const removeOptimisticSpace = (spaceId: string) => {
    setOptimisticSpaces(prev => prev.filter(s => s.id !== spaceId));
  };

  const filteredSpaces = useMemo(() => {
    if (!spaces) return optimisticSpaces;
    // Combine real spaces with optimistic ones
    const allSpaces = [...spaces, ...optimisticSpaces];
    return allSpaces
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
  }, [spaces, optimisticSpaces, searchQuery, selectedFilter]);

  const filteredPublicThreads = useMemo(() => {
    if (!publicThreads) return [];
    return publicThreads.filter(thread => {
      const searchLower = threadSearchQuery.toLowerCase();
      return (
        (thread.title || '').toLowerCase().includes(searchLower) ||
        (thread.creator_full_name || '').toLowerCase().includes(searchLower)
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
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticSpace: SpaceWithDetails = {
      ...data,
      id: tempId,
      created_at: new Date().toISOString(),
      creator_id: user.id,
      creator_full_name: user.user_metadata.full_name || 'You',
      moderators: [], 
      member_count: 1, 
      thread_count: 0,
      last_activity_at: new Date().toISOString(),
      creator_position: null,
      creator_organization: null,
      creator_specialization: null,
    };

    addOptimisticSpace(optimisticSpace);
    setShowSpaceCreator(false);
    
    try {
      await createSpace({
        name: data.name,
        description: data.description,
        space_type: data.space_type,
        join_level: data.join_level,
      });
      removeOptimisticSpace(tempId);
      await refreshSpaces(); 
      toast({ title: 'Success!', description: `The space "${data.name}" has been created.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
      removeOptimisticSpace(tempId);
    } 
  };

  const handleJoin = async (e: React.MouseEvent, space: SpaceWithDetails) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    toast({ title: 'Processing...', description: `Requesting to join ${space.name}.` });
    try {
      const isOpenJoin = space.join_level === 'OPEN';
      
      if (isOpenJoin) {
        await joinSpaceAsMember(space.id);
        toast({ title: 'Success!', description: `You have joined ${space.name}.` });
        await refreshSpaces();
      } else { 
        await requestToJoinSpace(space.id);
        toast({ title: 'Request Sent', description: `Your request to join ${space.name} is pending approval.` });
        
        setMemberships(prevMemberships => [
          ...prevMemberships,
          {
            space_id: space.id,
            user_id: user.id,
            status: 'PENDING',
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: 'MEMBER',
          }
        ]);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const renderSpaceCard = (space: SpaceWithDetails) => {
    const isPrivate = space.join_level === 'INVITE_ONLY';
    const membershipStatus = getMembershipStatus(space.id);
    const creatorDetails = [space.creator_position, space.creator_organization]
      .filter(Boolean)
      .join(' @ ');

    const cardContent = (
      <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge variant={space.space_type === 'FORUM' ? 'secondary' : 'outline'}>
              {space.space_type === 'FORUM' ? 'Forum' : 'Community Space'}
            </Badge>
            {isPrivate && <Badge variant="destructive">Private</Badge>}
          </div>
          <CardTitle className="text-xl">{space.name}</CardTitle>
          <CardDescription className="text-sm">{space.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-between">
          <div className="text-xs text-muted-foreground space-y-2">
            {space.creator_full_name && (
              <div>
                <p>Created by: <span className="font-semibold text-foreground">{space.creator_full_name}</span></p>
                {creatorDetails && <p className="text-xs">{creatorDetails}</p>}
              </div>
            )}
            {space.moderators && space.moderators.length > 0 && (
              <div>
                <TooltipProvider delayDuration={100}>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {space.moderators.slice(0, 3).map(mod => (
                      <Tooltip key={mod.id}|| `mod-${index}>
                        <TooltipTrigger asChild>
                          <span className="inline-block"> {/* ✅ Add wrapper */}
                            <Badge variant="outline" className="cursor-default">
                              {mod.full_name}
                            </Badge>
                          </span>
                        </TooltipTrigger>
                        {mod.specialization && (
                          <TooltipContent>
                            <p>{mod.specialization}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                    {space.moderators.length > 3 && (
                      <Badge variant="outline">+{space.moderators.length - 3} more</Badge>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end items-center">
            {membershipStatus === 'ACTIVE' ? (
              <Button asChild variant="outline" size="sm">
                <Link to={`/community/space/${space.id}`}>Go to Space</Link>
              </Button>
            ) : membershipStatus === 'PENDING' ? (
              <Button variant="secondary" size="sm" disabled>
                Requested
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={(e) => handleJoin(e, space)}>
                {isPrivate ? 'Request to Join' : 'Join'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

    return (
      <div 
        key={space.id} 
        className="cursor-pointer" 
        onClick={() => membershipStatus === 'ACTIVE' && navigate(`/community/space/${space.id}`)}
      >
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
            <div>
              <span className="font-medium text-foreground">{thread.creator_full_name}</span>
              {(thread.creator_position || thread.creator_specialization) && (
                <p className="text-xs">
                  {[thread.creator_position, thread.creator_specialization].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{thread.message_count} messages</span>
            </div>
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Community Hub</h1>
          <p className="text-lg text-muted-foreground">Discover spaces, join discussions, and engage with your peers.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search spaces..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10" 
                />
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
            <Button 
              size="sm" 
              onClick={() => user ? setShowSpaceCreator(true) : navigate('/login')}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Space
            </Button>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Loading spaces...</p>
          ) : filteredSpaces.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No spaces match your criteria.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpaces.map(renderSpaceCard)}
            </div>
          )}
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Public Threads</h2>
            {publicThreads && publicThreads.length > 0 && (
              <Button 
                size="sm" 
                onClick={() => user ? navigate(`/community/space/${publicThreads[0].space_id}/create-thread`) : navigate('/login')}
              >
                <Plus className="h-4 w-4 mr-2" /> Start a Thread
              </Button>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search public threads..." 
              value={threadSearchQuery} 
              onChange={(e) => setThreadSearchQuery(e.target.value)} 
              className="pl-10" 
            />
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Loading threads...</p>
          ) : filteredPublicThreads.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No public threads match your search.</p>
          ) : (
            <div className="space-y-4">
              {filteredPublicThreads.map(renderPublicThreadCard)}
            </div>
          )}
        </section>
      </main>
      <Footer />
      {user && (
        <SpaceCreator
          isOpen={showSpaceCreator}
          onClose={() => setShowSpaceCreator(false)}
          onSubmit={handleCreateSpace}
        />
      )}
    </div>
  );
}
