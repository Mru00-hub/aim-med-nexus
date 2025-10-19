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
  
  const initials = useMemo(() => {
    // Add safety checks for when profile is null
    if (!profile?.full_name) return '?'; 
    const names = profile.full_name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return profile.full_name.substring(0, 2).toUpperCase();
  }, [profile?.full_name]); // Depend on the specific property

  const formattedRole = useMemo(() => {
    // Add safety checks
    if (!profile?.user_role) return 'User'; 
    return profile.user_role.charAt(0).toUpperCase() + profile.user_role.slice(1);
  }, [profile?.user_role]); // Depend on the specific property

  // The core logic: If a URL exists, use it. Otherwise, generate the default one.
  const finalAvatarUrl = useMemo(() => {
    // Safety checks for all dependencies
    if (!profile || !user) return undefined; 
    return profile.profile_picture_url || generateAvatarUrl(profile.full_name, user.id);
  }, [profile?.profile_picture_url, profile?.full_name, user?.id]);
  // -------------------------------------


  // --- 2. HANDLE EXIT CASES (EARLY RETURNS) ---
  // This is now safe because all Hooks have already been called.

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return null; // Or <Link to="/login">...</Link>
  }
  
  if (!profile || !profile.full_name) {
    return (
      <Link to="/profile" title="Complete your profile"> 
        <Avatar className="cursor-pointer bg-muted">
          <AvatarFallback className="text-muted-foreground">?</AvatarFallback>
        </Avatar>
      </Link>
    );
  }

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
