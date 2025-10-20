import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialCounts } from '@/context/SocialCountsContext';

// Import the new standalone functions and types from the refactored API
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
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationWithMutuals[]>([]);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [
        requestsRes,       // Returns Promise<ConnectionRequest[]>
        connectionsRes,    // Returns Promise<Connection[]>
        blockedRes,        // Returns Promise<BlockedUser[]>
        sentRequestsRes,   // Returns Promise<ApiResponse<...>>
        recommendationsRes, // Returns Promise<ApiResponse<...>>
      ] = await Promise.all([
        getPendingRequests(),
        getMyConnections(),
        getBlockedUsers(),
        getSentPendingRequests(),
        getUserRecommendations(user.id),
      ]);

      // --- REFACTORED: Handle the new mixed response types ---
      
      // Functions that return data directly
      setRequests(requestsRes || []);
      setMyConnections(connectionsRes || []);
      setBlockedUsers(blockedRes || []);
      setRequestCount(requestsRes?.length || 0); 

      // Functions that still return an ApiResponse object
      if (sentRequestsRes.data) setSentRequests(sentRequestsRes.data);
      
      // Handle recommendations and their mutual connections
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

  // This handleAction function is robust and works with the refactored API
  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
        await action();
        toast({ title: "Success", description: successMessage });
        await fetchData(); // Re-fetch all data to ensure UI is consistent
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // These handlers correctly call the new standalone functions
  const handleSendRequest = (addresseeId: string) => handleAction(() => sendConnectionRequest(addresseeId), "Connection request sent.");
  const handleRespondRequest = async (requesterId: string, response: 'accepted' | 'ignored') => {
    // 1. Store rollback state
    const previousRequests = [...requests];

    // 2. Optimistic updates
    setRequestCount(prev => prev - 1);
    setRequests(prev => prev.filter(req => req.requester_id !== requesterId));
    
    try {
      // 3. API call
      await respondToRequest(requesterId, response);
      toast({ title: "Success", description: `Request ${response}.` });

      // 4. On success, fetch all data (good compromise)
      // This will correctly add the user to your "My Network" tab if accepted.
      await fetchData(); 

    } catch (error: any) {
      // 5. Rollback on failure
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setRequests(previousRequests);
      setRequestCount(prev => prev + 1);
    }
  };
  const handleRemoveConnection = (userId: string) => handleAction(() => removeConnection(userId), "Connection removed.");
  const handleWithdrawRequest = async (addresseeId: string) => {
    // 1. Store rollback state
    const previousSentRequests = [...sentRequests];

    // 2. Optimistic update
    setSentRequests(prev => prev.filter(req => req.addressee_id !== addresseeId));

    try {
      // 3. API call
      // We assume removeConnection handles deleting from the 'connection_requests' table
      // based on your original code.
      await removeConnection(addresseeId); 
      toast({ title: "Success", description: "Request withdrawn." });
    } catch (error: any) {
      // 4. Rollback
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSentRequests(previousSentRequests);
    }
  };
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
                    onWithdrawRequest={handleWithdrawRequest}  // Withdrawing is the same as removing a pending connection
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
