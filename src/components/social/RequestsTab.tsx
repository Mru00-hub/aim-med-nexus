import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Ban, Loader2, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { toggleFollow } from '@/integrations/supabase/community.api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export const RequestsTab = ({ requests, sentRequests, loading, onRespondRequest, onBlockUser, onWithdrawRequest }) => {
  const { user } = useAuth();
  const { isFollowing, refetchSocialGraph } = useSocialCounts();
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // --- 3. Add handleFollow function ---
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
  
  return (
    <Tabs defaultValue="incoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming">Incoming ({requests.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="incoming" className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
        {loading ? <Skeleton className="h-24 w-full" /> : requests.length > 0 ? requests.map(req => {
          // --- Get LIVE follow status for incoming requests ---
          const liveIsFollowing = isFollowing(req.requester_id);
          const isFollowLoading = !!followLoadingMap[req.requester_id];

          return (
            <UserActionCard
              key={req.requester_id}
              user={{
                id: req.requester_id,
                full_name: req.full_name,
                profile_picture_url: req.profile_picture_url,
                title: req.current_position || req.specialization_name,
                organization: req.organization,
                location: req.location_name
              }}
            >
              {/* Action Buttons */}
              <Button size="sm" onClick={() => onRespondRequest(req.requester_id, 'accepted')}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => onRespondRequest(req.requester_id, 'ignored')}>Ignore</Button>
              {/* Follow Button */}
              <Button
                 size="sm"
                 variant={liveIsFollowing ? "outline" : "ghost"}
                 onClick={() => handleFollow(req.requester_id)} // Use local handler
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => onBlockUser(req.requester_id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Ban className="h-4 w-4 mr-2" />Block</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </UserActionCard>
          );
        }) : <p className="text-center text-muted-foreground py-8">No incoming requests.</p>}
      </TabsContent>

      <TabsContent value="sent" className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
        {loading ? <Skeleton className="h-24 w-full" /> : sentRequests.length > 0 ? sentRequests.map(req => {
          // --- Get LIVE follow status for sent requests ---
          const liveIsFollowing = isFollowing(req.addressee_id);
          const isFollowLoading = !!followLoadingMap[req.addressee_id];

          return (
            <UserActionCard
              key={req.addressee_id}
              user={{
                id: req.addressee_id,
                full_name: req.full_name,
                profile_picture_url: req.profile_picture_url,
                title: req.current_position,
                organization: req.organization,
                location: null
              }}
            >
              <Badge variant="outline">Pending</Badge>
              {/* Follow Button */}
              <Button
                 size="sm"
                 variant={liveIsFollowing ? "outline" : "ghost"}
                 onClick={() => handleFollow(req.addressee_id)} // Use local handler
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
              <Button size="sm" variant="ghost" onClick={() => onWithdrawRequest(req.addressee_id)}>Withdraw</Button>
            </UserActionCard>
          );
        }) : <p className="text-center text-muted-foreground py-8">No pending sent requests.</p>}
      </TabsContent>
    </Tabs>
  );
};
