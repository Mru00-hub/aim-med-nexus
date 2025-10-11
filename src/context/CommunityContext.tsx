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
    if (!user) {
      setSpaces([]);
      setMemberships([]);
      setPublicThreads([]);
      setIsLoadingSpaces(false);
      return;
    }
    setIsLoadingSpaces(true);
    try {
      // Fetch all three global data sets at once.
      const [spacesData, membershipsData, publicThreadsData] = await Promise.all([
          getSpacesWithDetails(),
          getUserMemberships(),
          getPublicThreads()
      ]);
      setSpaces(spacesData || []);
      setMemberships(membershipsData || []);
      setPublicThreads(publicThreadsData || []);
    } catch (error: any) {
      console.error("Failed to fetch global community data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load community data.' });
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [user]);

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
