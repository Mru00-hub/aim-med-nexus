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
  const { refetchRequestCount, setRequestCount } = useSocialCounts();
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
    refetchRequestCount(); 
    
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

  // Enhanced handleAction with optimistic updates and rollback
  const handleAction = async (
    action: () => Promise<any>, 
    successMessage: string,
    optimisticUpdate?: () => void,
    rollback?: () => void
  ) => {
    // Apply optimistic update immediately
    if (optimisticUpdate) optimisticUpdate();
    
    try {
      await action();
      toast({ title: "Success", description: successMessage });
      await fetchData(); // Re-fetch to ensure consistency
    } catch (error: any) {
      // Rollback on error
      if (rollback) rollback();
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Optimistic handlers
  const handleSendRequest = (addresseeId: string) => {
    const previousSent = [...sentRequests];
    const previousRecommendations = [...recommendations];
    
    handleAction(
      () => sendConnectionRequest(addresseeId),
      "Connection request sent.",
      // Optimistic update
      () => {
        // Add to sent requests (create a temporary object)
        setSentRequests(prev => [...prev, { 
          id: `temp-${addresseeId}`, 
          requester_id: user!.id,
          addressee_id: addresseeId,
          created_at: new Date().toISOString(),
        } as SentRequest]);
        
        // Remove from recommendations
        setRecommendations(prev => prev.filter(rec => rec.id !== addresseeId));
      },
      // Rollback
      () => {
        setSentRequests(previousSent);
        setRecommendations(previousRecommendations);
      }
    );
  };

  const handleRespondRequest = (requesterId: string, response: 'accepted' | 'ignored') => {
    const previousRequests = [...requests];
    const previousConnections = [...myConnections];
    const requestToRespond = requests.find(r => r.requester_id === requesterId);
    
    handleAction(
      () => respondToRequest(requesterId, response),
      `Request ${response}.`,
      // Optimistic update
      () => {
        // Remove from requests
        setRequests(prev => prev.filter(r => r.requester_id !== requesterId));
        setRequestCount(prev => Math.max(0, prev - 1));
        
        // If accepted, add to connections
        if (response === 'accepted' && requestToRespond) {
          setMyConnections(prev => [...prev, {
            id: `temp-${requesterId}`,
            user_id: user!.id,
            connected_user_id: requesterId,
            created_at: new Date().toISOString(),
            requester: requestToRespond.requester,
            addressee: requestToRespond.addressee,
          } as Connection]);
        }
      },
      // Rollback
      () => {
        setRequests(previousRequests);
        setMyConnections(previousConnections);
        setRequestCount(prev => prev + 1);
      }
    );
  };

  const handleRemoveConnection = (userId: string) => {
    const previousConnections = [...myConnections];
    const previousSent = [...sentRequests];
    
    handleAction(
      () => removeConnection(userId),
      "Connection removed.",
      // Optimistic update
      () => {
        setMyConnections(prev => prev.filter(c => c.connected_user_id !== userId));
        setSentRequests(prev => prev.filter(s => s.addressee_id !== userId));
      },
      // Rollback
      () => {
        setMyConnections(previousConnections);
        setSentRequests(previousSent);
      }
    );
  };

  const handleBlockUser = (userId: string) => {
    const previousBlocked = [...blockedUsers];
    const previousRequests = [...requests];
    const previousConnections = [...myConnections];
    const previousRecommendations = [...recommendations];
    const previousSent = [...sentRequests];
    
    handleAction(
      () => blockUser(userId),
      "User has been blocked.",
      // Optimistic update
      () => {
        // Add to blocked (create temporary object)
        setBlockedUsers(prev => [...prev, {
          id: `temp-${userId}`,
          blocker_id: user!.id,
          blocked_id: userId,
          created_at: new Date().toISOString(),
          blocked_user: { id: userId, full_name: '', avatar_url: null } as any,
        } as BlockedUser]);
        
        // Remove from all other lists
        setRequests(prev => prev.filter(r => r.requester_id !== userId));
        setMyConnections(prev => prev.filter(c => c.connected_user_id !== userId));
        setRecommendations(prev => prev.filter(rec => rec.id !== userId));
        setSentRequests(prev => prev.filter(s => s.addressee_id !== userId));
        setRequestCount(prev => Math.max(0, prev - 1));
      },
      // Rollback
      () => {
        setBlockedUsers(previousBlocked);
        setRequests(previousRequests);
        setMyConnections(previousConnections);
        setRecommendations(previousRecommendations);
        setSentRequests(previousSent);
      }
    );
  };

  const handleUnblockUser = (userId: string) => {
    const previousBlocked = [...blockedUsers];
    
    handleAction(
      () => unblockUser(userId),
      "User has been unblocked.",
      // Optimistic update
      () => {
        setBlockedUsers(prev => prev.filter(b => b.blocked_id !== userId));
      },
      // Rollback
      () => {
        setBlockedUsers(previousBlocked);
      }
    );
  };
  
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
                    onWithdrawRequest={handleRemoveConnection}
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
