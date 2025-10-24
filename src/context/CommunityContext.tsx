// src/context/CommunityContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getSpacesWithDetails, 
    getUserSpaces,
    getUserMemberships,
    PublicPost,
    SpaceWithDetails,
    ThreadWithDetails,
    Membership,
    Enums,
} from '@/integrations/supabase/community.api';

// --- MODIFIED INTERFACE ---
interface CommunityContextType {
  spaces: SpaceWithDetails[];
  memberships: Membership[];
  publicThreads: PublicPost[];
  isLoadingSpaces: boolean;
  refreshSpaces: () => Promise<void>; // <-- RENAMED for clarity
  updateLocalSpace: (updatedSpace: SpaceWithDetails) => void; // <-- ADDED for optimistic updates
  updateLocalPost: (
    updatedPost: Partial<PublicPost> & { thread_id: string }
  ) => void;
  getMembershipStatus: (spaceId: string) => Enums<'membership_status'> | null;
  setMemberships: React.Dispatch<React.SetStateAction<Membership[]>>;
  addOptimisticSpace: (space: SpaceWithDetails) => void;
  removeOptimisticSpace: (spaceId: string) => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [spaces, setSpaces] = useState<SpaceWithDetails[]>([]); 
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [publicThreads, setPublicThreads] = useState<PublicPost[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

  const addOptimisticSpace = useCallback((space: SpaceWithDetails) => {
    setSpaces(currentSpaces => [space, ...currentSpaces]);
  }, []);

  const removeOptimisticSpace = useCallback((spaceId: string) => {
    setSpaces(currentSpaces => currentSpaces.filter(s => s.id !== spaceId));
  }, []);

  // This function is now named `refreshSpaces` but its logic is the same
  const refreshSpaces = useCallback(async () => {
    console.log('--- refreshSpaces START ---');
    console.log('User object from useAuth:', user); // <-- LOG 1: What does useAuth think?
    setIsLoadingSpaces(true);
    try {
      // 1. Always fetch public spaces and threads.
      // These functions will return mock data if the user is logged out.
      const { data: { session } } = await supabase.auth.getSession();      
      console.log('Current session status:', session ? 'ACTIVE' : 'NULL');
      const [spacesData, publicThreadsData] = await Promise.all([
        getSpacesWithDetails(),
        getPublicThreads(),
      ]);

      console.log('Fetched spaces count:', spacesData?.length);
      console.log('Fetched threads count:', publicThreadsData?.length);

      setSpaces(spacesData || []);
      setPublicThreads(publicThreadsData || []);

      // 2. *Only* fetch memberships if the user is actually logged in.
      if (session) {
        console.log('Session is active, fetching memberships.');
        const membershipsData = await getUserMemberships();
        setMemberships(membershipsData || []);
      } else {
        // 3. If no session, ensure memberships are cleared.
        console.log('No session, clearing memberships.');
        setMemberships([]);
      }
      
    } catch (error: any) {
      // This catch block will now only trigger on a *real* network/API error,
      // not on a "logged out" error from getUserMemberships.
      console.error('--- REFRESH SPACES FAILED ---', error.message);
      setSpaces([]);
      setMemberships([]);
      setPublicThreads([]);
    } finally {
      setIsLoadingSpaces(false);
      console.log('--- refreshSpaces END ---');
    }
  }, [user]);

  // Initial data fetch on user change
  useEffect(() => {
    refreshSpaces();
  }, [user, refreshSpaces]);
  
  // --- NEW FUNCTION FOR OPTIMISTIC UPDATES ---
  // This function directly updates the local state for a single space.
  const updateLocalSpace = useCallback((updatedSpace: SpaceWithDetails) => {
    setSpaces(currentSpaces => 
      currentSpaces.map(s => s.id === updatedSpace.id ? updatedSpace : s)
    );
  }, []); // No dependencies needed as `setSpaces` is stable

  const updateLocalPost = useCallback(
    (updatedPost: Partial<PublicPost> & { thread_id: string }) => {
      setPublicThreads((currentThreads) =>
        currentThreads.map((t) =>
          t.thread_id === updatedPost.thread_id ? { ...t, ...updatedPost } : t
        )
      );
    },
    []
  );
    
  const getMembershipStatus = useCallback((spaceId: string): Enums<'membership_status'> | null => {
      const membership = memberships.find(m => m.space_id === spaceId);
      return membership ? membership.status : null;
  }, [memberships]);

  // --- MODIFIED VALUE ---
  const contextValue = useMemo(() => ({
    spaces,
    memberships,
    publicThreads, 
    isLoadingSpaces,
    refreshSpaces, // <-- EXPOSED as refreshSpaces
    updateLocalSpace, // <-- EXPOSED the new function
    updateLocalPost,
    getMembershipStatus,
    setMemberships, 
    addOptimisticSpace,
    removeOptimisticSpace,
  }), [spaces, memberships, publicThreads, isLoadingSpaces, refreshSpaces, updateLocalSpace, updateLocalPost, getMembershipStatus]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
