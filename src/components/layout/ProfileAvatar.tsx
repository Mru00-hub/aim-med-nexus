// src/components/layout/ProfileAvatar.tsx

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { generateAvatarUrl } from '@/lib/utils';

// This component is now JUST the avatar, not the dropdown.
// It accepts a className to be sized by its parent (the Header).
type ProfileAvatarProps = {
  className?: string;
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ className }) => {
  const { user, profile, loading } = useAuth();
  
  const initials = useMemo(() => {
    if (!profile?.full_name) return '?'; 
    const names = profile.full_name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : profile.full_name.substring(0, 2).toUpperCase();
  }, [profile?.full_name]);

  const finalAvatarUrl = useMemo(() => {
    if (!profile || !user) return undefined; 
    return profile.profile_picture_url || generateAvatarUrl(profile.full_name, user.id);
  }, [profile?.profile_picture_url, profile?.full_name, user?.id]);

  if (loading) {
    // Use the passed className for consistent sizing
    return <Skeleton className={`rounded-full ${className}`} />;
  }

  if (!user || !profile) {
    // Return a generic fallback if no user/profile
    return (
      <Avatar className={className}>
        <AvatarFallback className="text-muted-foreground">?</AvatarFallback>
      </Avatar>
    );
  }

  // Simplified main return. No conditions, no links.
  // The Header component will wrap this in a link or dropdown.
  return (
    <Avatar className={className}>
      <AvatarImage src={finalAvatarUrl} alt={profile?.full_name || 'User'} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

