// src/context/CommunityContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
    getUserSpaces, 
    getUserMemberships,
    getSpaceDetails,
    getThreadsForSpace,
    getSpaceMemberList,
    getSpaceMemberCount,    // <-- ADDED IMPORT
    getThreadsCountForSpace, // <-- ADDED IMPORT
    Space,
    ThreadWithDetails,
    Membership,
    MemberProfile 
} from '@/integrations/supabase/community.api';

interface CommunityContextType {
  spaces: Space[]; // The master list of discoverable spaces
  memberships: Membership[]; // The user's actual memberships
  isLoadingSpaces: boolean;
  
  // New state for the currently viewed space
  selectedSpace: Space | null;
  selectedSpaceThreads: ThreadWithDetails[];
  selectedSpaceMembers: MemberProfile[];
  selectedSpaceMemberCount: number | null; // <-- ADDED
  selectedSpaceThreadCount: number | null; // <-- ADDED
  isLoadingSelectedSpace: boolean;

  // Actions
  fetchSpaces: () => Promise<void>;
  selectSpace: (spaceId: string | null) => Promise<void>; // Now async!
  refreshSelectedSpace: () => Promise<void>;
  isMemberOf: (spaceId: string) => boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Master lists
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

  // State for the single space being viewed
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedSpaceThreads, setSelectedSpaceThreads] = useState<ThreadWithDetails[]>([]);
  const [selectedSpaceMembers, setSelectedSpaceMembers] = useState<MemberProfile[]>([]);
  const [selectedSpaceMemberCount, setSelectedSpaceMemberCount] = useState<number | null>(null); // <-- ADDED
  const [selectedSpaceThreadCount, setSelectedSpaceThreadCount] = useState<number | null>(null); // <-- ADDED
  const [isLoadingSelectedSpace, setIsLoadingSelectedSpace] = useState(false);

  // Fetch the master lists (this part is largely the same)
  const fetchSpaces = async () => {
    if (!user) {
      setSpaces([]);
      setMemberships([]);
      setIsLoadingSpaces(false);
      return;
    }
    setIsLoadingSpaces(true);
    try {
      const [spacesData, membershipsData] = await Promise.all([
          getUserSpaces(),
          getUserMemberships()
      ]);
      setSpaces(spacesData || []);
      setMemberships(membershipsData || []);
    } catch (error: any) {
      console.error("Failed to fetch user spaces or public threads:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load community data.' });
    } finally {
      setIsLoadingSpaces(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    // The effect now directly calls fetchSpaces when the user's status changes.
    // This is a more stable and predictable pattern.
    fetchSpaces();
  }, [user]); // This effect correctly re-runs when the user logs in or out.

  const selectSpace = async (spaceId: string | null) => {
    if (!spaceId) {
      setSelectedSpace(null);
      return;
    }
    setIsLoadingSelectedSpace(true);
    try {
      // Fetch everything for the selected space in parallel
      const [spaceDetails, threads, members] = await Promise.all([
        getSpaceDetails(spaceId),
        getThreadsForSpace(spaceId),
        getSpaceMemberList(spaceId),
        getSpaceMemberCount(spaceId),    // <-- ADDED API CALL
        getThreadsCountForSpace(spaceId) // <-- ADDED API CALL
      ]);

      if (!spaceDetails) throw new Error("Space not found.");

      setSelectedSpace(spaceDetails);
      setSelectedSpaceThreads(threads);
      setSelectedSpaceMembers(members);
      setSelectedSpaceMemberCount(memberCount); // <-- SET STATE
      setSelectedSpaceThreadCount(threadCount); // <-- SET STATE

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to load space: ${error.message}` });
      setSelectedSpace(null); // Clear on error
    } finally {
      setIsLoadingSelectedSpace(false);
    }
  };

  const fetchSpaceMembers = async (spaceId: string) => {
    setIsLoadingMembers(true);
    try {
      const members = await getSpaceMemberList(spaceId); // Function from community.api.ts
      setSpaceMembers(members);
    } catch (error) {
      // Handle error with a toast...
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const refreshSelectedSpace = useCallback(async () => {
    if (selectedSpace?.id) {
      // It simply re-runs the selectSpace logic for the current space
      await selectSpace(selectedSpace.id);
    }
  }, [selectedSpace, selectSpace]);
    
  const isMemberOf = (spaceId: string): boolean => {
      return memberships.some(m => m.space_id === spaceId && m.status === 'ACTIVE');
  }

  const contextValue = useMemo(() => ({
    spaces,
    memberships,
    isLoadingSpaces,
    selectedSpace,
    selectedSpaceThreads,
    selectedSpaceMembers,
    isLoadingSelectedSpace,
    fetchSpaces,
    selectSpace,
    refreshSelectedSpace,
    isMemberOf,
  }), [spaces, memberships, isLoadingSpaces, selectedSpace, selectedSpaceThreads, selectedSpaceMembers, selectedSpaceMemberCount, selectedSpaceThreadCount, isLoadingSelectedSpace, fetchSpaces, selectSpace, refreshSelectedSpace, isMemberOf]);

  console.log('[CommunityContext] Providing value:', contextValue);
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
