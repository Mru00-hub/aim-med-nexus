// src/context/SocialCountsContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getPendingRequests } from '@/integrations/supabase/social.api'; // 1. REMOVE getUnreadInboxCount
import { getNotifications } from '@/integrations/supabase/notifications.api';

interface SocialCountsContextType {
  requestCount: number;
  unreadInboxCount: number;
  unreadNotifCount: number;
  setUnreadInboxCount: (count: number) => void; // 2. ADD setter for inbox back
}

const SocialCountsContext = createContext<SocialCountsContextType | undefined>(undefined);

export const SocialCountsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0); // This will be set from Header
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // This useEffect now *only* manages Social and Notifications
  useEffect(() => {
    if (!user) {
      setRequestCount(0);
      setUnreadNotifCount(0);
      return;
    }

    // --- 1. Define Fetching Functions ---
    const fetchPendingRequests = async () => {
      try {
        const requests = await getPendingRequests();
        setRequestCount(requests.length || 0);
      } catch (error) { console.error("Failed to fetch pending requests:", error); }
    };

    const fetchUnreadNotifCount = async () => {
      try {
        const allNotifications = await getNotifications();
        setUnreadNotifCount(allNotifications.filter(n => !n.is_read).length);
      } catch (error) { console.error("Failed to fetch notification count:", error); }
    };
    
    // --- 2. Fetch Initial Data ---
    fetchPendingRequests();
    fetchUnreadNotifCount();
    // 3. REMOVE fetchInboxCount()

    // --- 3. Set Up Realtime Subscriptions ---
    const notifChannel = supabase.channel('social-counts-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadNotifCount()
      ).subscribe();

    const socialChannel = supabase.channel('social-counts-connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections', filter: `addressee_id=eq.${user.id}` },
        () => fetchPendingRequests()
      ).subscribe();
      
    // 4. REMOVE inboxChannel

    // --- 4. Cleanup ---
    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(socialChannel);
      // 5. REMOVE inboxChannel cleanup
    };

  }, [user]);

  return (
    <SocialCountsContext.Provider 
      value={{ 
        requestCount, 
        unreadInboxCount, 
        unreadNotifCount, 
        setUnreadInboxCount // 6. Pass the setter
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
