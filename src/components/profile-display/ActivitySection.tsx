import React from 'react';
import { Link } from 'react-router-dom';
import { PublicPost, Space } from '@/integrations/supabase/community.api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageSquare } from 'lucide-react';

type ActivitySectionProps = {
  posts: PublicPost[];
  spaces: Space[];
};

export const ActivitySection: React.FC<ActivitySectionProps> = ({ posts, spaces }) => {
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
        <TabsTrigger value="spaces">Spaces ({spaces.length})</TabsTrigger>
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
            {spaces.map((space) => (
              <SpaceItemCard key={space.id} space={space} />
            ))}
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
        {post.description || 'No description provided.'}
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

const SpaceItemCard: React.FC<{ space: Space }> = ({ space }) => (
  <Card className="transition-all hover:shadow-md">
    <CardContent className="p-4">
      <Badge variant={space.space_type === 'FORUM' ? 'secondary' : 'outline'} className="mb-2">
        {space.space_type === 'FORUM' ? 'Forum' : 'Space'}
      </Badge>
      <Link to={`/community/space/${space.id}`}>
        <h4 className="font-semibold text-base mb-1 hover:text-primary">
      </p>
    </CardContent>
  </Card>
);
