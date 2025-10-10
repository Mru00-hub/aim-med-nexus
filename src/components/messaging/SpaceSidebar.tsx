// src/components/messaging/SpaceSidebar.tsx
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, MessageSquare, Users, Hash } from 'lucide-react'; 

// Import the necessary components and types
import { useCommunity } from '@/context/CommunityContext';
import { Space } from '@/integrations/supabase/community.api';

// This component no longer needs props, as it controls the state via context
interface SpaceSidebarProps {} 

export const SpaceSidebar: React.FC<SpaceSidebarProps> = () => {
  const { 
    spaces, 
    publicSpaceId,
    isLoadingSpaces: loading, 
    selectSpace, 
    selectedSpace,
  } = useCommunity();

  const activeSpaceId = selectedSpace?.id || null;

  // 1. Prepare the final list of spaces for the sidebar
  const sidebarSpaces = useMemo(() => {
    
    // The public/global threads container (Always appears first)
    const globalThreads: Space[] = publicSpaceId 
        ? [{ 
            id: publicSpaceId, 
            name: 'Public Threads', 
            space_type: 'PUBLIC', 
            // We must provide default values for mandatory fields if not fetched with the ID
            creator_id: 'system',
            join_level: 'OPEN',
            created_at: new Date().toISOString()
        } as Space] // Cast as Space to satisfy the type
        : [];

    // Filter out the 'PUBLIC' space from the main list, as it's handled above.
    // Also, sort the spaces alphabetically.
    const userSpaces = spaces
        .filter(s => s.space_type !== 'PUBLIC')
        .sort((a, b) => a.name.localeCompare(b.name));

    // Combine Global Threads (top) with the user's Forums and Communities.
    return [...globalThreads, ...userSpaces];
    
  }, [spaces, publicSpaceId]);


  // 2. Icon helper
  const getIcon = (type: Space['space_type']) => {
    if (type === 'PUBLIC') return <Globe className="h-4 w-4" />;
    if (type === 'FORUM') return <MessageSquare className="h-4 w-4" />;
    return <Users className="h-4 w-4" />; // COMMUNITY_SPACE
  }
  
  // 3. Selection handler
  const handleSelectSpace = (spaceId: string) => {
    // This action updates the global state managed by the CommunityProvider
    selectSpace(spaceId); 
  };


  if (loading) {
    return (
        <div className="p-4 space-y-4">
            <h2 className="font-bold text-lg">Spaces</h2>
            <div className="p-2 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 border-r h-full flex flex-col">
      <h2 className="font-bold text-xl mb-3 text-foreground">Spaces</h2>
      <nav className="flex flex-col gap-1 overflow-y-auto">
        {sidebarSpaces.map((space) => (
          <button
            key={space.id}
            onClick={() => handleSelectSpace(space.id)}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors duration-150 ${activeSpaceId === space.id 
                ? 'bg-primary text-primary-foreground shadow-md font-semibold' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`
            }
          >
            {getIcon(space.space_type)}
            <span className="truncate">{space.name}</span>
            {/* Display an icon for private spaces */}
            {space.join_level === 'INVITE_ONLY' && (
                <Hash className="h-3 w-3 ml-auto opacity-70" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
