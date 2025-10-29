// src/components/layout/ProfileAvatar.tsx

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { generateAvatarUrl } from '@/lib/utils';

export type AvatarProfile = {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
};

// This component is now JUST the avatar, not the dropdown.
// It accepts a className to be sized by its parent (the Header).
type ProfileAvatarProps = {
  /** The profile object containing id, name, and pic url */
  profile: AvatarProfile | null | undefined;
  /** Pass true to show a skeleton shimmer */
  loading?: boolean;
  /** Additional class names for sizing (e.g., "h-8 w-8") */
  className?: string;
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profile, 
  loading, 
  className 
}) => {
  const initials = useMemo(() => {
    if (!profile?.full_name) return '?'; 
    const names = profile.full_name.split(' ');
    // Get first letter of first name and first letter of last name
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : profile.full_name.substring(0, 2).toUpperCase();
  }, [profile?.full_name]);

  const finalAvatarUrl = useMemo(() => {
    if (!profile) return undefined; 

    // Use the saved URL if it exists (including saved ui-avatar links),
    // otherwise generate a new one.
    return profile.profile_picture_url || generateAvatarUrl(profile.full_name, profile.id);
  }, [profile]); // This memo now only depends on the profile object

  if (loading) {
    return <Skeleton className={`rounded-full ${className}`} />;
  }

  if (!profile) {
    // Return a generic fallback if no profile is provided
    return (
      <Avatar className={className}>
        <AvatarFallback className="text-muted-foreground">?</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={finalAvatarUrl} alt={profile.full_name || 'User'} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};
