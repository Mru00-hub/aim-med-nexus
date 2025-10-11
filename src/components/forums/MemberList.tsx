// src/components/forums/MemberList.tsx

import React from 'react';
import { MemberCard, DisplayMember } from './MemberCard';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberListProps {
    members: DisplayMember[];
    isLoading: boolean;
    emptyStateMessage?: string;
    isCurrentUserAdmin={isAdminView};
    onApprove?: (membershipId: string) => void;
    onReject?: (membershipId: string) => void;
    onBan?: (membershipId: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ 
    members, 
    isLoading, 
    emptyStateMessage = "There are no members to display.",
    isCurrentUserAdmin,
    onApprove,
    onReject,
    onBan
}) => {
  // 1. Handle the loading state based on props
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-4 w-[250px]" /></div>
        </div>
        <div className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-4 w-[200px]" /></div>
        </div>
      </div>
    );
  }

  // 2. Handle the empty state based on props
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {emptyStateMessage}
      </div>
    );
  }

  // 3. Render the list of members from props
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberCard 
            key={member.user_id} 
            member={member} 
            isCurrentUserAdmin={isCurrentUserAdmin} 
            onApprove={onApprove}
            onReject={onReject}
            onBan={onBan}
        />
      ))}
    </div>
  );
};
