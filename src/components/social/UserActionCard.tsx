import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// CHANGED: Expanded the User interface to include more optional details
interface User {
  id: string;
  full_name: string;
  profile_picture_url?: string | null;
  // NEW: Optional detailed fields
  title?: string | null;
  organization?: string | null;
  location?: string | null;
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
  ].filter(Boolean); // Filter out any null or empty strings

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${user.id}`}>
            <Avatar>
              <AvatarImage src={user.profile_picture_url || undefined} />
              <AvatarFallback>{user.full_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link to={`/profile/${user.id}`} className="hover:underline">
                <h4 className="font-semibold">{user.full_name}</h4>
            </Link>
            {/* CHANGED: Render the new detailed information line */}
            {userDetails.length > 0 && (
              <p className="text-sm text-muted-foreground flex items-center flex-wrap">
                {userDetails.map((detail, index) => (
                  <React.Fragment key={index}>
                    <span>{detail}</span>
                    {index < userDetails.length - 1 && <span className="mx-1.5">&bull;</span>}
                  </React.Fragment>
                ))}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
