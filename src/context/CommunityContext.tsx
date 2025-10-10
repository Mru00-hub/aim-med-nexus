// src/context/CommunityContext.tsx

// src/context/CommunityContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
    getUserSpaces, 
    getUserMemberships,
    getSpaceDetails,
    getThreadsForSpace,
    getSpaceMemberList,
    getSpaceMemberCount,
    getThreadsCountForSpace,
    Space,
    ThreadWithDetails,
    Membership,
    MemberProfile 
} from '@/integrations/supabase/community.api';

interface CommunityContextType {
  spaces: Space[];
  memberships: Membership[];
  isLoadingSpaces: boolean;
  
  selectedSpace: Space | null;
  selectedSpaceThreads: ThreadWithDetails[];
  selectedSpaceMembers: MemberProfile[];
  selectedSpaceMemberCount: number | null;
  selectedSpaceThreadCount: number | null;
  isLoadingSelectedSpace: boolean;

  fetchSpaces: () => Promise<void>;
  selectSpace: (spaceId: string | null) => Promise<void>;
  refreshSelectedSpace: () => Promise<void>;
  isMemberOf: (spaceId: string) => boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedSpaceThreads, setSelectedSpaceThreads] = useState<ThreadWithDetails[]>([]);
  const [selectedSpaceMembers, setSelectedSpaceMembers] = useState<MemberProfile[]>([]);
  const [selectedSpaceMemberCount, setSelectedSpaceMemberCount] = useState<number | null>(null);
  const [selectedSpaceThreadCount, setSelectedSpaceThreadCount] = useState<number | null>(null);
  const [isLoadingSelectedSpace, setIsLoadingSelectedSpace] = useState(false);
  const [publicThreads, setPublicThreads] = useState<ThreadWithDetails[]>([]); 

  const fetchSpaces = useCallback(async () => {
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
          getUserMemberships(),
          getPublicThreads()
      ]);
      setSpaces(spacesData || []);
      setMemberships(membershipsData || []);
      setPublicThreads(publicThreadsData || []);
    } catch (error: any) {
      console.error("Failed to fetch user spaces or public threads:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load community data.' });
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const selectSpace = useCallback(async (spaceId: string | null) => {
    if (!spaceId) {
      setSelectedSpace(null);
      setSelectedSpaceThreads([]);
      setSelectedSpaceMembers([]);
      setSelectedSpaceMemberCount(null);
      setSelectedSpaceThreadCount(null);
      return;
    }
    setIsLoadingSelectedSpace(true);
    try {
      const [spaceDetails, threads, members, memberCount, threadCount] = await Promise.all([
        getSpaceDetails(spaceId),
        getThreadsForSpace(spaceId),
        getSpaceMemberList(spaceId),
        getSpaceMemberCount(spaceId),
        getThreadsCountForSpace(spaceId)
      ]);

      if (!spaceDetails) throw new Error("Space not found.");

      setSelectedSpace(spaceDetails);
      setSelectedSpaceThreads(threads);
      setSelectedSpaceMembers(members);
      setSelectedSpaceMemberCount(memberCount);
      setSelectedSpaceThreadCount(threadCount);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to load space: ${error.message}` });
      setSelectedSpace(null);
    } finally {
      setIsLoadingSelectedSpace(false);
    }
  }, [toast]);

  const refreshSelectedSpace = useCallback(async () => {
    if (selectedSpace?.id) {
      await selectSpace(selectedSpace.id);
    }
  }, [selectedSpace, selectSpace]);
    
  const isMemberOf = useCallback((spaceId: string): boolean => {
      return memberships.some(m => m.space_id === spaceId && m.status === 'ACTIVE');
  }, [memberships]); // <-- THIS IS THE FIX

  const contextValue = useMemo(() => ({
    spaces,
    memberships,
    publicThreads, 
    isLoadingSpaces,
    selectedSpace,
    selectedSpaceThreads,
    selectedSpaceMembers,
    selectedSpaceMemberCount,
    selectedSpaceThreadCount,
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
