import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { UserActionCard } from '@/components/social/UserActionCard'; // Adjust path if needed
import { Button } from '@/components/ui/button';
import {
  sendConnectionRequest,
  createOrGetConversation,
  toggleFollow,
} from '@/integrations/supabase/social.api';
import { toggleFollow, ProfileWithStatus } from '@/integrations/supabase/community.api'; 
import { MessageSquare, UserCheck, UserPlus, X, Loader2, Check } from 'lucide-react'; 
import { useSocialCounts } from '@/context/SocialCountsContext';

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
  const { isFollowing, getConnectionStatus, refetchSocialGraph } = useSocialCounts();

  // Normalize the user object
  const normalizedUser = {
    id: user.id,
    full_name: user.full_name,
    profile_picture_url: user.profile_picture_url,
    title: user.current_position,
    organization: user.organization,
    location: user.location_name,
  };

  const liveConnectionStatus = getConnectionStatus(normalizedUser.id);
  const liveIsFollowing = isFollowing(normalizedUser.id);

  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);

  const isOwnCard = viewer?.id === normalizedUser.id;

  const handleFollow = async () => {
    if (!viewer) return toast({ title: 'Please log in', variant: 'destructive' });

    setIsFollowLoading(true);
    try {
      await toggleFollow(normalizedUser.id);
      await refetchSocialGraph(); // Refresh the global state
      toast({ title: liveIsFollowing ? 'Unfollowed' : 'Followed' }); // Toast based on *old* state
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const conversationId = await createOrGetConversation(normalizedUser.id);
      navigate(`/inbox?convo=${conversationId}`); 
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
      await refetchSocialGraph(); // Refresh the global state
      toast({ title: 'Connection request sent!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsConnectionLoading(false);
    }
  };

  // --- Button Rendering ---

  const renderButtons = () => {

    if (isOwnCard) {
      return (
        <Button size="sm" asChild variant="outline">
          <Link to="/profile/edit">Edit Profile</Link>
        </Button>
      );
    }

    let connectButton;
    switch (liveConnectionStatus) {
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
            <Link to="/social">Respond</Link>
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
          variant={liveIsFollowing ? "outline" : "ghost"} // Change variant based on state
          onClick={handleFollow}
          disabled={isFollowLoading}
          className="w-[100px]" // Give it a fixed width to prevent layout shift
        >
          {isFollowLoading ? (
             <Loader2 className="h-4 w-4 animate-spin" />
          ) : liveIsFollowing ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Following
            </>
          ) : (
            'Follow'
          )}
        </Button>
      </>
    );
  };

  return (
    <UserActionCard user={normalizedUser}>{renderButtons()}</UserActionCard>
  );
};
