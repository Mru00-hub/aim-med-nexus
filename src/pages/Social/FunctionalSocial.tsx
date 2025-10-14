import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/integrations/supabase/social.api';
import type { Database, Tables } from '@/integrations/supabase/types';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the new tab components
import { DiscoverTab } from '@/components/social/DiscoverTab';
import { NetworkTab } from '@/components/social/NetworkTab';
import { RequestsTab } from '@/components/social/RequestsTab';
import { BlockedTab } from '@/components/social/BlockedTab';

// Define types for all data models
type ConnectionRequest = Tables<'pending_connection_requests'>;
type UserRecommendation = Database['public']['Functions']['get_user_recommendations']['Returns'][number];
type SentRequest = Tables<'sent_pending_requests'>; 
type MyConnection = Tables<'my_connections'>;
type BlockedUser = Tables<'blocked_members'>;

const FunctionalSocial = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // State for all social data
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [myConnections, setMyConnections] = useState<MyConnection[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  
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
       toast({ title: "Error", description: "Could not fetch social data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, [user]);

  // Action Handlers
  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    const { error } = await action();
    if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Success", description: successMessage });
        await fetchData(); // Re-fetch all data to ensure UI consistency
    }
  };

  const handleSendRequest = (addresseeId: string) => handleAction(() => socialApi.connections.sendRequest(addresseeId), "Connection request sent.");
  const handleRespondRequest = (requesterId: string, response: 'accepted' | 'ignored') => handleAction(() => socialApi.connections.respondToRequest(requesterId, response), `Request ${response}.`);
  const handleRemoveConnection = (userId: string) => handleAction(() => socialApi.connections.removeConnection(userId), "Connection removed.");
  const handleBlockUser = (userId: string) => handleAction(() => socialApi.connections.blockUser(userId), "User has been blocked.");
  const handleUnblockUser = (userId: string) => handleAction(() => socialApi.connections.unblockUser(userId), "User has been unblocked.");
  
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
                <TabsTrigger value="blocked">Blocked ({blockedUsers.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="discover" className="mt-6">
                <DiscoverTab
                    recommendations={recommendations}
                    loading={loading}
                    onSendRequest={handleSendRequest}
                    onBlockUser={handleBlockUser}
                />
            </TabsContent>

            <TabsContent value="network" className="mt-6">
                <NetworkTab
                    myConnections={myConnections}
                    loading={loading}
                    onRemoveConnection={handleRemoveConnection}
                />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
                <RequestsTab
                    requests={requests}
                    sentRequests={sentRequests}
                    loading={loading}
                    onRespondRequest={handleRespondRequest}
                    onBlockUser={handleBlockUser}
                    onWithdrawRequest={handleRemoveConnection} // Withdrawing is the same as removing
                />
            </TabsContent>
            
            <TabsContent value="blocked" className="mt-6">
                 <BlockedTab
                    blockedUsers={blockedUsers}
                    loading={loading}
                    onUnblockUser={handleUnblockUser}
                 />
            </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default FunctionalSocial;
