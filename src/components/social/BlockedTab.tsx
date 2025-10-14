import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';

export const BlockedTab = ({ blockedUsers, loading, onUnblockUser }) => {
  return (
    <Card>
      <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <p className="text-sm text-muted-foreground pt-1">Users you have blocked cannot see you or interact with you.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? <Skeleton className="h-20 w-full" /> : blockedUsers.map(bu => (
          <UserActionCard key={bu.id} user={{ id: bu.id, full_name: bu.full_name, profile_picture_url: bu.profile_picture_url, subtitle: 'This user is blocked' }}>
            <Button variant="outline" size="sm" onClick={() => onUnblockUser(bu.id)}>Unblock</Button>
          </UserActionCard>
        ))}
      </CardContent>
    </Card>
  );
};
