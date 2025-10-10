// src/components/forums/MemberList.tsx

import React from 'react';
import { useCommunity } from '@/context/CommunityContext';
import { MemberCard } from './MemberCard';
import { Skeleton } from '@/components/ui/skeleton';

export const MemberList: React.FC = () => {
  // Get the member list and loading state from our updated context
  const { spaceMembers, isLoadingMembers } = useCommunity();

  // 1. Handle the loading state
  if (isLoadingMembers) {
    return (
      <div className="space-y-3">
        {/* Show skeleton loaders that mimic the MemberCard layout */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Handle the empty state
  if (!spaceMembers || spaceMembers.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        There are no active members in this space yet.
      </div>
    );
  }

  // 3. Render the list of members
  return (
    <div className="space-y-3">
      {spaceMembers.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
};
