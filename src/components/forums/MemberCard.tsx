// src/components/forums/MemberCard.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MemberProfile } from '@/integrations/supabase/community.api';

interface MemberCardProps {
  member: MemberProfile;
}

// Helper to get initials from a full name for the avatar fallback
const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  // Determine badge variant based on role for visual distinction
  const getBadgeVariant = (role: MemberProfile['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MODERATOR':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.profile_picture_url || ''} alt={member.full_name} />
          <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-lg">{member.full_name}</p>
        </div>
        <Badge variant={getBadgeVariant(member.role)} className="capitalize">
          {member.role.toLowerCase()}
        </Badge>
      </CardContent>
    </Card>
  );
};
