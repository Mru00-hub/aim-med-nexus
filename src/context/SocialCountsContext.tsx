// src/context/SocialCountsContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPendingRequests, getUnreadInboxCount, getMyConnections, Connection} from '@/integrations/supabase/social.api';
import { getNotifications } from '@/integrations/supabase/notifications.api';

interface SocialCountsContextType {
  requestCount: number;
  unreadInboxCount: number;
  unreadNotifCount: number;
  setUnreadNotifCount: React.Dispatch<React.SetStateAction<number>>;
  setUnreadInboxCount: (count: number) => void;
  refetchNotifCount: () => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  getConnectionStatus: (userId: string) => 'connected' | 'pending_sent' | 'pending_received' | 'not_connected';
  refetchSocialGraph: () => Promise<void>;
}

const SocialCountsContext = createContext<SocialCountsContextType | undefined>(undefined);

export const SocialCountsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [followsSet, setFollowsSet] = useState(new Set<string>());
  const [connectionsMap, setConnectionsMap] = useState(new Map<string, 'connected' | 'pending_sent' | 'pending_received'>());

  const fetchUnreadNotifCount = useCallback(async () => {
    if (!user) return;
    try {
      // Fetches notifications
      const allNotifications = await getNotifications();
      setUnreadNotifCount(allNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, [user]);

  const fetchUnreadInboxCount = useCallback(async () => {
    if (!user) return;
    try {
      // Fetches unread direct messages
      const count = await getUnreadInboxCount();
      setUnreadInboxCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch unread inbox count:", error);
    }
  }, [user]);

  const fetchSocialGraph = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch follows and connections in parallel
      const [followsResult, connectionsResult] = await Promise.all([
        supabase
          .from('user_follows')
          .select('followed_id')
          .eq('follower_id', user.id),
        getMyConnections() // This RPC call gets all connection statuses
      ]);

      // Process follows
      if (followsResult.error) throw followsResult.error;
      const newFollowsSet = new Set(followsResult.data.map(f => f.followed_id));
      setFollowsSet(newFollowsSet);

      // Process connections
      const newConnectionsMap = new Map<string, 'connected' | 'pending_sent' | 'pending_received'>();
      let pendingRequestCount = 0;

      for (const conn of connectionsResult) {
        // The `Connection` type from `get_my_connections_with_status`
        // tells us the status relative to the *other* user.
        newConnectionsMap.set(conn.other_user_id, conn.status);
        if (conn.status === 'pending_received') {
          pendingRequestCount++;
        }
      }
      
      setConnectionsMap(newConnectionsMap);
      setRequestCount(pendingRequestCount); // Set the derived request count

    } catch (error) {
      console.error("Failed to fetch social graph:", error);
    }
  }, [user]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    // Optimistically decrement unread count
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Rollback optimistic update on failure
      setUnreadNotifCount(prev => prev + 1);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      // If user logs out, reset all counts to 0
      setRequestCount(0);
      setUnreadNotifCount(0);
      setUnreadInboxCount(0);
      setFollowsSet(new Set());
      setConnectionsMap(new Map());
      return;
    }

    // On login, fetch all counts once
    fetchSocialGraph(); 
    fetchUnreadNotifCount();
    fetchUnreadInboxCount();

    // --- Real-time Subscriptions ---

    // 1. Listen for notification changes
    const notifChannel = supabase.channel('social-counts-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadNotifCount()
      )
      .subscribe();

    // 2. Listen for connection request changes
    const socialChannel = supabase.channel('social-graph-connections')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_connections', filter: `or(requester_id.eq.${user.id},addressee_id.eq.${user.id})` },
        () => fetchSocialGraph() // Refetch the whole graph on any change
      )
      .subscribe();

    const followsChannel = supabase.channel('social-graph-follows')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_follows', filter: `follower_id.eq.${user.id}`},
        () => fetchSocialGraph() // Refetch the whole graph on any change
      )
      .subscribe();

    // 3. Listen for new direct messages
    const inboxChannel = supabase.channel(`social-counts-inbox-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${user.id}` },
        () => fetchUnreadInboxCount()
      )
      .subscribe();

    // Cleanup function to remove subscriptions on logout
    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(socialChannel);
      supabase.removeChannel(followsChannel); // <-- Add cleanup for new channel
      supabase.removeChannel(inboxChannel);
    };
  }, [user, fetchSocialGraph, fetchUnreadNotifCount, fetchUnreadInboxCount]);

  return (
    <SocialCountsContext.Provider
      value={{
        requestCount,
        unreadInboxCount,
        unreadNotifCount,
        setUnreadNotifCount,
        setUnreadInboxCount,
        refetchNotifCount: fetchUnreadNotifCount,
        markNotificationAsRead,
        refetchSocialGraph: fetchSocialGraph,
        isFollowing: (userId: string) => followsSet.has(userId),
        getConnectionStatus: (userId: string) => connectionsMap.get(userId) || 'not_connected',

        // --- Remove old/unused values ---
        // setRequestCount is no longer needed externally
        setRequestCount: () => {}, // Provide a dummy function to match type
        // refetchRequestCount is replaced by refetchSocialGraph
        refetchRequestCount: fetchSocialGraph,
      }}
    >
      {children}
    </SocialCountsContext.Provider>
  );
};

export const useSocialCounts = () => {
  const context = useContext(SocialCountsContext);
  if (context === undefined) {
    throw new Error('useSocialCounts must be used within a SocialCountsProvider');
  }
  return context;
};
