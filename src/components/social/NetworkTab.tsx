import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserX, MessageSquare, Loader2, Check} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';
import { createOrGetConversation } from '@/integrations/supabase/social.api';
import { useToast } from '@/components/ui/use-toast';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { toggleFollow } from '@/integrations/supabase/community.api';
import { useAuth } from '@/hooks/useAuth';

// The props are passed correctly from FunctionalSocial.tsx
export const NetworkTab = ({ myConnections, loading, onRemoveConnection }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFollowing, refetchSocialGraph } = useSocialCounts();
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});

  const handleFollow = useCallback(async (userId: string) => {
    if (!user) return;
    setFollowLoadingMap(prev => ({ ...prev, [userId]: true }));
    try {
      await toggleFollow(userId);
      await refetchSocialGraph(); // Refresh global state
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  }, [user, refetchSocialGraph, toast]);

  const handleStartConversation = async (connection) => {
    toast({ title: "Opening conversation..." });
    try {
      const conversationId = await createOrGetConversation(connection.id);
      navigate('/inbox', {
        state: {
          conversationId: conversationId,
          participant: {
            id: connection.id,
            full_name: connection.full_name,
            profile_picture_url: connection.profile_picture_url,
          }
        }
      });
    } catch (error: any) {
      toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" });
    }
  };

  const filteredConnections = useMemo(() => {
    if (!searchTerm) return myConnections;
    return myConnections.filter(conn => conn.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [myConnections, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Connections</CardTitle>
        <div className="relative pt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter by name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
        {loading ? <Skeleton className="h-20 w-full" /> : filteredConnections.map(conn => (
          <UserActionCard
            key={conn.id}
            // --- REFACTORED: Use the new fields from get_my_connections() ---
            user={{
              id: conn.id,
              full_name: conn.full_name,
              profile_picture_url: conn.profile_picture_url,
              // Use current_position or specialization as the title
              title: conn.current_position || conn.specialization_name, 
              organization: conn.organization,
              location: conn.location_name // Use the new location_name field
            }}
          >
            <Button variant="ghost" size="icon" onClick={() => handleStartConversation(conn)}>
                <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onRemoveConnection(conn.id)}><UserX className="h-4 w-4 mr-2" />Remove</Button>
          </UserActionCard>
        ))}
      </CardContent>
    </Card>
  );
};
