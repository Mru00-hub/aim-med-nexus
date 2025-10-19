import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Briefcase, Award } from 'lucide-react';

// --- UPDATED: Interface to match the RPC return type ---
interface UserProfile {
  full_name: string | null;
  user_role: string | null;
  profile_picture_url: string | null;
  current_position: string | null;
  organization: string | null;
  specialization: string | null;
  current_location: string | null;
}

interface UserProfileCardProps {
  userId: string;
  children: React.ReactNode;
}

export const UserProfileCard = ({ userId, children }: UserProfileCardProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!userId || profile) return; // Don't fetch if no ID or already fetched
    
    setLoading(true);
    
    // --- REFACTORED: Call the get_profile_with_privacy RPC ---
    const { data, error } = await supabase.rpc('get_profile_with_privacy', {
      profile_id: userId
    });

    if (error) {
      console.error('Error fetching user profile hover card:', error);
    } else if (data && data.length > 0) {
      // Data is an array, take the first element
      setProfile(data[0] as UserProfile);
    }
    setLoading(false);
  };

  return (
    <HoverCard openDelay={200} onOpenChange={(open) => { if (open) fetchProfile() }}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        {loading && <ProfileCardSkeleton />}
        {profile && !loading && (
          <div className="flex gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.profile_picture_url || undefined} />
              <AvatarFallback>
                {profile.full_name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5 flex-grow">
              <h4 className="text-sm font-semibold">{profile.full_name}</h4>
              
              {/* --- UPDATED: Show richer data --- */}
              <div className="flex items-center text-xs text-muted-foreground">
                <Briefcase className="mr-2 h-3.5 w-3.5 opacity-70" />
                <span className="truncate">
                  {profile.current_position || 'Position not specified'}
                </span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Award className="mr-2 h-3.5 w-3.5 opacity-70" />
                <span className="truncate">
                  {profile.specialization || 'Specialization not specified'}
                </span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-2 h-3.5 w-3.5 opacity-70" />
                <span className="truncate">
                  {profile.current_location || 'Location not specified'}
                </span>
              </div>
              <Badge variant="outline" className="capitalize mt-1">
                {profile.user_role || 'Member'}
              </Badge>
            </div>
          </div>
        )}
        {!profile && !loading && <p className="text-sm text-muted-foreground">Could not load profile.</p>}
      </HoverCardContent>
    </HoverCard>
  );
};

const ProfileCardSkeleton = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  </div>
);
