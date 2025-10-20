// src/context/SocialCountsContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPendingRequests } from '@/integrations/supabase/social.api';
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

  useEffect(() => {
    if (!user) {
      setRequestCount(0);
      setUnreadNotifCount(0);
      return;
    }

    fetchPendingRequests();
    fetchUnreadNotifCount();

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

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(socialChannel);
    };
  }, [user, fetchPendingRequests, fetchUnreadNotifCount]);

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
