// src/components/home/FeaturedVideos.tsx

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getFeaturedVideos } from '@/integrations/supabase/content.api';
import { FeaturedVideo } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, ArrowLeft, ArrowRight, Youtube } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { YouTubeSubscribeButton } from '@/components/ui/youtube-subscribe-button';

import useCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

/**
 * Internal card component to display a single video.
 */
const VideoCard = ({ video, onPlay }: { video: FeaturedVideo, onPlay: () => void }) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;

  return (
    <button 
      onClick={onPlay}
      className="block w-full text-left" 
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
          <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors truncate">{video.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{video.author_name}</p>
          {video.description && (
            <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2">
              {video.description}
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  );
};

const VideoCarousel = ({ 
  videos, 
  isLoading, 
  forFounder, 
  onPlay, 
  onCtaClick 
}: { 
  videos: FeaturedVideo[], 
  isLoading: boolean, 
  forFounder: boolean, 
  onPlay: (video: FeaturedVideo) => void, 
  onCtaClick: () => void 
}) => {

  // 4. Setup carousel with faster autoplay (2.5 seconds) and loop
  const [emblaRef, emblaApi] = useCarousel(
    { loop: true },
    [Autoplay({ delay: 2500, stopOnInteraction: true, stopOnMouseEnter: true, resumeDelay: 5000 })]
  );

  // 5. Setup Prev/Next button controls
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    // 6. 'group' will show buttons on hover
    <div className="relative group">
      {/* 7. This is the main carousel viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        {/* 8. This is the container that moves */}
        <div className="flex space-x-4">
          {/* 9. We no longer need 'isLoading ?' here, we map skeletons/videos inside */}
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              // Each item is a "slide"
              <div key={`skel-${i}`} className="flex-0 0-auto w-64 md:w-72">
                <Skeleton className="aspect-video w-full rounded-t-lg" />
                <div className="p-3 border border-t-0 rounded-b-lg">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
              </div>
            ))
          ) : (
            videos.map(video => (
              <div key={video.id} className="flex-0 0-auto w-64 md:w-72">
                <VideoCard video={video} onPlay={() => onPlay(video)} />
              </div>
            ))
          )}

          {/* 10. The CTA card is now just another slide in the loop */}
          <div className="flex-0 0-auto w-64 md:w-72">
            <Card className="h-full flex flex-col items-center justify-center text-center p-4 bg-muted/30 hover:bg-muted/80 transition-colors">
              <h4 className="text-base font-semibold">Want to see more?</h4>
              <p className="text-muted-foreground text-xs mt-2">
                {forFounder
                  ? "Sign in to access exclusive content on non-clinical transitions."
                  : "Explore more insights from our trusted partners."
                }
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={onCtaClick}>
                Sign In for More
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* 11. These are the navigation buttons users can click */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={scrollPrev}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={scrollNext}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
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
    staleTime: 5 * 60 * 1000, 
  });

  const founderVideos = videos?.filter(v => v.author_type === 'founder') || [];
  const partnerVideos = videos?.filter(v => v.author_type === 'partner') || [];

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

          {/* --- 1. PARTNERS' CONTENT (MOVED UP) --- */}
          {(isLoading || partnerVideos.length > 0) && (
            <div className="mb-10"> 
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h3 className="text-xl font-semibold">
                  From Our Partners
                </h3>
                
                {/* This is the new subscribe button element */}
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-muted-foreground">
                    Feat. Partner: <span className="font-bold text-foreground">Medhustlr</span>
                  </span>
                  <Button asChild variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                    <a href="https://www.youtube.com/@Medhustlr" target="_blank" rel="noopener noreferrer">
                      <Youtube className="h-4 w-4 mr-1.5" />
                      Subscribe
                    </a>
                  </Button>
                </div>
              </div>
              <VideoCarousel
                videos={partnerVideos}
                isLoading={isLoading}
                forFounder={false}
                onPlay={setSelectedVideo}
                onCtaClick={() => navigate('/login')}
              />
            </div>
          )}

          {/* --- 2. FOUNDER'S CONTENT (MOVED DOWN) --- */}
          {(isLoading || founderVideos.length > 0) && (
            <div> 
              <h3 className="text-xl font-semibold mb-6">From the Founder</h3>
              <VideoCarousel
                videos={founderVideos}
                isLoading={isLoading}
                forFounder={true}
                onPlay={setSelectedVideo}
                onCtaClick={() => navigate('/login')}
              />
            </div>
          )}
        </div>
      </section>

      {/* This is the Modal Content */}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
              <div className="flex-1">
                <p className="text-sm font-semibold">{selectedVideo.author_name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedVideo.author_type === 'partner' ? 'Featured Partner' : 'Founder'}
                </p>
              </div>
        
              {/* We only show the subscribe button for partners */}
              {selectedVideo.author_type === 'partner' && selectedVideo.author_channel_id && (
                <YouTubeSubscribeButton channelId={selectedVideo.author_channel_id} />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
