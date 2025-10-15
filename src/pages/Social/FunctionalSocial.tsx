// src/pages/Social/FunctionalSocial.tsx

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialCounts } from '@/context/SocialCountsContext';

// FIX: Import the new standalone functions and types from the refactored API
import {
    getUserRecommendations,
    getMutualConnections, 
    getSentPendingRequests,
    getPendingRequests,
    getMyConnections,
    getBlockedUsers,
    sendConnectionRequest,
    respondToRequest,
    removeConnection,
    blockUser,
    unblockUser,
    ConnectionRequest,
    Connection,
    BlockedUser,
} from '@/integrations/supabase/social.api';

// Import the tab components
import { DiscoverTab } from '@/components/social/DiscoverTab';
import { NetworkTab } from '@/components/social/NetworkTab';
import { RequestsTab } from '@/components/social/RequestsTab';
import { BlockedTab } from '@/components/social/BlockedTab';
import type { Database, Tables } from '@/integrations/supabase/types';

type UserRecommendation = Database['public']['Functions']['get_user_recommendations']['Returns'][number];
type SentRequest = Tables<'sent_pending_requests'>;
type RecommendationWithMutuals = UserRecommendation & {
    mutuals?: any[]; // The array of mutual connections
};

const FunctionalSocial = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setRequestCount } = useSocialCounts();
  const [loading, setLoading] = useState(true);
  
  // State for all social data
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]); // Assuming type
  const [recommendations, setRecommendations] = useState<RecommendationWithMutuals[]>([]);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  useEffect(() => {
    setRequestCount(requests.length);
  }, [requests, setRequestCount]);
  
  // FIX: Refactored to use new API functions and a single try...catch block
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Promise.all fetches data in parallel for better performance
      const [requestsData, connectionsData, blockedData, sentRequestsData, recommendationsData, initialRecommendations,] = await Promise.all([
        getPendingRequests(),
        getMyConnections(),
        getBlockedUsers(),
        getSentPendingRequests(), 
        getUserRecommendations(user.id),
      ]);
      if (initialRecommendations && initialRecommendations.length > 0) {
                const mutualsPromises = initialRecommendations.map(rec => getMutualConnections(rec.id));
                const mutualsResults = await Promise.all(mutualsPromises);

                // 3. Combine the initial recommendations with their mutuals
                const recommendationsWithMutuals = initialRecommendations.map((rec, index) => ({
                    ...rec,
                    mutuals: mutualsResults[index] || [], // Attach the mutuals array
                }));
                setRecommendations(recommendationsWithMutuals);
            } else {
                setRecommendations([]);
      }

      setRequests(requestsData);
      setMyConnections(connectionsData);
      setBlockedUsers(blockedData);
      setSentRequests(sentRes.data as SentRequest[]);

    } catch (error: any) {
      console.error("Failed to fetch social data:", error);
       toast({ title: "Error", description: "Could not fetch your network data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, [user]);

  // FIX: Refactored `handleAction` to be much simpler with the new API style.
  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
        await action();
        toast({ title: "Success", description: successMessage });
        await fetchData(); // Re-fetch all data to ensure UI is consistent
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // FIX: These handlers now call the new standalone functions.
  const handleSendRequest = (addresseeId: string) => handleAction(() => sendConnectionRequest(addresseeId), "Connection request sent.");
  const handleRespondRequest = (requesterId: string, response: 'accepted' | 'ignored') => handleAction(() => respondToRequest(requesterId, response), `Request ${response}.`);
  const handleRemoveConnection = (userId: string) => handleAction(() => removeConnection(userId), "Connection removed.");
  const handleBlockUser = (userId: string) => handleAction(() => blockUser(userId), "User has been blocked.");
  const handleUnblockUser = (userId: string) => handleAction(() => unblockUser(userId), "User has been unblocked.");
  
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
                    onWithdrawRequest={handleRemoveConnection} // Withdrawing is the same as removing a pending connection
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
