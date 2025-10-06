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
    // The public space is defined by its type in the database
    return spaces.find(s => s.space_type === 'PUBLIC')?.id || null;
  }, [spaces]);
  
  // --- Data Fetching Logic ---
  const fetchSpaces = async () => {
    // 1. Handle unauthenticated user (show mock/empty state)
    if (!user) {
        // Only set spaces if they were empty, otherwise keep mock data visible
        setSpaces(prev => prev.length === 0 ? [] : prev); 
        setIsLoadingSpaces(false);
        return;
    }
    
    setIsLoadingSpaces(true);
    try {
      const [spacesData, threadsData] = await Promise.all([
          getUserSpaces(), // Fetch user's spaces (includes PUBLIC space via RLS)
          getPublicThreads() // Fetch public threads (globally)
      ]);
      
      setSpaces(spacesData);
      setPublicThreads(threadsData || []);
      
    } catch (error) {
      console.error("Failed to fetch user spaces or public threads:", error);
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
  
  /** * Checks if the current user is a member of a space.
   * This relies on RLS ensuring that `spaces` only contains spaces the user 
   * is authorized/membered in (or is PUBLIC/OPEN).
   */
  const isMemberOf = (spaceId: string): boolean => {
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
