import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// A generic user type to handle different data shapes from various views/functions
interface User {
  id: string;
  full_name: string;
  profile_picture_url?: string | null;
  subtitle: string;
}

interface UserActionCardProps {
  user: User;
  children: React.ReactNode; // This will be the action buttons
}

export const UserActionCard = ({ user, children }: UserActionCardProps) => {
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
            <p className="text-sm text-muted-foreground">{user.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
