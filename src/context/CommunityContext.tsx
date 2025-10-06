import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Assumed user authentication hook
import { useToast } from '@/components/ui/use-toast';
import { 
    getUserSpaces, 
    getPublicThreads, 
    Space, // The unified Space type
    ThreadWithDetails 
} from '@/integrations/supabase/community.api';

// --- Type Definitions for Context State ---

// The space_type enum is the source of truth for the type
type SpaceType = Space['space_type'];

interface CommunityContextType {
  // Data State
  spaces: Space[];
  publicThreads: ThreadWithDetails[];
  
  // UI/Flow State
  isLoadingSpaces: boolean;
  isInitialLoad: boolean;
  selectedSpace: Space | null; // The space currently active in the sidebar/view
  publicSpaceId: string | null; // The ID of the special 'PUBLIC' space
  
  // Actions
  fetchSpaces: () => Promise<void>;
  selectSpace: (spaceId: string | null) => void;
  // Utility for checking access
  isMemberOf: (spaceId: string) => boolean; 
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [publicThreads, setPublicThreads] = useState<ThreadWithDetails[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  // Derive the ID of the special public space once the data is loaded
  const publicSpaceId = useMemo(() => {
    return spaces.find(s => s.space_type === 'PUBLIC')?.id || null;
  }, [spaces]);
  
  // --- Data Fetching Logic ---
  const fetchSpaces = async () => {
    if (!user) {
        setSpaces(prev => prev.length === 0 ? [] : prev); // Don't wipe mock data if it exists
        setIsLoadingSpaces(false);
        return;
    }
    
    setIsLoadingSpaces(true);
    try {
      const spacesData = await getUserSpaces();
      setSpaces(spacesData);
      
      // Attempt to find the special Public Threads container and fetch its threads
      const publicId = spacesData.find(s => s.space_type === 'PUBLIC')?.id;
      if (publicId) {
        const threadsData = await getPublicThreads(publicId); // Assuming getPublicThreads now takes a spaceId argument for consistency
        setPublicThreads(threadsData || []);
      }
      
    } catch (error) {
      console.error("Failed to fetch user spaces and public threads:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load community data.' });
    } finally {
      setIsLoadingSpaces(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [user]); // Re-fetch when user logs in/out

  // --- Actions ---
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
  
  // Placeholder: In a real app, this logic would check the `memberships` table directly 
  // or rely on a user profile property. For now, we rely on the list of fetched spaces.
  const isMemberOf = (spaceId: string): boolean => {
      // If the user has the space in their list, they are a member (RLS guarantees this)
      return spaces.some(s => s.id === spaceId);
  }

  const contextValue = useMemo(() => ({
    spaces,
    publicThreads,
    isLoadingSpaces,
    isInitialLoad,
    selectedSpace,
    publicSpaceId,
    fetchSpaces,
    selectSpace,
    isMemberOf,
  }), [spaces, publicThreads, isLoadingSpaces, isInitialLoad, selectedSpace, publicSpaceId]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
};

// Custom hook for consuming the context
export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
