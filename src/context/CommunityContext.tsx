// src/context/CommunityContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
    getUserSpaces, 
    getPublicThreads, 
    getUserMemberships,
    Space,
    ThreadWithDetails,
    Membership
} from '@/integrations/supabase/community.api';

interface CommunityContextType {
  spaces: Space[];
  publicThreads: ThreadWithDetails[];
  isLoadingSpaces: boolean;
  isInitialLoad: boolean;
  selectedSpace: Space | null;
  publicSpaceId: string | null;
  fetchSpaces: () => Promise<void>; // Kept for manual refreshing if needed
  selectSpace: (spaceId: string | null) => void;
  memberships: Membership[];
  isMemberOf: (spaceId: string) => boolean; 
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<MemberProfile[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [publicThreads, setPublicThreads] = useState<ThreadWithDetails[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  const publicSpaceId = useMemo(() => {
    return spaces.find(s => s.space_type === 'PUBLIC')?.id || null;
  }, [spaces]);
  
  // --- REVISED AND ROBUST DATA FETCHING LOGIC ---
  const fetchSpaces = async () => {
    // This function is now wrapped to ensure loading state is always handled.
    if (!user) {
      setSpaces([]);
      setPublicThreads([]);
      setIsLoadingSpaces(false);
      return;
    }

    setIsLoadingSpaces(true);
    try {
      const [spacesData, threadsData] = await Promise.all([
          getUserSpaces(),
          getPublicThreads(),
          getUserMemberships()
      ]);
      setSpaces(spacesData || []);
      setPublicThreads(threadsData || []);
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

  const selectSpace = (spaceId: string | null) => {
    if (!spaceId) {
        setSelectedSpace(null);
        return;
    }
    const space = spaces.find(s => s.id === spaceId);
    if (space) {
      setSelectedSpace(space);
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
  
  const isMemberOf = (spaceId: string): boolean => {
      // Check for an ACTIVE membership in the new memberships state
      return memberships.some(m => m.space_id === spaceId && m.status === 'ACTIVE');
  }

  const contextValue = useMemo(() => ({
    spaces,
    publicThreads,
    isLoadingSpaces,
    isInitialLoad,
    selectedSpace,
    publicSpaceId,
    fetchSpaces,
    spaceMembers,
    selectSpace,
    memberships,
    isLoadingMembers,
    isMemberOf,
  }), [spaces, publicThreads, isLoadingSpaces, isInitialLoad, selectedSpace, publicSpaceId, memberships]);

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
