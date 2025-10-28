import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getFollowersWithStatus,
  getFollowingWithStatus,
  ProfileWithStatus,
} from '@/integrations/supabase/community.api';
import {
  getMyConnections,
  getMutualConnections,
} from '@/integrations/supabase/social.api';
import { UserCardWithActions } from './UserCardWithActions'; // We will create this next
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users } from 'lucide-react';

interface UserListModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  userId: string; // The ID of the profile being viewed
}

// A generic type to handle the different user objects returned by our APIs
type ApiUser = ProfileWithStatus;

export const UserListModal = ({
  isOpen,
  onOpenChange,
  title,
  userId,
}: UserListModalProps) => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setUsers([]); // Clear list when modal is closed
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      setUsers([]);

      try {
        let data: ApiUser[] = [];
        switch (title) {
          case 'Followers':
            data = await getFollowersWithStatus(userId);
            break;
          case 'Following':
            data = await getFollowingWithStatus(userId);
            break;
          case 'Connections': 
            data = await getMyConnections() as ApiUser[]; // Cast to new type
            break;
          case 'Mutual Connections':
            data = await getMutualConnections(userId) as ApiUser[]; // Cast to new type
            break;
          default:
            throw new Error('Invalid list title');
        }
        setUsers(data || []);
      } catch (e: any) {
        console.error(`Failed to fetch ${title}:`, e);
        setError(`Could not load ${title.toLowerCase()}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, title, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            A list of {title.toLowerCase()} for this profile.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
          {loading && (
            <div className="space-y-3">
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </div>
          )}

          {!loading && error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && users.length === 0 && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>No users found</AlertTitle>
              <AlertDescription>
                This list is currently empty.
              </AlertDescription>
            </Alert>
          )}

          {!loading &&
            !error &&
            users.length > 0 &&
            users.map((user) => (
              <UserCardWithActions key={user.id || user.user_id} user={user} />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UserCardSkeleton = () => (
  <div className="flex items-center space-x-4 p-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="space-y-2 flex-grow">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-4 w-4/5" />
    </div>
    <Skeleton className="h-9 w-24" />
  </div>
);
