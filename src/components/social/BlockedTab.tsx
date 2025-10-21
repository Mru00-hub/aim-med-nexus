import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';

export const BlockedTab = ({ blockedUsers, loading, onUnblockUser }) => {
  console.log("BLOCKED USERS DATA:", blockedUsers);
  return (
    <Card>
      <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <p className="text-sm text-muted-foreground pt-1">Users you have blocked cannot see you or interact with you.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? <Skeleton className="h-20 w-full" /> : blockedUsers.map(bu => (
          <UserActionCard 
            // FIX 1: Use the correct ID for the React key
            key={bu.unblocked_user_id} 
            user={{ 
              // FIX 2: Use the correct ID for the user prop
              id: bu.unblocked_user_id, 
              full_name: bu.full_name, 
              profile_picture_url: bu.profile_picture_url, 
              subtitle: 'This user is blocked' 
            }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              // FIX 3: Pass the correct ID to the click handler
              onClick={() => onUnblockUser(bu.unblocked_user_id)}
            >
              Unblock
            </Button>
          </UserActionCard>
        ))}
      </CardContent>
    </Card>
  );
};
