// src/context/SocialCountsContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; // 1. Import useAuth
import { supabase } from '@/integrations/supabase/client'; // 2. Import supabase
import { getPendingRequests, getUnreadInboxCount } from '@/integrations/supabase/social.api'; // 3. Import fetchers
import { getNotifications } from '@/integrations/supabase/notifications.api'; // 3. Import fetchers

interface SocialCountsContextType {
  requestCount: number;
  unreadInboxCount: number;
  unreadNotifCount: number; // 4. Add notification count
  // Remove the setters, the provider will handle it
}

const SocialCountsContext = createContext<SocialCountsContextType | undefined>(undefined);

export const SocialCountsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get the current user
  const [requestCount, setRequestCount] = useState(0);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0); // 4. Add state

  // This one useEffect will manage all counts and real-time updates
  useEffect(() => {
    if (!user) {
      setRequestCount(0);
      setUnreadInboxCount(0);
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
    
    const fetchInboxCount = async () => {
      try {
        const count = await getUnreadInboxCount(); // Use the API function
        setUnreadInboxCount(count);
      } catch (error) { console.error("Failed to fetch inbox count:", error); }
    };

    // --- 2. Fetch Initial Data ---
    fetchPendingRequests();
    fetchUnreadNotifCount();
    fetchInboxCount();

    // --- 3. Set Up Realtime Subscriptions ---
    const notifChannel = supabase.channel('social-counts-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadNotifCount()
      ).subscribe();

    const socialChannel = supabase.channel('social-counts-connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections', filter: `addressee_id=eq.${user.id}` },
        () => fetchPendingRequests()
      ).subscribe();
      
    // Listen for inbox changes (new messages or marking as read)
    const inboxChannel = supabase.channel('social-counts-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_conversations', filter: `user_id=eq.${user.id}` },
        () => fetchInboxCount()
      ).subscribe();
      

    // --- 4. Cleanup ---
    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(socialChannel);
      supabase.removeChannel(inboxChannel);
    };

  }, [user]); // Re-run all logic when user changes

  return (
    <SocialCountsContext.Provider value={{ requestCount, unreadInboxCount, unreadNotifCount }}>
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
