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
} from '@/integrations/supabase/community.api';

// --- NEW, SIMPLIFIED INTERFACE ---
// This now only defines the truly GLOBAL state.
interface CommunityContextType {
  spaces: SpaceWithDetails[];
  memberships: Membership[];
  publicThreads: ThreadWithDetails[];
  isLoadingSpaces: boolean;
  fetchSpaces: () => Promise<void>;
  isMemberOf: (spaceId: string) => boolean;
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
    fetchSpaces();
  }, [fetchSpaces]);

  // This is a useful utility function that depends on global state.
  const isMemberOf = useCallback((spaceId: string): boolean => {
      return memberships.some(m => m.space_id === spaceId && m.status === 'ACTIVE');
  }, [memberships]);

  // --- FINAL, SIMPLIFIED VALUE ---
  // The context now only provides the global state and related functions.
  const contextValue = useMemo(() => ({
    spaces,
    memberships,
    publicThreads, 
    isLoadingSpaces,
    fetchSpaces,
    isMemberOf,
  }), [spaces, memberships, publicThreads, isLoadingSpaces, fetchSpaces, isMemberOf]);

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
