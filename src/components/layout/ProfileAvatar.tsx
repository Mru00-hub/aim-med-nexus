import React from 'react';
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

export const ProfileAvatar = () => {
  const { user, profile, signOut, loading } = useAuth();

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user || !profile) {
    return null;
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // --- CHANGED: Capitalize the first letter of the user's role for display ---
  const formattedRole = profile.user_role.charAt(0).toUpperCase() + profile.user_role.slice(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={profile.profile_picture_url} alt={profile.full_name} />
          <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                {/* --- CHANGED: Display user role and location instead of email --- */}
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
