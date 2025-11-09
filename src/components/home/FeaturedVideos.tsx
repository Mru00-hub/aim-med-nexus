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
    <div className="flex space-x-6 pb-4 -mb-4 overflow-x-auto">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-64 md:w-72 flex-shrink-0">
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
      
      {/* "Sign in for more" CTA card at the end of the scroll */}
      <div className="w-64 md:w-72 flex-shrink-0">
         <Card className="h-full flex flex-col items-center justify-center text-center p-4 bg-muted/30 hover:bg-muted/80 transition-colors">
            <h4 className="text-lg font-semibold">Want to see more?</h4>
            <p className="text-muted-foreground text-sm mt-2">
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
  );

  return (
    <Dialog open={!!selectedVideo} onOpenChange={(isOpen) => !isOpen && setSelectedVideo(null)}>
      <section className="section-medical py-10 md:py-12">
        <div className="container-medical">
          {/* Section Header */}
          <div className="mb-10 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">
              From Clinic to Career
              <span className="text-primary block">Featured Content</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center">
              Watch content from our founder and partners on transitioning from clinical to non-clinical roles.
            </p>
          </div>

          {/* Founder's Content */}
          {(isLoading || founderVideos.length > 0) && (
            <div className="mb-10">
              <h3 className="text-xl font-semibold mb-6">From the Founder</h3>
              {renderVideoList(founderVideos, true)}
            </div>
          )}

          {/* Partners' Content */}
          {(isLoading || partnerVideos.length > 0) && (
            <div>
              <h3 className="text-xl font-semibold mb-6">From Our Partners</h3>
              {renderVideoList(partnerVideos, false)}
            </div>
          )}
        </div>
      </section>

      {/* 7. This is the Modal Content. It only renders when selectedVideo is not null. */}
      <DialogContent className="max-w-3xl p-0">
        {selectedVideo && (
          <>
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{selectedVideo.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.youtube_video_id}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
