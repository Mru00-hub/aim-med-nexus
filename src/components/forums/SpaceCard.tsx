import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SpaceWithDetails, Enums } from '@/integrations/supabase/community.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Loader2} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSpaceMetrics } from '@/hooks/useSpaceData';

interface SpaceCardProps {
  space: SpaceWithDetails;
  membershipStatus: Enums<'membership_status'> | null;
  onJoin: (space: SpaceWithDetails) => void;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({ space, membershipStatus, onJoin }) => {
  const navigate = useNavigate();
  const { memberCount, threadCount, isLoadingMetrics } = useSpaceMetrics(space.id);
  const isPrivate = space.join_level === 'INVITE_ONLY';
  const creatorDetails = [space.creator_position, space.creator_organization]
    .filter(Boolean)
    .join(' @ ');

  const handleCardClick = () => {
    if (membershipStatus === 'ACTIVE') {
      navigate(`/community/space/${space.id}`);
    }
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onJoin(space);
  };
  const isForum = space.space_type === 'FORUM';
  const threadLabel = isForum 
      ? (threadCount === 1 ? 'Post' : 'Posts') 
      : (threadCount === 1 ? 'Thread' : 'Threads');
  const memberLabel = memberCount === 1 ? 'Member' : 'Members';

  return (
    <div 
      key={space.id} 
      className="cursor-pointer h-full" 
      onClick={handleCardClick}
    >
      <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg flex flex-col">
        <CardHeader>
          <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
            <Badge variant={space.space_type === 'FORUM' ? 'secondary' : 'outline'}>
              {space.space_type === 'FORUM' ? 'Forum' : 'Community Space'}
            </Badge>
            {isPrivate && <Badge variant="destructive">Private</Badge>}
          </div>
          <CardTitle className="text-lg sm:text-xl">{space.name}</CardTitle>
          <CardDescription className="text-sm line-clamp-2">{space.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-between">
          <div>
            <div className="text-xs text-muted-foreground space-y-2">
              {space.creator_full_name && (
                <div>
                  <p>Created by: <span className="font-semibold text-foreground">{space.creator_full_name}</span></p>
                  {creatorDetails && <p className="text-xs">{creatorDetails}</p>}
                </div>
              )}
              {space.moderators && space.moderators.length > 0 && (
                <div>
                  <TooltipProvider delayDuration={100}>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {space.moderators.slice(0, 3).map((mod, index) => (
                        <Tooltip key={`${space.id}-mod-${index}`}>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Badge variant="outline" className="cursor-default">
                                {mod.full_name}
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          {mod.specialization && (
                            <TooltipContent>
                              <p>{mod.specialization}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ))}
                      {space.moderators.length > 3 && (
                        <Badge variant="outline">
                          +{space.moderators.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TooltipProvider>
                </div>   
              )}
            </div>
            
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              {isLoadingMetrics ? (
                // Show a simple loader while counts fetch
                <div className="flex items-center gap-1.5 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading stats...</span>
                </div>
              ) : (
                // Once loaded, show the stats
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-default">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium text-foreground">{threadCount}</span>
                        <span>{threadLabel}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{threadCount} {threadLabel} in this space</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-default">
                        <Users className="h-4 w-4" />
                        <span className="font-medium text-foreground">{memberCount}</span>
                        <span>{memberLabel}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{memberCount} {memberLabel} in this space</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex flex-wrap justify-end items-center gap-2">
            {membershipStatus === 'ACTIVE' ? (
              <Button asChild variant="outline" size="sm">
                <Link to={`/community/space/${space.id}`}>Go to Space</Link>
              </Button>
            ) : membershipStatus === 'PENDING' ? (
              <Button variant="secondary" size="sm" disabled>
                Requested
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={handleJoinClick}>
                {isPrivate ? 'Request to Join' : 'Join'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
