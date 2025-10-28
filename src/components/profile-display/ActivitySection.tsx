import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicPost, Space, requestToJoinSpace, joinSpaceAsMember } from '@/integrations/supabase/community.api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageSquare, LayoutGrid, Users, LogIn, Send } from 'lucide-react';
import { useCommunity } from '@/context/CommunityContext'; 
import { useAuth } from '@/hooks/useAuth'; // <-- Import auth hook
import { useToast } from '@/components/ui/use-toast'; // <-- Import toast
import { Button } from '@/components/ui/button';

type ActivitySectionProps = {
  posts: PublicPost[];
  spaces: Space[];
};

export const ActivitySection: React.FC<ActivitySectionProps> = ({ posts, spaces }) => {
  const { getMembershipStatus, setMemberships, refreshSpaces } = useCommunity();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleJoinSpace = async (space: Space) => {
    if (!user) {
      navigate('/login');
      return;
    }
    toast({ title: 'Processing...', description: `Requesting to join ${space.name}.` });
    try {
      if (space.join_level === 'OPEN') {
        await joinSpaceAsMember(space.id);
        toast({ title: 'Success!', description: `You have joined ${space.name}.` });
        await refreshSpaces(); // Refresh context
      } else {
        await requestToJoinSpace(space.id);
        toast({ title: 'Request Sent', description: `Your request to join ${space.name} is pending approval.` });
        // Optimistically update membership status in context
        setMemberships(prev => [
          ...prev,
          {
            space_id: space.id,
            user_id: user.id,
            status: 'PENDING',
            // Fill required fields - IDs don't matter much for optimistic UI
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: 'MEMBER',
          }
        ]);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="posts" disabled={posts.length === 0}>
          Posts ({posts.length})
        </TabsTrigger>
        <TabsTrigger value="spaces" disabled={spaces.length === 0}>
          Spaces ({spaces.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="posts" className="mt-4">
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostItemCard key={post.thread_id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No public posts yet.
          </p>
        )}
      </TabsContent>
      
      <TabsContent value="spaces" className="mt-4">
        {spaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spaces.map((space) => {
              // --- Get status for each space ---
              const membershipStatus = getMembershipStatus(space.id);
              return (
                <SpaceItemCard
                  key={space.id}
                  space={space}
                  membershipStatus={membershipStatus} // Pass status
                  onJoin={handleJoinSpace} // Pass join handler
                  isLoggedIn={!!user} // Pass login status
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No spaces created yet.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
};

// --- Activity Sub-components (copied from your old file) ---

const PostItemCard: React.FC<{ post: PublicPost }> = ({ post }) => (
  <Card className="transition-all hover:shadow-md">
    <CardContent className="p-4">
      <Link to={`/community/thread/${post.thread_id}`}>
        <h4 className="font-semibold text-base mb-2 hover:text-primary">
          {post.title}
        </h4>
      </Link>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {post.first_message_body || 'No description provided.'}
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" /> {post.total_reaction_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" /> {post.comment_count}
        </span>
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
      </div>
    </CardContent>
  </Card>
);

interface SpaceItemCardProps {
  space: Space;
  membershipStatus: ReturnType<typeof useCommunity>['getMembershipStatus'];
  onJoin: (space: Space) => void;
  isLoggedIn: boolean;
}

const SpaceItemCard: React.FC<SpaceItemCardProps> = ({ space, membershipStatus, onJoin, isLoggedIn }) => {
  const navigate = useNavigate();

  const renderAction = () => {
    // Public spaces are always accessible
    if (space.space_type === 'PUBLIC') {
      return (
        <Button size="sm" variant="outline" asChild>
          <Link to={`/community/space/${space.id}`}>View Space</Link>
        </Button>
      );
    }

    // Handle Forum/Community based on membership
    switch (membershipStatus) {
      case 'ACTIVE':
        return (
          <Button size="sm" variant="outline" asChild>
            <Link to={`/community/space/${space.id}`}>Enter Space</Link>
          </Button>
        );
      case 'PENDING':
        return <Badge variant="secondary">Request Pending</Badge>;
      case 'NOT_MEMBER':
      default:
        return (
          <Button size="sm" onClick={() => isLoggedIn ? onJoin(space) : navigate('/login')}>
            <LogIn className="h-4 w-4 mr-2" />
            {space.join_level === 'OPEN' ? 'Join Space' : 'Request to Join'}
          </Button>
        );
    }
  };

  const getSpaceTypeIcon = () => {
     switch(space.space_type) {
        case 'PUBLIC': return <MessageSquare className="h-3 w-3 mr-1.5" />;
        case 'FORUM': return <LayoutGrid className="h-3 w-3 mr-1.5" />;
        case 'COMMUNITY_SPACE': return <Users className="h-3 w-3 mr-1.5" />;
        default: return null;
     }
  }

  return (
    <Card className="transition-all hover:shadow-md flex flex-col justify-between">
      <CardContent className="p-4 flex-grow">
        <Badge variant={space.space_type === 'PUBLIC' ? 'default' : space.space_type === 'FORUM' ? 'secondary' : 'outline'} className="mb-2 capitalize">
          {getSpaceTypeIcon()}
          {space.space_type.replace('_', ' ').toLowerCase()}
        </Badge>
        <Link to={`/community/space/${space.id}`} className={membershipStatus === 'ACTIVE' || space.space_type === 'PUBLIC' ? 'hover:text-primary' : 'pointer-events-none'}>
          <h4 className="font-semibold text-base mb-1">
            {space.name || 'Untitled Space'}
          </h4>
          {space.description && (
             <p className="text-sm text-muted-foreground line-clamp-2">
                {space.description}
             </p>
          )}
        </Link>
      </CardContent>
      {/* Add Action Button Area */}
      <div className="p-4 pt-0">
        {renderAction()}
      </div>
    </Card>
  );
};
