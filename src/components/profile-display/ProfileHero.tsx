import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FullProfile } from '@/integrations/supabase/community.api';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, CheckCircle, Loader2, UserPlus, UserCheck, Send, Clock, Share2, Users, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { useToast } from '@/components/ui/use-toast';
import { sendConnectionRequest, createOrGetConversation } from '@/integrations/supabase/social.api';
import { toggleFollow } from '@/integrations/supabase/community.api';

type ProfileHeroProps = {
  data: FullProfile;
  isOwnProfile: boolean;
  connectionStatus: 'connected' | 'pending_sent' | 'pending_received' | 'not_connected';
  isFollowLoading: boolean;
  isConnectionLoading: boolean;
  onFollow: () => void;
  onConnect: () => void;
  onMessage: () => void;
  onShare: () => void;
  onShowList: (title: 'Followers' | 'Following' | 'Connections') => void;
};

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  data,
  isOwnProfile,
  connectionStatus: staleConnectionStatus,
  isFollowLoading: staleFollowLoading,
  isConnectionLoading: staleConnectionLoading,
  onFollow: staleOnFollow,
  onConnect: staleOnConnect,
  onMessage: staleOnMessage,
  onShare,
  onShowList,
}) => {
  const { user } = useAuth();
  const { profile, followers_count, following_count, connection_count, analytics } = data;
  const targetUserId = profile.id;

  const { isFollowing, getConnectionStatus, refetchSocialGraph } = useSocialCounts();
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- 6. Create NEW internal loading state ---
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);

  // --- 7. Get REAL-TIME status from context ---
  const liveIsFollowing = isFollowing(targetUserId);
  const liveConnectionStatus = getConnectionStatus(targetUserId);

  // 🚀 PLAN: Create the non-clinical headline
  const getHeadline = () => {
    if (profile.profile_mode === 'non_clinical') {
      const parts = [];
      if (data.career_transition?.target_industries?.[0]) {
        parts.push(data.career_transition.target_industries[0]);
      } else if (data.ventures[0]?.role) {
        parts.push(data.ventures[0].role);
      }
      if (data.content_portfolio[0]?.content_type) {
        parts.push(data.content_portfolio[0].content_type);
      }
      if (profile.current_position) {
        parts.push(`Former ${profile.specialization || profile.current_position}`);
      }
      return parts.slice(0, 3).join(' | ');
    }
    // Clinical Headline
    return `${profile.current_position || ''}${profile.current_position && profile.organization ? ' @ ' : ''}${profile.organization || ''}`;
  };
  
  const headline = getHeadline();

  const handleFollow = async () => {
    setIsFollowLoading(true);
    try {
      await toggleFollow(targetUserId);
      await refetchSocialGraph(); // Refresh the global state
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsFollowLoading(false);
  };

  const handleConnect = async () => {
    setIsConnectionLoading(true);
    try {
      await sendConnectionRequest(targetUserId);
      await refetchSocialGraph(); // Refresh the global state
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsConnectionLoading(false);
  };

  const handleMessage = async () => {
    try {
      const conversationId = await createOrGetConversation(targetUserId);
      navigate(`/inbox?convo=${conversationId}`);
    } catch (error: any) {
      toast({ title: "Error", description: `Could not start conversation: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    // --- Added overflow-hidden to prevent glitches ---
    <CardHeader className="p-0 overflow-hidden"> 
      <div className="h-32 sm:h-40 bg-gradient-to-r from-primary/20 to-accent/20" />
      
      {/* --- Added relative positioning here --- */}
      <div className="relative p-4 sm:p-6"> 
        {/* --- Moved negative margin directly to the Avatar --- */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
           <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-background shadow-lg bg-background -mt-16 sm:-mt-20 flex-shrink-0"> 
            <AvatarImage src={profile.profile_picture_url || undefined} alt={profile.full_name || ''} />
            <AvatarFallback className="text-5xl">
              {profile.full_name?.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          {/* --- Removed negative margin logic from here, adjusted padding --- */}
          <div className="flex-grow mt-4 sm:mt-0 sm:pb-2"> 
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {profile.full_name}
              </h1>
              {profile.is_verified && (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" title="Verified Profile" />
              )}
            </div>
            <p className="text-base sm:text-lg text-muted-foreground mt-1 capitalize">
              {headline}
            </p>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-3">
              <button onClick={() => onShowList('Connections')} className="hover:underline">
                <span className="font-semibold text-foreground">{connection_count}</span> Connections
              </button>
              <button onClick={() => onShowList('Followers')} className="hover:underline">
                <span className="font-semibold text-foreground">{followers_count}</span> Followers
              </button>
              <button onClick={() => onShowList('Following')} className="hover:underline">
                <span className="font-semibold text-foreground">{following_count}</span> Following
              </button>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span><span className="font-semibold text-foreground">{analytics?.view_count || 0}</span> Views</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Area */}
          <div className="flex w-full sm:w-auto gap-2 mt-4 sm:mt-0 sm:pb-2 flex-shrink-0">
             {isOwnProfile ? (
              <Button asChild className="flex-1 sm:flex-auto">
                <Link to="/complete-profile">
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
              </Button>
            ) : (
              user && (
                <>
                  <Button
                    variant={liveIsFollowing ? 'outline' : 'default'}
                    className="flex-1 sm:flex-auto"
                    onClick={handleFollow} // Use new handler
                    disabled={isFollowLoading}
                  >
                    {isFollowLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : liveIsFollowing ? (
                      <UserCheck className="mr-2 h-4 w-4" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {liveIsFollowing ? 'Following' : 'Follow'}
                  </Button>
                  
                  {liveConnectionStatus === 'connected' ? (
                    <Button variant="outline" className="flex-1 sm:flex-auto" onClick={handleMessage}>
                      <Send className="mr-2 h-4 w-4" /> Message
                    </Button>
                  ) : liveConnectionStatus === 'pending_sent' ? (
                    <Button variant="outline" className="flex-1 sm:flex-auto" disabled>
                      <Clock className="mr-2 h-4 w-4" /> Pending
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 sm:flex-auto" onClick={handleConnect} disabled={isConnectionLoading}>
                      {isConnectionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      Connect
                    </Button>
                  )}
                </>
              )
            )}
            <Button variant="outline" size="icon" title="Share Profile" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
  );
};
