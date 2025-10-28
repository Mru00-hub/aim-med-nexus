// src/context/SocialCountsContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPendingRequests, getUnreadInboxCount } from '@/integrations/supabase/social.api';
import { getNotifications } from '@/integrations/supabase/notifications.api';

interface SocialCountsContextType {
  requestCount: number;
  setRequestCount: React.Dispatch<React.SetStateAction<number>>;
  unreadInboxCount: number;
  unreadNotifCount: number;
  setUnreadNotifCount: React.Dispatch<React.SetStateAction<number>>;
  setUnreadInboxCount: (count: number) => void;
  refetchNotifCount: () => void;
  refetchRequestCount: () => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

const SocialCountsContext = createContext<SocialCountsContextType | undefined>(undefined);

export const SocialCountsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      // Fetches connection requests
      const requests = await getPendingRequests();
      setRequestCount(requests.length || 0);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    }
  }, [user]);

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
      return;
    }

    // On login, fetch all counts once
    fetchPendingRequests();
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
    const socialChannel = supabase.channel('social-counts-connections')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections', filter: `addressee_id=eq.${user.id}` },
        () => fetchPendingRequests()
      )
      .subscribe();

    // 3. Listen for new direct messages
    const inboxChannel = supabase.channel(`social-counts-inbox-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          // Filter to only listen for messages sent *to* this user
          filter: `recipient_id=eq.${user.id}`
        },
        () => fetchUnreadInboxCount()
      )
      .subscribe();

    // Cleanup function to remove subscriptions on logout
    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(socialChannel);
      supabase.removeChannel(inboxChannel);
    };
  }, [user, fetchPendingRequests, fetchUnreadNotifCount, fetchUnreadInboxCount]);

  return (
    <SocialCountsContext.Provider
      value={{
        requestCount,
        setRequestCount,
        unreadInboxCount,
        unreadNotifCount,
        setUnreadNotifCount,
        setUnreadInboxCount,
        refetchNotifCount: fetchUnreadNotifCount,
        refetchRequestCount: fetchPendingRequests,
        markNotificationAsRead,
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
