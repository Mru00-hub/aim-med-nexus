// src/context/CommunityContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
    getSpacesWithDetails, 
    getUserMemberships,
    getPublicThreads, // This is the important new one
    SpaceWithDetails,
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
      // This logic now works for both logged-in and logged-out users.
      // Your API functions will return mock data if the user is logged out.
      const [spacesData, membershipsData, publicThreadsData] = await Promise.all([
          getSpacesWithDetails(),
          getUserMemberships(), // This will throw an error if not logged in, which we'll handle.
          getPublicThreads()
      ]);
    
      setSpaces(spacesData || []);
      setMemberships(membershipsData || []);
      setPublicThreads(publicThreadsData || []);

    } catch (error: any) {
      // If the user is logged out, getUserMemberships() will throw an error.
      // We catch it and set memberships to empty, which is correct for a logged-out user.
      console.log("Fetching data as a logged-out user or an error occurred:", error.message);
      setMemberships([]); // Ensure memberships are empty on error/logout.
    
      // We can still try to set mock data for spaces and threads on error
      if (!user) {
          // Your community.api.ts returns [] for getSpacesWithDetails on logout, let's use the other mock instead
          const [mockSpaces, mockThreads] = await Promise.all([
              getUserSpaces(), // This one has the MOCK_SPACES
              getPublicThreads()
          ]);
          setSpaces(mockSpaces || []);
          setPublicThreads(mockThreads || []);
      }

    } finally {
      setIsLoadingSpaces(false);
    }
  }, [user, toast]);

  // Initial data fetch on component mount.
  useEffect(() => {
    if (user) { // Only fetch if user is logged in
      fetchSpaces();
    } else {
      // Clear data on logout
      setSpaces([]);
      setMemberships([]);
      setPublicThreads([]);
      setIsLoadingSpaces(false);
    }
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
