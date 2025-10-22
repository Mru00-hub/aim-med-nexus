import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPendingRequests, getUnreadInboxCount} from '@/integrations/supabase/social.api';
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
      const requests = await getPendingRequests();
      setRequestCount(requests.length || 0);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    }
  }, [user]);

  const fetchUnreadNotifCount = useCallback(async () => {
    if (!user) return;
    try {
      const allNotifications = await getNotifications();
      setUnreadNotifCount(allNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, [user]);

  const fetchUnreadInboxCount = useCallback(async () => {
    if (!user) return;
    try {
      // Calls your new, secure RPC function
      const count = await getUnreadInboxCount();
      setUnreadInboxCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch unread inbox count:", error);
    }
  }, [user]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    // Optimistically decrement unread count
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user!.id);
      // Can optionally refetch here or rely on subscriptions
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Rollback optimistic update on failure
      setUnreadNotifCount(prev => prev + 1);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRequestCount(0);
      setUnreadNotifCount(0);
      setUnreadInboxCount(0);
      return;
    }

    fetchPendingRequests();
    fetchUnreadNotifCount();
    fetchUnreadInboxCount();

    const notifChannel = supabase.channel('social-counts-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadNotifCount()
      )
      .subscribe();

    const socialChannel = supabase.channel('social-counts-connections')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections', filter: `addressee_id=eq.${user.id}` },
        () => fetchPendingRequests()
      )
      .subscribe();

    const inboxChannel = supabase.channel(`social-counts-inbox-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages' 
          // We refetch on *any* new message. Our RPC function
          // is secure and will correctly filter for *our* count.
        },
        () => fetchUnreadInboxCount()
      )
      .subscribe();

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
