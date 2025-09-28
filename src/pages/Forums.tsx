import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, TrendingUp, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThreadChat } from '@/components/ThreadChat';
import { StartThreadDialog } from '@/components/StartThreadDialog';
import { formatDistance } from 'date-fns';

interface Thread {
  id: number;
  title: string;
  created_by: string;
  created_at: string;
  creator_profile?: {
    full_name: string;
  };
  message_count?: number;
  latest_message?: {
    created_at: string;
  };
}

export const Forums = () => {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching threads:', error);
        return;
      }

      // Fetch additional data separately
      const threadsWithData = await Promise.all(
        (data || []).map(async (thread) => {
          // Fetch creator profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', thread.created_by)
            .single();

          // Fetch message count
          const { data: messages } = await supabase
            .from('messages')
            .select('created_at')
            .eq('thread_id', thread.id);

          return {
            ...thread,
            creator_profile: profile || { full_name: 'Unknown User' },
            message_count: messages?.length || 0,
            latest_message: messages && messages.length > 0 ? messages[messages.length - 1] : null
          };
        })
      );

      setThreads(threadsWithData);
    } catch (error) {
      console.error('Error in fetchThreads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadCreated = (threadId: number) => {
    fetchThreads();
    // Find and open the newly created thread
    setTimeout(() => {
      const newThread = threads.find(t => t.id === threadId);
      if (newThread) {
        setSelectedThread(newThread);
      }
    }, 1000);
  };

  const categories = [
    {
      name: "General Discussion",
      description: "Open discussions about healthcare topics",
      posts: 156,
      members: 892,
      trending: true
    },
    {
      name: "Medical Updates",
      description: "Latest medical research and updates", 
      posts: 89,
      members: 645,
      trending: false
    },
    {
      name: "Career Guidance",
      description: "Professional development and career advice",
      posts: 234,
      members: 1234,
      trending: true
    },
    {
      name: "Research Discussions",
      description: "Academic research and collaboration",
      posts: 67,
      members: 423,
      trending: false
    },
    {
      name: "Technology in Healthcare",
      description: "Healthcare technology and innovations",
      posts: 145,
      members: 789,
      trending: true
    },
    {
      name: "Student Corner",
      description: "Medical students discussions and support",
      posts: 298,
      members: 1567,
      trending: false
    }
  ];

  if (selectedThread) {
    return (
      <ThreadChat
        threadId={selectedThread.id}
        threadTitle={selectedThread.title}
        onBack={() => setSelectedThread(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Forums & Community</h1>
              <p className="text-muted-foreground">Connect with healthcare professionals worldwide</p>
            </div>
            {user && (
              <Button onClick={() => setShowStartDialog(true)} className="btn-medical">
                <Plus className="h-4 w-4 mr-2" />
                Start a Thread
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Public Threads Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Public Threads
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading threads...</p>
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No threads yet. Be the first to start a discussion!</p>
                  {user && (
                    <Button onClick={() => setShowStartDialog(true)} className="btn-medical">
                      <Plus className="h-4 w-4 mr-2" />
                      Start the First Thread
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {threads.map((thread) => (
                    <Card 
                      key={thread.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedThread(thread)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-primary hover:text-primary/80 transition-colors">
                            {thread.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {thread.message_count || 0} {thread.message_count === 1 ? 'message' : 'messages'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>Started by {thread.creator_profile?.full_name || 'Unknown User'}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistance(new Date(thread.created_at), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussion Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discussion Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {categories.map((category, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer opacity-60">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-primary">{category.name}</h3>
                        {category.trending && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {category.posts} posts
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {category.members} members
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Category-based discussions coming soon! Use public threads for now.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Thread Dialog */}
        <StartThreadDialog 
          open={showStartDialog}
          onClose={() => setShowStartDialog(false)}
          onThreadCreated={handleThreadCreated}
        />
      </main>
    </div>
  );
};

export default Forums;