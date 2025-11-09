// src/components/home/FeaturedVideos.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getFeaturedVideos } from '@/integrations/supabase/content.api';
import { FeaturedVideo } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Internal card component to display a single video.
 */
const VideoCard = ({ video, onPlay }: { video: FeaturedVideo, onPlay: () => void }) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;

  return (
    <button 
      onClick={onPlay}
      className="block w-64 md:w-72 flex-shrink-0 text-left"
      title={video.title}
    >
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-medical hover:scale-[1.02]">
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt={video.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <PlayCircle className="h-10 w-10 text-white/90" />
          </div>
        </div>
        <CardContent className="p-3">
          <p className="font-semibold text-base leading-snug group-hover:text-primary transition-colors truncate">{video.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{video.author_name}</p>
        </CardContent>
      </Card>
    </button>
  );
};

/**
 * Main component to display horizontally-scrolling lists of featured videos.
 */
export const FeaturedVideos = () => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<FeaturedVideo | null>(null);
  const { data: videos, isLoading } = useQuery({
    queryKey: ['featuredVideos'],
    queryFn: getFeaturedVideos,
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  const founderVideos = videos?.filter(v => v.author_type === 'founder') || [];
  const partnerVideos = videos?.filter(v => v.author_type === 'partner') || [];

  const renderVideoList = (videoList: FeaturedVideo[], forFounder: boolean) => (
    // This div creates the horizontal scroll container
    <div className="scroller-mask relative w-full overflow-hidden">
      <div className="group flex flex-nowrap space-x-4 pb-4 -mb-4 animate-auto-scroll hover:[animation-play-state:paused]">
        {/* 3. Render the list of videos */}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`s1-${i}`} className="w-64 md:w-72 flex-shrink-0">
              <Skeleton className="aspect-video w-full rounded-t-lg" />
              <div className="p-3 border border-t-0 rounded-b-lg">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
            </div>
          ))
        ) : (
          videoList.map(video => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onPlay={() => setSelectedVideo(video)} 
            />
          ))
        )}
        
        <div className="w-64 md:w-72 flex-shrink-0">
          <Card className="h-full flex flex-col items-center justify-center text-center p-4 bg-muted/30 hover:bg-muted/80 transition-colors">
              <h4 className="text-base font-semibold">Want to see more?</h4>
              <p className="text-muted-foreground text-xs mt-2">
                {forFounder 
                  ? "Sign in to access exclusive content on non-clinical transitions."
                  : "Explore more insights from our trusted partners."
                }
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/login')}>
                Sign In for More
              </Button>
          </Card>
        </div>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`s2-${i}`} className="w-64 md:w-72 flex-shrink-0" aria-hidden="true">
              <Skeleton className="aspect-video w-full rounded-t-lg" />
              <div className="p-3 border border-t-0 rounded-b-lg">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
            </div>
          ))
        ) : (
          videoList.map(video => (
            <VideoCard 
              key={`${video.id}-clone`} 
              video={video} 
              onPlay={() => setSelectedVideo(video)} 
            />
          ))
        )}
        <div className="w-64 md:w-72 flex-shrink-0" aria-hidden="true">
          <Card className="h-full flex flex-col items-center justify-center text-center p-4 bg-muted/30 hover:bg-muted/80 transition-colors">
              <h4 className="text-base font-semibold">Want to see more?</h4>
              <p className="text-muted-foreground text-xs mt-2">
                {forFounder 
                  ? "Sign in to access exclusive content on non-clinical transitions."
                  : "Explore more insights from our trusted partners."
                }
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/login')}>
                Sign In for More
              </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
