// src/components/layout/ProfileAvatar.tsx

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, User, Settings } from 'lucide-react';
import { generateAvatarUrl } from '@/lib/utils';

export const ProfileAvatar = () => {
  const { user, profile, signOut, loading } = useAuth();

  // --- 1. HANDLE EXIT CASES FIRST ---

  // Handle loading state
  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  // Handle logged-out users
  if (!user) {
    return null;
  }
  
  // Handle users who need to complete their profile
  if (!profile || !profile.full_name) {
    return (
      <Link to="/complete-profile" title="Complete your profile">
        <Avatar className="cursor-pointer bg-muted">
          <AvatarFallback className="text-muted-foreground">?</AvatarFallback>
        </Avatar>
      </Link>
    );
  }

  // --- 2. IF WE REACH HERE, THE USER IS FULLY LOGGED IN WITH A PROFILE ---
  // All memoized values and logic can now safely assume `profile` exists.

  const initials = useMemo(() => {
    const names = profile.full_name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return profile.full_name.substring(0, 2).toUpperCase();
  }, [profile.full_name]);

  const formattedRole = useMemo(() => {
    // No need for optional chaining '?' because we know `profile` exists
    return profile.user_role.charAt(0).toUpperCase() + profile.user_role.slice(1);
  }, [profile.user_role]);

  // The core logic: If a URL exists, use it. Otherwise, generate the default one.
  const finalAvatarUrl = profile.profile_picture_url || generateAvatarUrl(profile.full_name, user.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={finalAvatarUrl} alt={profile.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {formattedRole} &middot; {profile.current_location}
                </p>
            </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
           <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
