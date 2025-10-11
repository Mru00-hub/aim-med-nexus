// src/context/CommunityContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
    getSpacesWithDetails, 
    getUserSpaces,
    getUserMemberships,
    getPublicThreads, // This is the important new one
    SpaceWithDetails,
    Space, 
    ThreadWithDetails,
    Membership,
    Enums,
} from '@/integrations/supabase/community.api';

// --- NEW, SIMPLIFIED INTERFACE ---
// This now only defines the truly GLOBAL state.
interface CommunityContextType {
  spaces: SpaceWithDetails[];
  memberships: Membership[];
  publicThreads: ThreadWithDetails[];
  isLoadingSpaces: boolean;
  fetchSpaces: () => Promise<void>;
  getMembershipStatus: (spaceId: string) => Enums<'membership_status'> | null;
  setMemberships: React.Dispatch<React.SetStateAction<Membership[]>>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // --- GLOBAL STATE VARIABLES ---
  const [spaces, setSpaces] = useState<SpaceWithDetails[]>([]); 
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [publicThreads, setPublicThreads] = useState<ThreadWithDetails[]>([]); 
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

  // This function now correctly fetches all necessary GLOBAL data.
  const fetchSpaces = useCallback(async () => {
    setIsLoadingSpaces(true);
    try {
      if (user) {
        // --- LOGGED-IN USER LOGIC ---
        const [spacesData, membershipsData, publicThreadsData] = await Promise.all([
            getSpacesWithDetails(),
            getUserMemberships(),
            getPublicThreads()
        ]);
        setSpaces(spacesData || []);
        setMemberships(membershipsData || []);
        setPublicThreads(publicThreadsData || []);
      } else {
        // --- LOGGED-OUT USER LOGIC ---
        // Fetch data using functions that return mocks
        const [mockSpacesData, mockThreadsData] = await Promise.all([
            getUserSpaces(), // This correctly returns MOCK_SPACES
            getPublicThreads() // This correctly returns MOCK_PUBLIC_THREADS
        ]);

        // IMPORTANT: Your mock data is of type `Space[]`, but your state is `SpaceWithDetails[]`.
        // We must map the mock data to match the expected type.
        const mappedMockSpaces: SpaceWithDetails[] = mockSpacesData.map(space => ({
          ...space,
          creator_full_name: 'Community Member', // Add placeholder data
          moderators: [], // Add placeholder data
        }));

        setSpaces(mappedMockSpaces);
        setPublicThreads(mockThreadsData || []);
        setMemberships([]); // Logged-out users have no memberships
      }
    } catch (error: any) {
      console.error("Failed to fetch community data:", error.message);
      // On any failure, clear the state to prevent showing stale data
      setSpaces([]);
      setMemberships([]);
      setPublicThreads([]);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [user]); // The function's logic depends on the user state

  // === CHANGE 2: THE MAIN useEffect TO TRIGGER FETCHING ===
  // This now correctly calls fetchSpaces on ANY change to the user object (login/logout)
  useEffect(() => {
    fetchSpaces();
  }, [user, fetchSpaces]);
    
  // This is a useful utility function that depends on global state.
  const getMembershipStatus = useCallback((spaceId: string): Enums<'membership_status'> | null => {
      const membership = memberships.find(m => m.space_id === spaceId);
      return membership ? membership.status : null;
  }, [memberships]);

  // --- FINAL, SIMPLIFIED VALUE ---
  // The context now only provides the global state and related functions.
  const contextValue = useMemo(() => ({
    spaces,
    memberships,
    publicThreads, 
    isLoadingSpaces,
    fetchSpaces,
    getMembershipStatus,
    setMemberships, 
  }), [spaces, memberships, publicThreads, isLoadingSpaces, fetchSpaces, getMembershipStatus]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
};

// This hook remains the same for easy consumption of the context.
export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
