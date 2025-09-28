// src/components/messaging/SpaceSidebar.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, MessageSquare, Users } from 'lucide-react'; // Icons for clarity

// Define a type for what a "space" can be
export type Space = 
  | { type: 'GLOBAL'; id: 'global'; name: string }
  | { type: 'FORUM'; id: string; name: string }
  | { type: 'COMMUNITY_SPACE'; id: string; name: string };

interface SpaceSidebarProps {
  onSelectSpace: (space: Space) => void;
  activeSpaceId: string | null;
}

export const SpaceSidebar = ({ onSelectSpace, activeSpaceId }: SpaceSidebarProps) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaces = async () => {
      // In a real app, you'd fetch forums/communities the user has joined.
      // For now, we'll mock this data plus the Global space.
      const userSpaces: Space[] = [
        { type: 'GLOBAL', id: 'global', name: 'Global Threads' },
        // Example Forum:
        { type: 'FORUM', id: '8a1b2c3d-....', name: 'Photography Club' } 
      ];
      setSpaces(userSpaces);
      setLoading(false);
    };
    fetchSpaces();
  }, []);

  if (loading) {
    return <div className="p-2 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>;
  }

  const getIcon = (type: Space['type']) => {
    if (type === 'GLOBAL') return <Globe className="h-4 w-4" />;
    if (type === 'FORUM') return <MessageSquare className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  }

  return (
    <div className="p-2">
      <h2 className="font-bold text-lg p-2">Spaces</h2>
      <nav className="flex flex-col gap-1">
        {spaces.map((space) => (
          <button
            key={space.id}
            onClick={() => onSelectSpace(space)}
            className={`flex items-center gap-2 p-2 rounded-md text-sm hover:bg-muted ${activeSpaceId === space.id ? 'bg-muted font-semibold' : ''}`}
          >
            {getIcon(space.type)}
            {space.name}
          </button>
        ))}
      </nav>
    </div>
  );
};
