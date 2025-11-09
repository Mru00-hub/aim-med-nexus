import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// CHANGED: Expanded the User interface to include more optional details
interface User {
  id: string;
  full_name: string;
  profile_picture_url?: string | null;
  title?: string | null;
  organization?: string | null;
  location?: string | null;
  mutuals?: any[];
  similarity_score?: number | null;
}

interface UserActionCardProps {
  user: User;
  children: React.ReactNode; // This will be the action buttons
}

export const UserActionCard = ({ user, children }: UserActionCardProps) => {
  // NEW: Create a details array to cleanly render available info
  const userDetails = [
    user.title,
    user.organization,
    user.location,
  ].filter(Boolean);

  const roundedScore = user.similarity_score ? Math.round(user.similarity_score) : 0;
  
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to={`/profile/${user.id}`}>
            <Avatar profile={user} className="flex-shrink-0"> 
              <AvatarImage />
              <AvatarFallback />
            </Avatar>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
              <Link to={`/profile/${user.id}`} className="hover:underline">
                  <h4 className="font-semibold truncate">{user.full_name}</h4>
              </Link>
              {roundedScore > 0 && (
                <Badge variant="secondary" className="flex-shrink-0 text-xs">
                  {roundedScore}% Match
                </Badge>
              )}
            </div>
            {/* CHANGED: Render the new detailed information line */}
            {userDetails.length > 0 && (
              <p className="text-sm text-muted-foreground flex items-center flex-wrap truncate">
                {userDetails.map((detail, index) => (
                  <React.Fragment key={index}>
                    <span>{detail}</span>
                    {index < userDetails.length - 1 && <span className="mx-1.5">&bull;</span>}
                  </React.Fragment>
                ))}
              </p>
            )}
            {user.mutuals && user.mutuals.length > 0 && (
              <div className="text-xs text-muted-foreground flex items-center mt-1">
                <Users className="h-3 w-3 mr-1.5" />
                <span>
                  {user.mutuals.length} mutual connection{user.mutuals.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
