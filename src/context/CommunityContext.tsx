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
    setIsLoadingSpaces(true);
    try {
      if (user) {
        const [spacesData, membershipsData, publicThreadsData] = await Promise.all([
            getSpacesWithDetails(),
            getUserMemberships(),
            getPublicThreads()
        ]);
        setSpaces(spacesData || []);
        setMemberships(membershipsData || []);
        setPublicThreads(publicThreadsData || []);
      } else {
        const [mockSpacesData, mockThreadsData] = await Promise.all([
            getUserSpaces(),
            getPublicThreads()
        ]);

        const mappedMockSpaces: SpaceWithDetails[] = mockSpacesData.map(space => ({
          ...space,
          creator_full_name: 'Community Member',
          moderators: [],
          creator_position: null,
          creator_organization: null,
          creator_specialization: null,
        }));

        setSpaces(mappedMockSpaces);
        setPublicThreads(mockThreadsData || []);
        setMemberships([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch community data:", error.message);
      setSpaces([]);
      setMemberships([]);
      setPublicThreads([]);
    } finally {
      setIsLoadingSpaces(false);
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
