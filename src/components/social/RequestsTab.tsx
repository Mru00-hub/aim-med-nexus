import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Ban } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';

export const RequestsTab = ({ requests, sentRequests, loading, onRespondRequest, onBlockUser, onWithdrawRequest }) => {
  return (
    <Tabs defaultValue="incoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming">Incoming ({requests.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="incoming" className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
        {loading ? <Skeleton className="h-24 w-full" /> : requests.length > 0 ? requests.map(req => (
          <UserActionCard 
            key={req.requester_id} 
            // --- REFACTORED: Use new fields from get_pending_connection_requests() ---
            user={{ 
              id: req.requester_id, 
              full_name: req.full_name, 
              profile_picture_url: req.profile_picture_url, 
              // Use current_position or specialization as the title
              title: req.current_position || req.specialization_name, 
              organization: req.organization, 
              location: req.location_name // Use the new location_name field
            }}
          >
            <Button size="sm" onClick={() => onRespondRequest(req.requester_id, 'accepted')}>Accept</Button>
            <Button size="sm" variant="outline" onClick={() => onRespondRequest(req.requester_id, 'ignored')}>Ignore</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => onBlockUser(req.requester_id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Ban className="h-4 w-4 mr-2" />Block</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </UserActionCard>
        )) : <p className="text-center text-muted-foreground py-8">No incoming requests.</p>}
      </TabsContent>
      <TabsContent value="sent" className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
        {/* The 'sent' tab logic was already correct as it used the right fields */}
        {loading ? <Skeleton className="h-24 w-full" /> : sentRequests.length > 0 ? sentRequests.map(req => (
          <UserActionCard 
            key={req.addressee_id} 
            user={{ 
              id: req.addressee_id, 
              full_name: req.full_name, 
              profile_picture_url: req.profile_picture_url, 
              title: req.current_position, 
              organization: req.organization, 
              location: null // This view doesn't have location
            }}
          >
            <Badge variant="outline">Pending</Badge>
            <Button size="sm" variant="ghost" onClick={() => onWithdrawRequest(req.addressee_id)}>Withdraw</Button>
          </UserActionCard>
        )) : <p className="text-center text-muted-foreground py-8">No pending sent requests.</p>}
      </TabsContent>
    </Tabs>
  );
};
