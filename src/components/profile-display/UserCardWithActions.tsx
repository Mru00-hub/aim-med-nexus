import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { UserActionCard } from '@/components/social/UserActionCard'; // Adjust path if needed
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getConnectionStatus,
  sendConnectionRequest,
  createOrGetConversation,
} from '@/integrations/supabase/social.api';
import { toggleFollow } from '@/integrations/supabase/community.api';
import { MessageSquare, UserCheck, UserPlus, X } from 'lucide-react';

// A generic user type to normalize data from different API endpoints
interface CardUser {
  id: string;
  full_name: string;
  profile_picture_url?: string | null;
  title?: string | null;
  organization?: string | null;
  location?: string | null;
  mutuals?: any[];
  similarity_score?: number | null;
}

interface UserCardWithActionsProps {
  user: any; // User object from getFollowers, getFollowing, etc.
}

export const UserCardWithActions = ({ user }: UserCardWithActionsProps) => {
  const { user: viewer } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Normalize the user object
  const normalizedUser: CardUser = {
    id: user.id || user.user_id, // Handles both Profile and Connection types
    full_name: user.full_name,
    profile_picture_url: user.profile_picture_url,
    title: user.current_position || user.title,
    organization: user.organization,
    location: user.location_name || user.location,
    mutuals: user.mutuals,
    similarity_score: user.similarity_score,
  };

  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'pending_sent' | 'pending_received' | 'not_connected'
  >('not_connected');
  
  // Note: We cannot get follow status for each user without N+1 queries
  // The provided APIs (getFollowers, etc.) do not return this.
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const isOwnCard = viewer?.id === normalizedUser.id;

  useEffect(() => {
    if (isOwnCard) {
      setIsStatusLoading(false);
      return;
    }

    let isMounted = true;
    const fetchStatus = async () => {
      setIsStatusLoading(true);
      try {
        const status = await getConnectionStatus(normalizedUser.id);
        if (isMounted) {
          setConnectionStatus(status);
        }
      } catch (e) {
        console.error('Failed to get connection status for user card', e);
      } finally {
        if (isMounted) {
          setIsStatusLoading(false);
        }
      }
    };

    fetchStatus();
    
    return () => { isMounted = false; };
  }, [normalizedUser.id, isOwnCard]);

  // --- Action Handlers ---

  const handleFollow = async () => {
    if (!viewer) return toast({ title: 'Please log in', variant: 'destructive' });

    setIsFollowLoading(true);
    try {
      await toggleFollow(normalizedUser.id);
      // We can't be specific (Followed/Unfollowed) as we don't know the initial state
      toast({ title: 'Follow status toggled' }); 
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const conversationId = await createOrGetConversation(normalizedUser.id);
      navigate(`/messages/${conversationId}`);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not start conversation: ${e.message}`,
      });
    }
  };

  const handleConnect = async () => {
    setIsConnectionLoading(true);
    try {
      await sendConnectionRequest(normalizedUser.id);
      setConnectionStatus('pending_sent'); // Optimistic update
      toast({ title: 'Connection request sent!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsConnectionLoading(false);
    }
  };

  // --- Button Rendering ---

  const renderButtons = () => {
    if (isStatusLoading) {
      return <Skeleton className="h-9 w-28" />;
    }

    if (isOwnCard) {
      return (
        <Button size="sm" asChild variant="outline">
          <Link to="/profile/edit">Edit Profile</Link>
        </Button>
      );
    }

    let connectButton;
    switch (connectionStatus) {
      case 'connected':
        connectButton = (
          <Button size="sm" variant="outline" onClick={handleMessage}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        );
        break;
      case 'pending_sent':
        connectButton = (
          <Button size="sm" variant="outline" disabled>
            Pending
          </Button>
        );
        break;
      case 'pending_received':
        connectButton = (
          <Button size="sm" asChild>
            <Link to="/connections">Respond</Link>
          </Button>
        );
        break;
      case 'not_connected':
      default:
        connectButton = (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isConnectionLoading}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        );
    }

    return (
      <>
        {connectButton}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleFollow}
          disabled={isFollowLoading}
        >
          {/* We just use a generic 'Follow' as we don't know the state */}
          Follow
        </Button>
      </>
    );
  };

  return (
    <UserActionCard user={normalizedUser}>{renderButtons()}</UserActionCard>
  );
};
