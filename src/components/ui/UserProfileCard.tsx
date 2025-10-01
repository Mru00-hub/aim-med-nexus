// src/components/ui/UserProfileCard.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, MapPin, Briefcase } from 'lucide-react';

interface UserProfile {
  full_name: string;
  user_role: string;
  current_location: string;
  profile_picture_url: string;
}

interface UserProfileCardProps {
  userId: string;
  children: React.ReactNode;
}

export const UserProfileCard = ({ userId, children }: UserProfileCardProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, user_role, current_location, profile_picture_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  return (
    <HoverCard openDelay={200} onOpenChange={(open) => { if (open && !profile) fetchProfile() }}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        {loading && <ProfileCardSkeleton />}
        {profile && !loading && (
          <div className="flex justify-between space-x-4">
            <Avatar>
              <AvatarImage src={profile.profile_picture_url} />
              <AvatarFallback>
                {profile.full_name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-grow">
              <h4 className="text-sm font-semibold">{profile.full_name}</h4>
              <div className="flex items-center pt-2">
                <Briefcase className="mr-2 h-4 w-4 opacity-70" />
                <Badge variant="outline" className="capitalize">{profile.user_role || 'Member'}</Badge>
              </div>
              <div className="flex items-center pt-1">
                <MapPin className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  {profile.current_location || 'Location not specified'}
                </span>
              </div>
            </div>
          </div>
        )}
        {!profile && !loading && <p className="text-sm text-muted-foreground">Could not load profile.</p>}
      </HoverCardContent>
    </HoverCard>
  );
};

// A simple skeleton loader for a better user experience
const ProfileCardSkeleton = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  </div>
);
