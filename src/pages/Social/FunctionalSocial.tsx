import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialCounts } from '@/context/SocialCountsContext';

// Import API functions
import {
    getUserRecommendations,
    getMutualConnections, 
    getSentPendingRequests,
    getPendingRequests,
    getBlockedUsers,
    sendConnectionRequest,
    respondToRequest,
    removeConnection, // We still import this to pass to child if needed, or child can import directly
    getMyConnectionCount,
    blockUser,
    unblockUser,
    ConnectionRequest,
    BlockedUser,
    SentPendingRequest
} from '@/integrations/supabase/social.api';
import { ProfileWithStatus } from '@/integrations/supabase/community.api';

// Import Tabs
import { DiscoverTab } from '@/components/social/DiscoverTab';
import { NetworkTab } from '@/components/social/NetworkTab'; // Updated import
import { RequestsTab } from '@/components/social/RequestsTab';
import { BlockedTab } from '@/components/social/BlockedTab';
import type { Database } from '@/integrations/supabase/types';

type UserRecommendation = Database['public']['Functions']['get_user_recommendations']['Returns'][number];
type RecommendationWithMutuals = UserRecommendation & {
    mutuals?: ProfileWithStatus[];
};

const FunctionalSocial = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { requestCount, refetchSocialGraph } = useSocialCounts();
  const [loading, setLoading] = useState(true);
  
  // State for social data
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentPendingRequest[]>([]); 
  const [recommendations, setRecommendations] = useState<RecommendationWithMutuals[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    refetchSocialGraph(); 
    
    try {
      // REMOVED: getMyConnections() from this Promise.all
      const [
        requestsRes,       
        blockedRes,        
        sentRequestsRes,   
        recommendationsRes, 
        countRes
      ] = await Promise.all([
        getPendingRequests(),
        getBlockedUsers(),
        getSentPendingRequests(),
        getUserRecommendations(user.id),
        getMyConnectionCount()
      ]);

      setRequests(requestsRes || []);
      setBlockedUsers(blockedRes || []);
      setSentRequests(sentRequestsRes || []); 
      setConnectionCount(countRes || 0);
      
      // Handle recommendations
      if (recommendationsRes.data) {
        const initialRecommendations = recommendationsRes.data;
        try {
          const mutualsPromises = initialRecommendations.map(rec => getMutualConnections(rec.id));
          const mutualsResults = await Promise.all(mutualsPromises);
          
          const recommendationsWithMutuals = initialRecommendations.map((rec, index) => ({
            ...rec,
            mutuals: mutualsResults[index] || [],
          }));
          setRecommendations(recommendationsWithMutuals);
        } catch (error) {
          console.error("Failed to fetch mutual connections:", error);
          setRecommendations(initialRecommendations.map(rec => ({ ...rec, mutuals: [] })));
        }
      } else {
        setRecommendations([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch social data:", error);
      toast({ title: "Error", description: `Could not load social data: ${error.message}`, variant: "destructive" });
    }
    setLoading(false);
  };
  
  useEffect(() => { fetchData(); }, [user]);

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
        await action();
        toast({ title: "Success", description: successMessage });
        await fetchData(); 
        await refetchSocialGraph();
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: 'destructive' });
    }
  };

  const handleSendRequest = (addresseeId: string) => handleAction(() => sendConnectionRequest(addresseeId), "Connection request sent.");
  const handleRespondRequest = (requesterId: string, response: 'accepted' | 'ignored') => handleAction(() => respondToRequest(requesterId, response), `Request ${response}.`);
  const handleBlockUser = (userId: string) => handleAction(() => blockUser(userId), "User has been blocked.");
  const handleUnblockUser = (userId: string) => handleAction(() => unblockUser(userId), "User has been unblocked.");
  
  // Note: handleRemoveConnection is no longer passed to NetworkTab for data management, 
  // but NetworkTab will call the API directly. We only pass this if we need to withdraw requests.
  const handleWithdrawRequest = (userId: string) => handleAction(() => removeConnection(userId), "Request withdrawn.");

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
            <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="discover" className="whitespace-nowrap">Discover</TabsTrigger>
                <TabsTrigger value="network">
                    My Network ({connectionCount})
                </TabsTrigger>
                <TabsTrigger value="network" className="whitespace-nowrap">My Network</TabsTrigger>
                <TabsTrigger value="requests" className="whitespace-nowrap">Requests ({requestCount})</TabsTrigger>
                <TabsTrigger value="blocked" className="whitespace-nowrap">Blocked ({blockedUsers.length})</TabsTrigger>
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
                    onConnectionRemoved={() => setConnectionCount(prev => prev - 1)} 
                />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
                <RequestsTab
                    requests={requests}
                    sentRequests={sentRequests}
                    loading={loading}
                    onRespondRequest={handleRespondRequest}
                    onBlockUser={handleBlockUser}
                    onWithdrawRequest={handleWithdrawRequest} 
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
