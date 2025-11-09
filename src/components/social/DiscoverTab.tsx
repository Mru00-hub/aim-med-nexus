import React, { useState, useMemo, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Search, Sparkles, UserPlus, MoreHorizontal, Ban, Loader2, Check, Clock, MessageSquare, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { toggleFollow } from '@/integrations/supabase/community.api'; // <-- Import toggleFollow
import { useAuth } from '@/hooks/useAuth'; // <-- Import useAuth
import { useToast } from '@/components/ui/use-toast'; // <-- Import useToast
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import { createOrGetConversation } from '@/integrations/supabase/social.api';

export const DiscoverTab = ({ recommendations, loading, onSendRequest, onBlockUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth(); // Needed for user ID
  const { isFollowing, getConnectionStatus, refetchSocialGraph } = useSocialCounts();
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleMessage = async (userId: string) => {
    try {
      const conversationId = await createOrGetConversation(userId);
      navigate(`/inbox?convo=${conversationId}`);
    } catch (error: any) {
      toast({ title: "Error", description: `Could not start conversation: ${error.message}`, variant: "destructive" });
    }
  };

  const filteredRecommendations = useMemo(() => {
    if (!searchTerm) return recommendations;
    return recommendations.filter(rec => rec.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recommendations, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> People You May Know</CardTitle>
        <div className="relative pt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
        <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700 dark:text-blue-300">Get Better Recommendations!</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            Keep your profile details up-to-date to discover the most relevant connections.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1 text-blue-700 dark:text-blue-300 font-semibold" 
              onClick={() => navigate('/complete-profile')}
            >
              Update Profile
            </Button>
          </AlertDescription>
        </Alert>
        {loading ? <Skeleton className="h-20 w-full" /> : filteredRecommendations.map(rec => {
          // --- Get LIVE status inside the map ---
          const liveConnectionStatus = getConnectionStatus(rec.id);
          const liveIsFollowing = isFollowing(rec.id);
          const isFollowLoading = !!followLoadingMap[rec.id];
          const isStudent = rec.user_role === 'student';

          return (
            <UserActionCard
              key={rec.id}
              user={{
                id: rec.id,
                full_name: rec.full_name,
                profile_picture_url: rec.profile_picture_url,
                title: isStudent ? rec.course : rec.specialization,
                organization: isStudent ? rec.institution : rec.organization,
                location: isStudent ? rec.student_year : rec.current_location,
                mutuals: rec.mutuals,
                similarity_score: rec.similarity_score,
              }}
            >
              {/* --- Render buttons based on LIVE status --- */}
              {liveConnectionStatus === 'connected' ? (
                 <Button size="sm" variant="outline" onClick={() => handleMessage(rec.id)}>
                   <MessageSquare className="h-4 w-4 mr-2" /> Message
                 </Button>
              ) : liveConnectionStatus === 'pending_sent' ? (
                 <Button size="sm" variant="outline" disabled>
                   <Clock className="h-4 w-4 mr-2" /> Pending
                 </Button>
              ) : liveConnectionStatus === 'pending_received' ? (
                 <Button size="sm" variant="outline" onClick={() => navigate('/social')}> {/* Go to requests tab */}
                    Respond
                 </Button>
              ) : (
                 <Button size="sm" onClick={() => onSendRequest(rec.id)}> {/* Use prop function */}
                   <UserPlus className="h-4 w-4 mr-2" />Connect
                 </Button>
              )}
              {/* Follow Button */}
              <Button
                 size="sm"
                 variant={liveIsFollowing ? "outline" : "ghost"}
                 onClick={() => handleFollow(rec.id)} // Use local handler
                 disabled={isFollowLoading}
                 className="w-[100px]"
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
              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => onBlockUser(rec.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Ban className="h-4 w-4 mr-2" />Block User</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </UserActionCard>
          );
        })}
      </CardContent>
    </Card>
  );
};
