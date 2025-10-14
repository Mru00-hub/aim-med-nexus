import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/integrations/supabase/social.api';
import type { Database, Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserPlus,
  Search,
  Sparkles,
  UserX,
  MoreHorizontal,
  Ban
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for all data models
type ConnectionRequest = Tables<'pending_connection_requests'>;
type UserRecommendation = Database['public']['Functions']['get_user_recommendations']['Returns'][number];
type SentRequest = Tables<'sent_pending_requests'>; 
type MyConnection = Tables<'my_connections'>;
type BlockedUser = Tables<'blocked_members'>;

const FunctionalSocial = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // State for all social data
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [myConnections, setMyConnections] = useState<MyConnection[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  
  // State for search/filter
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reqRes, sentRes, recRes, connRes, blockedRes] = await Promise.all([
        socialApi.connections.getPendingRequests(),
        socialApi.connections.getSentPendingRequests(),
        socialApi.connections.getUserRecommendations(user.id),
        socialApi.connections.getMyConnections(),
        socialApi.connections.getBlockedUsers(),
      ]);

      if (reqRes.data) setRequests(reqRes.data);
      if (sentRes.data) setSentRequests(sentRes.data as SentRequest[]);
      if (recRes.data) setRecommendations(recRes.data);
      if (connRes.data) setMyConnections(connRes.data);
      if (blockedRes.data) setBlockedUsers(blockedRes.data);

    } catch (error) {
      console.error("Failed to fetch social data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // --- Action Handlers ---
  const handleAction = async (action: () => Promise<any>) => {
    await action();
    await fetchData(); // Re-fetch all data to ensure UI consistency after any action
  };

  const handleSendRequest = (addresseeId: string) => handleAction(() => socialApi.connections.sendRequest(addresseeId));
  const handleRespondRequest = (requesterId: string, response: 'accepted' | 'ignored') => handleAction(() => socialApi.connections.respondToRequest(requesterId, response));
  const handleRemoveConnection = (userId: string) => handleAction(() => socialApi.connections.removeConnection(userId));
  const handleBlockUser = (userId: string) => handleAction(() => socialApi.connections.blockUser(userId));
  const handleUnblockUser = (userId: string) => handleAction(() => socialApi.connections.unblockUser(userId));

  // --- Memoized Filtered Recommendations ---
  const filteredRecommendations = useMemo(() => {
    if (!searchTerm) return recommendations;
    return recommendations.filter(rec => rec.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recommendations, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Networking</h1>
          <p className="text-muted-foreground text-lg">
            Discover, connect with, and manage your professional network.
          </p>
        </div>
        
        <Tabs defaultValue="discover">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="discover">Discover</TabsTrigger>
                <TabsTrigger value="network">My Network ({myConnections.length})</TabsTrigger>
                <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
                <TabsTrigger value="blocked">Blocked</TabsTrigger>
            </TabsList>
            
            <TabsContent value="discover" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> People You May Know</CardTitle>
                        <div className="relative pt-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? <Skeleton className="h-20 w-full" /> : filteredRecommendations.map(rec => (
                             <div key={rec.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    {/* Avatar, Name, Details */}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => handleSendRequest(rec.id)}><UserPlus className="h-4 w-4 mr-2" />Connect</Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleBlockUser(rec.id)} className="text-destructive"><Ban className="h-4 w-4 mr-2" />Block User</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                             </div>
                        ))}
                    </CardContent>
                 </Card>
            </TabsContent>

            <TabsContent value="network" className="mt-6">
                <Card>
                    <CardHeader><CardTitle>My Connections</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {loading ? <Skeleton className="h-20 w-full" /> : myConnections.map(conn => (
                            <div key={conn.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                {/* ... Avatar, Name, etc ... */}
                                <Button variant="outline" size="sm" onClick={() => handleRemoveConnection(conn.id)}><UserX className="h-4 w-4 mr-2"/>Remove</Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
                <Tabs defaultValue="incoming" className="w-full">
                    <TabsList><TabsTrigger value="incoming">Incoming</TabsTrigger><TabsTrigger value="sent">Sent</TabsTrigger></TabsList>
                    <TabsContent value="incoming" className="mt-4">
                       {/* JSX for incoming requests */}
                    </TabsContent>
                    <TabsContent value="sent" className="mt-4">
                       {/* JSX for sent requests */}
                    </TabsContent>
                </Tabs>
            </TabsContent>
            
            <TabsContent value="blocked" className="mt-6">
                 <Card>
                    <CardHeader><CardTitle>Blocked Users</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                         {loading ? <Skeleton className="h-20 w-full" /> : blockedUsers.map(bu => (
                            <div key={bu.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                {/* ... Avatar, Name ... */}
                                <Button variant="outline" size="sm" onClick={() => handleUnblockUser(bu.id)}>Unblock</Button>
                            </div>
                        ))}
                    </CardContent>
                 </Card>
            </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default FunctionalSocial;
