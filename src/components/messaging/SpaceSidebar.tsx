// src/components/messaging/SpaceSidebar.tsx

import React, { useMemo, useState, useEffect } from 'react'; // Added useState, useEffect
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, MessageSquare, Users, Hash } from 'lucide-react';
import { Space, getUserSpaces } from '@/integrations/supabase/community.api'; // Import getUserSpaces

// This component must now manage its own state and selection
interface SpaceSidebarProps {
  // You need to decide how to communicate the selection back to the parent page
  // This is a common pattern:
  onSpaceSelect: (spaceId: string) => void;
  initialSpaceId: string | null;
}

export const SpaceSidebar: React.FC<SpaceSidebarProps> = ({
  onSpaceSelect,
  initialSpaceId,
}) => {
  // --- Local State ---
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  // The activeSpaceId is now managed locally, controlled by the parent
  const activeSpaceId = initialSpaceId;

  // --- Data Fetching ---
  useEffect(() => {
    const fetchSpaces = async () => {
      setLoading(true);
      try {
        // Call the API to get the spaces for the sidebar
        const spacesData = await getUserSpaces();
        setSpaces(spacesData || []);
      } catch (error) {
        console.error("Failed to fetch user spaces:", error);
        setSpaces([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, []); // Runs once on component mount

  // 1. Prepare the final list of spaces for the sidebar
  const sidebarSpaces = useMemo(() => {
    // --- VIRTUAL PUBLIC SPACE ---
    // We manually add the "Public Threads" space.
    // We give it a special ID 'public' to handle selection.
    // The 'get_threads' function knows that a 'null' ID means public.
    const globalThreads: Space = {
      id: 'public', // Use a special string ID
      name: 'Public Threads',
      space_type: 'PUBLIC',
      creator_id: 'system',
      join_level: 'OPEN',
      created_at: new Date().toISOString(),
    } as Space; // Cast to satisfy type

    // Filter and sort the user's other spaces
    const userSpaces = spaces
      .filter((s) => s.space_type !== 'PUBLIC') // Filter out any real 'PUBLIC' spaces
      .sort((a, b) => a.name.localeCompare(b.name));

    return [globalThreads, ...userSpaces];
  }, [spaces]);

  // 2. Icon helper (Unchanged)
  const getIcon = (type: Space['space_type']) => {
    if (type === 'PUBLIC') return <Globe className="h-4 w-4" />;
    if (type === 'FORUM') return <MessageSquare className="h-4 w-4" />;
    return <Users className="h-4 w-4" />; // COMMUNITY_SPACE
  };

  // 3. Selection handler
  const handleSelectSpace = (spaceId: string) => {
    // This action now calls the prop to inform the parent page
    onSpaceSelect(spaceId);
  };

  if (loading) {
    // ... (loading skeleton return is unchanged)
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

  // ... (return render logic is unchanged)
  return (
    <div className="p-4 border-r h-full flex flex-col">
      <h2 className="font-bold text-xl mb-3 text-foreground">Spaces</h2>
      <nav className="flex flex-col gap-1 overflow-y-auto">
        {sidebarSpaces.map((space) => (
          <button
            key={space.id}
            onClick={() => handleSelectSpace(space.id)}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors duration-150 ${
              activeSpaceId === space.id
                ? 'bg-primary text-primary-foreground shadow-md font-semibold'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {getIcon(space.space_type)}
            <span className="truncate">{space.name}</span>
            {space.join_level === 'INVITE_ONLY' && (
              <Hash className="h-3 w-3 ml-auto opacity-70" title="Private" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
